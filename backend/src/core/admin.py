"""
Django admin customization for the core app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from core import models


class UserAdmin(BaseUserAdmin):
    """Define the admin pages for users."""
    ordering = ['id']
    list_display = ['email', 'name']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('name',)}),
        (
            _('Permissions'),
            {'fields': ('is_active', 'is_staff', 'is_superuser')}
        ),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    readonly_fields = ['last_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'password1',
                'password2',
                'name',
                'is_active',
                'is_staff',
                'is_superuser'),
        }),
    )


class TaskAdmin(admin.ModelAdmin):
    """Define the admin pages for tasks."""

    ordering = ['-created_at']
    list_display = [
        'id',
        'title',
        'user',
        'status',
        'priority',
        'created_at',
        'modified_at',
    ]
    list_filter = ['status', 'priority']
    search_fields = ['title', 'description', 'user__email', 'user__name']


admin.site.register(models.User, UserAdmin)
admin.site.register(models.Task, TaskAdmin)
