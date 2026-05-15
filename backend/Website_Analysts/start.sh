#!/bin/sh
python manage.py migrate
exec gunicorn Website_Analysts.wsgi:application --bind 0.0.0.0:10000