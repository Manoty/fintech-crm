from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT/DELETE on messages

    def get_queryset(self):
        """
        Always filter by ticket.
        Supports:
          ?ticket=1
          ?ticket=1&is_internal=true
        """
        queryset = Message.objects.all().order_by('created_at')
        ticket_id = self.request.query_params.get('ticket')
        is_internal = self.request.query_params.get('is_internal')

        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)

        if is_internal is not None:
            queryset = queryset.filter(is_internal=is_internal.lower() == 'true')

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save()

        # If it's an agent reply (not internal), send via WhatsApp
        if not message.is_internal and message.channel == 'whatsapp':
            self._send_whatsapp_reply(message)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def _send_whatsapp_reply(self, message):
        """Send agent reply out via Twilio. Fails silently — don't crash the API."""
        try:
            import os
            from twilio.rest import Client
            client = Client(
                os.getenv('TWILIO_ACCOUNT_SID'),
                os.getenv('TWILIO_AUTH_TOKEN')
            )
            phone = message.ticket.customer.phone_number
            client.messages.create(
                from_=os.getenv('TWILIO_WHATSAPP_NUMBER'),
                to=f'whatsapp:{phone}',
                body=message.body
            )
        except Exception as e:
            print(f"[WhatsApp send error] {e}")