"""Websites App - URL Routes."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WebsiteViewSet

router = DefaultRouter()
router.register(r'', WebsiteViewSet, basename='website')

urlpatterns = [path('', include(router.urls))]