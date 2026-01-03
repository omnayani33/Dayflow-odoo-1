from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['employee_id', 'email', 'password', 'role']
        extra_kwargs = {
            'role': {'required': False}
        }
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            employee_id=validated_data.get('employee_id'),
            role=validated_data.get('role', 'EMPLOYEE')
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required')
        
        try:
            user = User.objects.get(email=email)
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
            'role': user.role
        }
