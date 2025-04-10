import pytest
from django.contrib.auth import get_user_model
from api.models import TimeSlot, Category, UserProfile
from datetime import datetime, timedelta
import zoneinfo

User = get_user_model()

# Use pytest fixtures for reusable setup (optional but good)
@pytest.fixture
def test_user(db): # db fixture enables database access
    return User.objects.create_user(username='testuser', password='password')

@pytest.fixture
def test_category(db):
    return Category.objects.create(name='Test Cat')

# Mark tests that need DB access
@pytest.mark.django_db
def test_timeslot_is_booked(test_user, test_category):
    """ Test the is_booked method on the TimeSlot model. """
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC")) # Use timezone-aware datetime
    slot_available = TimeSlot.objects.create(
        category=test_category,
        start_time=now + timedelta(hours=1),
        end_time=now + timedelta(hours=2),
        booked_by=None
    )
    slot_booked = TimeSlot.objects.create(
        category=test_category,
        start_time=now + timedelta(hours=3),
        end_time=now + timedelta(hours=4),
        booked_by=test_user
    )

    assert not slot_available.is_booked()
    assert slot_booked.is_booked()

@pytest.mark.django_db
def test_category_str(test_category):
    """ Test the __str__ method of the Category model. """
    assert str(test_category) == 'Test Cat'

@pytest.mark.django_db
def test_user_profile_creation(test_user):
    """ Test that a UserProfile is created automatically for a new user (via signal). """
    # User is created by the fixture
    # Accessing profile should not raise DoesNotExist if signal worked
    profile = test_user.profile
    assert profile is not None
    assert isinstance(profile, UserProfile)
    assert profile.user == test_user

@pytest.mark.django_db
def test_user_profile_str(test_user):
    """ Test the __str__ method of the UserProfile model. """
    # Profile should be created by fixture or signal
    profile = test_user.profile
    assert str(profile) == "testuser's Profile"

@pytest.mark.django_db
def test_timeslot_str_available(test_category):
    """ Test the __str__ method of an available TimeSlot. """
    now_dt = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    now_str = now_dt.strftime('%Y-%m-%d %H:%M')
    slot = TimeSlot.objects.create(
        category=test_category,
        start_time=now_dt,
        end_time=now_dt + timedelta(hours=1)
    )
    expected_str = f"Test Cat Slot: {now_str} - Available"
    assert str(slot) == expected_str

@pytest.mark.django_db
def test_timeslot_str_booked(test_user, test_category):
    """ Test the __str__ method of a booked TimeSlot. """
    now_dt = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    now_str = now_dt.strftime('%Y-%m-%d %H:%M')
    slot = TimeSlot.objects.create(
        category=test_category,
        start_time=now_dt,
        end_time=now_dt + timedelta(hours=1),
        booked_by=test_user
    )
    expected_str = f"Test Cat Slot: {now_str} - Booked by testuser"
    assert str(slot) == expected_str

# Add tests for UserProfile interested_categories relationship if desired
@pytest.mark.django_db
def test_user_profile_categories(test_user, test_category):
    """ Test adding categories to user profile. """
    profile = test_user.profile
    profile.interested_categories.add(test_category)
    profile.save() # Good practice to save after M2M add

    # Re-fetch user to ensure relation is saved
    user_reloaded = User.objects.get(pk=test_user.pk)
    assert user_reloaded.profile.interested_categories.count() == 1
    assert user_reloaded.profile.interested_categories.first() == test_category