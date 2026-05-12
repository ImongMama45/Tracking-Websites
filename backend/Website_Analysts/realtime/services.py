from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class RealtimeService:
    @staticmethod
    def update_visitor(**kwargs):
        website_id = kwargs.get("website_id")
        if not website_id:
            return None
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return None
        async_to_sync(channel_layer.group_send)(
            f"website_{website_id}",
            {
                "type": "analytics.event",
                "payload": {
                    "kind": "visitor_update",
                    "visitor_hash": kwargs.get("visitor_hash"),
                    "page": kwargs.get("page"),
                    "country_code": kwargs.get("country_code", ""),
                    "device_type": kwargs.get("device_type", ""),
                },
            },
        )
        return None
