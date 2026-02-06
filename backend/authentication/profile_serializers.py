from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmployeeProfile, Attendance, TimeOff, LeaveAllocation, Notification
from .document_models import EmployeeDocument

User = get_user_model()


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """Serializer for employee profile with role-based field access"""
    employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_avatar(self, obj):
        """Get absolute URL for avatar"""
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        
        if request and hasattr(request, 'user'):
            user = request.user
            
            # Employee can only edit specific fields
            if user.role == 'EMPLOYEE':
                # Read-only fields for employees (except phone and address)
                readonly_fields = [
                    'date_of_birth', 'gender', 'marital_status', 'department',
                    'job_title', 'manager', 'location', 'bank_name', 'account_number',
                    'ifsc_code', 'pan_no', 'uan_no', 'monthly_wage', 'yearly_wage',
                    'working_days_per_week', 'break_time_hours', 'basic_salary',
                    'basic_salary_percent', 'house_rent_allowance', 'hra_percent',
                    'standard_allowance', 'standard_allowance_percent', 'performance_bonus',
                    'performance_bonus_percent', 'leave_travel_allowance', 'lta_percent',
                    'fixed_allowance', 'fixed_allowance_percent', 'professional_tax',
                    'pf_employee_contribution', 'pf_employee_percent',
                    'pf_employer_contribution', 'pf_employer_percent'
                ]
                
                for field in readonly_fields:
                    if field in self.fields:
                        self.fields[field].read_only = True
                
                # Remove salary and bank fields from employee view
                salary_fields = [
                    'monthly_wage', 'yearly_wage', 'basic_salary', 'basic_salary_percent',
                    'house_rent_allowance', 'hra_percent', 'standard_allowance',
                    'standard_allowance_percent', 'performance_bonus', 'performance_bonus_percent',
                    'leave_travel_allowance', 'lta_percent', 'fixed_allowance',
                    'fixed_allowance_percent', 'professional_tax', 'pf_employee_contribution',
                    'pf_employee_percent', 'pf_employer_contribution', 'pf_employer_percent',
                    'bank_name', 'account_number', 'ifsc_code', 'pan_no', 'uan_no'
                ]
                
                for field in salary_fields:
                    if field in self.fields:
                        self.fields.pop(field)


class EmployeeProfilePublicSerializer(serializers.ModelSerializer):
    """Public serializer for employee card display"""
    employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeProfile
        fields = ['employee_id', 'full_name', 'email', 'avatar', 'job_title', 'department', 'status']
    
    def get_status(self, obj):
        """Get current attendance status"""
        from datetime import date
        today = date.today()
        try:
            attendance = Attendance.objects.get(user=obj.user, date=today)
            return attendance.status
        except Attendance.DoesNotExist:
            return 'ABSENT'


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance records"""
    employee_name = serializers.CharField(source='user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['user', 'work_hours', 'extra_hours', 'status', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        attendance = super().create(validated_data)
        attendance.calculate_work_hours()
        attendance.save()
        return attendance
    
    def update(self, instance, validated_data):
        attendance = super().update(instance, validated_data)
        attendance.calculate_work_hours()
        attendance.save()
        return attendance


class TimeOffSerializer(serializers.ModelSerializer):
    """Serializer for time off requests"""
    employee_name = serializers.CharField(source='user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = TimeOff
        fields = '__all__'
        read_only_fields = ['user', 'total_days', 'approved_by', 'approved_at', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError('End date must be after start date')
        return data
    
    def create(self, validated_data):
        time_off = super().create(validated_data)
        time_off.calculate_total_days()
        time_off.save()
        return time_off


class LeaveAllocationSerializer(serializers.ModelSerializer):
    """Serializer for leave allocation"""
    employee_name = serializers.CharField(source='user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    paid_leave_available = serializers.IntegerField(read_only=True)
    sick_leave_available = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = LeaveAllocation
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for in-app notifications"""
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 
                  'related_object_type', 'related_object_id', 'created_at', 
                  'read_at', 'time_ago']
        read_only_fields = ['id', 'created_at', 'read_at', 'time_ago']
    
    def get_time_ago(self, obj):
        """Get human-readable time ago"""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        created_at = obj.created_at
        
        if created_at.tzinfo is None:
            import pytz
            created_at = pytz.utc.localize(created_at)
        
        diff = now - created_at
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            weeks = int(seconds / 604800)
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Serializer for employee documents"""
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeDocument
        fields = ['id', 'document_name', 'document_type', 'file_url', 
                  'file_size', 'uploaded_at', 'updated_at']
        read_only_fields = ['id', 'uploaded_at', 'updated_at']
    
    def get_file_url(self, obj):
        """Get absolute URL for document file"""
        request = self.context.get('request')
        if obj.document_file and request:
            return request.build_absolute_uri(obj.document_file.url)
        return None
    
    def get_file_size(self, obj):
        """Get file size in human-readable format"""
        if obj.document_file:
            size = obj.document_file.size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
        return None

