"""
Reporting APIs for HRMS
Attendance reports, Payroll reports with CSV export
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
from .models import User, EmployeeProfile, Attendance, TimeOff, LeaveAllocation
from .profile_serializers import AttendanceSerializer
from .permissions import IsAdmin


class AttendanceReportView(APIView):
    """Generate attendance reports with statistics"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        employee_id = request.query_params.get('employee_id')
        department = request.query_params.get('department')
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = date.today().replace(day=1)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = date.today()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Base query
        attendance_query = Attendance.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).select_related('user', 'user__profile')
        
        # Apply filters
        if employee_id:
            attendance_query = attendance_query.filter(user__employee_id=employee_id)
        if department:
            attendance_query = attendance_query.filter(user__profile__department=department)
        
        # Get all attendance records
        attendance_records = attendance_query.order_by('-date', 'user__employee_id')
        
        # Calculate statistics by employee
        employee_stats = []
        employees = User.objects.filter(
            attendance_records__date__gte=start_date,
            attendance_records__date__lte=end_date
        ).distinct()
        
        if employee_id:
            employees = employees.filter(employee_id=employee_id)
        if department:
            employees = employees.filter(profile__department=department)
        
        for employee in employees:
            emp_attendance = attendance_query.filter(user=employee)
            
            total_days = emp_attendance.count()
            present_days = emp_attendance.filter(status='PRESENT').count()
            absent_days = emp_attendance.filter(status='ABSENT').count()
            half_days = emp_attendance.filter(status='HALF_DAY').count()
            leave_days = emp_attendance.filter(status='LEAVE').count()
            
            total_work_hours = emp_attendance.aggregate(
                total_hours=Sum('work_hours')
            )['total_hours'] or 0
            
            total_extra_hours = emp_attendance.aggregate(
                extra_hours=Sum('extra_hours')
            )['extra_hours'] or 0
            
            # Calculate attendance percentage
            working_days = present_days + half_days + leave_days  # Exclude absents
            attendance_percentage = (working_days / total_days * 100) if total_days > 0 else 0
            
            employee_stats.append({
                'employee_id': employee.employee_id,
                'employee_name': employee.get_full_name(),
                'email': employee.email,
                'department': employee.profile.department if hasattr(employee, 'profile') else '',
                'total_days': total_days,
                'present': present_days,
                'absent': absent_days,
                'half_day': half_days,
                'on_leave': leave_days,
                'total_work_hours': float(total_work_hours),
                'total_extra_hours': float(total_extra_hours),
                'attendance_percentage': round(attendance_percentage, 2)
            })
        
        # Overall statistics
        overall_stats = {
            'total_employees': employees.count(),
            'total_records': attendance_records.count(),
            'total_present': attendance_query.filter(status='PRESENT').count(),
            'total_absent': attendance_query.filter(status='ABSENT').count(),
            'total_half_day': attendance_query.filter(status='HALF_DAY').count(),
            'total_leave': attendance_query.filter(status='LEAVE').count(),
            'average_work_hours': float(attendance_query.aggregate(
                avg_hours=Avg('work_hours')
            )['avg_hours'] or 0),
        }
        
        return Response({
            'report_period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'overall_statistics': overall_stats,
            'employee_statistics': employee_stats,
            'filters': {
                'employee_id': employee_id,
                'department': department
            }
        })


