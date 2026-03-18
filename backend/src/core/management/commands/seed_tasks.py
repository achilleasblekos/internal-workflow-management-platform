from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import random

from core.models import Task

User = get_user_model()


TITLES = [
    "Set up CI/CD pipeline",
    "Write unit tests for auth module",
    "Design database schema",
    "Create API documentation",
    "Implement user registration",
    "Add email verification",
    "Build notification system",
    "Optimize database queries",
    "Set up monitoring and alerts",
    "Implement rate limiting",
    "Add search functionality",
    "Create onboarding flow",
    "Write integration tests",
    "Implement file upload",
    "Add dark mode support",
    "Set up error tracking",
    "Create admin dashboard",
    "Implement caching layer",
    "Add export to CSV feature",
    "Write API client library",
    "Set up staging environment",
    "Implement webhook support",
    "Add audit logging",
    "Create user analytics page",
    "Implement bulk operations",
]

DESCRIPTIONS = [
    "Configure GitHub Actions for automated testing and deployment",
    "Achieve at least 80% coverage on login and register",
    "Define tables, relationships, and indexes",
    "Generate OpenAPI spec and docs",
    "Allow users to sign up",
    "Send verification email",
    "Real-time notifications",
    "Fix N+1 queries",
    "Setup monitoring",
    "Prevent abuse",
    "Full-text search",
    "Guide new users",
    "End-to-end tests",
    "Allow file uploads",
    "Theme toggle",
    "Integrate Sentry",
    "Admin dashboard",
    "Redis caching",
    "Export CSV",
    "TypeScript SDK",
    "Staging environment",
    "Webhook support",
    "Audit logging",
    "User analytics",
    "Bulk operations",
]

STATUSES = ["TO_DO", "IN_PROGRESS", "DONE"]
PRIORITIES = ["LOW", "MEDIUM", "HIGH"]


class Command(BaseCommand):
    help = "Seed demo tasks for a user"

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            required=True,
            help="User email to assign tasks to",
        )

    def handle(self, *args, **options):
        email = options["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("User not found"))
            return

        for i in range(len(TITLES)):
            Task.objects.create(
                user=user,
                title=TITLES[i],
                description=DESCRIPTIONS[i],
                status=random.choice(STATUSES),
                priority=random.choice(PRIORITIES),
            )

        self.stdout.write(
            self.style.SUCCESS("Successfully seeded tasks!")
        )
