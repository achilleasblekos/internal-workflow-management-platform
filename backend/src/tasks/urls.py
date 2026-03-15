"""
URL mappings for task APIs.
"""
from django.urls import path

from tasks import views

app_name = 'tasks'

urlpatterns = [
    path('', views.TaskListCreateView.as_view(), name='task-list'),
    path('board/', views.task_board_view, name='task-board'),
    path('summary/', views.task_summary_view, name='task-summary'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
]
