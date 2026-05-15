"""Websites App - Views and URLs."""

import os
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Website, WebsiteSharedAccess
from .serializers import WebsiteSerializer, WebsiteCreateSerializer


class WebsiteViewSet(viewsets.ModelViewSet):
    """
    CRUD for user websites.
    GET    /api/v1/websites/           → list
    POST   /api/v1/websites/           → create
    GET    /api/v1/websites/{id}/      → retrieve
    PATCH  /api/v1/websites/{id}/      → update
    DELETE /api/v1/websites/{id}/      → soft-delete
    POST   /api/v1/websites/{id}/pause/     → pause tracking
    POST   /api/v1/websites/{id}/activate/  → resume tracking
    GET    /api/v1/websites/{id}/snippet/   → get embed snippet
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Include own + shared websites
        return Website.objects.filter(
            Q(owner=user) | Q(shared_access__user=user)
        ).exclude(status='deleted').distinct().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return WebsiteCreateSerializer
        return WebsiteSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        instance.status = Website.Status.INACTIVE
        instance.save(update_fields=['status'])

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        website = self.get_object()
        website.is_tracking_active = False
        website.save(update_fields=['is_tracking_active'])
        return Response({'status': 'paused'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        website = self.get_object()
        website.is_tracking_active = True
        website.save(update_fields=['is_tracking_active'])
        return Response({'status': 'active'})

    @action(detail=True, methods=['get'])
    def snippet(self, request, pk=None):
        website = self.get_object()
        base_url = os.environ.get('TRACKER_BASE_URL') or request.build_absolute_uri('/').rstrip('/')
        snippet = (
            f'<script async src="{base_url}/tracker.js" '
            f'data-site-id="{website.tracking_id}"></script>'
        )
        return Response({'snippet': snippet, 'tracking_id': website.tracking_id})
