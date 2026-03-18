"""
Serializers for task APIs.
"""
from rest_framework import serializers

from core.models import Task


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for tasks."""

    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True,
    )
    priority_display = serializers.CharField(
        source='get_priority_display',
        read_only=True,
    )

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'status_display',
            'priority',
            'priority_display',
            'created_at',
            'modified_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'modified_at',
            'status_display',
            'priority_display',
        ]

    def validate_title(self, value):
        """Validate and normalize title."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Title cannot be empty.')
        return value

    def validate_description(self, value):
        """Normalize description."""
        if not value:
            return ''
        return value.strip()

    def validate(self, attrs):
        """Validate task updates, including status transitions."""
        instance = getattr(self, 'instance', None)
        new_status = attrs.get('status')

        if instance is not None and new_status is not None:
            allowed = Task.valid_status_transitions().get(
                instance.status,
                {instance.status},
            )
            if new_status not in allowed:
                from_status = Task.Status(instance.status).label
                to_status = Task.Status(new_status).label

                raise serializers.ValidationError({
                    'status': (
                        f"Cannot move task from {from_status} to {to_status}."
                    )
                })

        return attrs
