"""Reports app URL routes."""

from django.urls import path

from .views import WebsiteCSVReportView

urlpatterns = [
    path("<uuid:website_id>/export.csv", WebsiteCSVReportView.as_view(), name="report-export-csv"),
]
