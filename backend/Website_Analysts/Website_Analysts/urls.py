"""
Analytics Platform - Main URL Configuration
============================================
Centralized URL routing for all API endpoints.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        'service': 'Analytics Platform API',
        'version': '1.0.0',
        'status': 'operational',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'websites': '/api/v1/websites/',
            'analytics': '/api/v1/analytics/',
            'tracking': '/api/v1/track/',
            'events': '/api/v1/events/',
            'sessions': '/api/v1/sessions/',
            'reports': '/api/v1/reports/',
            'notifications': '/api/v1/notifications/',
            'realtime': '/api/v1/realtime/',
        }
    })


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Root
    path('api/', api_root),

    # API v1
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/websites/', include('websites.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/track/', include('tracking.urls')),
    path('api/v1/events/', include('events.urls')),
    path('api/v1/sessions/', include('sessions_app.urls')),
    path('api/v1/reports/', include('reports.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/realtime/', include('realtime.urls')),

    # Tracker JavaScript SDK
    path('tracker.js', include('tracking.sdk_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)