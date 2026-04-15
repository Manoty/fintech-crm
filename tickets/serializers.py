from rest_framework import serializers
from .models import Ticket


class TicketListSerializer(serializers.ModelSerializer):
    """Lightweight — used for list views. No message thread."""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'subject', 'description', 'status', 'priority', 'category',
            'assigned_to', 'message_count', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'resolved_at']

    def get_message_count(self, obj):
        return obj.messages.count()


class TicketDetailSerializer(serializers.ModelSerializer):
    """Full detail — embeds entire message thread."""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    messages = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'subject', 'description', 'status', 'priority', 'category',
            'assigned_to', 'messages', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'resolved_at']

    def get_messages(self, obj):
        # Local import to avoid circular dependency
        from messaging.serializers import MessageSerializer
        messages = obj.messages.all().order_by('created_at')
        return MessageSerializer(messages, many=True).data