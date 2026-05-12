from rest_framework import serializers

from .models import DailyAnalytics, Event, PageView, Session, Visitor


class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = (
            "id", "visitor_hash", "device_type", "browser", "os",
            "country_code", "country_name", "first_seen_at", "last_seen_at", "visit_count",
        )


class SessionSerializer(serializers.ModelSerializer):
    visitor_hash = serializers.CharField(source="visitor.visitor_hash", read_only=True)

    class Meta:
        model = Session
        fields = (
            "id", "visitor_hash", "entry_type", "entry_page", "exit_page",
            "page_count", "started_at", "ended_at", "duration_seconds",
            "is_bounce", "is_converted",
        )


class PageViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageView
        fields = ("id", "url", "path", "hostname", "title", "referrer", "time_on_page", "scroll_depth", "viewed_at")


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ("id", "event_type", "event_name", "properties", "revenue", "currency", "occurred_at")


class DailyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAnalytics
        fields = "__all__"
