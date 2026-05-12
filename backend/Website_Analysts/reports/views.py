import csv

from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from analytics.models import Event, PageView, Session, Visitor
from websites.models import Website


class WebsiteCSVReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = Website.objects.get(id=website_id, owner=request.user)
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{website.tracking_id}-analytics.csv"'
        writer = csv.writer(response)
        writer.writerow(["metric", "value", "generated_at"])
        now = timezone.now().isoformat()
        writer.writerow(["visitors", Visitor.objects.filter(website=website).count(), now])
        writer.writerow(["sessions", Session.objects.filter(website=website).count(), now])
        writer.writerow(["page_views", PageView.objects.filter(website=website).count(), now])
        writer.writerow(["events", Event.objects.filter(website=website).count(), now])
        writer.writerow([])
        writer.writerow(["top_page", "views"])
        for row in PageView.objects.filter(website=website).values("path").annotate(views=Count("id")).order_by("-views")[:50]:
            writer.writerow([row["path"], row["views"]])
        return response
