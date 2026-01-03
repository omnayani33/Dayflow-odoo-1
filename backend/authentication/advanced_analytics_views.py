"""
Advanced Analytics Views - Unique Features for Hackathon
Includes: Predictive Analytics, Anomaly Detection, Performance Scoring, Trend Forecasting
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Sum, Q, F, FloatField
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek, ExtractWeekDay
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

from .models import User, EmployeeProfile, Attendance, TimeOff, LeaveAllocation
from .permissions import IsAdminOrHR


class PredictiveAnalyticsView(APIView):
    """
    AI-Powered Predictive Analytics
    - Forecast leave demand for next month
    - Predict attendance patterns
    - Identify burnout risks
    - Forecast workforce availability
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def get(self, request):
        # Get historical data for predictions
        today = datetime.now().date()
        last_90_days = today - timedelta(days=90)
        last_30_days = today - timedelta(days=30)
        
        # 1. LEAVE DEMAND PREDICTION
        # Analyze historical leave patterns by month
        leave_by_month = TimeOff.objects.filter(
            start_date__gte=last_90_days,
            status='APPROVED'
        ).annotate(
            month=TruncMonth('start_date')
        ).values('month').annotate(
            count=Count('id'),
            total_days=Sum(F('end_date') - F('start_date'))
        ).order_by('month')
        
        # Calculate trend and predict next month
        if leave_by_month:
            leave_counts = [item['count'] for item in leave_by_month]
            avg_monthly_leaves = statistics.mean(leave_counts)
            
            # Simple linear trend
            if len(leave_counts) >= 2:
                trend = (leave_counts[-1] - leave_counts[0]) / len(leave_counts)
                predicted_next_month = max(0, int(leave_counts[-1] + trend))
            else:
                predicted_next_month = int(avg_monthly_leaves)
        else:
            predicted_next_month = 0
            avg_monthly_leaves = 0
            leave_counts = []
        
        # 2. ATTENDANCE PREDICTION
        # Analyze weekly attendance patterns
        weekly_attendance = Attendance.objects.filter(
            date__gte=last_90_days
        ).annotate(
            week=TruncWeek('date')
        ).values('week').annotate(
            present_count=Count('id')
        ).order_by('week')
        
        total_employees = EmployeeProfile.objects.filter(user__is_active=True).count()
        
        if weekly_attendance:
            attendance_rates = [
                (item['present_count'] / total_employees * 100) if total_employees > 0 else 0
                for item in weekly_attendance
            ]
            predicted_attendance_rate = statistics.mean(attendance_rates[-4:]) if len(attendance_rates) >= 4 else (statistics.mean(attendance_rates) if attendance_rates else 95.0)
        else:
            predicted_attendance_rate = 95.0
        
        # 3. BURNOUT RISK DETECTION
        # Identify employees with excessive hours or no leaves
        burnout_risks = []
        employees = EmployeeProfile.objects.filter(user__is_active=True).select_related('user')
        
        for emp in employees:
            # Calculate total work hours in last 30 days
            recent_attendance = Attendance.objects.filter(
                user=emp.user,
                date__gte=last_30_days,
                check_out__isnull=False
            )
            
            total_hours = 0
            for att in recent_attendance:
                if att.check_in and att.check_out:
                    # Convert TimeFields to comparable format
                    from datetime import datetime, timedelta
                    today_date = datetime.now().date()
                    check_in_dt = datetime.combine(today_date, att.check_in)
                    check_out_dt = datetime.combine(today_date, att.check_out)
                    if check_out_dt < check_in_dt:
                        check_out_dt += timedelta(days=1)
                    duration = check_out_dt - check_in_dt
                    total_hours += duration.total_seconds() / 3600
            
            # Check if employee took any leave
            recent_leaves = TimeOff.objects.filter(
                user=emp.user,
                start_date__gte=last_90_days,
                status='APPROVED'
            ).count()
            
            # Calculate work days
            work_days = recent_attendance.count()
            
            # Burnout risk criteria
            avg_hours_per_day = total_hours / work_days if work_days > 0 else 0
            risk_score = 0
            risk_factors = []
            
            if avg_hours_per_day > 10:
                risk_score += 40
                risk_factors.append("Long working hours")
            
            if recent_leaves == 0:
                risk_score += 30
                risk_factors.append("No leave taken in 90 days")
            
            if work_days > 25:  # Working more than 25 days in last 30
                risk_score += 30
                risk_factors.append("Minimal rest days")
            
            if risk_score >= 50:
                burnout_risks.append({
                    "employee_id": emp.user.id,
                    "employee_name": f"{emp.user.first_name} {emp.user.last_name}",
                    "email": emp.user.email,
                    "department": emp.department or "Not Set",
                    "risk_score": risk_score,
                    "risk_level": "HIGH" if risk_score >= 70 else "MEDIUM",
                    "risk_factors": risk_factors,
                    "avg_hours_per_day": round(avg_hours_per_day, 1),
                    "days_since_last_leave": (today - emp.user.timeoff_requests.filter(
                        status='APPROVED'
                    ).order_by('-end_date').first().end_date).days if emp.user.timeoff_requests.filter(
                        status='APPROVED'
                    ).exists() else "Never"
                })
        
        # 4. WORKFORCE AVAILABILITY FORECAST
        # Predict how many employees will be available next week
        next_week_leaves = TimeOff.objects.filter(
            start_date__lte=today + timedelta(days=7),
            end_date__gte=today,
            status='APPROVED'
        ).count()
        
        predicted_available = total_employees - next_week_leaves
        availability_percentage = (predicted_available / total_employees * 100) if total_employees > 0 else 100
        
        # 5. SEASONAL TRENDS
        # Identify peak leave periods
        leave_by_weekday = TimeOff.objects.filter(
            start_date__gte=last_90_days,
            status='APPROVED'
        ).annotate(
            weekday=ExtractWeekDay('start_date')
        ).values('weekday').annotate(
            count=Count('id')
        ).order_by('weekday')
        
        weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        peak_leave_days = [
            {
                "day": weekday_names[item['weekday'] - 1],
                "leave_count": item['count']
            }
            for item in leave_by_weekday
        ]
        
        return Response({
            "predictions": {
                "next_month_leave_requests": predicted_next_month,
                "confidence": "MEDIUM" if len(leave_counts) >= 3 else "LOW",
                "predicted_attendance_rate": round(predicted_attendance_rate, 1),
                "workforce_availability_next_week": {
                    "available_employees": predicted_available,
                    "total_employees": total_employees,
                    "availability_percentage": round(availability_percentage, 1),
                    "employees_on_leave": next_week_leaves
                }
            },
            "burnout_analysis": {
                "total_at_risk": len(burnout_risks),
                "high_risk_count": len([r for r in burnout_risks if r['risk_level'] == 'HIGH']),
                "employees": sorted(burnout_risks, key=lambda x: x['risk_score'], reverse=True)
            },
            "seasonal_trends": {
                "peak_leave_days": sorted(peak_leave_days, key=lambda x: x['leave_count'], reverse=True)
            },
            "insights": self._generate_insights(predicted_next_month, predicted_attendance_rate, len(burnout_risks))
        })
    
    def _generate_insights(self, leave_prediction, attendance_rate, burnout_count):
        insights = []
        
        if leave_prediction > 15:
            insights.append({
                "type": "WARNING",
                "category": "Workforce Planning",
                "message": f"High leave demand expected ({leave_prediction} requests). Consider hiring temporary staff.",
                "priority": "HIGH"
            })
        
        if attendance_rate < 90:
            insights.append({
                "type": "WARNING",
                "category": "Attendance",
                "message": f"Low attendance rate predicted ({attendance_rate}%). Review attendance policies.",
                "priority": "MEDIUM"
            })
        
        if burnout_count > 0:
            insights.append({
                "type": "ALERT",
                "category": "Employee Wellbeing",
                "message": f"{burnout_count} employees showing burnout risk. Immediate intervention recommended.",
                "priority": "HIGH"
            })
        
        if not insights:
            insights.append({
                "type": "SUCCESS",
                "category": "Overall Health",
                "message": "Workforce metrics are healthy. Continue current practices.",
                "priority": "LOW"
            })
        
        return insights


