from celery import shared_task
from django.db.models import Avg, Count
from django.utils import timezone

from websites.models import Website
from .models import DailyAnalytics, PageView, Session, Visitor


@shared_task
def aggregate_daily_analytics(date_iso=None):
    target_date = timezone.datetime.fromisoformat(date_iso).date() if date_iso else timezone.now().date()
    for website in Website.objects.filter(status=Website.Status.ACTIVE):
        sessions = Session.objects.filter(website=website, started_at__date=target_date)
        page_views = PageView.objects.filter(website=website, viewed_at__date=target_date)
        visitors = Visitor.objects.filter(website=website, sessions__started_at__date=target_date).distinct()
        total_sessions = sessions.count()
        bounce_count = sessions.filter(is_bounce=True).count()
        DailyAnalytics.objects.update_or_create(
            website=website,
            date=target_date,
            defaults={
                "total_visitors": visitors.count(),
                "unique_visitors": visitors.count(),
                "returning_visitors": visitors.filter(visit_count__gt=1).count(),
                "total_page_views": page_views.count(),
                "total_sessions": total_sessions,
                "bounce_rate": (bounce_count / total_sessions * 100) if total_sessions else 0,
                "avg_session_duration": sessions.aggregate(avg=Avg("duration_seconds"))["avg"] or 0,
                "avg_pages_per_session": page_views.count() / total_sessions if total_sessions else 0,
                "avg_scroll_depth": page_views.aggregate(avg=Avg("scroll_depth"))["avg"] or 0,
                "top_pages": list(page_views.values("path").annotate(views=Count("id")).order_by("-views")[:10]),
                "top_countries": list(visitors.values("country_code", "country_name").annotate(visitors=Count("id")).order_by("-visitors")[:10]),
            },
        )
    return str(target_date)
