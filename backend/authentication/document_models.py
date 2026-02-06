"""
Document Management Models
Handles employee document uploads and management
"""

from django.db import models
from .models import User


class EmployeeDocument(models.Model):
    """Employee documents (resumes, certificates, ID proofs, etc.)"""
    
    DOCUMENT_TYPES = [
        ('RESUME', 'Resume/CV'),
        ('ID_PROOF', 'ID Proof'),
        ('ADDRESS_PROOF', 'Address Proof'),
        ('CERTIFICATE', 'Certificate'),
        ('OFFER_LETTER', 'Offer Letter'),
        ('CONTRACT', 'Employment Contract'),
        ('OTHER', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='OTHER')
    document_file = models.FileField(upload_to='employee_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.document_name}"
