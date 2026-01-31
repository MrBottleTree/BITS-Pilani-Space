import getpass
import secrets
import string

import argon2
from django.contrib.auth.models import User as DjangoUser
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils import timezone


def generate_cuid():
    """Generate a CUID-compatible unique identifier (lowercase letter + 23 alphanumeric chars)."""
    alphabet = string.ascii_lowercase + string.digits
    first = secrets.choice(string.ascii_lowercase)
    rest = ''.join(secrets.choice(alphabet) for _ in range(23))
    return first + rest


def slow_hash(password):
    """Hash a password with argon2id, matching the Node.js slowHash parameters:
    timeCost=2, memoryCost=2^14 (16384 KiB), parallelism=1."""
    hasher = argon2.PasswordHasher(
        time_cost=2,
        memory_cost=2 ** 14,
        parallelism=1,
        type=argon2.Type.ID,
    )
    return hasher.hash(password)


class Command(BaseCommand):
    help = 'Create an ADMIN user in the Prisma-managed User table.'

    def handle(self, *args, **options):
        name = input('Name: ').strip()
        if not name:
            raise CommandError('Name cannot be empty.')

        email = input('Email: ').strip()
        if not email:
            raise CommandError('Email cannot be empty.')

        password = getpass.getpass('Password: ')
        password2 = getpass.getpass('Password (again): ')
        if password != password2:
            raise CommandError('Passwords do not match.')
        if not password:
            raise CommandError('Password cannot be empty.')

        password_hash = slow_hash(password)
        now = timezone.now()
        user_id = generate_cuid()
        handle = generate_cuid()

        with connection.cursor() as cursor:
            cursor.execute(
                '''
                INSERT INTO "User" (id, name, handle, password_hash, email, role, updated_at)
                VALUES (%s, %s, %s, %s, %s, 'ADMIN', %s)
                ''',
                [user_id, name, handle, password_hash, email, now],
            )

        DjangoUser.objects.create_superuser(
            username=email,
            email=email,
            password=password,
        )

        self.stdout.write(self.style.SUCCESS(
            f'Admin user "{name}" created successfully (id={user_id}, handle={handle}).'
        ))
