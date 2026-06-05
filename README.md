# Pelec Analytics

**Pelec** is a privacy-focused, Google Analytics–style web traffic platform built with a Django REST backend, a Vite + React dashboard, real-time WebSocket updates via Django Channels, Celery-powered aggregation, and a lightweight event-tracking SDK.

> Full system documentation, analytics categories, and code mapping are in [`docs/SYSTEM_FUNCTION_AND_ANALYTICS_SCOPE.md`](docs/SYSTEM_FUNCTION_AND_ANALYTICS_SCOPE.md).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Core API](#core-api)
- [Getting Started](#getting-started)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Production Deployment](#production-deployment)
- [Tracking Snippet](#tracking-snippet)
- [Dashboard Pages](#dashboard-pages)
- [Tracking Events](#tracking-events)
- [Reports & Notifications](#reports--notifications)
- [Best Practices](#best-practices)

---

## Features

- **Real-time analytics** via WebSocket (Django Channels)
- **Automated aggregation** with Celery worker and beat scheduler
- **JWT authentication** with email-based user accounts
- **Per-website tracking IDs** and embed snippets
- **Privacy-friendly** — anonymized tracking option available
- **CSV exports** for offline analysis and stakeholder reports
- **Custom event tracking** via the `window.pelecTrack()` SDK method
- **Alert notifications** for traffic spikes and unusual activity

---

## Architecture

| App | Responsibility |
|---|---|
| `accounts` | Email-based users, JWT auth, profile, API tokens |
| `websites` | Website properties, tracking IDs, embed snippets, privacy settings |
| `tracking` | Public ingestion API and lightweight `tracker.js` SDK |
| `analytics` | Visitor, session, page view, event, real-time, daily/monthly models and dashboard APIs |
| `events` | Searchable read API over tracked behavior |
| `sessions_app` | Session read API |
| `reports` | CSV export generation |
| `notifications` | Alert center model and API |
| `realtime` | WebSocket consumer and live snapshot API |
| `frontend/src` | React dashboard, auth screens, charts, website management, notifications, settings |

---

## Core API

### Authentication
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/auth/register/` |
| `POST` | `/api/v1/auth/login/` |
| `GET / PATCH` | `/api/v1/auth/profile/` |

### Website Management
| Method | Endpoint |
|---|---|
| `GET / POST` | `/api/v1/websites/` |
| `GET` | `/api/v1/websites/{id}/snippet/` |

### Tracking Ingestion
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/track/event/` |
| `GET` | `/tracker.js` |

### Analytics
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/analytics/{website_id}/overview/` |
| `GET` | `/api/v1/analytics/{website_id}/traffic/` |
| `GET` | `/api/v1/analytics/{website_id}/pages/` |
| `GET` | `/api/v1/analytics/{website_id}/sources/` |
| `GET` | `/api/v1/analytics/{website_id}/devices/` |
| `GET` | `/api/v1/analytics/{website_id}/locations/` |

### Events, Sessions & Realtime
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/events/` |
| `GET` | `/api/v1/sessions/` |
| `GET` | `/api/v1/realtime/{website_id}/snapshot/` |
| `WS` | `/ws/analytics/{website_id}/` |

### Reports
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/reports/{website_id}/export.csv` |

---

## Getting Started

### Backend

```powershell
cd backend/Website_Analysts
python manage.py migrate
python manage.py runserver
```

By default, local development uses **SQLite** and an **in-memory channel layer**. To use PostgreSQL and Redis, set the following environment variables before running:

```
DB_ENGINE=postgres
DATABASE_URL=postgres://user:password@localhost:5432/pelec
REDIS_URL=redis://localhost:6379/0
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The React dashboard runs at `http://localhost:5173` by default and proxies API requests to the Django backend.

---

## Production Deployment

Use Docker Compose to spin up the full stack:

```powershell
docker compose up --build
```

Ensure the following environment variables are configured with real values:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `ALLOWED_HOSTS` | Comma-separated list of allowed domains |
| `CORS_ORIGINS` | Allowed frontend origins |
| `DB_*` | PostgreSQL connection credentials |
| `REDIS_URL` | Redis connection string |

Run the **Celery worker** and **Celery beat** alongside the ASGI backend to enable scheduled aggregation and alert processing:

```bash
celery -A Website_Analysts worker -l info
celery -A Website_Analysts beat -l info
```

---

## Tracking Snippet

Each registered website generates a unique embed snippet. Copy it from **Website Management** and paste it before the closing `</body>` tag of your site:

```html
<script async src="https://your-domain.com/tracker.js" data-site-id="AP-XXXXXXXXXXXX"></script>
```

The SDK automatically captures:
- Page views
- Clicks
- Form submissions
- Scroll depth
- Time on page

Events are delivered using `sendBeacon` for minimal page-load impact.

---

## Dashboard Pages

| Page | Description |
|---|---|
| **Overview** | High-level KPI cards: visitors, page views, sessions, bounce rate, and traffic trends |
| **Real-time** | Live visitor activity, active users, and current page activity |
| **Visitors** | Total, unique, returning, and active visitors across a selected date range |
| **Sessions** | Session count, duration, bounce rate, pages per session, entry/exit pages |
| **Events** | Tracked clicks, form submissions, scroll events, and custom actions |
| **Sources** | Direct, referral, social, and search traffic breakdowns |
| **Geography** | Country and region distribution when location data is available |
| **Devices** | Device type, browser, and operating system analytics |

---

## Tracking Events

For custom actions beyond the automatic captures, call the SDK method directly:

```javascript
window.pelecTrack("Event Name", { key: "value" });
```

**Example use cases:**
- Signup button clicks
- Pricing page interactions
- File downloads
- Purchase completions

---

## Reports & Notifications

**Reports** — Export CSV data from the reports API for offline analysis or stakeholder summaries:

```
GET /api/v1/reports/{website_id}/export.csv
```

**Notifications** — The notifications center surfaces traffic spikes, unusual activity, and summary alerts as alert rules are triggered. Configure alert rules from the dashboard settings.

---

## Best Practices

- Install **only one** tracking snippet per website to avoid duplicate page views.
- Always use the **website-specific tracking ID** for the matching domain.
- Enable **anonymized tracking** for stronger user privacy protection.
- Use **custom events** to capture key user actions such as signups, pricing clicks, downloads, and purchases.
- Review **traffic sources** regularly to identify which channels deliver the best audience.

---

## License

See [LICENSE](LICENSE) for details.
