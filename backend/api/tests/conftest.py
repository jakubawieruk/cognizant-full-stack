import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory
from api.models import Category, TimeSlot, UserProfile
from datetime import datetime, timedelta
import zoneinfo


User = get_user_model()

# --- Client Fixtures ---
@pytest.fixture
def api_client():
    """ Fixture for DRF APIClient """
    return APIClient()

@pytest.fixture
def factory():
    """ Fixture for APIRequestFactory """
    return APIRequestFactory()

# --- Database Fixtures ---
@pytest.fixture
def test_user(db): # db fixture enables database access
    return User.objects.create_user(username='testuser', password='password')

@pytest.fixture
def other_user(db):
    return User.objects.create_user(username='otheruser', password='password')

@pytest.fixture
def test_user_with_profile(db):
    user = User.objects.create_user(username='profileuser', password='password') # Use a unique name if needed
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return user

@pytest.fixture
def test_category(db):
    cat, _ = Category.objects.get_or_create(name='Shared Test Cat')
    return cat

@pytest.fixture
def available_timeslot(db, test_category):
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    slot, _ = TimeSlot.objects.get_or_create(
        category=test_category,
        start_time=now + timedelta(hours=1),
        defaults={'end_time': now + timedelta(hours=2), 'booked_by': None}
    )
    slot.booked_by = None
    slot.save()
    return slot

@pytest.fixture
def booked_by_test_user_timeslot(db, test_category, test_user_with_profile):
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    slot, _ = TimeSlot.objects.get_or_create(
        category=test_category,
        start_time=now + timedelta(hours=3),
        defaults={'end_time': now + timedelta(hours=4)}
    )
    slot.booked_by = test_user_with_profile
    slot.save()
    return slot

@pytest.fixture
def booked_by_other_user_timeslot(db, test_category, other_user):
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    slot, _ = TimeSlot.objects.get_or_create(
        category=test_category,
        start_time=now + timedelta(hours=5),
        defaults={'end_time': now + timedelta(hours=6)}
    )
    slot.booked_by = other_user
    slot.save()
    return slot

@pytest.fixture
def test_timeslot(db, test_category):
    now = datetime.now(tz=zoneinfo.ZoneInfo("UTC"))
    return TimeSlot.objects.create(
        category=test_category,
        start_time=now + timedelta(days=1, hours=1),
        end_time=now + timedelta(days=1, hours=2)
    )
