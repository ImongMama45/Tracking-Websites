from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import PageView
from websites.models import Website
from django.db.models import Count


class RealtimeSnapshotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        try:
            website = Website.objects.get(id=website_id, owner=request.user)
        except Website.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        # Count active visitors from cache keys set by TrackingService
        # Each key: active:{website_id}:{visitor_hash}, TTL=120s
        # We scan all keys matching pattern and count non-expired ones
        active_visitors = 0
        try:
            from django.core.cache import cache
            # Django's default cache doesn't support key scanning.
            # TrackingService also sets a rolling count — use that as fallback.
            # Best approach: maintain a sorted set. For now count from DB (last 2 min).
            cutoff = timezone.now() - timedelta(minutes=2)
            active_visitors = (
                PageView.objects
                .filter(website=website, viewed_at__gte=cutoff)
                .values("visitor")
                .distinct()
                .count()
            )
        except Exception:
            active_visitors = 0

        # Active pages: pages viewed in last 2 minutes
        cutoff = timezone.now() - timedelta(minutes=2)
        active_pages = (
            PageView.objects
            .filter(website=website, viewed_at__gte=cutoff)
            .values("path")
            .annotate(count=Count("visitor", distinct=True))
            .order_by("-count")[:10]
        )

        return Response({
            "active_visitors": active_visitors,
            "active_pages": [
                {"url": p["path"], "count": p["count"]}
                for p in active_pages
            ],
        })