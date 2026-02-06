"""
Enhanced Reporting APIs for HRMS with real-time analytics
"""
import csv
from io import StringIO
from django.http import HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q, F
from datetime import date, datetime, timedelta
from collections import defaultdict
from .models import User, EmployeeProfile, Attendance, TimeOff, LeaveAllocation
from .profile_serializers import AttendanceSerializer
from .permissions import IsAdmin
import calendar


class AttendanceReportView(APIView):
    """Generate comprehensive attendance reports with real-time analytics"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        # Calculate date range
        start_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        
        # Get all employees
        all_employees = User.objects.filter(is_active=True).select_related('profile')
        total_employees = all_employees.count()
        
        # Get attendance records for the month
        attendance_records = Attendance.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).select_related('user', 'user__profile')
        
        # Calculate summary statistics
        present_count = attendance_records.filter(status='PRESENT').count()
        absent_count = attendance_records.filter(status='ABSENT').count()
        leave_count = attendance_records.filter(status='LEAVE').count()
        half_day_count = attendance_records.filter(status='HALF_DAY').count()
        
        avg_work_hours = attendance_records.aggregate(
            avg=Avg('work_hours')
        )['avg'] or 0
        
        # Daily trend data
        daily_trend = []
        current_date = start_date
        while current_date <= min(end_date, date.today()):
            day_records = attendance_records.filter(date=current_date)
            daily_trend.append({
                'date': current_date.isoformat(),
                'present': day_records.filter(status='PRESENT').count(),
                'absent': day_records.filter(status='ABSENT').count(),
                'leave': day_records.filter(status='LEAVE').count(),
                'half_day': day_records.filter(status='HALF_DAY').count()
            })
            current_date += timedelta(days=1)
        
        # Department-wise statistics
        department_stats = {}
        for emp in all_employees:
            dept = emp.profile.department if hasattr(emp, 'profile') and emp.profile.department else 'Unknown'
            if dept not in department_stats:
                department_stats[dept] = {'total': 0, 'present': 0}
            department_stats[dept]['total'] += 1
            
            # Count present days for this employee
            emp_present = attendance_records.filter(
                user=emp,
                status='PRESENT'
            ).count()
            if emp_present > 0:
                department_stats[dept]['present'] += 1
        
        # Calculate percentages
        for dept in department_stats:
            total = department_stats[dept]['total']
            present = department_stats[dept]['present']
            department_stats[dept]['present_percentage'] = round(
                (present / total * 100) if total > 0 else 0, 1
            )
        
        # Top performers (by attendance percentage and work hours)
        top_performers = []
        for emp in all_employees:
            emp_records = attendance_records.filter(user=emp)
            total_days = emp_records.count()
            if total_days == 0:
                continue
            
            present_days = emp_records.filter(status='PRESENT').count()
            attendance_percentage = round((present_days / total_days * 100), 1)
            
            avg_hours = emp_records.aggregate(avg=Avg('work_hours'))['avg'] or 0
            
            top_performers.append({
                'name': emp.get_full_name(),
                'department': emp.profile.department if hasattr(emp, 'profile') else 'Unknown',
                'attendance_percentage': attendance_percentage,
                'avg_hours': round(avg_hours, 1)
            })
        
        # Sort by attendance percentage and limit to top 5
        top_performers.sort(key=lambda x: (x['attendance_percentage'], x['avg_hours']), reverse=True)
        top_performers = top_performers[:5]
        
        return Response({
            'summary': {
                'total_employees': total_employees,
                'present': present_count,
                'absent': absent_count,
                'leave': leave_count,
                'half_day': half_day_count,
                'avg_work_hours': round(avg_work_hours, 2)
            },
            'daily_trend': daily_trend,
            'department_stats': department_stats,
            'top_performers': top_performers
        })


class LeaveReportView(APIView):
    """Generate comprehensive leave reports"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))
        
        # Get all leave requests for the year
        leave_requests = TimeOff.objects.filter(
            start_date__year=year
        ).select_related('user', 'user__profile')
        
        # Summary statistics
        total_requests = leave_requests.count()
        approved = leave_requests.filter(status='APPROVED').count()
        rejected = leave_requests.filter(status='REJECTED').count()
        pending = leave_requests.filter(status='PENDING').count()
        
        # Leave type breakdown
        leave_type_breakdown = {
            'Paid Leave': leave_requests.filter(time_off_type='PAID').count(),
            'Sick Leave': leave_requests.filter(time_off_type='SICK').count(),
            'Unpaid Leave': leave_requests.filter(time_off_type='UNPAID').count(),
            'Casual Leave': leave_requests.filter(time_off_type='CASUAL').count()
        }
        
        return Response({
            'summary': {
                'total_requests': total_requests,
                'approved': approved,
                'rejected': rejected,
                'pending': pending
            },
            'leave_type_breakdown': leave_type_breakdown
        })


