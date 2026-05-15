from django.db import migrations


def create_asa_dtr_website(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Website = apps.get_model('websites', 'Website')

    email = 'quertlalisan@gmail.com'
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'is_active': True,
            'is_staff': False,
            'is_superuser': False,
        }
    )
    if created:
        user.password = '!'
        user.save(update_fields=['password'])

    website, website_created = Website.objects.get_or_create(
        tracking_id='AP-FB2AE69AD770',
        defaults={
            'owner': user,
            'name': 'ASA-DTR System',
            'domain': 'asa-dtr-system-swart.vercel.app',
            'description': 'Seeded tracking website for quertlalisan@gmail.com',
            'status': 'active',
            'is_tracking_active': True,
        }
    )
    if not website_created and website.owner != user:
        website.owner = user
        website.name = 'ASA-DTR System'
        website.domain = 'asa-dtr-system-swart.vercel.app'
        website.description = 'Seeded tracking website for quertlalisan@gmail.com'
        website.status = 'active'
        website.is_tracking_active = True
        website.save(update_fields=['owner', 'name', 'domain', 'description', 'status', 'is_tracking_active'])


def remove_asa_dtr_website(apps, schema_editor):
    Website = apps.get_model('websites', 'Website')
    Website.objects.filter(tracking_id='AP-FB2AE69AD770').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('websites', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_asa_dtr_website, remove_asa_dtr_website),
    ]
