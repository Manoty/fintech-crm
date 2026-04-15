from django.db import models


class Message(models.Model):

    class MessageType(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        AGENT = 'agent', 'Agent'
        INTERNAL = 'internal', 'Internal Note'

    class Channel(models.TextChoices):
        WHATSAPP = 'whatsapp', 'WhatsApp'
        EMAIL = 'email', 'Email'
        PORTAL = 'portal', 'Portal'
        INTERNAL = 'internal', 'Internal'

    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.CASCADE,
        related_name='messages'
    )
    message_type = models.CharField(
        max_length=20,
        choices=MessageType.choices
    )
    channel = models.CharField(
        max_length=20,
        choices=Channel.choices,
        default=Channel.PORTAL
    )
    sender_name = models.CharField(max_length=255)
    body = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal notes are never sent to the customer via WhatsApp"
    )
    whatsapp_message_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Twilio Message SID — used for deduplication"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        label = "🔒 Internal" if self.is_internal else self.get_message_type_display()
        return f"[{label}] {self.sender_name}: {self.body[:60]}"