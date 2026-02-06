from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Company
from .utils import generate_random_password, generate_employee_id
from datetime import datetime

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    """Serializer for Company model"""
    class Meta:
        model = Company
        fields = ['id', 'name', 'logo', 'created_at']
        read_only_fields = ['id', 'created_at']


class CompanySignupSerializer(serializers.Serializer):
    """Serializer for company registration (Admin/HR creates account)"""
    company_name = serializers.CharField(max_length=255)
    logo = serializers.ImageField(required=False, allow_null=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    def validate_company_name(self, value):
        if Company.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError('Company with this name already exists')
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists')
        return value
    
    def create(self, validated_data):
        # Create company
        company = Company.objects.create(
            name=validated_data['company_name'],
            logo=validated_data.get('logo')
        )
        
        # Create admin user
        user = User.objects.create_user(
            company=company,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            password=validated_data['password'],
            role='ADMIN',
            year_of_joining=datetime.now().year,
            is_first_login=False,
            is_staff=True
        )
        
        # Generate employee ID
        user.employee_id = generate_employee_id(
            company,
            user.first_name,
            user.last_name,
            user.year_of_joining
        )
        user.save()
        
        return {'user': user, 'company': company}


class EmployeeCreateSerializer(serializers.Serializer):
    """Serializer for creating employee (Only Admin/HR can use this)"""
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=['HR', 'EMPLOYEE'], default='EMPLOYEE')
    year_of_joining = serializers.IntegerField(default=datetime.now().year)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists')
        return value
    
    def create(self, validated_data):
        company = self.context['company']
        
        # Generate random password
        temp_password = generate_random_password()
        
        # Create user
        user = User.objects.create_user(
            company=company,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            password=temp_password,
            role=validated_data.get('role', 'EMPLOYEE'),
            year_of_joining=validated_data.get('year_of_joining', datetime.now().year),
            is_first_login=True
        )
        
        # Generate employee ID
        user.employee_id = generate_employee_id(
            company,
            user.first_name,
            user.last_name,
            user.year_of_joining
        )
        user.save()
        
        # Create profile with job details
        from .models import EmployeeProfile
        EmployeeProfile.objects.create(
            user=user,
            department=validated_data.get('department', ''),
            job_title=validated_data.get('job_title', '')
        )
        
        return {'user': user, 'temp_password': temp_password}


class LoginSerializer(serializers.Serializer):
    """Serializer for user login using employee_id or email"""
    login_id = serializers.CharField()  # Can be employee_id or email
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, data):
        login_id = data.get('login_id')
        password = data.get('password')
        
        if not login_id or not password:
            raise serializers.ValidationError('Login ID and password are required')
        
        # Try to find user by employee_id or email
        user = None
        try:
            user = User.objects.get(employee_id=login_id)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=login_id)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
        
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
        
        data['user'] = user
        return data
    
    def get_tokens(self, user):
        """Generate JWT tokens for the user"""
        refresh = RefreshToken.for_user(user)
        return {
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'employee_id': user.employee_id,
            'email': user.email,
            'role': user.role,
            'is_first_login': user.is_first_login,
            'full_name': user.get_full_name()
        }


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data
    
    def validate_old_password(self, value):
        user = self.context['user']
        if not user.is_first_login and not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value
