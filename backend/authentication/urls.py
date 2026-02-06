from django.urls import path
from .views import (
    CompanySignupView,
    EmployeeCreateView,
    LoginView,
    ChangePasswordView,
    CurrentUserView
)
from .delete_views import EmployeeDeleteView
from .dashboard_views import (
    MyProfileView,
    UpdateProfileView,
    EmployeeDashboardView,
    AdminDashboardView,
    CheckInOutView,
    MyAttendanceView,
    AllAttendanceView,
    TimeOffRequestView,
    TimeOffManagementView,
    EmployeeListView
)
from .reports_views import (
    AttendanceReportView,
    AttendanceReportCSVView,
    PayrollReportView,
    PayrollReportCSVView,
    LeaveReportView,
    LeaveReportCSVView
)
from .notification_views import (
    MyNotificationsView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    DeleteNotificationView,
    ClearAllNotificationsView
)
from .analytics_views import (
    AnalyticsDashboardView,
    AttendanceTrendAnalyticsView,
    LeaveAnalyticsView,
    PayrollAnalyticsView
)
from .advanced_analytics_views import (
    PredictiveAnalyticsView,
    AnomalyDetectionView,
    PerformanceScoreView,
    GraphDataView
)
from .profile_management_views import (
    AvatarUploadView,
    DocumentListView,
    DocumentUploadView,
    DocumentDownloadView,
    DocumentDeleteView
)

urlpatterns = [
    # Company registration (creates first admin account)
    path('company/signup', CompanySignupView.as_view(), name='company-signup'),
    
    # Employee management (admin/HR only)
    path('employee/create', EmployeeCreateView.as_view(), name='employee-create'),
    path('employee/all', EmployeeListView.as_view(), name='employee-list'),
    path('employee/<int:pk>/delete', EmployeeDeleteView.as_view(), name='employee-delete'),
    
    # Authentication
    path('login', LoginView.as_view(), name='login'),
    path('change-password', ChangePasswordView.as_view(), name='change-password'),
    
    # User info
    path('me', CurrentUserView.as_view(), name='current-user'),
    
    # Profile Management
    path('profile/me', MyProfileView.as_view(), name='my-profile'),
    path('profile/update', UpdateProfileView.as_view(), name='update-profile'),
    path('profile/avatar', AvatarUploadView.as_view(), name='avatar-upload'),
    path('profile/documents', DocumentListView.as_view(), name='document-list'),
    path('profile/documents', DocumentUploadView.as_view(), name='document-upload'),
    path('profile/documents/<int:pk>/download', DocumentDownloadView.as_view(), name='document-download'),
    path('profile/documents/<int:pk>', DocumentDeleteView.as_view(), name='document-delete'),
    
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
    
    # In-App Notifications (NEW)
    path('notifications', MyNotificationsView.as_view(), name='my-notifications'),
    path('notifications/<int:pk>/read', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('notifications/read-all', MarkAllNotificationsReadView.as_view(), name='mark-all-read'),
    path('notifications/<int:pk>/delete', DeleteNotificationView.as_view(), name='delete-notification'),
    path('notifications/clear', ClearAllNotificationsView.as_view(), name='clear-notifications'),
    
    # Analytics Dashboards (NEW)
    path('analytics/dashboard', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('analytics/attendance-trend', AttendanceTrendAnalyticsView.as_view(), name='attendance-trend'),
    path('analytics/leave', LeaveAnalyticsView.as_view(), name='leave-analytics'),
    path('analytics/payroll', PayrollAnalyticsView.as_view(), name='payroll-analytics'),
    
    # Advanced Analytics - Unique Features for Hackathon (NEW)
    path('analytics/predictive', PredictiveAnalyticsView.as_view(), name='predictive-analytics'),
    path('analytics/anomalies', AnomalyDetectionView.as_view(), name='anomaly-detection'),
    path('analytics/performance-scores', PerformanceScoreView.as_view(), name='performance-scores'),
    path('analytics/graph-data', GraphDataView.as_view(), name='graph-data'),
]
