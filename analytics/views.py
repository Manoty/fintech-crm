from django.db.models import F, ExpressionWrapper, DurationField, Count
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from tickets.models import Ticket

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'full_name': request.user.get_full_name() or request.user.username,})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'detail': 'Logged out.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    from tickets.models import Ticket

    all_tickets = Ticket.objects.all()
    

    # ── Basic counts ────────────────────────────────────────────
    total_tickets    = all_tickets.count()
    open_tickets     = all_tickets.filter(status=Ticket.Status.OPEN).count()
    in_progress      = all_tickets.filter(status=Ticket.Status.IN_PROGRESS).count()
    resolved_tickets = all_tickets.filter(status=Ticket.Status.RESOLVED).count()
    closed_tickets   = all_tickets.filter(status=Ticket.Status.CLOSED).count()

    # ── Average resolution time (hours) ─────────────────────────
    # Only tickets that have been resolved (resolved_at is not null)
    resolved_qs = all_tickets.filter(
        resolved_at__isnull=False
    ).annotate(
        resolution_duration=ExpressionWrapper(
            F('resolved_at') - F('created_at'),
            output_field=DurationField()
        )
    )

    avg_resolution_hours = None
    if resolved_qs.exists():
        total_seconds = sum(
            t.resolution_duration.total_seconds()
            for t in resolved_qs
        )
        avg_seconds = total_seconds / resolved_qs.count()
        avg_resolution_hours = round(avg_seconds / 3600, 2)

    # ── Breakdown by category ────────────────────────────────────
    tickets_by_category = {}
    for item in all_tickets.values('category').annotate(count=Count('id')):
        tickets_by_category[item['category']] = item['count']

    # ── Breakdown by priority ────────────────────────────────────
    tickets_by_priority = {}
    for item in all_tickets.values('priority').annotate(count=Count('id')):
        tickets_by_priority[item['priority']] = item['count']

    # ── Breakdown by status ──────────────────────────────────────
    tickets_by_status = {
        'open':        open_tickets,
        'in_progress': in_progress,
        'resolved':    resolved_tickets,
        'closed':      closed_tickets,
    }

    # ── Tickets created last 7 days (for sparkline later) ───────
    from datetime import timedelta
    from django.db.models.functions import TruncDate

    seven_days_ago = timezone.now() - timedelta(days=7)
    daily_counts = (
        all_tickets
        .filter(created_at__gte=seven_days_ago)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    tickets_last_7_days = [
        {'date': str(item['date']), 'count': item['count']}
        for item in daily_counts
    ]

    return Response({
        'total_tickets':             total_tickets,
        'open_tickets':              open_tickets,
        'in_progress_tickets':       in_progress,
        'resolved_tickets':          resolved_tickets,
        'closed_tickets':            closed_tickets,
        'avg_resolution_time_hours': avg_resolution_hours,
        'tickets_by_category':       tickets_by_category,
        'tickets_by_priority':       tickets_by_priority,
        'tickets_by_status':         tickets_by_status,
        'tickets_last_7_days':       tickets_last_7_days,
    })