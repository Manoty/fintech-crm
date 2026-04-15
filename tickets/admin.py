from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'subject', 'customer', 'status',
        'priority', 'category', 'assigned_to', 'created_at'
    ]
    list_filter = ['status', 'priority', 'category']
    search_fields = ['subject', 'customer__full_name', 'customer__phone_number']
    ordering = ['-created_at']
    readonly_fields = ['resolved_at', 'created_at', 'updated_at']