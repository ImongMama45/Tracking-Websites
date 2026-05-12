from django.core.cache import cache
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import PageView, RealtimeVisitor
from websites.models import Website


class RealtimeSnapshotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = Website.objects.get(id=website_id, owner=request.user)
        active_count = RealtimeVisitor.objects.filter(website=website).count()
        current_pages = (
            PageView.objects.filter(website=website)
            .values("path")
            .annotate(visitors=Count("visitor", distinct=True), views=Count("id"))
            .order_by("-views")[:10]
        )
        return Response({
            "active_visitors": active_count or cache.get(f"active_count:{website.id}", 0),
            "current_pages": list(current_pages),
        })
