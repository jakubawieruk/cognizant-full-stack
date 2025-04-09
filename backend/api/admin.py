from django.contrib import admin
from .models import Category, TimeSlot, UserProfile
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

class UserProfileInline(admin.StackedInline):
  model = UserProfile
  can_delete = False
  verbose_name_plural = 'Profile'
  fk_name = 'user'
  fields = ('interested_categories',)

class CustomUserAdmin(BaseUserAdmin):
  inlines = (UserProfileInline,)
  list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_interested_categories')
  list_select_related = ('profile',)

  def get_interested_categories(self, instance):
      try:
          return ", ".join([cat.name for cat in instance.profile.interested_categories.all()])
      except UserProfile.DoesNotExist:
          return "No Profile"
  get_interested_categories.short_description = 'Interested Categories'

  def get_inline_instances(self, request, obj=None):
      if not obj:
          return list()
      return super(CustomUserAdmin, self).get_inline_instances(request, obj)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
  list_display = ('name',)
  search_fields = ('name',)

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
  list_display = ('category', 'start_time', 'end_time', 'booked_by', 'is_booked')
  list_filter = ('category', 'start_time', 'booked_by')
  search_fields = ('category__name', 'booked_by__username')
  autocomplete_fields = ['category', 'booked_by']

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)