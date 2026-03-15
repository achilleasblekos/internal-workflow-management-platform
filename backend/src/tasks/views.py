"""
Views for task APIs.
"""
from django.core.paginator import EmptyPage, Paginator
from django.db.models import Count, Q
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from core.models import Task
from tasks.serializers import TaskSerializer


class TaskPagination(PageNumberPagination):
    """Pagination for standard task list endpoint."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TaskQueryMixin:
    """Common filtering and ordering helpers for task views."""

    allowed_ordering = {
        'title': 'title',
        '-title': '-title',
        'created_at': 'created_at',
        '-created_at': '-created_at',
        'modified_at': 'modified_at',
        '-modified_at': '-modified_at',
        'priority': 'priority',
        '-priority': '-priority',
        'status': 'status',
        '-status': '-status',
    }

    def get_base_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def apply_filters(self, queryset, include_status=False):
        search = self.request.query_params.get('search')
        priority = self.request.query_params.get('priority')
        status_value = self.request.query_params.get('status')
        ordering = self.request.query_params.get('ordering', '-created_at')

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        if priority:
            queryset = queryset.filter(priority=priority)

        if include_status and status_value:
            queryset = queryset.filter(status=status_value)

        queryset = queryset.order_by(
            self.allowed_ordering.get(ordering, '-created_at'),
            '-id',
        )

        return queryset


class TaskListCreateView(TaskQueryMixin, generics.ListCreateAPIView):
    """List and create tasks."""
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = TaskPagination

    def get_queryset(self):
        return self.apply_filters(
            self.get_base_queryset(),
            include_status=True,
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete a task."""
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_board_view(request):
    """
    Return 3 board columns:
    - TO_DO
    - IN_PROGRESS
    - DONE

    Global filters:
    - search
    - priority

    Independent pagination per column:
    - page_todo
    - page_in_progress
    - page_done
    - page_size
    """
    queryset = Task.objects.filter(user=request.user)

    search = request.query_params.get('search')
    priority = request.query_params.get('priority')

    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )

    if priority:
        queryset = queryset.filter(priority=priority)

    try:
        page_size = int(request.query_params.get('page_size', 10))
    except ValueError:
        page_size = 10

    page_size = max(1, min(page_size, 100))

    def paginate_column(status_value, page_param_name):
        column_qs = queryset.filter(
            status=status_value,
            ).order_by('-created_at', '-id')
        paginator = Paginator(column_qs, page_size)

        try:
            page_number = int(request.query_params.get(page_param_name, 1))
        except ValueError:
            page_number = 1

        page_number = max(1, page_number)

        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            page_obj = paginator.page(1) if paginator.count > 0 else None

        if page_obj is None:
            return {
                'count': 0,
                'page': 1,
                'page_size': page_size,
                'total_pages': 0,
                'results': [],
            }

        serializer = TaskSerializer(page_obj.object_list, many=True)
        return {
            'count': paginator.count,
            'page': page_obj.number,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'results': serializer.data,
        }

    status_counts = dict(
        queryset.values('status')
        .annotate(total=Count('id'))
        .values_list('status', 'total')
    )

    priority_counts = dict(
        queryset.values('priority')
        .annotate(total=Count('id'))
        .values_list('priority', 'total')
    )

    total = queryset.count()
    done_count = status_counts.get(Task.Status.DONE, 0)
    completion_percentage = (
        round((done_count / total) * 100, 2) if total else 0
    )

    return Response({
        'filters': {
            'search': search,
            'priority': priority,
            'page_size': page_size,
        },
        'summary': {
            'total': total,
            'by_status': {
                'TO_DO': status_counts.get(Task.Status.TO_DO, 0),
                'IN_PROGRESS': status_counts.get(Task.Status.IN_PROGRESS, 0),
                'DONE': status_counts.get(Task.Status.DONE, 0),
            },
            'by_priority': {
                'LOW': priority_counts.get(Task.Priority.LOW, 0),
                'MEDIUM': priority_counts.get(Task.Priority.MEDIUM, 0),
                'HIGH': priority_counts.get(Task.Priority.HIGH, 0),
            },
            'completion_percentage': completion_percentage,
        },
        'columns': {
            'TO_DO': paginate_column(Task.Status.TO_DO, 'page_todo'),
            'IN_PROGRESS': paginate_column(
                Task.Status.IN_PROGRESS,
                'page_in_progress'),
            'DONE': paginate_column(Task.Status.DONE, 'page_done'),
        },
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_summary_view(request):
    """
    Return task totals for dashboard/cards.
    Supports:
    - search
    - priority
    - optional status
    """
    queryset = Task.objects.filter(user=request.user)

    search = request.query_params.get('search')
    priority = request.query_params.get('priority')
    status_value = request.query_params.get('status')

    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )

    if priority:
        queryset = queryset.filter(priority=priority)

    if status_value:
        queryset = queryset.filter(status=status_value)

    status_counts = dict(
        queryset.values('status')
        .annotate(total=Count('id'))
        .values_list('status', 'total')
    )

    priority_counts = dict(
        queryset.values('priority')
        .annotate(total=Count('id'))
        .values_list('priority', 'total')
    )

    total = queryset.count()
    done_count = status_counts.get(Task.Status.DONE, 0)
    completion_percentage = (
        round((done_count / total) * 100, 2) if total else 0
    )

    return Response({
        'total': total,
        'by_status': {
            'TO_DO': status_counts.get(Task.Status.TO_DO, 0),
            'IN_PROGRESS': status_counts.get(Task.Status.IN_PROGRESS, 0),
            'DONE': status_counts.get(Task.Status.DONE, 0),
        },
        'by_priority': {
            'LOW': priority_counts.get(Task.Priority.LOW, 0),
            'MEDIUM': priority_counts.get(Task.Priority.MEDIUM, 0),
            'HIGH': priority_counts.get(Task.Priority.HIGH, 0),
        },
        'completion_percentage': completion_percentage,
    })
