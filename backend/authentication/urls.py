from django.urls import path
from .views import (
    CompanySignupView,
    EmployeeCreateView,
    LoginView,
    ChangePasswordView,
    CurrentUserView
)

urlpatterns = [
    # Company registration (creates first admin account)
    path('company/signup', CompanySignupView.as_view(), name='company-signup'),
    
    # Employee management (admin/HR only)
    path('employee/create', EmployeeCreateView.as_view(), name='employee-create'),
    
    # Authentication
    path('login', LoginView.as_view(), name='login'),
    path('change-password', ChangePasswordView.as_view(), name='change-password'),
    
    # User info
    path('me', CurrentUserView.as_view(), name='current-user'),
]
