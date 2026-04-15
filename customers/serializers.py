from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    ticket_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'full_name', 'email', 'phone_number',
            'ticket_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_ticket_count(self, obj):
        return obj.tickets.count()