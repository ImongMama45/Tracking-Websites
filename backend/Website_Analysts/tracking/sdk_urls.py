"""Tracking SDK URL routes."""

from django.urls import path

from .views import TrackerSDKView


urlpatterns = [
    path("", TrackerSDKView.as_view(), name="tracker-sdk"),
]
