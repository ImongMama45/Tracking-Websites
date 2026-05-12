"""
Analytics App - Core Models
============================
Production-grade PostgreSQL models for analytics data collection.
Optimized with proper indexing for high-throughput analytics queries.
"""

import uuid
from django.db import models


class Visitor(models.Model):
    """
    Represents a unique visitor across sessions.
    Identified by a browser fingerprint hash (privacy-safe, no PII).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='visitors')

    # Anonymous identification (fingerprint-based, no PII)
    visitor_hash = models.CharField(max_length=64, db_index=True)

    # Device classification
    device_type = models.CharField(max_length=20, choices=[
        ('desktop', 'Desktop'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
        ('bot', 'Bot'),
        ('unknown', 'Unknown'),
    ], default='unknown')

    # Browser info
    browser = models.CharField(max_length=100, blank=True)
    browser_version = models.CharField(max_length=20, blank=True)
    os = models.CharField(max_length=100, blank=True)
    os_version = models.CharField(max_length=20, blank=True)

    # Geography (anonymized)
    country_code = models.CharField(max_length=2, blank=True, db_index=True)
    country_name = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    timezone = models.CharField(max_length=50, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Screen
    screen_width = models.IntegerField(null=True, blank=True)
    screen_height = models.IntegerField(null=True, blank=True)
    viewport_width = models.IntegerField(null=True, blank=True)
    viewport_height = models.IntegerField(null=True, blank=True)

    # Language
    language = models.CharField(max_length=20, blank=True)

    # Metadata
    first_seen_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    visit_count = models.IntegerField(default=1)

    class Meta:
        db_table = 'analytics_visitors'
        unique_together = ['website', 'visitor_hash']
        indexes = [
            models.Index(fields=['website', 'first_seen_at']),
            models.Index(fields=['website', 'country_code']),
            models.Index(fields=['website', 'device_type']),
            models.Index(fields=['first_seen_at']),
        ]

    def __str__(self):
        return f"Visitor {self.visitor_hash[:8]} @ {self.website}"


class Session(models.Model):
    """
    A single browsing session for a visitor.
    Sessions expire after 30 minutes of inactivity.
    """

    class EntryType(models.TextChoices):
        DIRECT = 'direct', 'Direct'
        REFERRAL = 'referral', 'Referral'
        SEARCH = 'search', 'Search Engine'
        SOCIAL = 'social', 'Social Media'
        EMAIL = 'email', 'Email'
        PAID = 'paid', 'Paid Ads'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='sessions')
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='sessions')

    # Traffic source
    referrer_url = models.TextField(blank=True)
    referrer_domain = models.CharField(max_length=255, blank=True)
    utm_source = models.CharField(max_length=255, blank=True)
    utm_medium = models.CharField(max_length=255, blank=True)
    utm_campaign = models.CharField(max_length=255, blank=True)
    utm_term = models.CharField(max_length=255, blank=True)
    utm_content = models.CharField(max_length=255, blank=True)
    entry_type = models.CharField(max_length=20, choices=EntryType.choices, default=EntryType.DIRECT)

    # Pages
    entry_page = models.TextField(blank=True)
    exit_page = models.TextField(blank=True)
    page_count = models.IntegerField(default=1)

    # Duration
    started_at = models.DateTimeField(db_index=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)

    # Engagement
    is_bounce = models.BooleanField(default=True)
    is_converted = models.BooleanField(default=False)

    # Metadata
    ip_hash = models.CharField(max_length=64, blank=True)  # Anonymized

    class Meta:
        db_table = 'analytics_sessions'
        indexes = [
            models.Index(fields=['website', 'started_at']),
            models.Index(fields=['website', 'entry_type']),
            models.Index(fields=['visitor', 'started_at']),
            models.Index(fields=['website', 'is_bounce']),
            models.Index(fields=['started_at']),
        ]


class PageView(models.Model):
    """
    Individual page view event with detailed engagement metrics.
    Core of the analytics data pipeline.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='page_views')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='page_views')
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='page_views')

    # Page info
    url = models.TextField(db_index=True)
    path = models.TextField(db_index=True)
    hostname = models.CharField(max_length=255)
    title = models.CharField(max_length=500, blank=True)
    query_params = models.TextField(blank=True)

    # Referrer for this specific page
    referrer = models.TextField(blank=True)

    # Engagement
    time_on_page = models.IntegerField(default=0, help_text='Seconds spent on page')
    scroll_depth = models.IntegerField(default=0, help_text='Max scroll depth percentage (0-100)')
    is_exit_page = models.BooleanField(default=False)
    is_entry_page = models.BooleanField(default=False)

    # Timestamps
    viewed_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = 'analytics_page_views'
        indexes = [
            models.Index(fields=['website', 'viewed_at']),
            models.Index(fields=['website', 'path']),
            models.Index(fields=['session', 'viewed_at']),
            models.Index(fields=['viewed_at']),
        ]