class AttendanceReportCSVView(APIView):
    """Export attendance report to CSV"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        employee_id = request.query_params.get('employee_id')
        department = request.query_params.get('department')
        
        # Default to current month
        if not start_date:
            start_date = date.today().replace(day=1)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = date.today()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Query attendance
        attendance_query = Attendance.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).select_related('user', 'user__profile').order_by('-date', 'user__employee_id')
        
        if employee_id:
            attendance_query = attendance_query.filter(user__employee_id=employee_id)
        if department:
            attendance_query = attendance_query.filter(user__profile__department=department)
        
        # Create CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_report_{start_date}_to_{end_date}.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Employee ID',
            'Employee Name',
            'Email',
            'Department',
            'Date',
            'Check In',
            'Check Out',
            'Work Hours',
            'Extra Hours',
            'Status',
            'Notes'
        ])
        
        # Write data
        for record in attendance_query:
            writer.writerow([
                record.user.employee_id,
                record.user.get_full_name(),
                record.user.email,
                record.user.profile.department if hasattr(record.user, 'profile') else '',
                record.date,
                record.check_in or '',
                record.check_out or '',
                record.work_hours,
                record.extra_hours,
                record.get_status_display(),
                record.notes
            ])
        
        return response


class PayrollReportView(APIView):
    """Generate payroll reports"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Get query parameters
        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)
        employee_id = request.query_params.get('employee_id')
        department = request.query_params.get('department')
        
        # Get all employees with profiles
        employees = User.objects.filter(
            profile__isnull=False
        ).select_related('profile', 'company')
        
        if employee_id:
            employees = employees.filter(employee_id=employee_id)
        if department:
            employees = employees.filter(profile__department=department)
        
        payroll_data = []
        total_payroll_cost = 0
        
        for employee in employees:
            profile = employee.profile
            
            # Get attendance for the month
            attendance_records = Attendance.objects.filter(
                user=employee,
                date__month=month,
                date__year=year
            )
            
            present_days = attendance_records.filter(status='PRESENT').count()
            half_days = attendance_records.filter(status='HALF_DAY').count()
            leave_days = attendance_records.filter(status='LEAVE').count()
            absent_days = attendance_records.filter(status='ABSENT').count()
            
            # Calculate working days (exclude absents from pay)
            working_days = present_days + (half_days * 0.5) + leave_days
            
            # Get working days in month (assuming 22 working days per month)
            total_working_days = 22
            
            # Calculate monthly salary based on attendance
            monthly_wage = float(profile.monthly_wage)
            per_day_salary = monthly_wage / total_working_days
            
            # Calculate gross salary based on working days
            gross_salary = per_day_salary * working_days
            
            # Deductions
            professional_tax = float(profile.professional_tax)
            pf_employee = float(profile.pf_employee_contribution)
            
            # Total deductions
            total_deductions = professional_tax + pf_employee
            
            # Net salary
            net_salary = gross_salary - total_deductions
            
            # Employer costs
            pf_employer = float(profile.pf_employer_contribution)
            total_employer_cost = gross_salary + pf_employer
            
            total_payroll_cost += total_employer_cost
            
            payroll_data.append({
                'employee_id': employee.employee_id,
                'employee_name': employee.get_full_name(),
                'email': employee.email,
                'department': profile.department,
                'job_title': profile.job_title,
                'attendance': {
                    'present_days': present_days,
                    'half_days': half_days,
                    'leave_days': leave_days,
                    'absent_days': absent_days,
                    'working_days': working_days,
                    'total_working_days': total_working_days
                },
                'salary_details': {
                    'monthly_wage': monthly_wage,
                    'per_day_salary': round(per_day_salary, 2),
                    'gross_salary': round(gross_salary, 2),
                    'basic_salary': float(profile.basic_salary),
                    'hra': float(profile.house_rent_allowance),
                    'standard_allowance': float(profile.standard_allowance),
                    'performance_bonus': float(profile.performance_bonus),
                    'lta': float(profile.leave_travel_allowance),
                    'fixed_allowance': float(profile.fixed_allowance)
                },
                'deductions': {
                    'professional_tax': professional_tax,
                    'pf_employee': pf_employee,
                    'total_deductions': total_deductions
                },
                'net_salary': round(net_salary, 2),
                'employer_contribution': {
                    'pf_employer': pf_employer,
                    'total_employer_cost': round(total_employer_cost, 2)
                }
            })
        
        return Response({
            'report_period': {
                'month': int(month),
                'year': int(year)
            },
            'summary': {
                'total_employees': employees.count(),
                'total_payroll_cost': round(total_payroll_cost, 2)
            },
            'payroll_data': payroll_data,
            'filters': {
                'employee_id': employee_id,
                'department': department
            }
        })


