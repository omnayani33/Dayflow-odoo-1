from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from datetime import date, datetime, timedelta
from .models import User, EmployeeProfile, Attendance, TimeOff, LeaveAllocation
from .profile_serializers import (
    EmployeeProfileSerializer,
    EmployeeProfilePublicSerializer,
    AttendanceSerializer,
    TimeOffSerializer,
    LeaveAllocationSerializer,
    NotificationSerializer
)
from .permissions import IsAdmin


class MyProfileView(APIView):
    """Get current user's profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get or create profile
        profile, created = EmployeeProfile.objects.get_or_create(user=request.user)
        serializer = EmployeeProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)


class UpdateProfileView(APIView):
    """Update user profile with role-based restrictions"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        profile, created = EmployeeProfile.objects.get_or_create(user=request.user)
        serializer = EmployeeProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Auto-calculate salary components if admin updates salary
            if request.user.role in ['ADMIN', 'HR'] and 'monthly_wage' in request.data:
                profile.calculate_salary_components()
            
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'profile': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeDashboardView(APIView):
    """Dashboard summary for employees"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = date.today()
        current_month = today.month
        current_year = today.year
        
        # Attendance count for current month
        attendance_count = Attendance.objects.filter(
            user=user,
            date__month=current_month,
            date__year=current_year,
            status='PRESENT'
        ).count()
        
        # Total working days in month
        from calendar import monthrange
        total_days = monthrange(current_year, current_month)[1]
        working_days = total_days - 8  # Approximate (excluding weekends)
        
        # Leave allocation
        leave_allocation, _ = LeaveAllocation.objects.get_or_create(
            user=user,
            year=current_year
        )
        
        # Pending leave requests
        pending_leaves = TimeOff.objects.filter(
            user=user,
            status='PENDING'
        ).count()
        
        # Today's attendance status
        try:
            today_attendance = Attendance.objects.get(user=user, date=today)
            today_status = {
                'checked_in': today_attendance.check_in is not None,
                'check_in': str(today_attendance.check_in) if today_attendance.check_in else None,
                'check_out': str(today_attendance.check_out) if today_attendance.check_out else None,
                'status': today_attendance.status
            }
        except Attendance.DoesNotExist:
            today_status = {
                'checked_in': False,
                'check_in': None,
                'check_out': None,
                'status': 'ABSENT'
            }
        
        return Response({
            'employee': {
                'name': user.get_full_name(),
                'employee_id': user.employee_id,
                'email': user.email,
                'role': user.role
            },
            'attendance': {
                'days_present': attendance_count,
                'working_days': working_days,
                'attendance_percentage': round((attendance_count / working_days * 100), 2) if working_days > 0 else 0,
                'today': today_status
            },
            'leaves': {
                'paid_leave_available': leave_allocation.paid_leave_available,
                'paid_leave_total': leave_allocation.paid_leave_total,
                'sick_leave_available': leave_allocation.sick_leave_available,
                'sick_leave_total': leave_allocation.sick_leave_total,
                'pending_requests': pending_leaves
            }
        })


class AdminDashboardView(APIView):
    """Dashboard summary for admin/HR"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        company = request.user.company
        today = date.today()
        current_month = today.month
        current_year = today.year
        
        # Total employees
        total_employees = User.objects.filter(company=company, is_active=True).count()
        
        # Employees by role
        employees_by_role = User.objects.filter(
            company=company,
            is_active=True
        ).values('role').annotate(count=Count('id'))
        
        # Pending leave requests
        pending_leaves = TimeOff.objects.filter(
            user__company=company,
            status='PENDING'
        ).count()
        
        # Today's attendance overview
        today_attendance = Attendance.objects.filter(
            user__company=company,
            date=today
        ).values('status').annotate(count=Count('id'))
        
        attendance_summary = {
            'PRESENT': 0,
            'ABSENT': 0,
            'LEAVE': 0
        }
        for item in today_attendance:
            attendance_summary[item['status']] = item['count']
        
        # Calculate absent employees
        attendance_summary['ABSENT'] = total_employees - (
            attendance_summary['PRESENT'] + attendance_summary['LEAVE']
        )
        
        # Monthly attendance stats
        monthly_attendance = Attendance.objects.filter(
            user__company=company,
            date__month=current_month,
            date__year=current_year,
            status='PRESENT'
        ).count()
        
        # Recent employee list for cards
        employees = User.objects.filter(
            company=company,
            is_active=True
        ).select_related('profile')[:10]
        
        employee_cards = []
        for emp in employees:
            try:
                today_att = Attendance.objects.get(user=emp, date=today)
                emp_status = today_att.status
            except Attendance.DoesNotExist:
                emp_status = 'ABSENT'
            
            employee_cards.append({
                'employee_id': emp.employee_id,
                'name': emp.get_full_name(),
                'email': emp.email,
                'job_title': emp.profile.job_title if hasattr(emp, 'profile') else '',
                'avatar': request.build_absolute_uri(emp.profile.avatar.url) if hasattr(emp, 'profile') and emp.profile.avatar else None,
                'status': emp_status
            })
        
        return Response({
            'summary': {
                'total_employees': total_employees,
                'pending_leaves': pending_leaves,
                'monthly_attendance_count': monthly_attendance
            },
            'employees_by_role': list(employees_by_role),
            'attendance_today': attendance_summary,
            'employee_cards': employee_cards
        })


