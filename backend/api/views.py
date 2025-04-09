from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Category, TimeSlot, UserProfile
from .serializers import CategorySerializer, TimeSlotSerializer, UserProfileSerializer, BookingActionSerializer

# ViewSet for Categories (Read Only for regular users)
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = Category.objects.all()
  serializer_class = CategorySerializer
  permission_classes = [permissions.IsAuthenticated]

# View for User Preferences
class UserPreferencesView(generics.RetrieveUpdateAPIView):
  serializer_class = UserProfileSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_object(self):
    # Return the profile of the logged-in user
    profile, created = UserProfile.objects.get_or_create(user=self.request.user)
    return profile

# ViewSet for TimeSlots
class TimeSlotViewSet(viewsets.ReadOnlyModelViewSet):
  serializer_class = TimeSlotSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    # --- DETAILED DEBUGGING ---
    print("-" * 20)
    print(f"[DEBUG] Request Method: {self.request.method}")
    print(f"[DEBUG] Raw Request GET dict: {self.request.GET}") # Shows parsed GET params as dict
    print(f"[DEBUG] Raw request query string: {self.request.META.get('QUERY_STRING')}") # The raw query string
    category_ids_str_get = self.request.GET.getlist('category_id') # Keep checking both
    category_ids_str_get_brackets = self.request.GET.getlist('category_id[]') # Keep checking both
    print(f"[DEBUG] Attempting getlist('category_id'): {self.request.GET.getlist('category_id')}")
    print(f"[DEBUG] Attempting getlist('category_id[]'): {self.request.GET.getlist('category_id[]')}") # Check if key has brackets
    print("-" * 20)
    # --- END DETAILED DEBUGGING ---
    # --- Filtering Logic ---
    queryset = TimeSlot.objects.select_related('category', 'booked_by').all()

    # Filter by week (example: requires 'start_date' query parameter YYYY-MM-DD)
    start_date_str = self.request.query_params.get('start_date')
    if start_date_str:
      try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = start_date + timedelta(days=7)
        # Filter slots that *start* within the week
        queryset = queryset.filter(start_time__date__gte=start_date, start_time__date__lt=end_date)
      except ValueError:
        # Handle invalid date format if necessary
        pass

    # Filter by specific Category IDs passed from Frontend
    # Use getlist to handle multiple category_id parameters
    category_ids_str = self.request.query_params.getlist('category_id')
    # Convert to integers, handling potential errors
    # --- Check if the list is actually populated ---

    if category_ids_str_get_brackets:
      print("[DEBUG] Using key 'category_id[]' for filtering.")
      category_ids_str = category_ids_str_get_brackets
    elif category_ids_str_get:
      # Fallback to 'category_id' if the first wasn't populated but this one is
      print("[DEBUG] Using key 'category_id' for filtering.")
      category_ids_str = category_ids_str_get
    else:
      # Neither key yielded results
      print("[DEBUG] No category_id or category_id[] parameter found.")
      category_ids_str = [] # Ensure it's an empty list
      
    if category_ids_str: # Only attempt conversion and filtering if the list is not empty
      valid_category_ids = []
      for cat_id_str in category_ids_str:
        try:
          valid_category_ids.append(int(cat_id_str))
        except (ValueError, TypeError):
          pass # Ignore invalid IDs silently

      # --- Apply filter ONLY if valid integer IDs were found ---
      if valid_category_ids:
        print(f"[DEBUG] Applying category filter for IDs: {valid_category_ids}") # Add Debug Print
        queryset = queryset.filter(category_id__in=valid_category_ids) # Use __in for multiple IDs
      else:
        print("[DEBUG] No valid category IDs found after conversion, not filtering by category.") # Add Debug Print
    else:
      print("[DEBUG] category_id parameter not found or empty in request, not filtering by category.") # Add Debug Print


    return queryset.order_by('start_time')


  # --- Booking Action ---
  @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], serializer_class=BookingActionSerializer)
  def book(self, request, pk=None):
    timeslot = self.get_object() # Gets the specific timeslot by pk

    if timeslot.booked_by:
      return Response({'detail': 'Slot already booked.'}, status=status.HTTP_400_BAD_REQUEST)

    if timeslot.start_time < timezone.now():
      return Response({'detail': 'Cannot book a slot in the past.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for conflicts
    existing_booking = TimeSlot.objects.filter(booked_by=request.user, start_time__lt=timeslot.end_time, end_time__gt=timeslot.start_time).exists()
    if existing_booking:
      return Response({'detail': 'You already have a booking conflicting with this time.'}, status=status.HTTP_400_BAD_REQUEST)

    timeslot.booked_by = request.user
    timeslot.save()
    serializer = self.get_serializer(timeslot)
    return Response(serializer.data, status=status.HTTP_200_OK)

  # --- Unbooking Action ---
  @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], serializer_class=BookingActionSerializer)
  def unbook(self, request, pk=None):
      timeslot = self.get_object()

      if timeslot.booked_by != request.user:
          return Response({'detail': 'You did not book this slot.'}, status=status.HTTP_403_FORBIDDEN)

      if timeslot.start_time < timezone.now():
            return Response({'detail': 'Cannot unbook a slot in the past.'}, status=status.HTTP_400_BAD_REQUEST)

      timeslot.booked_by = None
      timeslot.save()
      serializer = self.get_serializer(timeslot)
      return Response(serializer.data, status=status.HTTP_200_OK)
