from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Category(models.Model):
  name = models.CharField(max_length=100, unique=True)

  def __str__(self):
      return self.name

class UserProfile(models.Model):
  user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
  interested_categories = models.ManyToManyField(Category, blank=True)

  def __str__(self):
    return f"{self.user.username}'s Profile"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
  if created:
    UserProfile.objects.create(user=instance)

class TimeSlot(models.Model):
  category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='timeslots')
  start_time = models.DateTimeField()
  end_time = models.DateTimeField()

  booked_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='booked_slots',
    # unique=True # Ensure this FK is unique when not NULL
  )

  class Meta:
    ordering = ['start_time']

  def is_booked(self):
    return self.booked_by is not None

  def __str__(self):
    status = f"Booked by {self.booked_by.username}" if self.is_booked() else "Available"
    return f"{self.category.name} Slot: {self.start_time.strftime('%Y-%m-%d %H:%M')} - {status}"