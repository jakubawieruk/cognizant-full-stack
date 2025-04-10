import pytest
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Category, TimeSlot, UserProfile
from datetime import datetime, timedelta
import zoneinfo

User = get_user_model()

@pytest.fixture
def api_client():
    """ Fixture for DRF APIClient """
    return APIClient()

@pytest.fixture
def test_user_with_profile(db):
    """ Fixture for user with profile created (relies on signals or get_or_create) """
    user = User.objects.create_user(username='testuser', password='password')
    # Ensure profile exists, assuming get_or_create or signal works
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return user

@pytest.fixture
def test_category(db):
    return Category.objects.create(name='API Test Cat')

@pytest.fixture
def test_timeslot(db, test_category):
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    return TimeSlot.objects.create(
        category=test_category,
        start_time=now + timedelta(days=1, hours=1),
        end_time=now + timedelta(days=1, hours=2)
    )

@pytest.mark.django_db
def test_get_timeslots_unauthenticated(api_client):
    """ Verify unauthenticated users cannot access timeslots. """
    url = reverse('timeslot-list') # Uses the 'basename' from router registration
    response = api_client.get(url)
    assert response.status_code == 401

@pytest.mark.django_db
def test_get_timeslots_authenticated_no_prefs(api_client, test_user_with_profile, test_timeslot):
    """ Verify authenticated user can get timeslots (no category prefs set). """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-list')
    # Construct params like the frontend would for next week
    start_date = (test_timeslot.start_time - timedelta(days=test_timeslot.start_time.weekday())).strftime('%Y-%m-%d')
    response = api_client.get(url, {'start_date': start_date})

    assert response.status_code == 200
    # Check if the created timeslot is in the response data
    assert len(response.data) >= 1 # Check if at least one slot is returned
    assert any(slot['id'] == test_timeslot.id for slot in response.data)

@pytest.mark.django_db
def test_get_timeslots_filtered_by_category_param(api_client, test_user_with_profile, test_category, test_timeslot):
    """ Verify filtering by explicit category_id works. """
    other_cat = Category.objects.create(name='Other Cat')
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    other_slot = TimeSlot.objects.create(
        category=other_cat,
        start_time=now + timedelta(days=1, hours=3),
        end_time=now + timedelta(days=1, hours=4)
    )

    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-list')
    start_date = (test_timeslot.start_time - timedelta(days=test_timeslot.start_time.weekday())).strftime('%Y-%m-%d')

    # Request specifically for test_category's ID
    response = api_client.get(url, {'start_date': start_date, 'category_id': test_category.id})

    assert response.status_code == 200
    assert len(response.data) == 1 # Should only return the one matching slot
    assert response.data[0]['id'] == test_timeslot.id
    assert response.data[0]['category']['id'] == test_category.id

@pytest.mark.django_db
def test_book_timeslot_success(api_client, test_user_with_profile, test_timeslot):
    """ Verify successfully booking an available timeslot. """
    assert test_timeslot.booked_by is None # Pre-condition

    api_client.force_authenticate(user=test_user_with_profile)
    # URL for the 'book' custom action: basename-book
    url = reverse('timeslot-book', kwargs={'pk': test_timeslot.pk})
    response = api_client.post(url)

    assert response.status_code == 200
    test_timeslot.refresh_from_db() # Reload model data from DB
    assert test_timeslot.booked_by == test_user_with_profile
    assert response.data['is_booked'] is True
    assert response.data['booked_by']['id'] == test_user_with_profile.id

@pytest.mark.django_db
def test_book_timeslot_already_booked(api_client, test_user_with_profile, test_timeslot):
    """ Verify booking fails if slot is already booked. """
    other_user = User.objects.create_user(username='otheruser', password='password')
    test_timeslot.booked_by = other_user
    test_timeslot.save()

    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-book', kwargs={'pk': test_timeslot.pk})
    response = api_client.post(url)

    assert response.status_code == 400 # Bad Request
    assert 'already booked' in response.data.get('detail', '').lower()
    test_timeslot.refresh_from_db()
    assert test_timeslot.booked_by == other_user # Should not have changed

@pytest.mark.django_db
def test_get_user_preferences_success(api_client, test_user_with_profile):
    """ Test GET /api/user/preferences/ successfully retrieves profile. """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('user-preferences') # Use the name defined in api/urls.py
    response = api_client.get(url)

    assert response.status_code == 200
    # Check that the response contains expected user data from the profile's user
    assert response.data['user']['username'] == test_user_with_profile.username
    assert 'interested_categories' in response.data # Check for categories list

@pytest.mark.django_db
def test_put_user_preferences_success(api_client, test_user_with_profile, test_category):
    """ Test PUT /api/user/preferences/ successfully updates categories. """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('user-preferences')

    # Initially no interested categories
    assert test_user_with_profile.profile.interested_categories.count() == 0

    # Data to send: list of category IDs
    data = {'interested_category_ids': [test_category.id]}
    response = api_client.put(url, data, format='json')

    assert response.status_code == 200
    assert response.data['user']['username'] == test_user_with_profile.username # Should return updated profile
    # Verify categories list in response
    assert len(response.data['interested_categories']) == 1
    assert response.data['interested_categories'][0]['id'] == test_category.id

    # Verify database was updated
    test_user_with_profile.profile.refresh_from_db()
    assert test_user_with_profile.profile.interested_categories.count() == 1
    assert test_user_with_profile.profile.interested_categories.first() == test_category

