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
    AllAttendanceView,
    TimeOffRequestView,
    TimeOffManagementView
)
from .reports_views import (
    AttendanceReportView,
    AttendanceReportCSVView,
    PayrollReportView,
    PayrollReportCSVView,
    LeaveReportView,
    LeaveReportCSVView
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
    
    # Attendance Management (Module 5)
    path('attendance/checkin', CheckInOutView.as_view(), name='checkin'),  # Alternative route
    path('attendance/checkout', CheckInOutView.as_view(), name='checkout'),  # Alternative route
    path('attendance/check', CheckInOutView.as_view(), name='check-in-out'),  # Original unified route
    path('attendance/my', MyAttendanceView.as_view(), name='my-attendance'),
    path('attendance', AllAttendanceView.as_view(), name='all-attendance'),  # Admin view all
    
    # Leave Management (Module 6)
    path('leave/apply', TimeOffRequestView.as_view(), name='leave-apply'),  # Alternative route
    path('leave/my', TimeOffRequestView.as_view(), name='leave-my'),  # Alternative route
    path('leave/all', TimeOffManagementView.as_view(), name='leave-all'),  # Alternative route
    path('leave/approve', TimeOffManagementView.as_view(), name='leave-approve'),  # Alternative route
    path('timeoff/request', TimeOffRequestView.as_view(), name='timeoff-request'),  # Original route
    path('timeoff/manage', TimeOffManagementView.as_view(), name='timeoff-manage'),
    path('timeoff/manage/<int:pk>', TimeOffManagementView.as_view(), name='timeoff-manage-detail'),
    
    # Reporting APIs (Module 7)
    path('reports/attendance', AttendanceReportView.as_view(), name='attendance-report'),
    path('reports/attendance/csv', AttendanceReportCSVView.as_view(), name='attendance-report-csv'),
    path('reports/payroll', PayrollReportView.as_view(), name='payroll-report'),
    path('reports/payroll/csv', PayrollReportCSVView.as_view(), name='payroll-report-csv'),
    path('reports/leave', LeaveReportView.as_view(), name='leave-report'),
    path('reports/leave/csv', LeaveReportCSVView.as_view(), name='leave-report-csv'),
]
