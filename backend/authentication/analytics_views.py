"""
Analytics Dashboard APIs
Provides comprehensive analytics data for dashboards
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q, F, FloatField
from django.db.models.functions import TruncDate, TruncMonth
from datetime import date, datetime, timedelta
from calendar import monthrange
from .models import User, Attendance, TimeOff, LeaveAllocation, EmployeeProfile
from .permissions import IsAdmin


class AnalyticsDashboardView(APIView):
    """Comprehensive analytics dashboard for Admin/HR"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        company = request.user.company
        today = date.today()
        current_month = today.month
        current_year = today.year
        
        # Date ranges
        month_start = date(current_year, current_month, 1)
        last_day = monthrange(current_year, current_month)[1]
        month_end = date(current_year, current_month, last_day)
        
        # Last 30 days
        days_30_ago = today - timedelta(days=30)
        
        # ============================================================
        # EMPLOYEE STATISTICS
        # ============================================================
        total_employees = User.objects.filter(company=company, is_active=True).count()
        
        employees_by_role = User.objects.filter(
            company=company,
            is_active=True
        ).values('role').annotate(count=Count('id'))
        
        employees_by_department = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).exclude(department='').values('department').annotate(count=Count('id'))
        
        # ============================================================
        # ATTENDANCE STATISTICS
        # ============================================================
        
        # Today's attendance
        today_attendance = Attendance.objects.filter(
            user__company=company,
            date=today
        ).values('status').annotate(count=Count('id'))
        
        today_stats = {
            'PRESENT': 0,
            'ABSENT': 0,
            'HALF_DAY': 0,
            'LEAVE': 0
        }
        
        for item in today_attendance:
            today_stats[item['status']] = item['count']
        
        # Calculate absent (employees who haven't marked attendance)
        marked_today = sum(today_stats.values())
        today_stats['ABSENT'] = max(0, total_employees - marked_today)
        
        # Current month attendance statistics
        month_attendance = Attendance.objects.filter(
            user__company=company,
            date__gte=month_start,
            date__lte=month_end
        ).aggregate(
            total_present=Count('id', filter=Q(status='PRESENT')),
            total_absent=Count('id', filter=Q(status='ABSENT')),
            total_half_day=Count('id', filter=Q(status='HALF_DAY')),
            total_leave=Count('id', filter=Q(status='LEAVE')),
            avg_work_hours=Avg('work_hours'),
            total_overtime=Sum('extra_hours')
        )
        
        # Attendance trend (last 30 days)
        attendance_trend = Attendance.objects.filter(
            user__company=company,
            date__gte=days_30_ago,
            date__lte=today
        ).values('date').annotate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            half_day=Count('id', filter=Q(status='HALF_DAY')),
            leave=Count('id', filter=Q(status='LEAVE'))
        ).order_by('date')
        
        # Top performers (highest attendance percentage)
        top_performers = []
        employees = User.objects.filter(company=company, is_active=True)[:10]
        
        for emp in employees:
            emp_attendance = Attendance.objects.filter(
                user=emp,
                date__gte=month_start,
                date__lte=month_end
            )
            
            total_days = emp_attendance.count()
            present_days = emp_attendance.filter(status='PRESENT').count()
            
            if total_days > 0:
                percentage = (present_days / total_days) * 100
                top_performers.append({
                    'employee_id': emp.employee_id,
                    'name': emp.get_full_name(),
                    'department': emp.profile.department if hasattr(emp, 'profile') else '',
                    'attendance_percentage': round(percentage, 2),
                    'present_days': present_days,
                    'total_days': total_days
                })
        
        top_performers = sorted(top_performers, key=lambda x: x['attendance_percentage'], reverse=True)[:5]
        
        # ============================================================
        # LEAVE STATISTICS
        # ============================================================
        
        leave_stats = TimeOff.objects.filter(
            user__company=company,
            start_date__year=current_year
        ).aggregate(
            total_requests=Count('id'),
            pending=Count('id', filter=Q(status='PENDING')),
            approved=Count('id', filter=Q(status='APPROVED')),
            rejected=Count('id', filter=Q(status='REJECTED'))
        )
        
        # Leave by type
        leave_by_type = TimeOff.objects.filter(
            user__company=company,
            start_date__year=current_year,
            status='APPROVED'
        ).values('time_off_type').annotate(
            count=Count('id'),
            total_days=Sum('total_days')
        )
        
        # Leave trend (monthly)
        leave_trend = TimeOff.objects.filter(
            user__company=company,
            start_date__year=current_year
        ).annotate(
            month=TruncMonth('start_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # ============================================================
        # PAYROLL STATISTICS
        # ============================================================
        
        payroll_stats = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).aggregate(
            total_monthly_payroll=Sum('monthly_wage'),
            avg_salary=Avg('monthly_wage'),
            total_pf_employee=Sum('pf_employee_contribution'),
            total_pf_employer=Sum('pf_employer_contribution')
        )
        
        # Salary distribution by department
        salary_by_dept = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).exclude(department='').values('department').annotate(
            total_salary=Sum('monthly_wage'),
            avg_salary=Avg('monthly_wage'),
            employee_count=Count('id')
        ).order_by('-total_salary')
        
        # ============================================================
        # RECENT ACTIVITIES
        # ============================================================
        
        recent_leaves = TimeOff.objects.filter(
            user__company=company
        ).select_related('user').order_by('-created_at')[:5]
        
        recent_activities = []
        for leave in recent_leaves:
            recent_activities.append({
                'type': 'leave_request',
                'employee': leave.user.get_full_name(),
                'employee_id': leave.user.employee_id,
                'action': f'{leave.get_status_display()} - {leave.get_time_off_type_display()}',
                'date': leave.created_at.strftime('%Y-%m-%d %H:%M'),
                'status': leave.status
            })
        
        # ============================================================
        # RESPONSE
        # ============================================================
        
        return Response({
            'company': {
                'name': company.name,
                'total_employees': total_employees
            },
            'date_info': {
                'today': today.strftime('%Y-%m-%d'),
                'current_month': current_month,
                'current_year': current_year
            },
            'employees': {
                'total': total_employees,
                'by_role': list(employees_by_role),
                'by_department': list(employees_by_department)
            },
            'attendance': {
                'today': today_stats,
                'current_month': month_attendance,
                'trend_30_days': list(attendance_trend),
                'top_performers': top_performers
            },
            'leave': {
                'statistics': leave_stats,
                'by_type': list(leave_by_type),
                'monthly_trend': [
                    {
                        'month': item['month'].strftime('%Y-%m'),
                        'count': item['count']
                    } for item in leave_trend
                ]
            },
            'payroll': {
                'statistics': {
                    'total_monthly_payroll': float(payroll_stats['total_monthly_payroll'] or 0),
                    'avg_salary': float(payroll_stats['avg_salary'] or 0),
                    'total_pf_employee': float(payroll_stats['total_pf_employee'] or 0),
                    'total_pf_employer': float(payroll_stats['total_pf_employer'] or 0)
                },
                'by_department': [
                    {
                        'department': item['department'],
                        'total_salary': float(item['total_salary']),
                        'avg_salary': float(item['avg_salary']),
                        'employee_count': item['employee_count']
                    } for item in salary_by_dept
                ]
            },
            'recent_activities': recent_activities
        })


