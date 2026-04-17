from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketListSerializer, TicketDetailSerializer


def log_system_event(ticket, body):
    """Create a system message in the ticket thread."""
    from messaging.models import Message
    Message.objects.create(
        ticket=ticket,
        message_type=Message.MessageType.SYSTEM,
        channel=Message.Channel.INTERNAL,
        sender_name='System',
        body=body,
        is_internal=False,
    )


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    filter_backends = [filters.SearchFilter]
    search_fields = ['subject', 'customer__full_name', 'customer__phone_number']

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return TicketDetailSerializer
        return TicketListSerializer

    def get_queryset(self):
        queryset = Ticket.objects.all().order_by('-created_at')
        status_filter   = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        category_filter = self.request.query_params.get('category')
        customer_filter = self.request.query_params.get('customer')
        assigned_filter = self.request.query_params.get('assigned_to')

        if status_filter:   queryset = queryset.filter(status=status_filter)
        if priority_filter: queryset = queryset.filter(priority=priority_filter)
        if category_filter: queryset = queryset.filter(category=category_filter)
        if customer_filter: queryset = queryset.filter(customer_id=customer_filter)
        if assigned_filter: queryset = queryset.filter(assigned_to=assigned_filter)

        return queryset

    def perform_create(self, serializer):
        ticket = serializer.save()
        log_system_event(ticket, f'Ticket created · Priority: {ticket.priority} · Category: {ticket.category}')

    def perform_update(self, serializer):
        old = self.get_object()
        old_status   = old.status
        old_priority = old.priority
        old_assigned = old.assigned_to

        ticket = serializer.save()

        if old_status != ticket.status:
            log_system_event(
                ticket,
                f'Status changed: {old_status.replace("_"," ")} → {ticket.status.replace("_"," ")}'
            )
        if old_priority != ticket.priority:
            log_system_event(
                ticket,
                f'Priority changed: {old_priority} → {ticket.priority}'
            )
        if old_assigned != ticket.assigned_to and ticket.assigned_to:
            log_system_event(
                ticket,
                f'Assigned to: {ticket.assigned_to}'
            )

    @action(detail=True, methods=['patch'], url_path='resolve')
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status == Ticket.Status.RESOLVED:
            return Response(
                {'detail': 'Ticket is already resolved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ticket.resolve()
        log_system_event(ticket, 'Ticket resolved ✓')
        serializer = TicketDetailSerializer(ticket)
        return Response(serializer.data)