class CheckInOutView(APIView):
    """Check-in and check-out for employees"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        action = request.data.get('action')  # 'check_in' or 'check_out'
        today = date.today()
        
        # Get location data from request
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        location_name = request.data.get('location', '')
        
        attendance, created = Attendance.objects.get_or_create(
            user=request.user,
            date=today
        )
        
        if action == 'check_in':
            if attendance.check_in:
                return Response(
                    {'error': 'Already checked in today'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            attendance.check_in = datetime.now().time()
            attendance.status = 'PRESENT'
            
            # Store check-in location
            if latitude and longitude:
                attendance.check_in_latitude = latitude
                attendance.check_in_longitude = longitude
                attendance.check_in_location = location_name
            
            attendance.save()
            return Response({
                'message': 'Checked in successfully',
                'check_in': str(attendance.check_in),
                'location': {
                    'latitude': str(attendance.check_in_latitude) if attendance.check_in_latitude else None,
                    'longitude': str(attendance.check_in_longitude) if attendance.check_in_longitude else None,
                    'name': attendance.check_in_location
                }
            })
        
        elif action == 'check_out':
            if not attendance.check_in:
                return Response(
                    {'error': 'Please check in first'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if attendance.check_out:
                return Response(
                    {'error': 'Already checked out today'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            attendance.check_out = datetime.now().time()
            
            # Store check-out location
            if latitude and longitude:
                attendance.check_out_latitude = latitude
                attendance.check_out_longitude = longitude
                attendance.check_out_location = location_name
            
            attendance.calculate_work_hours()
            attendance.save()
            return Response({
                'message': 'Checked out successfully',
                'check_out': str(attendance.check_out),
                'work_hours': float(attendance.work_hours),
                'extra_hours': float(attendance.extra_hours),
                'location': {
                    'latitude': str(attendance.check_out_latitude) if attendance.check_out_latitude else None,
                    'longitude': str(attendance.check_out_longitude) if attendance.check_out_longitude else None,
                    'name': attendance.check_out_location
                }
            })
        
        return Response(
            {'error': 'Invalid action. Use "check_in" or "check_out"'},
            status=status.HTTP_400_BAD_REQUEST
        )


class MyAttendanceView(APIView):
    """View own attendance records"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)
        
        attendance_records = Attendance.objects.filter(
            user=request.user,
            date__month=month,
            date__year=year
        ).order_by('date')
        
        serializer = AttendanceSerializer(attendance_records, many=True)
        return Response({
            'month': month,
            'year': year,
            'records': serializer.data
        })


