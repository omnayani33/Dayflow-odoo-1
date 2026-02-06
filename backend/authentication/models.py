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


class EmployeeProfile(models.Model):
    """Extended employee profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Profile Picture
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Personal Information
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], blank=True)
    marital_status = models.CharField(max_length=20, choices=[('Single', 'Single'), ('Married', 'Married'), ('Divorced', 'Divorced')], blank=True)
    residential_address = models.TextField(blank=True)
    personal_email = models.EmailField(blank=True)
    
    # Job Information
    department = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    location = models.CharField(max_length=200, blank=True)
    
    # Bank Details (Private - Admin/HR only)
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    pan_no = models.CharField(max_length=20, blank=True)
    uan_no = models.CharField(max_length=20, blank=True)
    
    # Salary Information (Admin only)
    monthly_wage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    yearly_wage = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    working_days_per_week = models.IntegerField(default=5)
    break_time_hours = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    
    # Salary Components (Admin only)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    basic_salary_percent = models.DecimalField(max_digits=5, decimal_places=2, default=50.0)
    house_rent_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hra_percent = models.DecimalField(max_digits=5, decimal_places=2, default=50.0)
    standard_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    standard_allowance_percent = models.DecimalField(max_digits=5, decimal_places=2, default=16.67)
    performance_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    performance_bonus_percent = models.DecimalField(max_digits=5, decimal_places=2, default=8.33)
    leave_travel_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lta_percent = models.DecimalField(max_digits=5, decimal_places=2, default=8.33)
    fixed_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fixed_allowance_percent = models.DecimalField(max_digits=5, decimal_places=2, default=11.67)
    
    # Tax Deductions (Admin only)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=200.0)
    
    # PF Contribution (Admin only)
    pf_employee_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pf_employee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=12.0)
    pf_employer_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pf_employer_percent = models.DecimalField(max_digits=5, decimal_places=2, default=12.0)
    
    # About & Skills (Resume Tab)
    about = models.TextField(blank=True, help_text='About section for employee profile')
    skills = models.JSONField(default=list, blank=True, help_text='List of skills')
    certifications = models.JSONField(default=list, blank=True, help_text='List of certifications')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employee_profiles'
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Profile"
    
    def calculate_salary_components(self):
        """Auto-calculate salary components based on monthly wage"""
        if self.monthly_wage > 0:
            self.basic_salary = (self.monthly_wage * self.basic_salary_percent) / 100
            self.house_rent_allowance = (self.basic_salary * self.hra_percent) / 100
            self.standard_allowance = (self.monthly_wage * self.standard_allowance_percent) / 100
            self.performance_bonus = (self.monthly_wage * self.performance_bonus_percent) / 100
            self.leave_travel_allowance = (self.monthly_wage * self.lta_percent) / 100
            self.fixed_allowance = (self.monthly_wage * self.fixed_allowance_percent) / 100
            
            # PF Contributions
            self.pf_employee_contribution = (self.basic_salary * self.pf_employee_percent) / 100
            self.pf_employer_contribution = (self.basic_salary * self.pf_employer_percent) / 100
            
            # Yearly wage
            self.yearly_wage = self.monthly_wage * 12


class Attendance(models.Model):
    """Daily attendance tracking"""
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),        ('HALF_DAY', 'Half Day'),        ('LEAVE', 'On Leave'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    
    # Location tracking
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_location = models.CharField(max_length=500, blank=True)
    check_out_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_location = models.CharField(max_length=500, blank=True)
    
    work_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    extra_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ABSENT')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance'
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.date} - {self.status}"
    
    def calculate_work_hours(self):
        """Calculate work hours from check-in and check-out"""
        if self.check_in and self.check_out:
            from datetime import datetime, timedelta
            check_in_dt = datetime.combine(self.date, self.check_in)
            check_out_dt = datetime.combine(self.date, self.check_out)
            
            # Handle overnight shifts
            if check_out_dt < check_in_dt:
                check_out_dt += timedelta(days=1)
            
            duration = check_out_dt - check_in_dt
            hours = duration.total_seconds() / 3600
            
            # Standard work hours (e.g., 8 hours)
            standard_hours = 8
            self.work_hours = min(hours, standard_hours)
            self.extra_hours = max(0, hours - standard_hours)
            
            if hours > 0:
                self.status = 'PRESENT'


class TimeOff(models.Model):
    """Time off / Leave management"""
    TYPE_CHOICES = [
        ('PAID', 'Paid Time Off'),
        ('SICK', 'Sick Leave'),
        ('UNPAID', 'Unpaid Leave'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_off_requests')
    time_off_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField(default=1)
    reason = models.TextField(blank=True)
    attachment = models.FileField(upload_to='leave_certificates/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'time_off'
        verbose_name = 'Time Off'
        verbose_name_plural = 'Time Off Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.time_off_type} ({self.start_date} to {self.end_date})"
    
    def calculate_total_days(self):
        """Calculate total days between start and end date"""
        delta = self.end_date - self.start_date
        self.total_days = delta.days + 1


class LeaveAllocation(models.Model):
    """Leave allocation per user per year"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_allocations')
    year = models.IntegerField(default=datetime.now().year)
    paid_leave_total = models.IntegerField(default=24)  # 24 days per year
    paid_leave_used = models.IntegerField(default=0)
    sick_leave_total = models.IntegerField(default=7)  # 7 days per year
    sick_leave_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'leave_allocations'
        unique_together = ['user', 'year']
        verbose_name = 'Leave Allocation'
        verbose_name_plural = 'Leave Allocations'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.year}"
    
    @property
    def paid_leave_available(self):
        return self.paid_leave_total - self.paid_leave_used
    
    @property
    def sick_leave_available(self):
        return self.sick_leave_total - self.sick_leave_used


class Notification(models.Model):
    """In-app notification system"""
    TYPE_CHOICES = [
        ('INFO', 'Information'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    is_read = models.BooleanField(default=False)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)  # 'leave', 'attendance', etc.
    related_object_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.now()
            self.save()