class PayrollReportCSVView(APIView):
    """Export payroll report to CSV"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Get query parameters
        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)
        employee_id = request.query_params.get('employee_id')
        department = request.query_params.get('department')
        
        # Get all employees with profiles
        employees = User.objects.filter(
            profile__isnull=False
        ).select_related('profile')
        
        if employee_id:
            employees = employees.filter(employee_id=employee_id)
        if department:
            employees = employees.filter(profile__department=department)
        
        # Create CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="payroll_report_{month}_{year}.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Employee ID',
            'Employee Name',
            'Email',
            'Department',
            'Job Title',
            'Present Days',
            'Half Days',
            'Leave Days',
            'Absent Days',
            'Working Days',
            'Monthly Wage',
            'Gross Salary',
            'Basic Salary',
            'HRA',
            'Standard Allowance',
            'Performance Bonus',
            'LTA',
            'Fixed Allowance',
            'Professional Tax',
            'PF Employee',
            'Total Deductions',
            'Net Salary',
            'PF Employer',
            'Total Employer Cost'
        ])
        
        # Write data
        for employee in employees:
            profile = employee.profile
            
            # Get attendance
            attendance_records = Attendance.objects.filter(
                user=employee,
                date__month=month,
                date__year=year
            )
            
            present_days = attendance_records.filter(status='PRESENT').count()
            half_days = attendance_records.filter(status='HALF_DAY').count()
            leave_days = attendance_records.filter(status='LEAVE').count()
            absent_days = attendance_records.filter(status='ABSENT').count()
            working_days = present_days + (half_days * 0.5) + leave_days
            
            # Calculate salary
            monthly_wage = float(profile.monthly_wage)
            per_day_salary = monthly_wage / 22
            gross_salary = per_day_salary * working_days
            
            professional_tax = float(profile.professional_tax)
            pf_employee = float(profile.pf_employee_contribution)
            total_deductions = professional_tax + pf_employee
            net_salary = gross_salary - total_deductions
            
            pf_employer = float(profile.pf_employer_contribution)
            total_employer_cost = gross_salary + pf_employer
            
            writer.writerow([
                employee.employee_id,
                employee.get_full_name(),
                employee.email,
                profile.department,
                profile.job_title,
                present_days,
                half_days,
                leave_days,
                absent_days,
                round(working_days, 1),
                round(monthly_wage, 2),
                round(gross_salary, 2),
                float(profile.basic_salary),
                float(profile.house_rent_allowance),
                float(profile.standard_allowance),
                float(profile.performance_bonus),
                float(profile.leave_travel_allowance),
                float(profile.fixed_allowance),
                professional_tax,
                pf_employee,
                total_deductions,
                round(net_salary, 2),
                pf_employer,
                round(total_employer_cost, 2)
            ])
        
        return response


class LeaveReportView(APIView):
    """Generate leave/time-off reports"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Get query parameters
        year = request.query_params.get('year', date.today().year)
        employee_id = request.query_params.get('employee_id')
        status = request.query_params.get('status')  # PENDING, APPROVED, REJECTED
        
        # Get all employees with leave allocations
        employees = User.objects.filter(
            leave_allocations__year=year
        ).select_related('profile').distinct()
        
        if employee_id:
            employees = employees.filter(employee_id=employee_id)
        
        leave_report = []
        
        for employee in employees:
            # Get leave allocation
            allocation = LeaveAllocation.objects.filter(
                user=employee,
                year=year
            ).first()
            
            if not allocation:
                continue
            
            # Get time-off requests
            timeoff_query = TimeOff.objects.filter(
                user=employee,
                start_date__year=year
            )
            
            if status:
                timeoff_query = timeoff_query.filter(status=status)
            
            # Calculate leave statistics
            total_paid_requests = timeoff_query.filter(time_off_type='PAID').count()
            total_sick_requests = timeoff_query.filter(time_off_type='SICK').count()
            total_unpaid_requests = timeoff_query.filter(time_off_type='UNPAID').count()
            
            approved_paid = timeoff_query.filter(
                time_off_type='PAID', status='APPROVED'
            ).aggregate(total=Sum('total_days'))['total'] or 0
            
            approved_sick = timeoff_query.filter(
                time_off_type='SICK', status='APPROVED'
            ).aggregate(total=Sum('total_days'))['total'] or 0
            
            pending_requests = timeoff_query.filter(status='PENDING').count()
            
            leave_report.append({
                'employee_id': employee.employee_id,
                'employee_name': employee.get_full_name(),
                'email': employee.email,
                'department': employee.profile.department if hasattr(employee, 'profile') else '',
                'leave_allocation': {
                    'paid_leave_total': allocation.paid_leave_total,
                    'paid_leave_used': allocation.paid_leave_used,
                    'paid_leave_available': allocation.paid_leave_available,
                    'sick_leave_total': allocation.sick_leave_total,
                    'sick_leave_used': allocation.sick_leave_used,
                    'sick_leave_available': allocation.sick_leave_available
                },
                'leave_requests': {
                    'total_paid_requests': total_paid_requests,
                    'total_sick_requests': total_sick_requests,
                    'total_unpaid_requests': total_unpaid_requests,
                    'approved_paid_days': int(approved_paid),
                    'approved_sick_days': int(approved_sick),
                    'pending_requests': pending_requests
                }
            })
        
        return Response({
            'report_year': int(year),
            'total_employees': len(leave_report),
            'leave_report': leave_report,
            'filters': {
                'employee_id': employee_id,
                'status': status
            }
        })


class LeaveReportCSVView(APIView):
    """Export leave report to CSV"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        year = request.query_params.get('year', date.today().year)
        employee_id = request.query_params.get('employee_id')
        
        employees = User.objects.filter(
            leave_allocations__year=year
        ).select_related('profile').distinct()
        
        if employee_id:
            employees = employees.filter(employee_id=employee_id)
        
        # Create CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="leave_report_{year}.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Employee ID',
            'Employee Name',
            'Email',
            'Department',
            'Paid Leave Total',
            'Paid Leave Used',
            'Paid Leave Available',
            'Sick Leave Total',
            'Sick Leave Used',
            'Sick Leave Available',
            'Total Requests',
            'Pending Requests',
            'Approved Requests'
        ])
        
        # Write data
        for employee in employees:
            allocation = LeaveAllocation.objects.filter(user=employee, year=year).first()
            if not allocation:
                continue
            
            timeoff_query = TimeOff.objects.filter(user=employee, start_date__year=year)
            total_requests = timeoff_query.count()
            pending_requests = timeoff_query.filter(status='PENDING').count()
            approved_requests = timeoff_query.filter(status='APPROVED').count()
            
            writer.writerow([
                employee.employee_id,
                employee.get_full_name(),
                employee.email,
                employee.profile.department if hasattr(employee, 'profile') else '',
                allocation.paid_leave_total,
                allocation.paid_leave_used,
                allocation.paid_leave_available,
                allocation.sick_leave_total,
                allocation.sick_leave_used,
                allocation.sick_leave_available,
                total_requests,
                pending_requests,
                approved_requests
            ])
        
        return response