@pytest.mark.django_db
def test_get_timeslots_invalid_start_date(api_client, test_user_with_profile):
    """ Test GET /timeslots/ with an invalid date format (covers except ValueError). """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-list')
    response = api_client.get(url, {'start_date': 'invalid-date-format'}) # Send bad date

    assert response.status_code == 200 # Should still succeed but potentially return all slots

@pytest.mark.django_db
def test_get_timeslots_filter_category_brackets(api_client, test_user_with_profile, test_category, test_timeslot):
    """ Test filtering with category_id[] keys (covers the specific if branch). """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-list')
    start_date = (test_timeslot.start_time - timedelta(days=test_timeslot.start_time.weekday())).strftime('%Y-%m-%d')

    # Construct URL manually or use params with list for category_id[] simulation
    # Note: APIClient GET params might not easily simulate '[]' in key, but we can test the logic path
    # Alternatively, mock request.GET within the test if needed, but let's try simple first.
    # This relies on APIClient/Django Test QueryDict maybe handling list values correctly internally
    # even without brackets in the test client call. If not, mocking is needed.
    response = api_client.get(f"{url}?start_date={start_date}&category_id[]={test_category.id}") # Manually add brackets

    assert response.status_code == 200
    assert len(response.data) >= 1 # Check based on test_timeslot existing
    assert any(slot['id'] == test_timeslot.id for slot in response.data)
    # If the debug print "[DEBUG] Using key 'category_id[]' for filtering." appears, coverage is met.

@pytest.mark.django_db
def test_get_timeslots_invalid_category_id_type(api_client, test_user_with_profile, test_timeslot):
    """ Test filtering with non-integer category ID (covers except ValueError/TypeError). """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-list')
    start_date = (test_timeslot.start_time - timedelta(days=test_timeslot.start_time.weekday())).strftime('%Y-%m-%d')

    response = api_client.get(url, {'start_date': start_date, 'category_id': 'abc'}) # Invalid ID type

    assert response.status_code == 200
    # Expect it to ignore the invalid ID and return results as if no category filter was applied
    # Check if the original timeslot is still returned
    assert any(slot['id'] == test_timeslot.id for slot in response.data)
    # If debug print "[DEBUG] No valid category IDs found..." appears, coverage is met.

@pytest.mark.django_db
def test_get_timeslots_non_existent_category_id(api_client, test_user_with_profile, test_timeslot):
    """ Test filtering with a category ID that exists but isn't an integer. """
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-list')
    start_date = (test_timeslot.start_time - timedelta(days=test_timeslot.start_time.weekday())).strftime('%Y-%m-%d')
    non_existent_id = 99999 # An ID that doesn't correspond to a category

    response = api_client.get(url, {'start_date': start_date, 'category_id': non_existent_id})

    assert response.status_code == 200
    # Expect empty list because filter is applied but no slots match
    assert len(response.data) == 0
    # This implicitly tests the else block for 'No valid category IDs found' isn't hit,
    # because the ID *was* valid, just didn't match anything.

@pytest.mark.django_db
def test_book_timeslot_in_past(api_client, test_user_with_profile, test_category):
    """ Test booking fails if the slot start time is in the past. """
    now = timezone.now()
    past_slot = TimeSlot.objects.create(
        category=test_category,
        start_time=now - timedelta(hours=2), # Start time is in the past
        end_time=now - timedelta(hours=1)
    )
    api_client.force_authenticate(user=test_user_with_profile)
    url = reverse('timeslot-book', kwargs={'pk': past_slot.pk})
    response = api_client.post(url)

    assert response.status_code == 400
    assert 'cannot book a slot in the past' in response.data.get('detail', '').lower()
    past_slot.refresh_from_db()
    assert past_slot.booked_by is None # Should not have been booked

# Test for booking conflict (ensure the relevant check is uncommented in views.py)
# @pytest.mark.django_db
# def test_book_timeslot_conflict(api_client, test_user_with_profile, test_category, test_timeslot):
#     """ Test booking fails if user already has a conflicting booking. """
#     # Pre-book the user for a conflicting slot
#     now = timezone.now()
#     conflicting_slot = TimeSlot.objects.create(
#         category=test_category,
#         start_time=test_timeslot.start_time - timedelta(minutes=30), # Overlaps test_timeslot
#         end_time=test_timeslot.start_time + timedelta(minutes=30),
#         booked_by=test_user_with_profile
#     )
#
#     api_client.force_authenticate(user=test_user_with_profile)
#     url = reverse('timeslot-book', kwargs={'pk': test_timeslot.pk}) # Try to book original slot
#     response = api_client.post(url)
#
#     assert response.status_code == 400
#     assert 'conflicting' in response.data.get('detail', '').lower()
#     test_timeslot.refresh_from_db()
#     assert test_timeslot.booked_by is None