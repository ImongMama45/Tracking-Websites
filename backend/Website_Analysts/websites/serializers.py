"""Websites App - Serializers."""

from rest_framework import serializers
from .models import Website, WebsiteSharedAccess


class WebsiteSerializer(serializers.ModelSerializer):
    page_views_today = serializers.SerializerMethodField()
    visitors_today = serializers.SerializerMethodField()

    class Meta:
        model = Website
        fields = (
            'id', 'name', 'domain', 'tracking_id', 'status',
            'is_tracking_active', 'filter_bots', 'anonymize_ips',
            'respect_dnt', 'exclude_ips', 'favicon_url', 'timezone',
            'page_views_today', 'visitors_today', 'created_at',
        )
        read_only_fields = ('id', 'tracking_id', 'created_at')

    def get_page_views_today(self, obj):
        from django.core.cache import cache
        return cache.get(f'pv_today:{obj.id}', 0)

    def get_visitors_today(self, obj):
        from django.core.cache import cache
        return cache.get(f'visitors_today:{obj.id}', 0)

    def validate_domain(self, value):
        # Normalize domain
        return value.lower().strip().rstrip('/')


class WebsiteCreateSerializer(WebsiteSerializer):
    class Meta(WebsiteSerializer.Meta):
        fields = ('name', 'domain', 'timezone', 'filter_bots', 'anonymize_ips')

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)