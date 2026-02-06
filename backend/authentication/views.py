from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .delete_views import EmployeeDeleteView
from django.contrib.auth import get_user_model
from .serializers import (
    CompanySignupSerializer,
    EmployeeCreateSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    CompanySerializer
)
from .permissions import IsAdmin
from .models import Company

User = get_user_model()


class CompanySignupView(APIView):
    """
    API endpoint for company registration
    This creates the first admin/HR account for a company
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CompanySignupSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            user = result['user']
            company = result['company']
            
            return Response(
                {
                    'message': 'Company and admin account created successfully',
                    'company': {
                        'id': company.id,
                        'name': company.name
                    },
                    'user': {
                        'employee_id': user.employee_id,
                        'email': user.email,
                        'full_name': user.get_full_name(),
                        'role': user.role
                    }
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeCreateView(APIView):
    """
    API endpoint for creating employees
    Only ADMIN or HR can create new employees
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request):
        # Check if user is ADMIN or HR
        if request.user.role not in ['ADMIN', 'HR']:
            return Response(
                {'error': 'Only Admin or HR can create employees'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = EmployeeCreateSerializer(
            data=request.data,
            context={'company': request.user.company}
        )
        
        if serializer.is_valid():
            result = serializer.save()
            user = result['user']
            temp_password = result['temp_password']
            
            # Send welcome email
            from .notifications import EmailNotificationService
            EmailNotificationService.send_welcome_email(user, temp_password)
            
            return Response(
                {
                    'message': 'Employee created successfully. Welcome email sent.',
                    'employee': {
                        'employee_id': user.employee_id,
                        'email': user.email,
                        'full_name': user.get_full_name(),
                        'role': user.role,
                        'phone': user.phone
                    },
                    'temporary_password': temp_password,
                    'note': 'Please share this password with the employee. They must change it on first login.'
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    API endpoint for user login
    Accepts employee_id or email as login_id
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = serializer.get_tokens(user)
            
            response_data = {
                **tokens,
                'message': 'Login successful'
            }
            
            # Add note if it's first login
            if user.is_first_login:
                response_data['note'] = 'Please change your password'
            
            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    API endpoint for changing password
    Handles both first-time password change and regular password updates
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'user': request.user}
        )
        
        if serializer.is_valid():
            user = request.user
            
            # For first login, no old password needed
            if not user.is_first_login:
                # Validate old password
                if not serializer.validated_data.get('old_password'):
                    return Response(
                        {'error': 'Old password is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.is_first_login = False
            user.save()
            
            # Send password changed email
            from .notifications import EmailNotificationService
            EmailNotificationService.send_password_changed_email(user)
            
            return Response(
                {
                    'message': 'Password changed successfully. Confirmation email sent.',
                    'note': 'Please login again with your new password'
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """Get current authenticated user details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'employee_id': user.employee_id,
            'email': user.email,
            'full_name': user.get_full_name(),
            'role': user.role,
            'phone': user.phone,
            'is_first_login': user.is_first_login,
            'company': {
                'id': user.company.id if user.company else None,
                'name': user.company.name if user.company else None
            }
        })
