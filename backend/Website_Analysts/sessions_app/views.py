from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from analytics.models import Session
from analytics.serializers import SessionSerializer


class SessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["entry_type", "is_bounce", "is_converted", "website"]
    ordering_fields = ["started_at", "duration_seconds", "page_count"]
    ordering = ["-started_at"]

    def get_queryset(self):
        return Session.objects.filter(
            Q(website__owner=self.request.user) | Q(website__shared_access__user=self.request.user)
        ).select_related("website", "visitor").distinct()