class AllAttendanceView(APIView):
    """Admin view to see all employees attendance"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)
        status = request.query_params.get('status')  # Optional filter
        employee_id = request.query_params.get('employee_id')  # Optional filter
        
        # Base query
        attendance_records = Attendance.objects.filter(
            date__month=month,
            date__year=year
        ).select_related('user').order_by('-date', 'user__employee_id')
        
        # Apply optional filters
        if status:
            attendance_records = attendance_records.filter(status=status)
        if employee_id:
            attendance_records = attendance_records.filter(user__employee_id=employee_id)
        
        serializer = AttendanceSerializer(attendance_records, many=True)
        
        # Calculate summary statistics
        total_records = attendance_records.count()
        present_count = attendance_records.filter(status='PRESENT').count()
        absent_count = attendance_records.filter(status='ABSENT').count()
        half_day_count = attendance_records.filter(status='HALF_DAY').count()
        leave_count = attendance_records.filter(status='LEAVE').count()
        
        return Response({
            'month': int(month),
            'year': int(year),
            'summary': {
                'total': total_records,
                'present': present_count,
                'absent': absent_count,
                'half_day': half_day_count,
                'on_leave': leave_count
            },
            'records': serializer.data
        })


class TimeOffRequestView(APIView):
    """Create and view time-off requests"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get user's time-off requests
        time_off_requests = TimeOff.objects.filter(user=request.user)
        serializer = TimeOffSerializer(time_off_requests, many=True)
        
        # Get leave allocation
        leave_allocation, _ = LeaveAllocation.objects.get_or_create(
            user=request.user,
            year=date.today().year
        )
        
        return Response({
            'time_off_requests': serializer.data,
            'allocation': LeaveAllocationSerializer(leave_allocation).data
        })
    
    def post(self, request):
        serializer = TimeOffSerializer(data=request.data)
        if serializer.is_valid():
            time_off = serializer.save(user=request.user)
            
            # Send notifications
            from .notifications import (
                EmailNotificationService,
                WhatsAppNotificationService,
                InAppNotificationService
            )
            
            # In-app notification for employee
            InAppNotificationService.notify_leave_request_submitted(time_off)
            
            # Notify admins/HR about new leave request
            InAppNotificationService.notify_admin_new_leave_request(time_off)
            EmailNotificationService.send_leave_request_to_admin(time_off)
            
            return Response({
                'message': 'Time-off request submitted successfully. Admin has been notified.',
                'request': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeOffManagementView(APIView):
    """Admin/HR can view and approve/reject time-off requests"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Get all time-off requests for company
        time_off_requests = TimeOff.objects.filter(user__company=request.user.company)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            time_off_requests = time_off_requests.filter(status=status_filter.upper())
        
        serializer = TimeOffSerializer(time_off_requests, many=True)
        return Response(serializer.data)
    
    def patch(self, request, pk):
        time_off = get_object_or_404(TimeOff, pk=pk, user__company=request.user.company)
        action = request.data.get('action')  # 'approve' or 'reject'
        
        if action == 'approve':
            time_off.status = 'APPROVED'
            time_off.approved_by = request.user
            time_off.approved_at = datetime.now()
            
            # Update leave allocation
            leave_allocation, _ = LeaveAllocation.objects.get_or_create(
                user=time_off.user,
                year=time_off.start_date.year
            )
            
            if time_off.time_off_type == 'PAID':
                leave_allocation.paid_leave_used += time_off.total_days
            elif time_off.time_off_type == 'SICK':
                leave_allocation.sick_leave_used += time_off.total_days
            
            leave_allocation.save()
            time_off.save()
            
            # Send notifications (Email + WhatsApp + In-app)
            from .notifications import (
                EmailNotificationService,
                WhatsAppNotificationService,
                InAppNotificationService
            )
            
            # In-app notification
            InAppNotificationService.notify_leave_approved(time_off)
            
            # Email notification
            EmailNotificationService.send_leave_approval_email(time_off)
            
            # WhatsApp notification
            whatsapp_service = WhatsAppNotificationService()
            whatsapp_service.send_leave_approval_whatsapp(time_off)
            
            return Response({
                'message': 'Time-off request approved. Employee has been notified via email, WhatsApp, and in-app.',
                'request': TimeOffSerializer(time_off).data
            })
        
        elif action == 'reject':
            time_off.status = 'REJECTED'
            time_off.rejection_reason = request.data.get('reason', '')
            time_off.save()
            
            # Send notifications
            from .notifications import (
                EmailNotificationService,
                WhatsAppNotificationService,
                InAppNotificationService
            )
            
            # In-app notification
            InAppNotificationService.notify_leave_rejected(time_off)
            
            # Email notification
            EmailNotificationService.send_leave_rejection_email(time_off)
            
            # WhatsApp notification
            whatsapp_service = WhatsAppNotificationService()
            whatsapp_service.send_leave_rejection_whatsapp(time_off)
            
            return Response({
                'message': 'Time-off request rejected. Employee has been notified via email, WhatsApp, and in-app.',
                'request': TimeOffSerializer(time_off).data
            })
        
        return Response(
            {'error': 'Invalid action. Use "approve" or "reject"'},
            status=status.HTTP_400_BAD_REQUEST
        )


class EmployeeListView(APIView):
    """List all employees in the company (Admin only)"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        employees = User.objects.filter(company=request.user.company).order_by('employee_id')
        data = []
        for emp in employees:
            data.append({
                'id': emp.id,
                'employee_id': emp.employee_id,
                'full_name': emp.get_full_name(),
                'email': emp.email,
                'role': emp.role,
                'department': emp.profile.department if hasattr(emp, 'profile') else 'N/A',
                'job_title': emp.profile.job_title if hasattr(emp, 'profile') else 'N/A',
                'phone': emp.phone,
                'is_active': emp.is_active
            })
        return Response(data)