class AttendanceTrendAnalyticsView(APIView):
    """Detailed attendance trend analytics"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        company = request.user.company
        days = int(request.query_params.get('days', 30))
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Daily trend
        daily_trend = Attendance.objects.filter(
            user__company=company,
            date__gte=start_date,
            date__lte=end_date
        ).values('date').annotate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            half_day=Count('id', filter=Q(status='HALF_DAY')),
            leave=Count('id', filter=Q(status='LEAVE')),
            total_work_hours=Sum('work_hours'),
            total_overtime=Sum('extra_hours')
        ).order_by('date')
        
        # Department-wise attendance
        dept_attendance = Attendance.objects.filter(
            user__company=company,
            date__gte=start_date,
            date__lte=end_date,
            user__profile__isnull=False
        ).values('user__profile__department').annotate(
            present_count=Count('id', filter=Q(status='PRESENT')),
            total_records=Count('id')
        ).exclude(user__profile__department='')
        
        dept_stats = []
        for item in dept_attendance:
            if item['total_records'] > 0:
                percentage = (item['present_count'] / item['total_records']) * 100
                dept_stats.append({
                    'department': item['user__profile__department'],
                    'attendance_percentage': round(percentage, 2),
                    'present_count': item['present_count'],
                    'total_records': item['total_records']
                })
        
        return Response({
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'days': days
            },
            'daily_trend': list(daily_trend),
            'department_stats': dept_stats
        })


class LeaveAnalyticsView(APIView):
    """Detailed leave analytics"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        company = request.user.company
        year = int(request.query_params.get('year', date.today().year))
        
        # Leave allocation summary
        allocation_summary = LeaveAllocation.objects.filter(
            user__company=company,
            year=year
        ).aggregate(
            total_paid_allocated=Sum('paid_leave_total'),
            total_paid_used=Sum('paid_leave_used'),
            total_sick_allocated=Sum('sick_leave_total'),
            total_sick_used=Sum('sick_leave_used')
        )
        
        # Calculate remaining
        paid_remaining = (allocation_summary['total_paid_allocated'] or 0) - (allocation_summary['total_paid_used'] or 0)
        sick_remaining = (allocation_summary['total_sick_allocated'] or 0) - (allocation_summary['total_sick_used'] or 0)
        
        # Leave requests by month
        monthly_requests = TimeOff.objects.filter(
            user__company=company,
            start_date__year=year
        ).annotate(
            month=TruncMonth('start_date')
        ).values('month', 'status').annotate(
            count=Count('id')
        ).order_by('month', 'status')
        
        # Department-wise leave usage
        dept_leave = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).exclude(department='').values('department').annotate(
            employees=Count('user'),
            total_requests=Count('user__time_off_requests', filter=Q(user__time_off_requests__start_date__year=year)),
            approved_requests=Count('user__time_off_requests', filter=Q(
                user__time_off_requests__start_date__year=year,
                user__time_off_requests__status='APPROVED'
            ))
        )
        
        return Response({
            'year': year,
            'allocation_summary': {
                'paid_leave': {
                    'allocated': allocation_summary['total_paid_allocated'] or 0,
                    'used': allocation_summary['total_paid_used'] or 0,
                    'remaining': paid_remaining
                },
                'sick_leave': {
                    'allocated': allocation_summary['total_sick_allocated'] or 0,
                    'used': allocation_summary['total_sick_used'] or 0,
                    'remaining': sick_remaining
                }
            },
            'monthly_trend': list(monthly_requests),
            'department_usage': list(dept_leave)
        })


