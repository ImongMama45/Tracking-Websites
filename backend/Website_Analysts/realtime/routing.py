from django.urls import re_path

from .consumers import AnalyticsConsumer


websocket_urlpatterns = [
    re_path(r"ws/analytics/(?P<website_id>[0-9a-f-]+)/$", AnalyticsConsumer.as_asgi()),
]
