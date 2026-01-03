from django.urls import path
from .views import (
    CompanySignupView,
    EmployeeCreateView,
    LoginView,
    ChangePasswordView,
    CurrentUserView
)
from .dashboard_views import (
    MyProfileView,
    UpdateProfileView,
    EmployeeDashboardView,
    AdminDashboardView,
    CheckInOutView,
    MyAttendanceView,
    TimeOffRequestView,
    TimeOffManagementView
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
    
    # Profile Management
    path('profile/me', MyProfileView.as_view(), name='my-profile'),
    path('profile/update', UpdateProfileView.as_view(), name='update-profile'),
    
    # Dashboard
    path('dashboard/employee', EmployeeDashboardView.as_view(), name='employee-dashboard'),
    path('dashboard/admin', AdminDashboardView.as_view(), name='admin-dashboard'),
    
    # Attendance
    path('attendance/check', CheckInOutView.as_view(), name='check-in-out'),
    path('attendance/my', MyAttendanceView.as_view(), name='my-attendance'),
    
    # Time Off
    path('timeoff/request', TimeOffRequestView.as_view(), name='timeoff-request'),
    path('timeoff/manage', TimeOffManagementView.as_view(), name='timeoff-manage'),
    path('timeoff/manage/<int:pk>', TimeOffManagementView.as_view(), name='timeoff-manage-detail'),
]
