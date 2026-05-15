"""Analytics app URL routes."""

from django.urls import path

from .views import (
    DeviceStatsView,
    EventStatsView,
    LocationStatsView,
    OverviewStatsView,
    TopPagesView,
    TrafficChartView,
    TrafficSourcesView,
    SessionListView,
)


urlpatterns = [
    path("<uuid:website_id>/overview/", OverviewStatsView.as_view(), name="analytics-overview"),
    path("<uuid:website_id>/traffic/", TrafficChartView.as_view(), name="analytics-traffic"),
    path("<uuid:website_id>/pages/", TopPagesView.as_view(), name="analytics-pages"),
    path("<uuid:website_id>/sources/", TrafficSourcesView.as_view(), name="analytics-sources"),
    path("<uuid:website_id>/devices/", DeviceStatsView.as_view(), name="analytics-devices"),
    path("<uuid:website_id>/locations/", LocationStatsView.as_view(), name="analytics-locations"),
    path("<uuid:website_id>/events/", EventStatsView.as_view(), name="analytics-events"),
    path('<int:website_id>/sessions/', SessionListView.as_view(), name='sessions'),
]
