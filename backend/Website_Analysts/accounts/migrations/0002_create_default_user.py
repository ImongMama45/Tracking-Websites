from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_default_user(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    email = 'quertlalisan@gmail.com'
    if User.objects.filter(email=email).exists():
        return

    user = User(
        email=email,
        first_name='quert',
        last_name='lalisan',
        company='it tech',
        role='owner',
        is_active=True,
        is_email_verified=True,
        password=make_password('taequert123'),
    )
    user.save()


def remove_default_user(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(email='quertlalisan@gmail.com').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_user, reverse_code=remove_default_user),
    ]