class AnomalyDetectionView(APIView):
    """
    Detect Unusual Patterns and Anomalies
    - Identify suspicious attendance patterns
    - Detect leave abuse
    - Find time theft indicators
    - Spot productivity anomalies
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def get(self, request):
        today = datetime.now().date()
        last_30_days = today - timedelta(days=30)
        
        anomalies = {
            "attendance_anomalies": [],
            "leave_anomalies": [],
            "productivity_anomalies": [],
            "policy_violations": []
        }
        
        # 1. ATTENDANCE ANOMALIES
        employees = EmployeeProfile.objects.filter(user__is_active=True).select_related('user')
        
        for emp in employees:
            recent_attendance = Attendance.objects.filter(
                user=emp.user,
                date__gte=last_30_days
            ).order_by('date')
            
            # Pattern: Always checking in late
            late_checkins = 0
            very_early_checkins = 0
            unusual_checkout_times = 0
            same_time_checkins = defaultdict(int)
            
            for att in recent_attendance:
                if not att.check_in:
                    continue
                checkin_time = att.check_in
                
                # Late check-ins (after 9:30 AM)
                if checkin_time.hour > 9 or (checkin_time.hour == 9 and checkin_time.minute > 30):
                    late_checkins += 1
                
                # Suspiciously early (before 6 AM)
                if checkin_time.hour < 6:
                    very_early_checkins += 1
                
                # Same time every day (within 2 minutes) - suspicious
                time_key = f"{checkin_time.hour}:{checkin_time.minute // 2}"
                same_time_checkins[time_key] += 1
                
                # Check-out anomalies
                if att.check_out:
                    checkout_time = att.check_out.time()
                    # Leaving too early (before 4 PM) or too late (after 11 PM)
                    if checkout_time.hour < 16 or checkout_time.hour >= 23:
                        unusual_checkout_times += 1
            
            total_days = recent_attendance.count()
            
            # Detect patterns
            if total_days > 0:
                if late_checkins / total_days > 0.7:
                    anomalies["attendance_anomalies"].append({
                        "employee": f"{emp.user.first_name} {emp.user.last_name}",
                        "email": emp.user.email,
                        "anomaly_type": "Chronic Late Check-ins",
                        "severity": "MEDIUM",
                        "details": f"{late_checkins} out of {total_days} days",
                        "recommendation": "Discuss flexible work hours or address punctuality"
                    })
                
                if very_early_checkins > 5:
                    anomalies["attendance_anomalies"].append({
                        "employee": f"{emp.user.first_name} {emp.user.last_name}",
                        "email": emp.user.email,
                        "anomaly_type": "Unusual Early Check-ins",
                        "severity": "LOW",
                        "details": f"{very_early_checkins} check-ins before 6 AM",
                        "recommendation": "Verify if legitimate or potential time fraud"
                    })
                
                # Check if too many same-time check-ins (possible buddy punching)
                for time_key, count in same_time_checkins.items():
                    if count > 10 and count / total_days > 0.5:
                        anomalies["attendance_anomalies"].append({
                            "employee": f"{emp.user.first_name} {emp.user.last_name}",
                            "email": emp.user.email,
                            "anomaly_type": "Repetitive Check-in Time Pattern",
                            "severity": "HIGH",
                            "details": f"Same check-in time ({count} times)",
                            "recommendation": "Investigate for buddy punching or automated check-ins"
                        })
                        break
        
        # 2. LEAVE ANOMALIES
        for emp in employees:
            # Check for suspicious leave patterns
            recent_leaves = TimeOff.objects.filter(
                user=emp.user,
                start_date__gte=last_30_days
            ).order_by('start_date')
            
            # Pattern: Always requesting leave on Mondays/Fridays
            monday_friday_leaves = 0
            for leave in recent_leaves:
                if leave.start_date.weekday() in [0, 4]:  # Monday or Friday
                    monday_friday_leaves += 1
            
            if monday_friday_leaves >= 3:
                anomalies["leave_anomalies"].append({
                    "employee": f"{emp.user.first_name} {emp.user.last_name}",
                    "email": emp.user.email,
                    "anomaly_type": "Weekend Extension Pattern",
                    "severity": "MEDIUM",
                    "details": f"{monday_friday_leaves} leaves on Mon/Fri in last 30 days",
                    "recommendation": "Discuss leave planning and weekend extension policy"
                })
            
            # Check for excessive sick leave
            sick_leaves = recent_leaves.filter(leave_type='SICK').count()
            if sick_leaves > 4:
                anomalies["leave_anomalies"].append({
                    "employee": f"{emp.user.first_name} {emp.user.last_name}",
                    "email": emp.user.email,
                    "anomaly_type": "Excessive Sick Leave",
                    "severity": "HIGH",
                    "details": f"{sick_leaves} sick leaves in 30 days",
                    "recommendation": "Wellness check or medical certificate verification"
                })
        
        # 3. PRODUCTIVITY ANOMALIES
        for emp in employees:
            # Calculate average work hours
            recent_attendance = Attendance.objects.filter(
                user=emp.user,
                date__gte=last_30_days,
                check_out__isnull=False
            )
            
            if recent_attendance.exists():
                total_hours = 0
                for att in recent_attendance:
                    if att.check_in and att.check_out:
                        from datetime import datetime as dt, timedelta as td
                        today_d = dt.now().date()
                        ci_dt = dt.combine(today_d, att.check_in)
                        co_dt = dt.combine(today_d, att.check_out)
                        if co_dt < ci_dt:
                            co_dt += td(days=1)
                        duration = co_dt - ci_dt
                        total_hours += duration.total_seconds() / 3600
                
                avg_hours = total_hours / recent_attendance.count() if recent_attendance.count() > 0 else 0
                
                # Very low working hours
                if avg_hours < 6:
                    anomalies["productivity_anomalies"].append({
                        "employee": f"{emp.user.first_name} {emp.user.last_name}",
                        "email": emp.user.email,
                        "anomaly_type": "Low Working Hours",
                        "severity": "HIGH",
                        "details": f"Average {avg_hours:.1f} hours/day",
                        "recommendation": "Investigate workload distribution or time management"
                    })
                
                # Extremely high hours (potential burnout)
                if avg_hours > 12:
                    anomalies["productivity_anomalies"].append({
                        "employee": f"{emp.user.first_name} {emp.user.last_name}",
                        "email": emp.user.email,
                        "anomaly_type": "Excessive Working Hours",
                        "severity": "HIGH",
                        "details": f"Average {avg_hours:.1f} hours/day",
                        "recommendation": "Enforce work-life balance policies"
                    })
        
        # 4. POLICY VIOLATIONS
        # Check for unapproved absences
        all_dates_last_30 = [last_30_days + timedelta(days=x) for x in range(30)]
        for emp in employees:
            attendance_dates = set(
                Attendance.objects.filter(
                    employee=emp,
                    check_in__date__gte=last_30_days
                ).values_list('check_in__date', flat=True)
            )
            
            approved_leave_dates = set()
            for leave in TimeOff.objects.filter(
                employee=emp,
                status='APPROVED',
                start_date__lte=today,
                end_date__gte=last_30_days
            ):
                current_date = max(leave.start_date, last_30_days)
                while current_date <= min(leave.end_date, today):
                    approved_leave_dates.add(current_date)
                    current_date += timedelta(days=1)
            
            # Find missing days (not weekends)
            missing_days = 0
            for date in all_dates_last_30:
                if date.weekday() < 5:  # Weekday
                    if date not in attendance_dates and date not in approved_leave_dates and date <= today:
                        missing_days += 1
            
            if missing_days > 3:
                anomalies["policy_violations"].append({
                    "employee": f"{emp.user.first_name} {emp.user.last_name}",
                    "email": emp.user.email,
                    "violation_type": "Unapproved Absences",
                    "severity": "HIGH",
                    "details": f"{missing_days} days without attendance or approved leave",
                    "recommendation": "Immediate follow-up required"
                })
        
        # Calculate summary statistics
        summary = {
            "total_anomalies": (
                len(anomalies["attendance_anomalies"]) +
                len(anomalies["leave_anomalies"]) +
                len(anomalies["productivity_anomalies"]) +
                len(anomalies["policy_violations"])
            ),
            "high_severity": sum(
                1 for category in anomalies.values()
                for item in category
                if isinstance(item, dict) and item.get("severity") == "HIGH"
            ),
            "requires_immediate_action": [
                item for category in anomalies.values()
                for item in category
                if isinstance(item, dict) and item.get("severity") == "HIGH"
            ][:5]  # Top 5
        }
        
        return Response({
            "summary": summary,
            "anomalies": anomalies,
            "scan_period": "Last 30 days",
            "scan_date": today.isoformat()
        })


class PerformanceScoreView(APIView):
    """
    Calculate Performance Scores for Employees
    - Attendance score
    - Punctuality score
    - Work hours score
    - Overall performance rating
    - Comparative rankings
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def get(self, request):
        today = datetime.now().date()
        last_90_days = today - timedelta(days=90)
        
        performance_data = []
        employees = EmployeeProfile.objects.filter(user__is_active=True).select_related('user')
        
        for emp in employees:
            scores = self._calculate_employee_score(emp, last_90_days, today)
            performance_data.append(scores)
        
        # Sort by overall score
        performance_data.sort(key=lambda x: x['overall_score'], reverse=True)
        
        # Add rankings
        for idx, emp_data in enumerate(performance_data):
            emp_data['rank'] = idx + 1
            emp_data['percentile'] = round((len(performance_data) - idx) / len(performance_data) * 100, 1)
        
        # Department-wise analysis
        dept_scores = defaultdict(list)
        for emp_data in performance_data:
            dept = emp_data['department']
            dept_scores[dept].append(emp_data['overall_score'])
        
        department_analysis = [
            {
                "department": dept,
                "average_score": round(statistics.mean(scores), 1),
                "employee_count": len(scores),
                "top_performers": len([s for s in scores if s >= 85])
            }
            for dept, scores in dept_scores.items()
        ]
        
        return Response({
            "employee_scores": performance_data,
            "department_analysis": sorted(department_analysis, key=lambda x: x['average_score'], reverse=True),
            "top_performers": performance_data[:10],
            "needs_improvement": [emp for emp in performance_data if emp['overall_score'] < 60]
        })
    
    def _calculate_employee_score(self, emp, start_date, end_date):
        # Calculate total expected working days
        total_days = (end_date - start_date).days
        expected_work_days = sum(1 for i in range(total_days) if (start_date + timedelta(days=i)).weekday() < 5)
        
        # Get attendance records
        attendance_records = Attendance.objects.filter(
            employee=emp,
            check_in__date__gte=start_date,
            check_in__date__lte=end_date
        )
        
        actual_work_days = attendance_records.count()
        
        # Get approved leaves
        approved_leave_days = 0
        for leave in TimeOff.objects.filter(
            employee=emp,
            status='APPROVED',
            start_date__lte=end_date,
            end_date__gte=start_date
        ):
            leave_start = max(leave.start_date, start_date)
            leave_end = min(leave.end_date, end_date)
            leave_days = (leave_end - leave_start).days + 1
            # Count only weekdays
            approved_leave_days += sum(1 for i in range(leave_days) if (leave_start + timedelta(days=i)).weekday() < 5)
        
        # 1. ATTENDANCE SCORE (35%)
        expected_present_days = expected_work_days - approved_leave_days
        attendance_rate = (actual_work_days / expected_present_days * 100) if expected_present_days > 0 else 100
        attendance_score = min(attendance_rate, 100) * 0.35
        
        # 2. PUNCTUALITY SCORE (25%)
        on_time_checkins = 0
        for att in attendance_records:
            checkin_time = att.check_in.time()
            # On time if before 9:15 AM
            if checkin_time.hour < 9 or (checkin_time.hour == 9 and checkin_time.minute <= 15):
                on_time_checkins += 1
        
        punctuality_rate = (on_time_checkins / actual_work_days * 100) if actual_work_days > 0 else 100
        punctuality_score = min(punctuality_rate, 100) * 0.25
        
        # 3. WORK HOURS SCORE (25%)
        total_hours = 0
        complete_days = 0
        for att in attendance_records.filter(check_out__isnull=False):
            duration = att.check_out - att.check_in
            hours = duration.total_seconds() / 3600
            total_hours += hours
            complete_days += 1
        
        avg_hours_per_day = total_hours / complete_days if complete_days > 0 else 0
        # Ideal: 8-9 hours, Score calculation
        if 7.5 <= avg_hours_per_day <= 9.5:
            hours_score = 100 * 0.25
        elif avg_hours_per_day > 9.5:
            hours_score = max(80, 100 - (avg_hours_per_day - 9.5) * 5) * 0.25
        else:
            hours_score = (avg_hours_per_day / 8 * 100) * 0.25
        
        # 4. CONSISTENCY SCORE (15%)
        # Check for attendance consistency (minimal gaps)
        attendance_dates = sorted(attendance_records.values_list('check_in__date', flat=True))
        gaps = 0
        for i in range(1, len(attendance_dates)):
            date_diff = (attendance_dates[i] - attendance_dates[i-1]).days
            # Count gaps (excluding weekends and approved leaves)
            if date_diff > 3:
                gaps += 1
        
        consistency_rate = max(0, 100 - (gaps * 10))
        consistency_score = consistency_rate * 0.15
        
        # OVERALL SCORE
        overall_score = round(attendance_score + punctuality_score + hours_score + consistency_score, 1)
        
        return {
            "employee_id": emp.user.id,
            "employee_name": f"{emp.user.first_name} {emp.user.last_name}",
            "email": emp.user.email,
            "department": emp.department or "Not Set",
            "role": emp.role,
            "overall_score": overall_score,
            "grade": self._get_grade(overall_score),
            "breakdown": {
                "attendance": round(attendance_score / 0.35, 1),
                "punctuality": round(punctuality_score / 0.25, 1),
                "work_hours": round(hours_score / 0.25, 1),
                "consistency": round(consistency_score / 0.15, 1)
            },
            "metrics": {
                "days_present": actual_work_days,
                "expected_days": expected_present_days,
                "attendance_rate": round(attendance_rate, 1),
                "avg_hours_per_day": round(avg_hours_per_day, 1),
                "on_time_percentage": round(punctuality_rate, 1)
            }
        }
    
    def _get_grade(self, score):
        if score >= 90:
            return "A+ (Excellent)"
        elif score >= 80:
            return "A (Very Good)"
        elif score >= 70:
            return "B+ (Good)"
        elif score >= 60:
            return "B (Satisfactory)"
        elif score >= 50:
            return "C (Needs Improvement)"
        else:
            return "D (Poor)"


