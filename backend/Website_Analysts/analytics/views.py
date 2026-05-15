"""
Analytics App - Views
Provides aggregated analytics data for the dashboard.
All endpoints require authentication and website ownership.
"""

from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, Q, F
from django.db.models.functions import TruncDate, TruncHour
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from websites.models import Website
from .models import (
    Visitor, Session, PageView, Event,
    DailyAnalytics,
)


def get_website_or_404(request, website_id):
    """Helper to get website with ownership check."""
    try:
        return Website.objects.get(
            Q(id=website_id) & (Q(owner=request.user) | Q(shared_access__user=request.user))
        )
    except Website.DoesNotExist:
        return None


def parse_date_range(request):
    """Parse start/end from query params, default to last 30 days."""
    end = timezone.now().date()
    start_str = request.query_params.get('start')
    end_str = request.query_params.get('end')
    period = request.query_params.get('period', '30d')

    if start_str and end_str:
        try:
            start = datetime.strptime(start_str, '%Y-%m-%d').date()
            end = datetime.strptime(end_str, '%Y-%m-%d').date()
            return start, end
        except ValueError:
            pass

    period_map = {'7d': 7, '14d': 14, '30d': 30, '90d': 90, '12m': 365}
    days = period_map.get(period, 30)
    start = end - timedelta(days=days - 1)
    return start, end


class OverviewStatsView(APIView):
    """
    GET /api/v1/analytics/{website_id}/overview/
    Returns key KPI metrics for the dashboard overview.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)
        prev_start = start - (end - start) - timedelta(days=1)
        prev_end = start - timedelta(days=1)

        def get_stats(date_start, date_end):
            sessions = Session.objects.filter(
                website=website,
                started_at__date__range=(date_start, date_end),
            )
            page_views = PageView.objects.filter(
                website=website,
                viewed_at__date__range=(date_start, date_end),
            )
            visitors = sessions.values('visitor').distinct().count()
            total_sessions = sessions.count()
            bounce_sessions = sessions.filter(is_bounce=True).count()
            avg_duration = sessions.aggregate(avg=Avg('duration_seconds'))['avg'] or 0
            return {
                'visitors': visitors,
                'page_views': page_views.count(),
                'sessions': total_sessions,
                'bounce_rate': (bounce_sessions / total_sessions * 100) if total_sessions else 0,
                'avg_session_duration': round(avg_duration),
                'pages_per_session': round(page_views.count() / total_sessions, 2) if total_sessions else 0,
            }

        current = get_stats(start, end)
        previous = get_stats(prev_start, prev_end)

        def calc_change(curr, prev):
            if prev == 0:
                return 100 if curr > 0 else 0
            return round((curr - prev) / prev * 100, 1)

        return Response({
            'current': {
                'visitors': current['visitors'],
                'page_views': current['page_views'],
                'sessions': current['sessions'],
                'bounce_rate': current['bounce_rate'],
            },
            'changes': {
                'visitors': calc_change(current['visitors'], previous['visitors']),
                'page_views': calc_change(current['page_views'], previous['page_views']),
                'sessions': calc_change(current['sessions'], previous['sessions']),
                'bounce_rate': calc_change(current['bounce_rate'], previous['bounce_rate']),
            }
        })


class TrafficChartView(APIView):
    """
    GET /api/v1/analytics/{website_id}/traffic/
    Returns time-series data for visitor/pageview charts.
    Falls back to live Session/PageView queries when DailyAnalytics is empty.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)

        # Try pre-aggregated table first (fast path)
        daily = list(
            DailyAnalytics.objects
            .filter(website=website, date__range=(start, end))
            .order_by('date')
            .values('date', 'unique_visitors', 'total_page_views', 'total_sessions')
        )

        if daily:
            # Use pre-aggregated data
            date_map = {row['date']: row for row in daily}
            result = []
            current = start
            while current <= end:
                row = date_map.get(current, {})
                result.append({
                    'date': str(current),
                    'visitors': row.get('unique_visitors', 0),
                    'page_views': row.get('total_page_views', 0),
                    'sessions': row.get('total_sessions', 0),
                })
                current += timedelta(days=1)
        else:
            # Fallback: query live data directly from PageView + Session tables
            from django.db.models.functions import TruncDate

            page_views_by_date = (
                PageView.objects
                .filter(website=website, viewed_at__date__range=(start, end))
                .annotate(day=TruncDate('viewed_at'))
                .values('day')
                .annotate(
                    page_views=Count('id'),
                    unique_visitors=Count('visitor', distinct=True),
                )
            )
            pv_map = {row['day']: row for row in page_views_by_date}

            sessions_by_date = (
                Session.objects
                .filter(website=website, started_at__date__range=(start, end))
                .annotate(day=TruncDate('started_at'))
                .values('day')
                .annotate(sessions=Count('id'))
            )
            sess_map = {row['day']: row['sessions'] for row in sessions_by_date}

            result = []
            current = start
            while current <= end:
                pv = pv_map.get(current, {})
                result.append({
                    'date': str(current),
                    'visitors': pv.get('unique_visitors', 0),
                    'page_views': pv.get('page_views', 0),
                    'sessions': sess_map.get(current, 0),
                })
                current += timedelta(days=1)

        return Response({'data': result})