class PayrollReportView(APIView):
    """Generate comprehensive payroll reports"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        # Get all employees with profiles
        employees = User.objects.filter(
            profile__isnull=False,
            is_active=True
        ).select_related('profile')
        
        total_payout = 0
        total_basic = 0
        total_hra = 0
        total_allowances = 0
        total_deductions = 0
        department_payroll = defaultdict(lambda: {'total': 0, 'count': 0})
        
        for emp in employees:
            profile = emp.profile
            
            # Get attendance for the month
            attendance_records = Attendance.objects.filter(
                user=emp,
                date__month=month,
                date__year=year
            )
            
            present_days = attendance_records.filter(status='PRESENT').count()
            half_days = attendance_records.filter(status='HALF_DAY').count()
            leave_days = attendance_records.filter(status='LEAVE').count()
            
            # Calculate working days
            working_days = present_days + (half_days * 0.5) + leave_days
            total_working_days = 22  # Standard working days per month
            
            # Calculate salary
            monthly_wage = float(profile.monthly_wage)
            per_day_salary = monthly_wage / total_working_days
            gross_salary = per_day_salary * working_days
            
            # Deductions
            professional_tax = float(profile.professional_tax)
            pf_employee = float(profile.pf_employee_contribution)
            deductions = professional_tax + pf_employee
            
            # Net salary
            net_salary = gross_salary - deductions
            
            # Accumulate totals
            total_payout += gross_salary
            total_basic += float(profile.basic_salary) * (working_days / total_working_days)
            total_hra += float(profile.house_rent_allowance) * (working_days / total_working_days)
            total_allowances += (
                float(profile.standard_allowance) + 
                float(profile.fixed_allowance)
            ) * (working_days / total_working_days)
            total_deductions += deductions
            
            # Department-wise payroll
            dept = profile.department or 'Unknown'
            department_payroll[dept]['total'] += gross_salary
            department_payroll[dept]['count'] += 1
        
        # Calculate averages
        processed_count = employees.count()
        avg_salary = total_payout / processed_count if processed_count > 0 else 0
        
        return Response({
            'summary': {
                'total_payout': round(total_payout, 2),
                'avg_salary': round(avg_salary, 2),
                'processed_count': processed_count
            },
            'distribution': {
                'basic_salary': round(total_basic, 2),
                'hra': round(total_hra, 2),
                'allowances': round(total_allowances, 2),
                'deductions': round(total_deductions, 2)
            },
            'department_payroll': dict(department_payroll)
        })


class AttendanceReportCSVView(APIView):
    """Export attendance report to CSV"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        start_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        
        attendance_records = Attendance.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).select_related('user', 'user__profile').order_by('-date', 'user__employee_id')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_report_{month}_{year}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Employee ID', 'Employee Name', 'Email', 'Department', 'Date',
            'Check In', 'Check In Location', 'Check Out', 'Check Out Location',
            'Work Hours', 'Extra Hours', 'Status', 'Notes'
        ])
        
        for record in attendance_records:
            writer.writerow([
                record.user.employee_id,
                record.user.get_full_name(),
                record.user.email,
                record.user.profile.department if hasattr(record.user, 'profile') else '',
                record.date,
                record.check_in or '',
                record.check_in_location or '',
                record.check_out or '',
                record.check_out_location or '',
                record.work_hours,
                record.extra_hours,
                record.get_status_display(),
                record.notes
            ])
        
        return response


class LeaveReportCSVView(APIView):
    """Export leave report to CSV"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))
        
        leave_requests = TimeOff.objects.filter(
            start_date__year=year
        ).select_related('user', 'user__profile').order_by('-created_at')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="leave_report_{year}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Employee ID', 'Employee Name', 'Email', 'Department',
            'Leave Type', 'Start Date', 'End Date', 'Total Days',
            'Status', 'Reason', 'Created At'
        ])
        
        for leave in leave_requests:
            writer.writerow([
                leave.user.employee_id,
                leave.user.get_full_name(),
                leave.user.email,
                leave.user.profile.department if hasattr(leave.user, 'profile') else '',
                leave.get_time_off_type_display(),
                leave.start_date,
                leave.end_date,
                leave.total_days,
                leave.get_status_display(),
                leave.reason,
                leave.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response


class PayrollReportCSVView(APIView):
    """Export payroll report to CSV"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        employees = User.objects.filter(
            profile__isnull=False,
            is_active=True
        ).select_related('profile')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="payroll_report_{month}_{year}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Employee ID', 'Employee Name', 'Email', 'Department', 'Job Title',
            'Present Days', 'Half Days', 'Leave Days', 'Working Days',
            'Monthly Wage', 'Gross Salary', 'Basic Salary', 'HRA',
            'Allowances', 'Professional Tax', 'PF Employee',
            'Total Deductions', 'Net Salary'
        ])
        
        for emp in employees:
            profile = emp.profile
            attendance_records = Attendance.objects.filter(
                user=emp,
                date__month=month,
                date__year=year
            )
            
            present_days = attendance_records.filter(status='PRESENT').count()
            half_days = attendance_records.filter(status='HALF_DAY').count()
            leave_days = attendance_records.filter(status='LEAVE').count()
            working_days = present_days + (half_days * 0.5) + leave_days
            
            monthly_wage = float(profile.monthly_wage)
            per_day_salary = monthly_wage / 22
            gross_salary = per_day_salary * working_days
            
            professional_tax = float(profile.professional_tax)
            pf_employee = float(profile.pf_employee_contribution)
            total_deductions = professional_tax + pf_employee
            net_salary = gross_salary - total_deductions
            
            writer.writerow([
                emp.employee_id,
                emp.get_full_name(),
                emp.email,
                profile.department,
                profile.job_title,
                present_days,
                half_days,
                leave_days,
                round(working_days, 1),
                round(monthly_wage, 2),
                round(gross_salary, 2),
                float(profile.basic_salary),
                float(profile.house_rent_allowance),
                float(profile.standard_allowance) + float(profile.fixed_allowance),
                professional_tax,
                pf_employee,
                total_deductions,
                round(net_salary, 2)
            ])
        
        return response
