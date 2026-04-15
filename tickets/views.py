from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketListSerializer, TicketDetailSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    filter_backends = [filters.SearchFilter]
    search_fields = ['subject', 'customer__full_name', 'customer__phone_number']

    def get_serializer_class(self):
        """Use detailed serializer for single-object actions."""
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return TicketDetailSerializer
        return TicketListSerializer

    def get_queryset(self):
        """Support ?status=open&priority=high&category=fraud filtering."""
        queryset = Ticket.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        category_filter = self.request.query_params.get('category')
        customer_filter = self.request.query_params.get('customer')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        if customer_filter:
            queryset = queryset.filter(customer_id=customer_filter)

        return queryset

    @action(detail=True, methods=['patch'], url_path='resolve')
    def resolve(self, request, pk=None):
        """PATCH /api/tickets/{id}/resolve/ — stamps resolved_at automatically."""
        ticket = self.get_object()

        if ticket.status == Ticket.Status.RESOLVED:
            return Response(
                {'detail': 'Ticket is already resolved.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket.resolve()
        serializer = TicketDetailSerializer(ticket)
        return Response(serializer.data)