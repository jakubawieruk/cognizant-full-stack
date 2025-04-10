import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory # To create mock request objects
from api.serializers import TimeSlotSerializer # Import the serializer

User = get_user_model()

@pytest.mark.django_db
def test_timeslot_serializer_fields(available_timeslot, test_user):
    """ Basic test to ensure expected fields are present (authenticated). """
    # Simulate an authenticated request context
    factory = APIRequestFactory()
    request = factory.get('/fake-url/') # URL doesn't matter much here
    request.user = test_user # Assign the authenticated user

    serializer = TimeSlotSerializer(available_timeslot, context={'request': request})
    data = serializer.data

    # Check for essential fields
    assert 'id' in data
    assert 'start_time' in data
    assert 'end_time' in data
    assert 'category' in data
    assert 'booked_by' in data # Will be null here
    assert 'is_booked' in data
    assert 'booked_by_user' in data # The field we're focusing on

@pytest.mark.django_db
def test_timeslot_serializer_is_booked(available_timeslot, booked_by_test_user_timeslot, test_user):
    """ Test the 'is_booked' field output. """
    factory = APIRequestFactory()
    request = factory.get('/fake-url/')
    request.user = test_user # Context doesn't strictly affect is_booked, but good practice

    serializer_available = TimeSlotSerializer(available_timeslot, context={'request': request})
    serializer_booked = TimeSlotSerializer(booked_by_test_user_timeslot, context={'request': request})

    assert serializer_available.data['is_booked'] is False
    assert serializer_booked.data['is_booked'] is True

@pytest.mark.django_db
def test_timeslot_serializer_booked_by_user_authenticated(
    factory, test_user_with_profile, available_timeslot, booked_by_test_user_timeslot, booked_by_other_user_timeslot
):
    """ Test 'booked_by_user' when the request user IS authenticated. """
    request = factory.get('/fake-url/')
    request.user = test_user_with_profile # The authenticated user for this test run

    context = {'request': request}

    # Case 1: Slot is available
    serializer_available = TimeSlotSerializer(available_timeslot, context=context)
    assert serializer_available.data['booked_by_user'] is False

    # Case 2: Slot booked by the current user (test_user)
    serializer_booked_self = TimeSlotSerializer(booked_by_test_user_timeslot, context=context)
    assert serializer_booked_self.data['booked_by_user'] is True

    # Case 3: Slot booked by a different user (other_user)
    serializer_booked_other = TimeSlotSerializer(booked_by_other_user_timeslot, context=context)
    assert serializer_booked_other.data['booked_by_user'] is False


@pytest.mark.django_db
def test_timeslot_serializer_booked_by_user_unauthenticated(
    factory, available_timeslot, booked_by_test_user_timeslot
):
    """ Test 'booked_by_user' when the request user IS NOT authenticated. """
    # Simulate an unauthenticated request (AnonymousUser)
    request = factory.get('/fake-url/')
    # request.user = AnonymousUser() # Usually default if not set, or explicitly set if needed

    context = {'request': request}

    # Case 1: Slot is available
    serializer_available = TimeSlotSerializer(available_timeslot, context=context)
    assert serializer_available.data['booked_by_user'] is False

    # Case 2: Slot booked by *some* user (doesn't matter who, current user is anonymous)
    serializer_booked = TimeSlotSerializer(booked_by_test_user_timeslot, context=context)
    assert serializer_booked.data['booked_by_user'] is False

    # Ensure the serializer doesn't crash if context is missing (optional robustness check)
    serializer_no_context = TimeSlotSerializer(booked_by_test_user_timeslot)
    # Check it returns False safely (or handle potential error depending on desired behavior)
    assert serializer_no_context.data['booked_by_user'] is False