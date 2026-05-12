"""Tracking app URL routes."""

from django.urls import path

from .views import TrackEventView, TrackPageView


urlpatterns = [
    path("event/", TrackEventView.as_view(), name="track-event"),
    path("pageview/", TrackPageView.as_view(), name="track-pageview"),
]
