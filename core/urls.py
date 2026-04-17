from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

from customers.views import CustomerViewSet
from tickets.views import TicketViewSet
from messaging.views import MessageViewSet
from messaging.webhook import whatsapp_webhook
from analytics.views import analytics_summary, logout_view, me 

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/webhook/whatsapp/', whatsapp_webhook, name='whatsapp-webhook'),
    path('api/analytics/summary/', analytics_summary, name='analytics-summary'),
    path('api/auth/login/', obtain_auth_token, name='auth-login'),
    path('api/auth/logout/', logout_view, name='auth-logout'),
    path('api/auth/me/', me, name='auth-me'),
]