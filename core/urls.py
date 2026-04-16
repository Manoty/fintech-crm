from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from customers.views import CustomerViewSet
from tickets.views import TicketViewSet
from messaging.views import MessageViewSet
from messaging.webhook import whatsapp_webhook

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'tickets',   TicketViewSet,   basename='ticket')
router.register(r'messages',  MessageViewSet,  basename='message')

urlpatterns = [
    path('admin/',                    admin.site.urls),
    path('api/',                      include(router.urls)),
    path('api/webhook/whatsapp/',     whatsapp_webhook,       name='whatsapp-webhook'),
    path('api/analytics/',            include('analytics.urls')),
]