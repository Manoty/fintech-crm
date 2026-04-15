from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'ticket', 'message_type', 'channel',
        'sender_name', 'is_internal', 'created_at'
    ]
    list_filter = ['message_type', 'channel', 'is_internal']
    search_fields = ['sender_name', 'body', 'ticket__subject']
    ordering = ['created_at']
    readonly_fields = ['whatsapp_message_id', 'created_at']