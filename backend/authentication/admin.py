from django.contrib import admin
from .models import Company, User, EmployeeProfile, Attendance, TimeOff, LeaveAllocation
from .document_models import EmployeeDocument


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'is_active']
    search_fields = ['name']
    list_filter = ['is_active', 'created_at']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'email', 'first_name', 'last_name', 'role', 'company', 'is_active']
    search_fields = ['employee_id', 'email', 'first_name', 'last_name']
    list_filter = ['role', 'company', 'is_active', 'year_of_joining']
    readonly_fields = ['password', 'last_login', 'created_at', 'updated_at']


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'job_title', 'department', 'monthly_wage']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'job_title', 'department']
    list_filter = ['department', 'job_title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'check_in', 'check_in_location', 'check_out', 'check_out_location', 'work_hours', 'status']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'check_in_location', 'check_out_location']
    list_filter = ['status', 'date']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at', 'check_in_latitude', 'check_in_longitude', 'check_out_latitude', 'check_out_longitude']
    fieldsets = (
        ('Employee Info', {
            'fields': ('user', 'date', 'status')
        }),
        ('Check In', {
            'fields': ('check_in', 'check_in_latitude', 'check_in_longitude', 'check_in_location')
        }),
        ('Check Out', {
            'fields': ('check_out', 'check_out_latitude', 'check_out_longitude', 'check_out_location')
        }),
        ('Work Hours', {
            'fields': ('work_hours', 'extra_hours', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TimeOff)
class TimeOffAdmin(admin.ModelAdmin):
    list_display = ['user', 'time_off_type', 'start_date', 'end_date', 'total_days', 'status']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    list_filter = ['time_off_type', 'status', 'start_date']
    readonly_fields = ['total_days', 'approved_at', 'created_at', 'updated_at']


@admin.register(LeaveAllocation)
class LeaveAllocationAdmin(admin.ModelAdmin):
    list_display = ['user', 'year', 'paid_leave_available', 'sick_leave_available']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    list_filter = ['year']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'document_name', 'document_type', 'uploaded_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'document_name']
    list_filter = ['document_type', 'uploaded_at']
    readonly_fields = ['uploaded_at', 'updated_at']