class TopPagesView(APIView):
    """GET /api/v1/analytics/{website_id}/pages/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)
        limit = int(request.query_params.get('limit', 10))

        pages = (
            PageView.objects
            .filter(website=website, viewed_at__date__range=(start, end))
            .values('path')
            .annotate(
                views=Count('id'),
                unique_visitors=Count('visitor', distinct=True),
                avg_duration=Avg('time_on_page'),
                avg_scroll=Avg('scroll_depth'),
            )
            .order_by('-views')[:limit]
        )

        return Response({'data': list(pages)})


class TrafficSourcesView(APIView):
    """GET /api/v1/analytics/{website_id}/sources/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)

        sources = (
            Session.objects
            .filter(website=website, started_at__date__range=(start, end))
            .values('entry_type')
            .annotate(sessions=Count('id'))
            .order_by('-sessions')
        )

        referrers = (
            Session.objects
            .filter(website=website, started_at__date__range=(start, end), entry_type='referral')
            .exclude(referrer_domain='')
            .values('referrer_domain')
            .annotate(sessions=Count('id'))
            .order_by('-sessions')[:10]
        )

        return Response({'sources': list(sources), 'referrers': list(referrers)})


class DeviceStatsView(APIView):
    """GET /api/v1/analytics/{website_id}/devices/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)
        sessions = Session.objects.filter(
            website=website,
            started_at__date__range=(start, end),
        )

        device_types = (
            Visitor.objects
            .filter(sessions__in=sessions)
            .values('device_type')
            .annotate(count=Count('id', distinct=True))
        )

        browsers = (
            Visitor.objects
            .filter(sessions__in=sessions)
            .values('browser')
            .annotate(count=Count('id', distinct=True))
            .order_by('-count')[:8]
        )

        os_stats = (
            Visitor.objects
            .filter(sessions__in=sessions)
            .values('os')
            .annotate(count=Count('id', distinct=True))
            .order_by('-count')[:8]
        )

        return Response({
            'device_types': list(device_types),
            'browsers': list(browsers),
            'os': list(os_stats),
        })


class LocationStatsView(APIView):
    """GET /api/v1/analytics/{website_id}/locations/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)
        sessions = Session.objects.filter(
            website=website,
            started_at__date__range=(start, end),
        )

        countries = (
            Visitor.objects
            .filter(sessions__in=sessions)
            .exclude(country_code='')
            .values('country_code', 'country_name')
            .annotate(sessions=Count('sessions', distinct=True))
            .order_by('-sessions')[:20]
        )

        return Response({'countries': list(countries)})


class EventStatsView(APIView):
    """GET /api/v1/analytics/{website_id}/events/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)
        events = (
            Event.objects
            .filter(website=website, occurred_at__date__range=(start, end))
            .values('event_name', 'event_type')
            .annotate(
                count=Count('id'),
                unique_visitors=Count('visitor', distinct=True),
            )
            .order_by('-count')[:20]
        )

        return Response({'data': list(events)})

class SessionListView(APIView):
    """GET /api/v1/analytics/{website_id}/sessions/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, website_id):
        website = get_website_or_404(request, website_id)
        if not website:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        start, end = parse_date_range(request)
        sessions = Session.objects.filter(
            website=website,
            started_at__date__range=(start, end),
        ).select_related("visitor").order_by("-started_at")

        total = sessions.count()
        bounces = sessions.filter(is_bounce=True).count()
        avg_dur = sessions.aggregate(avg=Avg('duration_seconds'))['avg'] or 0
        avg_pages = sessions.aggregate(avg=Avg('page_count'))['avg'] or 0

        # Entry pages
        entry_pages = (
            sessions.exclude(entry_page='')
            .values('entry_page')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Exit pages
        exit_pages = (
            sessions.exclude(exit_page='')
            .values('exit_page')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Recent sessions list (last 50)
        recent = sessions[:50].values(
            'id', 'started_at', 'duration_seconds',
            'page_count', 'is_bounce', 'entry_page',
            'exit_page', 'entry_type',
            'visitor__country_name', 'visitor__device_type', 'visitor__browser',
        )

        return Response({
            'summary': {
                'total_sessions':    total,
                'bounce_rate':       round(bounces / total * 100, 1) if total else 0,
                'avg_duration':      round(avg_dur),
                'avg_pages':         round(avg_pages, 2),
            },
            'entry_pages': list(entry_pages),
            'exit_pages':  list(exit_pages),
            'sessions':    list(recent),
        })