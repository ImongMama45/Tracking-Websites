# Pelec Website Traffic Analytics Platform

Pelec is a Google Analytics Lite style platform with a Django REST backend, event tracking SDK, realtime Channels updates, Celery aggregation, and a Vite React dashboard.

The complete system function, analytics categories, platform features, and current code mapping are documented in [`docs/SYSTEM_FUNCTION_AND_ANALYTICS_SCOPE.md`](docs/SYSTEM_FUNCTION_AND_ANALYTICS_SCOPE.md).

## Architecture

- `backend/Website_Analysts/accounts`: email-based users, JWT auth, profile, API tokens.
- `backend/Website_Analysts/websites`: website properties, tracking IDs, embed snippets, privacy settings.
- `backend/Website_Analysts/tracking`: public ingestion API and lightweight `tracker.js`.
- `backend/Website_Analysts/analytics`: normalized visitor, session, page view, event, realtime, daily/monthly analytics models plus dashboard APIs.
- `backend/Website_Analysts/events` and `sessions_app`: searchable read APIs over tracked behavior.
- `backend/Website_Analysts/reports`: CSV exports.
- `backend/Website_Analysts/notifications`: alert center model/API.
- `backend/Website_Analysts/realtime`: WebSocket consumer and snapshot API.
- `frontend/src`: React dashboard, auth screens, charts, website management, notifications, settings.

## Core API

- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `GET/PATCH /api/v1/auth/profile/`
- `GET/POST /api/v1/websites/`
- `GET /api/v1/websites/{id}/snippet/`
- `POST /api/v1/track/event/`
- `GET /tracker.js`
- `GET /api/v1/analytics/{website_id}/overview/`
- `GET /api/v1/analytics/{website_id}/traffic/`
- `GET /api/v1/analytics/{website_id}/pages/`
- `GET /api/v1/analytics/{website_id}/sources/`
- `GET /api/v1/analytics/{website_id}/devices/`
- `GET /api/v1/analytics/{website_id}/locations/`
- `GET /api/v1/events/`
- `GET /api/v1/sessions/`
- `GET /api/v1/realtime/{website_id}/snapshot/`
- `GET /api/v1/reports/{website_id}/export.csv`
- `WS /ws/analytics/{website_id}/`

## Local Development

Backend:

```powershell
cd backend/Website_Analysts
python manage.py migrate
python manage.py runserver
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

For local Django runs, SQLite and in-memory cache/channel layers are used unless you set `DB_ENGINE=postgres` and install/run Redis.

## Production

Use Docker Compose:

```powershell
docker compose up --build
```

Set real values for `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ORIGINS`, database credentials, and `REDIS_URL`. Run Celery worker and beat beside the ASGI backend for scheduled aggregation and alert processing.

## Tracking Snippet

Each website exposes:

```html
<script async src="https://your-domain.com/tracker.js" data-site-id="AP-XXXXXXXXXXXX"></script>
```

The SDK batches page views, clicks, form submissions, scroll depth, and time-on-page with `sendBeacon` support for low page-impact delivery.
