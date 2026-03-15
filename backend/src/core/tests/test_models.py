"""
Test for models.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from core import models


class ModelTests(TestCase):
    """Test models."""

    def test_create_user_with_email_successful(self):
        """Test creating a new user with an email is successful."""
        email = 'test@example.com'
        password = 'testpass123'
        user = get_user_model().objects.create_user(
            email=email,
            password=password,
        )

        self.assertEqual(user.email, email)
        self.assertTrue(user.check_password(password))

    def test_new_user_email_normalized(self):
        """Test the email for a new user is normalized."""
        sample_emails = [
            ('test1@EXAMPLE.com', 'test1@example.com'),
            ('TEST2@EXAMPLE.com', 'test2@example.com'),
            ('Test3@Example.com', 'test3@example.com'),
        ]

        for email, expected in sample_emails:
            user = get_user_model().objects.create_user(
                email=email,
                password='testpass123',
            )

            self.assertEqual(user.email, expected)

    def test_new_user_without_email_raises_error(self):
        """Test creating a user without an email raises a ValueError."""
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user('', 'test123')

    def test_create_new_superuser(self):
        """Test creating a new superuser is successful."""
        email = 'admin@example.com'
        password = 'adminpass123'
        user = get_user_model().objects.create_superuser(
            email=email,
            password=password,
        )

        self.assertEqual(user.email, email)
        self.assertTrue(user.check_password(password))
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_create_task_success(self):
        """Test creating a task is successful."""
        user = get_user_model().objects.create_user(
            email='taskuser@example.com',
            password='testpass123',
            name='Task User',
        )

        task = models.Task.objects.create(
            user=user,
            title='Prepare sprint report',
            description='Collect metrics and summarize sprint progress.',
            status=models.Task.Status.TO_DO,
            priority=models.Task.Priority.HIGH,
        )

        self.assertEqual(str(task), task.title)
        self.assertEqual(task.user, user)
        self.assertEqual(task.status, models.Task.Status.TO_DO)
        self.assertEqual(task.priority, models.Task.Priority.HIGH)
