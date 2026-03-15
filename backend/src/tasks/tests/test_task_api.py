"""
Tests for task APIs.
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APIClient

from core.models import Task
from tasks.serializers import TaskSerializer


TASKS_URL = reverse('tasks:task-list')
BOARD_URL = reverse('tasks:task-board')
SUMMARY_URL = reverse('tasks:task-summary')


def detail_url(task_id):
    """Create and return a task detail URL."""
    return reverse('tasks:task-detail', args=[task_id])


def create_user(**params):
    """Create and return a new user."""
    return get_user_model().objects.create_user(**params)


def create_task(user, **params):
    """Create and return a sample task."""
    defaults = {
        'title': 'Sample task',
        'description': 'Sample description',
        'status': Task.Status.TO_DO,
        'priority': Task.Priority.MEDIUM,
    }
    defaults.update(params)
    return Task.objects.create(user=user, **defaults)


class PublicTaskApiTests(TestCase):
    """Test unauthenticated task API requests."""

    def setUp(self):
        self.client = APIClient()

    def test_auth_required_for_list(self):
        res = self.client.get(TASKS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auth_required_for_board(self):
        res = self.client.get(BOARD_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auth_required_for_summary(self):
        res = self.client.get(SUMMARY_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class PrivateTaskApiTests(TestCase):
    """Test authenticated task API requests."""

    def setUp(self):
        self.user = create_user(
            email='user@example.com',
            password='testpass123',
            name='Test User',
        )
        self.other_user = create_user(
            email='other@example.com',
            password='otherpass123',
            name='Other User',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_retrieve_tasks_paginated(self):
        create_task(user=self.user)
        create_task(user=self.user, title='Task 2')

        res = self.client.get(TASKS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('count', res.data)
        self.assertIn('results', res.data)
        self.assertEqual(res.data['count'], 2)

        tasks = Task.objects.filter(user=self.user).order_by('-created_at', '-id')
        serializer = TaskSerializer(tasks, many=True)
        self.assertEqual(res.data['results'], serializer.data)

    def test_tasks_limited_to_user(self):
        create_task(user=self.other_user, title='Other user task')
        create_task(user=self.user, title='My task')

        res = self.client.get(TASKS_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'My task')

    def test_create_task(self):
        payload = {
            'title': 'Review PR',
            'description': 'Review backend pull request.',
            'status': Task.Status.TO_DO,
            'priority': Task.Priority.HIGH,
        }

        res = self.client.post(TASKS_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(id=res.data['id'])
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.title, payload['title'])
        self.assertEqual(task.status, payload['status'])
        self.assertEqual(task.priority, payload['priority'])

    def test_retrieve_task_detail(self):
        task = create_task(user=self.user)

        res = self.client.get(detail_url(task.id))

        serializer = TaskSerializer(task)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, serializer.data)

    def test_partial_update_task_title(self):
        task = create_task(
            user=self.user,
            title='Initial title',
            status=Task.Status.TO_DO,
        )

        payload = {'title': 'Updated title'}
        res = self.client.patch(detail_url(task.id), payload)

        task.refresh_from_db()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(task.title, payload['title'])
        self.assertEqual(task.status, Task.Status.TO_DO)

    def test_delete_task(self):
        task = create_task(user=self.user)

        res = self.client.delete(detail_url(task.id))

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())

    def test_task_other_users_task_error(self):
        task = create_task(user=self.other_user)

        res = self.client.get(detail_url(task.id))

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_tasks_by_status(self):
        create_task(user=self.user, status=Task.Status.TO_DO)
        task2 = create_task(
            user=self.user,
            title='In progress task',
            status=Task.Status.IN_PROGRESS,
        )

        res = self.client.get(TASKS_URL, {'status': Task.Status.IN_PROGRESS})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], task2.id)

    def test_filter_tasks_by_priority(self):
        create_task(user=self.user, priority=Task.Priority.LOW)
        task2 = create_task(
            user=self.user,
            title='High priority task',
            priority=Task.Priority.HIGH,
        )

        res = self.client.get(TASKS_URL, {'priority': Task.Priority.HIGH})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], task2.id)

    def test_search_tasks_by_title(self):
        task1 = create_task(user=self.user, title='Prepare sprint report')
        create_task(user=self.user, title='Review PR')

        res = self.client.get(TASKS_URL, {'search': 'sprint'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], task1.id)

    def test_search_tasks_by_description(self):
        task1 = create_task(
            user=self.user,
            description='Discuss deployment timeline.',
        )
        create_task(
            user=self.user,
            description='Prepare product demo materials.',
        )

        res = self.client.get(TASKS_URL, {'search': 'deployment'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['id'], task1.id)

    def test_order_tasks_by_title(self):
        create_task(user=self.user, title='Bravo')
        create_task(user=self.user, title='Alpha')

        res = self.client.get(TASKS_URL, {'ordering': 'title'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['results'][0]['title'], 'Alpha')
        self.assertEqual(res.data['results'][1]['title'], 'Bravo')

    def test_order_tasks_by_created_at_desc(self):
        first = create_task(user=self.user, title='First')
        second = create_task(user=self.user, title='Second')

        res = self.client.get(TASKS_URL, {'ordering': '-created_at'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['results'][0]['id'], second.id)
        self.assertEqual(res.data['results'][1]['id'], first.id)

    def test_order_tasks_by_modified_at_desc(self):
        task1 = create_task(user=self.user, title='Task 1')
        task2 = create_task(user=self.user, title='Task 2')

        task1.title = 'Task 1 updated'
        task1.save()

        res = self.client.get(TASKS_URL, {'ordering': '-modified_at'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['results'][0]['id'], task1.id)
        self.assertEqual(res.data['results'][1]['id'], task2.id)

    def test_invalid_status_transition_returns_error(self):
        task = create_task(user=self.user, status=Task.Status.TO_DO)

        payload = {'status': Task.Status.DONE}
        res = self.client.patch(detail_url(task.id), payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.TO_DO)

    def test_valid_status_transition_to_in_progress(self):
        task = create_task(user=self.user, status=Task.Status.TO_DO)

        payload = {'status': Task.Status.IN_PROGRESS}
        res = self.client.patch(detail_url(task.id), payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.IN_PROGRESS)

    def test_valid_status_transition_back_to_todo(self):
        task = create_task(user=self.user, status=Task.Status.IN_PROGRESS)

        payload = {'status': Task.Status.TO_DO}
        res = self.client.patch(detail_url(task.id), payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.TO_DO)

    def test_valid_status_transition_to_done(self):
        task = create_task(user=self.user, status=Task.Status.IN_PROGRESS)

        payload = {'status': Task.Status.DONE}
        res = self.client.patch(detail_url(task.id), payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.DONE)

    def test_valid_status_transition_done_to_in_progress(self):
        task = create_task(user=self.user, status=Task.Status.DONE)

        payload = {'status': Task.Status.IN_PROGRESS}
        res = self.client.patch(detail_url(task.id), payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.IN_PROGRESS)

    def test_board_endpoint_returns_three_columns(self):
        create_task(user=self.user, title='Todo 1', status=Task.Status.TO_DO)
        create_task(user=self.user, title='In Progress 1', status=Task.Status.IN_PROGRESS)
        create_task(user=self.user, title='Done 1', status=Task.Status.DONE)

        res = self.client.get(BOARD_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('summary', res.data)
        self.assertIn('columns', res.data)
        self.assertIn('TO_DO', res.data['columns'])
        self.assertIn('IN_PROGRESS', res.data['columns'])
        self.assertIn('DONE', res.data['columns'])

    def test_board_endpoint_filters_by_priority(self):
        create_task(
            user=self.user,
            title='Low task',
            status=Task.Status.TO_DO,
            priority=Task.Priority.LOW,
        )
        create_task(
            user=self.user,
            title='High task',
            status=Task.Status.IN_PROGRESS,
            priority=Task.Priority.HIGH,
        )

        res = self.client.get(BOARD_URL, {'priority': Task.Priority.HIGH})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['summary']['total'], 1)
        self.assertEqual(res.data['columns']['IN_PROGRESS']['count'], 1)

    def test_board_endpoint_searches_title_and_description(self):
        create_task(
            user=self.user,
            title='Build API',
            description='Create CRUD endpoints',
            status=Task.Status.IN_PROGRESS,
        )
        create_task(
            user=self.user,
            title='Landing page',
            description='Public page',
            status=Task.Status.TO_DO,
        )

        res = self.client.get(BOARD_URL, {'search': 'CRUD'})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['summary']['total'], 1)
        self.assertEqual(res.data['columns']['IN_PROGRESS']['count'], 1)

    def test_board_endpoint_has_independent_pagination_per_column(self):
        for i in range(12):
            create_task(
                user=self.user,
                title=f'Todo {i}',
                status=Task.Status.TO_DO,
            )

        res = self.client.get(BOARD_URL, {
            'page_size': 5,
            'page_todo': 2,
            'page_in_progress': 1,
            'page_done': 1,
        })

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['columns']['TO_DO']['page'], 2)
        self.assertEqual(res.data['columns']['TO_DO']['page_size'], 5)
        self.assertGreaterEqual(res.data['columns']['TO_DO']['total_pages'], 3)

    def test_summary_endpoint(self):
        create_task(user=self.user, status=Task.Status.TO_DO, priority=Task.Priority.MEDIUM)
        create_task(user=self.user, status=Task.Status.IN_PROGRESS, priority=Task.Priority.HIGH)
        create_task(user=self.user, status=Task.Status.DONE, priority=Task.Priority.LOW)

        res = self.client.get(SUMMARY_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total'], 3)
        self.assertEqual(res.data['by_status']['TO_DO'], 1)
        self.assertEqual(res.data['by_status']['IN_PROGRESS'], 1)
        self.assertEqual(res.data['by_status']['DONE'], 1)
        self.assertEqual(res.data['completion_percentage'], 33.33)