class PayrollAnalyticsView(APIView):
    """Payroll analytics and insights"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        company = request.user.company
        
        # Overall statistics
        payroll_stats = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).aggregate(
            total_employees=Count('id'),
            total_monthly_gross=Sum('monthly_wage'),
            avg_salary=Avg('monthly_wage'),
            min_salary=Avg('monthly_wage'),  # Should be Min but using Avg for now
            max_salary=Avg('monthly_wage'),  # Should be Max but using Avg for now
            total_basic=Sum('basic_salary'),
            total_hra=Sum('house_rent_allowance'),
            total_pf_employee=Sum('pf_employee_contribution'),
            total_pf_employer=Sum('pf_employer_contribution')
        )
        
        # Salary distribution (ranges)
        salary_ranges = [
            {'range': '0-25k', 'min': 0, 'max': 25000},
            {'range': '25k-50k', 'min': 25000, 'max': 50000},
            {'range': '50k-75k', 'min': 50000, 'max': 75000},
            {'range': '75k-100k', 'min': 75000, 'max': 100000},
            {'range': '100k+', 'min': 100000, 'max': 9999999}
        ]
        
        salary_distribution = []
        for range_info in salary_ranges:
            count = EmployeeProfile.objects.filter(
                user__company=company,
                user__is_active=True,
                monthly_wage__gte=range_info['min'],
                monthly_wage__lt=range_info['max']
            ).count()
            
            if count > 0:
                salary_distribution.append({
                    'range': range_info['range'],
                    'count': count
                })
        
        # Department-wise payroll
        dept_payroll = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).exclude(department='').values('department').annotate(
            employee_count=Count('id'),
            total_payroll=Sum('monthly_wage'),
            avg_salary=Avg('monthly_wage')
        ).order_by('-total_payroll')
        
        # Role-wise average salary
        role_salary = EmployeeProfile.objects.filter(
            user__company=company,
            user__is_active=True
        ).values('user__role').annotate(
            count=Count('id'),
            avg_salary=Avg('monthly_wage'),
            total_payroll=Sum('monthly_wage')
        )
        
        return Response({
            'overall_statistics': {
                'total_employees': payroll_stats['total_employees'] or 0,
                'total_monthly_gross': float(payroll_stats['total_monthly_gross'] or 0),
                'avg_salary': float(payroll_stats['avg_salary'] or 0),
                'total_basic_salary': float(payroll_stats['total_basic'] or 0),
                'total_hra': float(payroll_stats['total_hra'] or 0),
                'total_pf_employee': float(payroll_stats['total_pf_employee'] or 0),
                'total_pf_employer': float(payroll_stats['total_pf_employer'] or 0),
                'total_employer_cost': float(payroll_stats['total_monthly_gross'] or 0) + float(payroll_stats['total_pf_employer'] or 0)
            },
            'salary_distribution': salary_distribution,
            'department_payroll': [
                {
                    'department': item['department'],
                    'employee_count': item['employee_count'],
                    'total_payroll': float(item['total_payroll']),
                    'avg_salary': float(item['avg_salary'])
                } for item in dept_payroll
            ],
            'role_wise_salary': [
                {
                    'role': item['user__role'],
                    'count': item['count'],
                    'avg_salary': float(item['avg_salary']),
                    'total_payroll': float(item['total_payroll'])
                } for item in role_salary
            ]
        })
