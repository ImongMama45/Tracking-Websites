from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from analytics.models import Event
from analytics.serializers import EventSerializer


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["event_type", "website"]
    search_fields = ["event_name", "properties"]
    ordering_fields = ["occurred_at", "event_name"]
    ordering = ["-occurred_at"]

    def get_queryset(self):
        return Event.objects.filter(
            Q(website__owner=self.request.user) | Q(website__shared_access__user=self.request.user)
        ).select_related("website", "visitor", "session").distinct()
