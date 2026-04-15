from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'ticket', 'message_type', 'channel',
            'sender_name', 'body', 'is_internal',
            'whatsapp_message_id', 'created_at'
        ]
        read_only_fields = ['created_at', 'whatsapp_message_id']

    def validate(self, data):
        """Internal notes must use internal channel — never WhatsApp."""
        if data.get('is_internal') and data.get('channel') == Message.Channel.WHATSAPP:
            raise serializers.ValidationError(
                "Internal notes cannot use WhatsApp channel."
            )
        return data