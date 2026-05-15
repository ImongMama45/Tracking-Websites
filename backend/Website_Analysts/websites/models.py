"""
Websites App - Models
=====================
Multi-website management with secure tracking ID generation.
"""

import uuid
import secrets
from django.db import models
from accounts.models import User


class Website(models.Model):
    """
    Represents a website registered on the analytics platform.
    Each website gets a unique tracking ID for the JavaScript SDK.
    """

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        SUSPENDED = 'suspended', 'Suspended'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='websites'
    )

    # Site info
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    favicon_url = models.URLField(blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC')

    # Tracking
    tracking_id = models.CharField(max_length=32, unique=True, db_index=True)
    tracking_script_version = models.CharField(max_length=10, default='1.0.0')
    is_tracking_active = models.BooleanField(default=True)

    # Settings
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    allowed_domains = models.JSONField(
        blank=True,
        default=list,
        help_text='Additional allowed domains for tracking (subdomains, staging, etc.)'
    )
    exclude_ips = models.JSONField(
        blank=True,
        default=list,
        help_text='IP addresses to exclude from tracking (e.g., internal team)'
    )

    # Privacy
    anonymize_ips = models.BooleanField(default=True)
    gdpr_mode = models.BooleanField(default=False)
    respect_dnt = models.BooleanField(default=True)

    # Bot filtering
    filter_bots = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_ping_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'websites'
        verbose_name = 'Website'
        verbose_name_plural = 'Websites'
        indexes = [
            models.Index(fields=['tracking_id']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['domain']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.domain})"

    def save(self, *args, **kwargs):
        if not self.tracking_id:
            self.tracking_id = self._generate_tracking_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_tracking_id():
        """Generate a secure, unique tracking ID like: AP-XXXXXXXXXXXX"""
        token = secrets.token_hex(6).upper()
        return f"AP-{token}"

    @property
    def embed_script(self):
        return f'<script async src="https://tracking-websites-g4qt8910p-imongmama45s-projects.vercel.app/tracker.js" data-site-id="{self.tracking_id}"></script>'

    @property
    def is_verified(self):
        """Check if tracking script has been successfully detected on the site."""
        return self.last_ping_at is not None
class WebsiteSharedAccess(models.Model):
    class Permission(models.TextChoices):
        VIEW = "view"
        EDIT = "edit"
        ADMIN = "admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="shared_access")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.CharField(max_length=10, choices=Permission.choices)

    created_at = models.DateTimeField(auto_now_add=True)

class WebsiteMember(models.Model):
    """
    Team members with role-based access to a website's analytics.
    Enables sharing dashboards with collaborators.
    """

    class Permission(models.TextChoices):
        VIEW = 'view', 'View Only'
        ANALYST = 'analyst', 'Analyst'
        ADMIN = 'admin', 'Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='website_memberships')
    permission = models.CharField(max_length=20, choices=Permission.choices, default=Permission.VIEW)
    invited_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_invitations'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'website_members'
        unique_together = ['website', 'user']


class TrackingScript(models.Model):
    """
    Versioned tracking script configurations per website.
    Allows customizing what events and data are collected.
    """

    website = models.OneToOneField(Website, on_delete=models.CASCADE, related_name='script_config')

    # Feature flags
    track_page_views = models.BooleanField(default=True)
    track_scroll_depth = models.BooleanField(default=True)
    track_clicks = models.BooleanField(default=True)
    track_forms = models.BooleanField(default=True)
    track_outbound_links = models.BooleanField(default=True)
    track_file_downloads = models.BooleanField(default=True)
    track_404_errors = models.BooleanField(default=True)

    # Custom events config
    custom_events_enabled = models.BooleanField(default=True)
    session_recording_enabled = models.BooleanField(default=False)

    # Performance
    batch_size = models.IntegerField(default=10)
    flush_interval_ms = models.IntegerField(default=5000)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tracking_scripts'
