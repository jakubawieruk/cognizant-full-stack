from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'timeslots', views.TimeSlotViewSet, basename='timeslot')

urlpatterns = [
  path('', include(router.urls)),
  path('user/preferences/', views.UserPreferencesView.as_view(), name='user-preferences'),
  path('auth/', include('dj_rest_auth.urls')),
  path('auth/registration/', include('dj_rest_auth.registration.urls')),
]