class Event(models.Model):
    """
    Custom and automatic events tracked by the JavaScript SDK.
    Supports clicks, form submissions, custom business events, etc.
    """

    class EventType(models.TextChoices):
        CLICK = 'click', 'Click'
        FORM_SUBMIT = 'form_submit', 'Form Submission'
        SCROLL = 'scroll', 'Scroll'
        VIDEO_PLAY = 'video_play', 'Video Play'
        VIDEO_COMPLETE = 'video_complete', 'Video Complete'
        DOWNLOAD = 'download', 'File Download'
        OUTBOUND_LINK = 'outbound_link', 'Outbound Link'
        CUSTOM = 'custom', 'Custom Event'
        ERROR_404 = 'error_404', '404 Error'
        CONVERSION = 'conversion', 'Conversion'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='events')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='events', null=True)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='events')
    page_view = models.ForeignKey(PageView, on_delete=models.SET_NULL, null=True, related_name='events')

    # Event classification
    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    event_name = models.CharField(max_length=255, db_index=True)  # e.g., "Signup Button Click"

    # Flexible properties (JSON)
    properties = models.JSONField(default=dict, blank=True)

    # Element info (for click/form events)
    element_tag = models.CharField(max_length=50, blank=True)
    element_id = models.CharField(max_length=255, blank=True)
    element_class = models.CharField(max_length=500, blank=True)
    element_text = models.CharField(max_length=255, blank=True)
    element_href = models.TextField(blank=True)

    # Revenue tracking (optional)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, blank=True)

    occurred_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = 'analytics_events'
        indexes = [
            models.Index(fields=['website', 'event_type', 'occurred_at']),
            models.Index(fields=['website', 'event_name', 'occurred_at']),
            models.Index(fields=['occurred_at']),
        ]


class RealtimeVisitor(models.Model):
    """
    Tracks currently active visitors for real-time dashboard.
    Records are TTL-managed by Redis; this table is for persistence/fallback.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='realtime_visitors')
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='realtime_records')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, null=True)

    current_page = models.TextField(blank=True)
    current_page_title = models.CharField(max_length=500, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    device_type = models.CharField(max_length=20, blank=True)

    last_active_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = 'analytics_realtime_visitors'
        unique_together = ['website', 'visitor']
        indexes = [
            models.Index(fields=['website', 'last_active_at']),
        ]


# ─── Aggregated Analytics Tables (for fast dashboard queries) ─────────────────

class DailyAnalytics(models.Model):
    """
    Pre-aggregated daily analytics for fast dashboard rendering.
    Computed by Celery tasks every hour, and at midnight.
    """

    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='daily_analytics')
    date = models.DateField(db_index=True)

    # Traffic
    total_visitors = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
    returning_visitors = models.IntegerField(default=0)
    total_page_views = models.IntegerField(default=0)
    total_sessions = models.IntegerField(default=0)

    # Engagement
    bounce_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    avg_session_duration = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_pages_per_session = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    avg_scroll_depth = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Traffic sources (JSON for flexibility)
    traffic_sources = models.JSONField(default=dict)
    top_pages = models.JSONField(default=list)
    top_countries = models.JSONField(default=list)
    device_breakdown = models.JSONField(default=dict)
    browser_breakdown = models.JSONField(default=dict)
    hourly_breakdown = models.JSONField(default=list)

    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_daily'
        unique_together = ['website', 'date']
        indexes = [
            models.Index(fields=['website', 'date']),
        ]
        ordering = ['-date']


class MonthlyAnalytics(models.Model):
    """Pre-aggregated monthly analytics."""

    website = models.ForeignKey('websites.Website', on_delete=models.CASCADE, related_name='monthly_analytics')
    year = models.IntegerField()
    month = models.IntegerField()

    total_visitors = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
    total_page_views = models.IntegerField(default=0)
    total_sessions = models.IntegerField(default=0)
    bounce_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    avg_session_duration = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    traffic_sources = models.JSONField(default=dict)
    top_pages = models.JSONField(default=list)
    top_countries = models.JSONField(default=list)

    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_monthly'
        unique_together = ['website', 'year', 'month']
        ordering = ['-year', '-month']