class GraphDataView(APIView):
    """
    Prepare Data for Advanced Graph Visualizations
    - Time-series data for line charts
    - Comparative bar chart data
    - Heatmap data
    - Network/relationship data
    - Distribution data for histograms
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def get(self, request):
        graph_type = request.query_params.get('type', 'all')
        today = datetime.now().date()
        last_90_days = today - timedelta(days=90)
        
        data = {}
        
        if graph_type in ['all', 'timeseries']:
            data['timeseries'] = self._get_timeseries_data(last_90_days, today)
        
        if graph_type in ['all', 'heatmap']:
            data['heatmap'] = self._get_heatmap_data(last_90_days, today)
        
        if graph_type in ['all', 'distribution']:
            data['distribution'] = self._get_distribution_data()
        
        if graph_type in ['all', 'comparative']:
            data['comparative'] = self._get_comparative_data(last_90_days, today)
        
        if graph_type in ['all', 'correlation']:
            data['correlation'] = self._get_correlation_data(last_90_days, today)
        
        return Response(data)
    
    def _get_timeseries_data(self, start_date, end_date):
        """Daily time-series data for attendance and leave trends"""
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            attendance_count = Attendance.objects.filter(
                date=current_date
            ).count()
            
            leave_count = TimeOff.objects.filter(
                start_date__lte=current_date,
                end_date__gte=current_date,
                status='APPROVED'
            ).count()
            
            total_employees = EmployeeProfile.objects.filter(user__is_active=True).count()
            
            daily_data.append({
                "date": current_date.isoformat(),
                "attendance": attendance_count,
                "on_leave": leave_count,
                "absent": max(0, total_employees - attendance_count - leave_count),
                "attendance_percentage": round((attendance_count / total_employees * 100) if total_employees > 0 else 0, 1)
            })
            
            current_date += timedelta(days=1)
        
        return {
            "daily_trends": daily_data,
            "chart_type": "line",
            "x_axis": "date",
            "y_axes": ["attendance", "on_leave", "absent"]
        }
    
    def _get_heatmap_data(self, start_date, end_date):
        """Heatmap data: Attendance by day of week and hour"""
        heatmap_data = defaultdict(lambda: defaultdict(int))
        
        attendances = Attendance.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for att in attendances:
            weekday = weekday_names[att.date.weekday()]
            if att.check_in:
                hour = att.check_in.hour
            else:
                hour = 9  # Default hour if check_in not set
            heatmap_data[weekday][hour] += 1
        
        # Format for frontend consumption
        formatted_data = []
        for day in weekday_names:
            for hour in range(24):
                formatted_data.append({
                    "day": day,
                    "hour": f"{hour:02d}:00",
                    "value": heatmap_data[day][hour]
                })
        
        return {
            "data": formatted_data,
            "chart_type": "heatmap",
            "x_axis": "hour",
            "y_axis": "day",
            "value_label": "check_ins"
        }
    
    def _get_distribution_data(self):
        """Distribution data: Salary, work hours, leave balance"""
        employees = EmployeeProfile.objects.filter(user__is_active=True)
        
        # Salary distribution (using monthly_wage field)
        salary_ranges = [
            {"range": "0-30k", "min": 0, "max": 30000},
            {"range": "30k-50k", "min": 30000, "max": 50000},
            {"range": "50k-75k", "min": 50000, "max": 75000},
            {"range": "75k-100k", "min": 75000, "max": 100000},
            {"range": "100k+", "min": 100000, "max": None}
        ]
        
        salary_dist = []
        for sr in salary_ranges:
            if sr['max'] is not None:
                count = employees.filter(
                    monthly_wage__gte=sr['min'],
                    monthly_wage__lt=sr['max']
                ).count()
            else:
                # For 100k+ range, no upper limit
                count = employees.filter(
                    monthly_wage__gte=sr['min']
                ).count()
            salary_dist.append({
                "range": sr['range'],
                "count": count
            })
        
        return {
            "salary_distribution": {
                "data": salary_dist,
                "chart_type": "bar",
                "x_axis": "range",
                "y_axis": "count"
            }
        }
    
    def _get_comparative_data(self, start_date, end_date):
        """Department vs Department comparison"""
        departments = EmployeeProfile.objects.filter(
            user__is_active=True
        ).values_list('department', flat=True).distinct()
        
        comparison = []
        for dept in departments:
            if not dept:
                continue
            
            dept_employees = EmployeeProfile.objects.filter(
                department=dept,
                user__is_active=True
            )
            
            # Get user IDs for this department's employees
            dept_user_ids = dept_employees.values_list('user_id', flat=True)
            
            total_attendance = Attendance.objects.filter(
                user_id__in=dept_user_ids,
                date__gte=start_date
            ).count()
            
            total_leaves = TimeOff.objects.filter(
                user_id__in=dept_user_ids,
                start_date__gte=start_date,
                status='APPROVED'
            ).count()
            
            avg_salary = dept_employees.aggregate(Avg('monthly_wage'))['monthly_wage__avg'] or 0
            
            comparison.append({
                "department": dept,
                "employee_count": dept_employees.count(),
                "total_attendance": total_attendance,
                "total_leaves": total_leaves,
                "avg_salary": round(avg_salary, 2),
                "attendance_per_employee": round(total_attendance / dept_employees.count(), 1) if dept_employees.count() > 0 else 0
            })
        
        return {
            "department_comparison": comparison,
            "chart_type": "grouped_bar",
            "metrics": ["employee_count", "total_attendance", "total_leaves"]
        }
    
    def _get_correlation_data(self, start_date, end_date):
        """Correlation between different metrics"""
        employees = EmployeeProfile.objects.filter(user__is_active=True)
        
        correlation_data = []
        for emp in employees:
            attendance_count = Attendance.objects.filter(
                user=emp.user,
                date__gte=start_date
            ).count()
            
            leave_count = TimeOff.objects.filter(
                user=emp.user,
                start_date__gte=start_date,
                status='APPROVED'
            ).count()
            
            correlation_data.append({
                "employee_id": emp.user.id,
                "salary": float(emp.monthly_wage) if emp.monthly_wage else 0,
                "attendance_days": attendance_count,
                "leave_days": leave_count,
                "role": emp.user.role
            })
        
        return {
            "scatter_data": correlation_data,
            "chart_type": "scatter",
            "suggested_comparisons": [
                {"x": "salary", "y": "attendance_days", "title": "Salary vs Attendance"},
                {"x": "salary", "y": "leave_days", "title": "Salary vs Leave Usage"}
            ]
        }
