"""
Tracking App - Data Ingestion Pipeline
=======================================
High-throughput endpoint for receiving tracking data from the JS SDK.
Handles batched events, bot filtering, IP anonymization, and geo-lookup.
"""

import json
import logging

from django.core.cache import cache
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from websites.models import Website
from tracking.services import (
    TrackingService,
    BotDetectionService,
)
from realtime.services import RealtimeService

logger = logging.getLogger('tracking')


class PlainTextJSONParser(JSONParser):
    media_type = 'text/plain'

    def parse(self, stream, media_type=None, parser_context=None):
        raw_body = stream.read().decode('utf-8')
        return json.loads(raw_body) if raw_body else {}


class TrackingRateThrottle(AnonRateThrottle):
    """High-capacity throttle for tracking endpoints."""
    scope = 'tracking'


class TrackEventView(APIView):
    """
    Main tracking ingestion endpoint.
    Accepts batched events from the JavaScript tracking SDK.
    
    POST /api/v1/track/event/
    
    Optimized for high throughput:
    - Bot filtering (pre-processing, reject bots early)
    - Async queue via Redis for heavy processing
    - Lightweight synchronous path for real-time counters
    """

    permission_classes = [AllowAny]
    throttle_classes = [TrackingRateThrottle]
    parser_classes = [JSONParser, PlainTextJSONParser]

    def post(self, request):
        payload = self._get_payload(request)
        site_id = request.headers.get('X-Site-Id') or payload.get('site_id')
        if not site_id:
            return Response({'error': 'Missing site_id'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate tracking ID and get website (cached)
        website = self._get_website(site_id)
        if not website:
            return Response({'error': 'Invalid site_id'}, status=status.HTTP_404_NOT_FOUND)

        if not website.is_tracking_active:
            return Response({'status': 'tracking_disabled'}, status=status.HTTP_200_OK)

        # Bot detection - reject early to save processing
        user_agent = request.headers.get('User-Agent', '')
        if website.filter_bots and BotDetectionService.is_bot(user_agent):
            logger.debug(f"Bot rejected: {user_agent[:80]}")
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)

        # IP anonymization
        client_ip = self._get_client_ip(request)
        if website.anonymize_ips:
            client_ip = self._anonymize_ip(client_ip)

        # Check if IP is excluded (e.g., internal team)
        if client_ip in (website.exclude_ips or []):
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)

        # DNT (Do Not Track) header respect
        if website.respect_dnt and request.headers.get('DNT') == '1':
            return Response({'status': 'dnt_respected'}, status=status.HTTP_200_OK)

        events = payload.get('events', [payload])  # Support single or batched events

        if not events or len(events) > 100:  # Sanity limit
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)

        # Process events asynchronously via Celery for heavy lifting
        # Synchronously update real-time counters for live dashboard
        try:
            tracking_service = TrackingService(website, client_ip, user_agent)
            result = tracking_service.process_events(events)

            # Update real-time visitor count (fast Redis operation)
            RealtimeService.update_visitor(
                website_id=str(website.id),
                visitor_hash=result.get('visitor_hash'),
                page=events[-1].get('url', ''),
                country_code=result.get('country_code', ''),
                device_type=result.get('device_type', ''),
            )

            response = Response({'status': 'ok', 'processed': len(events)})
            response['Access-Control-Allow-Origin'] = '*'
            return response

        except Exception as e:
            logger.error(f"Tracking error for site {site_id}: {str(e)}", exc_info=True)
            return Response({'status': 'ok'})  # Always return 200 to not break client sites

    def options(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'content-type, x-site-id'
        response['Access-Control-Max-Age'] = '86400'
        return response

    def _get_payload(self, request) -> dict:
        if isinstance(request.data, dict) and request.data:
            return request.data
        try:
            raw_body = request.body.decode('utf-8')
            return json.loads(raw_body) if raw_body else {}
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {}

    def _get_website(self, tracking_id: str):
        """Cache website lookup to avoid DB hit on every request."""
        cache_key = f"website:tracking:{tracking_id}"
        website = cache.get(cache_key)
        if website is None:
            try:
                website = Website.objects.select_related('script_config').get(
                    tracking_id=tracking_id,
                    status='active'
                )
                cache.set(cache_key, website, timeout=300)  # 5 minute cache
            except Website.DoesNotExist:
                cache.set(cache_key, False, timeout=60)  # Cache miss for 1 min
                return None
        return website if website else None

    def _get_client_ip(self, request) -> str:
        """Extract real IP from proxy headers."""
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def _anonymize_ip(self, ip: str) -> str:
        """Anonymize IP by zeroing last octet (IPv4) or last 80 bits (IPv6)."""
        if not ip:
            return ''
        parts = ip.split('.')
        if len(parts) == 4:  # IPv4
            parts[-1] = '0'
            return '.'.join(parts)
        elif ':' in ip:  # IPv6 - keep first 48 bits
            parts = ip.split(':')
            return ':'.join(parts[:3] + ['0000'] * (len(parts) - 3))
        return ip


class TrackPageView(APIView):
    """Optimized single page view tracking endpoint."""

    permission_classes = [AllowAny]
    throttle_classes = [TrackingRateThrottle]

    def post(self, request):
        # Simplified version of TrackEventView for page views only
        return TrackEventView().post(request)


class TrackerSDKView(APIView):
    """Serve the tracking JavaScript SDK."""

    permission_classes = [AllowAny]

    def get(self, request):
        from django.http import HttpResponse
        from tracking.sdk import generate_tracker_script

        script = generate_tracker_script()
        response = HttpResponse(script, content_type='application/javascript')
        response['Cache-Control'] = 'public, max-age=3600'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Access-Control-Allow-Origin'] = '*'
        return response
