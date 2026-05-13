"""
Analytics Platform - Production Django Settings
================================================
Modular, scalable configuration for the analytics platform.
"""

import os
# import importlib.util
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
# LOG_DIR = BASE_DIR / "logs"
# os.makedirs(LOG_DIR, exist_ok=True)

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-in-production-use-env-var')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ─── Application Definition ──────────────────────────────────────────────────

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # 'channels',
    'django_filters',
    # 'celery',
    # 'django_celery_beat',
    # 'django_celery_results',
]

LOCAL_APPS = [
    'accounts',
    'websites',
    'analytics',
    'tracking',
    'events',
    'sessions_app',  # renamed to avoid conflict with django.contrib.sessions
    'reports',
    'notifications',
    'realtime',
    'common',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─── Middleware ───────────────────────────────────────────────────────────────

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'common.middleware.RequestTimingMiddleware',
    # 'common.middleware.APIRateLimitMiddleware',
]

ROOT_URLCONF = 'Website_Analysts.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Website_Analysts.wsgi.application'
# ASGI_APPLICATION = 'Website_Analysts.asgi.application'

# ─── Database ─────────────────────────────────────────────────────────────────

if os.environ.get('DB_ENGINE', 'sqlite').lower() != 'postgres':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'analytics_db'),
            'USER': os.environ.get('DB_USER', 'analytics_user'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'analytics_password'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'connect_timeout': 10,
            },
            'CONN_MAX_AGE': 60,
        }
    }

# ─── Redis & Channels ─────────────────────────────────────────────────────────

# REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# CACHES = {
#     'default': {
#         'BACKEND': 'django_redis.cache.RedisCache',
#         'LOCATION': REDIS_URL,
#         'OPTIONS': {
#             'CLIENT_CLASS': 'django_redis.client.DefaultClient',
#             'SOCKET_CONNECT_TIMEOUT': 5,
#             'SOCKET_TIMEOUT': 5,
#             'RETRY_ON_TIMEOUT': True,
#             'MAX_CONNECTIONS': 1000,
#             'CONNECTION_POOL_KWARGS': {'max_connections': 100},
#         },
#         'KEY_PREFIX': 'analytics',
#         'TIMEOUT': 300,
#     }
# }

# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {
#             'hosts': [REDIS_URL],
#             'capacity': 1500,
#             'expiry': 10,
#         },
#     },
# }

# # ── Celery ────────────────────────────────────────────────────────────────────
# if DEBUG or importlib.util.find_spec('django_redis') is None:
#     CACHES = {
#         'default': {
#             'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
#             'LOCATION': 'analytics-dev-cache',
#             'TIMEOUT': 300,
#         }
#     }
#     CHANNEL_LAYERS = {
#         'default': {
#             'BACKEND': (
#                 'channels.layers.InMemoryChannelLayer'
#                 if importlib.util.find_spec('channels_redis') is None
#                 else 'channels_redis.core.RedisChannelLayer'
#             ),
#         }
#     }

# CELERY_BROKER_URL = REDIS_URL
# CELERY_RESULT_BACKEND = REDIS_URL
# CELERY_ACCEPT_CONTENT = ['json']
# CELERY_TASK_SERIALIZER = 'json'
# CELERY_RESULT_SERIALIZER = 'json'
# CELERY_TIMEZONE = 'UTC'
# CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
# CELERY_TASK_ROUTES = {
#     'analytics.tasks.*': {'queue': 'analytics'},
#     'tracking.tasks.*': {'queue': 'tracking'},
#     'reports.tasks.*': {'queue': 'reports'},
# }
 

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.PageNumberPagination",
    'PAGE_SIZE':10,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '2000/hour',
        'tracking': '10000/hour',
    },
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}

# ─── JWT Settings ─────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'TOKEN_OBTAIN_SERIALIZER': 'accounts.serializers.CustomTokenObtainPairSerializer',
}

# ─── CORS ─────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only in development

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-site-id',  # Tracking site identifier
]

# ─── Auth ─────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Static & Media ───────────────────────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── Tracking SDK ─────────────────────────────────────────────────────────────

TRACKER_SCRIPT_VERSION = '1.0.0'
TRACKER_BATCH_SIZE = 50
TRACKER_FLUSH_INTERVAL = 5000  # ms
BOT_USER_AGENTS_FILE = BASE_DIR / 'common' / 'data' / 'bot_agents.txt'

# ─── Analytics Settings ───────────────────────────────────────────────────────

ANALYTICS_CACHE_TIMEOUT = 300  # 5 minutes
REALTIME_VISITOR_TIMEOUT = 300  # 5 minutes - visitor considered inactive
SESSION_TIMEOUT_MINUTES = 30
ANALYTICS_RETENTION_DAYS = 365

# ─── Email ────────────────────────────────────────────────────────────────────

EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@analyticsplatform.com')

# ─── Logging ──────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
# ─── Internationalization ─────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Security (Production) ────────────────────────────────────────────────────

CSRF_TRUSTED_ORIGINS = [
    "https://*.onrender.com",
    "https://*.vercel.app",
]

if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

