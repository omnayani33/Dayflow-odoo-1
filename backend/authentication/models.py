from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from datetime import datetime


class Company(models.Model):
    """Company/Organization model"""
    name = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'companies'
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
    
    def __str__(self):
        return self.name
    
    def get_company_code(self):
        """Get first two letters of company name in uppercase"""
        words = self.name.split()
        if len(words) >= 2:
            return (words[0][:2] + words[1][:2]).upper()
        return self.name[:4].upper()


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_first_login', False)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with email as username and role-based access"""
    
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('HR', 'HR Officer'),
        ('EMPLOYEE', 'Employee'),
    ]
    
    # Company relation
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees', null=True, blank=True)
    
    # Personal Information
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=100, default='')
    last_name = models.CharField(max_length=100, default='')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Authentication & Role
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE')
    year_of_joining = models.IntegerField(default=datetime.now().year)
    
    # Status flags
    is_verified = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_first_login = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def generate_employee_id(self):
        """Generate employee ID in format: OI[CompanyCode][NameCode][Year][SerialNum]"""
        if not self.company:
            return None
        
        # OI prefix (Odoo India or your app prefix)
        prefix = "OI"
        
        # Company code (first 2 letters of first 2 words)
        company_code = self.company.get_company_code()
        
        # Name code (first 2 letters of first and last name)
        name_code = (self.first_name[:2] + self.last_name[:2]).upper()
        
        # Year
        year = str(self.year_of_joining)
        
        # Get serial number for this year
        year_employees = User.objects.filter(
            company=self.company,
            year_of_joining=self.year_of_joining
        ).count()
        serial_num = str(year_employees + 1).zfill(4)
        
        return f"{prefix}{company_code}{name_code}{year}{serial_num}"
