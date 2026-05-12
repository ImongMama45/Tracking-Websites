import hashlib
from datetime import timedelta
from urllib.parse import urlparse

from django.core.cache import cache
from django.utils import timezone

from analytics.models import Event, PageView, Session, Visitor


class BotDetectionService:
    @staticmethod
    def is_bot(user_agent: str) -> bool:
        lowered = user_agent.lower()
        bot_signatures = ("bot", "crawler", "spider", "slurp", "bingpreview")
        return any(signature in lowered for signature in bot_signatures)


class GeoLocationService:
    @staticmethod
    def lookup(_ip_address: str) -> dict:
        return {}


class UserAgentParserService:
    @staticmethod
    def parse(_user_agent: str) -> dict:
        return {}


class TrackingService:
    def __init__(self, website, client_ip: str, user_agent: str):
        self.website = website
        self.client_ip = client_ip
        self.user_agent = user_agent

    def process_events(self, events):
        visitor_seed = f"{self.website.pk}:{self.client_ip}:{self.user_agent}"
        visitor_hash = hashlib.sha256(visitor_seed.encode("utf-8")).hexdigest()
        parsed_agent = UserAgentParserService.parse(self.user_agent)
        visitor, _ = Visitor.objects.get_or_create(
            website=self.website,
            visitor_hash=visitor_hash,
            defaults={
                "device_type": parsed_agent.get("device_type", "unknown"),
                "browser": parsed_agent.get("browser", ""),
                "os": parsed_agent.get("os", ""),
                "language": "",
            },
        )
        visitor.visit_count += 1
        visitor.save(update_fields=["visit_count", "last_seen_at"])

        now = timezone.now()
        session = (
            Session.objects.filter(
                website=self.website,
                visitor=visitor,
                started_at__gte=now - timedelta(minutes=30),
            )
            .order_by("-started_at")
            .first()
        )
        if session is None:
            first_event = events[0] if events else {}
            session = Session.objects.create(
                website=self.website,
                visitor=visitor,
                started_at=now,
                referrer_url=first_event.get("referrer", "")[:2000],
                referrer_domain=self._domain(first_event.get("referrer", "")),
                entry_type=self._entry_type(first_event.get("referrer", "")),
                entry_page=self._path(first_event.get("url", "")),
                ip_hash=hashlib.sha256(self.client_ip.encode("utf-8")).hexdigest() if self.client_ip else "",
            )

        processed = 0
        country_code = ""
        for payload in events:
            event_type = payload.get("type", "pageview")
            url = payload.get("url", "")
            if event_type in ("pageview", "page_view"):
                PageView.objects.create(
                    website=self.website,
                    visitor=visitor,
                    session=session,
                    url=url,
                    path=self._path(url),
                    hostname=self._domain(url),
                    title=payload.get("title", "")[:500],
                    referrer=payload.get("referrer", "")[:2000],
                    time_on_page=int(payload.get("time_on_page") or 0),
                    scroll_depth=int(payload.get("scroll_depth") or 0),
                    viewed_at=now,
                )
                session.page_count += 1
            else:
                Event.objects.create(
                    website=self.website,
                    visitor=visitor,
                    session=session,
                    event_type=self._event_type(event_type),
                    event_name=payload.get("name") or event_type,
                    properties=payload.get("properties") or payload,
                    occurred_at=now,
                )
            processed += 1

        session.ended_at = now
        session.duration_seconds = max(session.duration_seconds, int((now - session.started_at).total_seconds()))
        session.is_bounce = session.page_count <= 1
        session.exit_page = self._path(events[-1].get("url", "")) if events else session.exit_page
        session.save(update_fields=["ended_at", "duration_seconds", "is_bounce", "exit_page", "page_count"])

        if processed:
            page_view_key = f"pv_today:{self.website.id}"
            cache.set(page_view_key, cache.get(page_view_key, 0) + processed, timeout=86400)
        cache.set(f"active:{self.website.id}:{visitor_hash}", now.isoformat(), timeout=120)
        return {
            "visitor_hash": visitor_hash,
            "country_code": country_code,
            "device_type": visitor.device_type,
            "processed": processed,
        }

    @staticmethod
    def _domain(url: str) -> str:
        return urlparse(url).netloc[:255] if url else ""

    @staticmethod
    def _path(url: str) -> str:
        parsed = urlparse(url) if url else None
        return parsed.path or "/" if parsed else "/"

    @staticmethod
    def _entry_type(referrer: str) -> str:
        if not referrer:
            return Session.EntryType.DIRECT
        ref = referrer.lower()
        if any(domain in ref for domain in ("google.", "bing.", "duckduckgo.", "yahoo.")):
            return Session.EntryType.SEARCH
        if any(domain in ref for domain in ("facebook.", "x.com", "twitter.", "linkedin.", "instagram.")):
            return Session.EntryType.SOCIAL
        return Session.EntryType.REFERRAL

    @staticmethod
    def _event_type(event_type: str) -> str:
        mapping = {
            "click": Event.EventType.CLICK,
            "form_submit": Event.EventType.FORM_SUBMIT,
            "scroll": Event.EventType.SCROLL,
            "outbound_link": Event.EventType.OUTBOUND_LINK,
            "download": Event.EventType.DOWNLOAD,
        }
        return mapping.get(event_type, Event.EventType.CUSTOM)
