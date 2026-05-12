"""
ASGI Configuration - WebSocket & HTTP Support
==============================================
Supports both HTTP (Django) and WebSocket (Channels) protocols.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Website_Analysts.settings')

django_asgi_app = get_asgi_application()

from realtime import routing as realtime_routing

application = ProtocolTypeRouter({
    # HTTP → Django views
    'http': django_asgi_app,

    # WebSocket → Django Channels
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                realtime_routing.websocket_urlpatterns
            )
        )
    ),
})
