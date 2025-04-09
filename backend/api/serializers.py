from rest_framework import serializers
from .models import Category, TimeSlot, UserProfile
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
  class Meta:
    model = Category
    fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ('id', 'username', 'first_name', 'last_name')


class UserProfileSerializer(serializers.ModelSerializer):
  interested_categories = CategorySerializer(many=True, read_only=True)
  interested_category_ids = serializers.PrimaryKeyRelatedField(
    many=True, queryset=Category.objects.all(), source='interested_categories', write_only=True
  )
  user = UserSerializer(read_only=True)

  class Meta:
    model = UserProfile
    fields = ['user', 'interested_categories', 'interested_category_ids']


class TimeSlotSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False
    )
    booked_by = UserSerializer(read_only=True)
    is_booked = serializers.BooleanField(read_only=True)
    booked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = ['id', 'category', 'category_id', 'start_time', 'end_time', 'booked_by', 'is_booked', 'booked_by_user']
        read_only_fields = ['booked_by']

    def get_booked_by_user(self, obj):
        """ Check if the slot is booked by the current request's user. """
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.booked_by == user
        return False 

class BookingActionSerializer(serializers.Serializer):
    # No fields needed, action determined by endpoint/method
    pass