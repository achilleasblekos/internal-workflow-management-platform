"""
Database models for the application.
"""

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    """Manager for user profiles."""

    def create_user(self, email, password=None, **extra_fields):
        """Create a new user profile."""
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password):
        """Create and save a new superuser with given details."""
        user = self.create_user(email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model that supports using email instead of username."""

    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'


class Task(models.Model):
    """Task object."""

    class Status(models.TextChoices):
        TO_DO = 'TO_DO', 'To Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DONE = 'DONE', 'Done'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TO_DO,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        """Return string representation of task."""
        return self.title

    @staticmethod
    def valid_status_transitions():
        return {
            Task.Status.TO_DO: {
                Task.Status.TO_DO,
                Task.Status.IN_PROGRESS,
            },
            Task.Status.IN_PROGRESS: {
                Task.Status.IN_PROGRESS,
                Task.Status.TO_DO,
                Task.Status.DONE,
            },
            Task.Status.DONE: {
                Task.Status.DONE,
                Task.Status.IN_PROGRESS,
            },
        }

    def clean(self):
        """Validate status transitions on update."""
        if not self.pk:
            return

        previous = Task.objects.get(pk=self.pk)
        allowed = self.valid_status_transitions().get(
            previous.status,
            {previous.status},
        )

        if self.status not in allowed:
            raise ValidationError({
                'status': (
                    'Invalid status transition from '
                    f'{previous.status} to {self.status}.'
                )
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
