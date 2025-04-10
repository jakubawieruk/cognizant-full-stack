import pytest
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
    assert response.status_code == 401 # Or 403 depending on default permission

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
    # Note: response.data might be paginated if pagination is enabled
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