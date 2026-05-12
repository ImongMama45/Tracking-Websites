"""Realtime app URL routes."""

from django.urls import path

from .views import RealtimeSnapshotView

urlpatterns = [
    path("<uuid:website_id>/snapshot/", RealtimeSnapshotView.as_view(), name="realtime-snapshot"),
]
