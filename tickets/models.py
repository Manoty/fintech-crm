from django.db import models
from django.utils import timezone


class Ticket(models.Model):

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class Category(models.TextChoices):
        TRANSACTION = 'transaction', 'Transaction'
        KYC = 'kyc', 'KYC'
        FRAUD = 'fraud', 'Fraud'
        ACCOUNT = 'account', 'Account'
        OTHER = 'other', 'Other'

    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    assigned_to = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status.upper()}] {self.subject} — {self.customer}"

    def resolve(self):
        """Mark ticket as resolved and stamp the resolution time."""
        self.status = self.Status.RESOLVED
        self.resolved_at = timezone.now()
        self.save()