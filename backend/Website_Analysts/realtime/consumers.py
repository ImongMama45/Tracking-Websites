import json

from channels.generic.websocket import AsyncWebsocketConsumer


class AnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.website_id = self.scope["url_route"]["kwargs"]["website_id"]
        self.group_name = f"website_{self.website_id}"
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def analytics_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))
