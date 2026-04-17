import os
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny

@csrf_exempt
@require_POST
@permission_classes([AllowAny])

def whatsapp_webhook(request):
    """
    Main webhook endpoint — Twilio calls this for every inbound WhatsApp message.

    Twilio POST fields (form-encoded, not JSON):
      From       → whatsapp:+254700000001
      Body       → message text
      MessageSid → unique Twilio message ID (SM...)
      ProfileName → WhatsApp display name of sender
    """
    # ── Parse Twilio POST data ──────────────────────────────────────────────
    from_field = request.POST.get('From', '')       # whatsapp:+254700000001
    body = request.POST.get('Body', '').strip()
    message_sid = request.POST.get('MessageSid', '')
    profile_name = request.POST.get('ProfileName', '')

    # Strip the "whatsapp:" prefix to get clean E.164 phone number
    phone_number = from_field.replace('whatsapp:', '')

    print(f"\n[Webhook] ─── Inbound message ───────────────────────")
    print(f"[Webhook] From:       {phone_number}")
    print(f"[Webhook] Name:       {profile_name}")
    print(f"[Webhook] Body:       {body}")
    print(f"[Webhook] MessageSid: {message_sid}")
    print(f"[Webhook] ─────────────────────────────────────────────\n")

    # ── Guard: ignore empty messages ────────────────────────────────────────
    if not phone_number or not body:
        print("[Webhook] Empty phone or body — ignoring.")
        twiml = MessagingResponse()
        return HttpResponse(str(twiml), content_type='text/xml')

    # ── Core logic ──────────────────────────────────────────────────────────
    customer, _ = get_or_create_customer(phone_number, profile_name)
    ticket, is_new_ticket = get_or_create_ticket(customer, body)
    save_inbound_message(ticket, customer, body, message_sid)
    send_auto_reply(phone_number, ticket, is_new_ticket)

    # ── Return empty TwiML (auto-reply sent via API, not TwiML body) ────────
    twiml = MessagingResponse()
    return HttpResponse(str(twiml), content_type='text/xml')


def get_or_create_customer(phone_number, profile_name=""):
    """
    Find existing customer by phone number or create a new one.
    phone_number arrives from Twilio in E.164 format e.g. +254700000001
    """
    from customers.models import Customer

    customer, created = Customer.objects.get_or_create(
        phone_number=phone_number,
        defaults={
            'full_name': profile_name or f"WhatsApp {phone_number}",
        }
    )

    if created:
        print(f"[Webhook] New customer created: {customer}")
    else:
        print(f"[Webhook] Existing customer found: {customer}")

    return customer, created


def get_or_create_ticket(customer, message_body):
    """
    Find the customer's most recent open or in_progress ticket.
    If none exists, create a new one with subject from the first message.
    """
    from tickets.models import Ticket

    existing_ticket = Ticket.objects.filter(
        customer=customer,
        status__in=[Ticket.Status.OPEN, Ticket.Status.IN_PROGRESS]
    ).order_by('-created_at').first()

    if existing_ticket:
        print(f"[Webhook] Appending to existing ticket #{existing_ticket.id}")
        return existing_ticket, False

    # Auto-generate subject from first 80 chars of message
    subject = message_body[:80] if len(message_body) > 80 else message_body

    new_ticket = Ticket.objects.create(
        customer=customer,
        subject=subject,
        description=message_body,
        status=Ticket.Status.OPEN,
        priority=Ticket.Priority.MEDIUM,
        category=Ticket.Category.OTHER,
    )

    print(f"[Webhook] New ticket created: #{new_ticket.id} — {new_ticket.subject}")
    return new_ticket, True


def save_inbound_message(ticket, customer, body, twilio_message_sid):
    """
    Save the inbound WhatsApp message to the ticket thread.
    Uses whatsapp_message_id for deduplication — Twilio can retry webhooks.
    """
    from messaging.models import Message

    # Deduplication check
    if Message.objects.filter(whatsapp_message_id=twilio_message_sid).exists():
        print(f"[Webhook] Duplicate message detected, skipping: {twilio_message_sid}")
        return None

    message = Message.objects.create(
        ticket=ticket,
        message_type=Message.MessageType.CUSTOMER,
        channel=Message.Channel.WHATSAPP,
        sender_name=customer.full_name,
        body=body,
        is_internal=False,
        whatsapp_message_id=twilio_message_sid,
    )

    print(f"[Webhook] Message saved: #{message.id}")
    return message


def send_auto_reply(to_number, ticket, is_new_ticket):
    """
    Send an automatic acknowledgement back to the customer via Twilio.
    """
    try:
        client = Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN')
        )

        if is_new_ticket:
            body = (
                f"✅ Hello! Your support request has been received.\n\n"
                f"🎫 Ticket #{ticket.id}: {ticket.subject}\n\n"
                f"Our team will respond shortly. "
                f"Reply to this message to add more details."
            )
        else:
            body = (
                f"📩 Message received and added to Ticket #{ticket.id}.\n\n"
                f"Our team is on it. We'll update you soon."
            )

        client.messages.create(
            from_=os.getenv('TWILIO_WHATSAPP_NUMBER'),
            to=f'whatsapp:{to_number}',
            body=body
        )
        print(f"[Webhook] Auto-reply sent to {to_number}")

    except Exception as e:
        # Never let a Twilio error crash the webhook response
        print(f"[Webhook] Auto-reply failed: {e}")