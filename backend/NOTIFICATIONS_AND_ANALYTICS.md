# Notifications and Analytics System Documentation

## Overview
This document describes the comprehensive notification and analytics system implemented in the Dayflow HRMS backend. The system supports:
- **Email Notifications** via SMTP (Gmail/SendGrid/SES)
- **WhatsApp Notifications** via Twilio
- **In-App Notifications** stored in database
- **Analytics Dashboards** for comprehensive reporting

---

## 1. Notification System

### Architecture
The notification system is built with three separate services:

#### 1.1 Email Notification Service (`EmailNotificationService`)
- **File**: `authentication/notifications.py`
- **Purpose**: Send professional HTML emails for important events
- **Configuration**: Requires email credentials in `.env`

**Email Types**:
1. **Welcome Email** - Sent when new employee is created
2. **Leave Approval Email** - Sent when leave request is approved
3. **Leave Rejection Email** - Sent when leave request is rejected
4. **Leave Request to Admin** - Sent to all admins/HR when employee requests leave
5. **Password Changed Email** - Sent when user changes their password

**Usage Example**:
```python
from authentication.notifications import EmailNotificationService

# Send welcome email
EmailNotificationService.send_welcome_email(user, temp_password)

# Send leave approval
EmailNotificationService.send_leave_approval_email(time_off_request)
```

#### 1.2 WhatsApp Notification Service (`WhatsAppNotificationService`)
- **File**: `authentication/notifications.py`
- **Purpose**: Send WhatsApp messages via Twilio for urgent notifications
- **Configuration**: Requires Twilio credentials in `.env`

**WhatsApp Message Types**:
1. **Leave Approval** - Notify employee their leave was approved
2. **Leave Rejection** - Notify employee their leave was rejected
3. **Attendance Reminder** - Send reminders for check-in/check-out

**Usage Example**:
```python
from authentication.notifications import WhatsAppNotificationService

service = WhatsAppNotificationService()
service.send_leave_approval_whatsapp(time_off_request)
```

#### 1.3 In-App Notification Service (`InAppNotificationService`)
- **File**: `authentication/notifications.py`
- **Purpose**: Create database notifications for display in frontend
- **Storage**: Stored in `Notification` model

**Notification Types**:
1. **Leave Request Submitted** - Employee sees confirmation
2. **Leave Approved** - Employee notified of approval
3. **Leave Rejected** - Employee notified of rejection
4. **Admin New Leave Request** - Admin/HR notified of new request
5. **Attendance Milestone** - Celebrate attendance achievements

**Usage Example**:
```python
from authentication.notifications import InAppNotificationService

# Create notification
InAppNotificationService.notify_leave_approved(time_off_request)
```

---

## 2. In-App Notification Management API

### Endpoints

#### 2.1 Get My Notifications
```http
GET /api/auth/notifications
Authorization: Bearer <token>
Query Parameters:
  - is_read: filter by read status (true/false)
  - type: filter by type (INFO/SUCCESS/WARNING/ERROR)
  - limit: limit number of results

Response:
{
  "total_count": 25,
  "unread_count": 5,
  "notifications": [
    {
      "id": 1,
      "title": "Leave Approved",
      "message": "Your leave request for Jan 20-22 has been approved",
      "notification_type": "SUCCESS",
      "is_read": false,
      "created_at": "2026-01-15T10:30:00Z",
      "time_ago": "2 hours ago"
    }
  ]
}
```

#### 2.2 Mark Notification as Read
```http
PATCH /api/auth/notifications/{id}/read
Authorization: Bearer <token>

Response:
{
  "message": "Notification marked as read"
}
```

#### 2.3 Mark All Notifications as Read
```http
POST /api/auth/notifications/read-all
Authorization: Bearer <token>

Response:
{
  "message": "5 notifications marked as read"
}
```

#### 2.4 Delete Notification
```http
DELETE /api/auth/notifications/{id}/delete
Authorization: Bearer <token>

Response:
{
  "message": "Notification deleted successfully"
}
```

#### 2.5 Clear All Read Notifications
```http
DELETE /api/auth/notifications/clear
Authorization: Bearer <token>

Response:
{
  "message": "3 read notifications cleared"
}
```

---

## 3. Analytics Dashboard APIs

### Endpoints

#### 3.1 Master Analytics Dashboard
```http
GET /api/auth/analytics/dashboard
Authorization: Bearer <token>

Response:
{
  "employee_stats": {
    "total_employees": 50,
    "active_employees": 48,
    "by_role": {
      "EMPLOYEE": 30,
      "MANAGER": 15,
      "HR": 3,
      "ADMIN": 2
    },
    "by_department": {
      "Engineering": 20,
      "Sales": 15,
      "HR": 5
    }
  },
  "attendance_stats": {
    "today_present": 45,
    "today_absent": 3,
    "average_monthly_attendance": 96.5,
    "last_30_days_trend": [
      {"date": "2026-01-15", "present": 48, "absent": 2},
      ...
    ]
  },
  "leave_stats": {
    "pending_requests": 5,
    "approved_this_month": 12,
    "rejected_this_month": 2,
    "by_type": {
      "PAID": 8,
      "SICK": 4,
      "UNPAID": 0
    },
    "monthly_trend": [
      {"month": "2026-01", "total": 14},
      ...
    ]
  },
  "payroll_stats": {
    "total_monthly_payroll": 250000,
    "average_salary": 5000,
    "by_department": {
      "Engineering": 120000,
      "Sales": 90000,
      "HR": 40000
    }
  },
  "top_performers": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "attendance_percentage": 100,
      "leave_balance": 15
    }
  ],
  "recent_activities": [
    {
      "type": "LEAVE_REQUEST",
      "description": "Jane Smith requested 3 days leave",
      "timestamp": "2026-01-15T14:30:00Z"
    }
  ]
}
```

#### 3.2 Attendance Trend Analytics
```http
GET /api/auth/analytics/attendance-trend?days=30
Authorization: Bearer <token>

Response:
{
  "trend_data": [
    {
      "date": "2026-01-15",
      "total_employees": 50,
      "present": 48,
      "absent": 2,
      "attendance_percentage": 96.0
    }
  ],
  "department_wise": [
    {
      "department": "Engineering",
      "total_employees": 20,
      "average_attendance": 95.5
    }
  ]
}
```

#### 3.3 Leave Analytics
```http
GET /api/auth/analytics/leave?year=2026
Authorization: Bearer <token>

Response:
{
  "allocation_summary": {
    "paid_leave": {
      "allocated": 1000,
      "used": 450,
      "remaining": 550
    },
    "sick_leave": {
      "allocated": 500,
      "used": 120,
      "remaining": 380
    }
  },
  "monthly_trends": [
    {
      "month": "2026-01",
      "total_requests": 14,
      "approved": 12,
      "rejected": 2,
      "pending": 0
    }
  ],
  "department_wise": [
    {
      "department": "Engineering",
      "total_leave_days": 180,
      "average_per_employee": 9.0
    }
  ]
}
```

#### 3.4 Payroll Analytics
```http
GET /api/auth/analytics/payroll
Authorization: Bearer <token>

Response:
{
  "overall_stats": {
    "total_employees": 50,
    "total_monthly_payroll": 250000,
    "average_salary": 5000,
    "median_salary": 4500,
    "highest_salary": 15000,
    "lowest_salary": 3000
  },
  "salary_distribution": [
    {"range": "0-25000", "count": 45},
    {"range": "25000-50000", "count": 3},
    {"range": "50000-75000", "count": 1},
    {"range": "75000-100000", "count": 1}
  ],
  "department_wise": [
    {
      "department": "Engineering",
      "total_employees": 20,
      "total_payroll": 120000,
      "average_salary": 6000
    }
  ],
  "role_wise": [
    {
      "role": "ADMIN",
      "count": 2,
      "average_salary": 12000
    }
  ]
}
```

---

## 4. Configuration

### 4.1 Email Configuration
Add to `.env` file:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**For Gmail**:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate App Password at [App Passwords](https://myaccount.google.com/apppasswords)
4. Use the generated 16-character password in `.env`

### 4.2 Twilio/WhatsApp Configuration
Add to `.env` file:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Setup Steps**:
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get Account SID and Auth Token from [Console](https://console.twilio.com)
3. Activate WhatsApp Sandbox at [Try WhatsApp](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
4. For production, apply for WhatsApp Business API access

---

## 5. Integration Points

### Where Notifications Are Sent

#### 5.1 Employee Creation
**File**: `authentication/views.py` - `EmployeeCreateView`
- ✉️ **Email**: Welcome email with credentials
- 📱 **In-App**: N/A (user doesn't exist yet)
- 💬 **WhatsApp**: N/A

#### 5.2 Password Change
**File**: `authentication/views.py` - `ChangePasswordView`
- ✉️ **Email**: Password changed confirmation
- 📱 **In-App**: N/A (could be added)
- 💬 **WhatsApp**: N/A

#### 5.3 Leave Request Submission
**File**: `authentication/dashboard_views.py` - `TimeOffRequestView`
- ✉️ **Email**: Sent to all admins/HR
- 📱 **In-App**: Confirmation for employee + notification for admins/HR
- 💬 **WhatsApp**: N/A

#### 5.4 Leave Approval
**File**: `authentication/dashboard_views.py` - `TimeOffManagementView`
- ✉️ **Email**: Approval notification to employee
- 📱 **In-App**: Approval notification to employee
- 💬 **WhatsApp**: Approval notification to employee

#### 5.5 Leave Rejection
**File**: `authentication/dashboard_views.py` - `TimeOffManagementView`
- ✉️ **Email**: Rejection notification to employee
- 📱 **In-App**: Rejection notification to employee
- 💬 **WhatsApp**: Rejection notification to employee

---

## 6. Database Schema

### Notification Model
```python
class Notification(models.Model):
    TYPE_CHOICES = [
        ('INFO', 'Info'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
    ]
    
    user = ForeignKey(User)              # Who receives the notification
    title = CharField(max_length=200)    # Notification title
    message = TextField()                # Notification message
    notification_type = CharField()      # INFO/SUCCESS/WARNING/ERROR
    is_read = BooleanField(default=False)
    related_object_type = CharField()    # e.g., 'timeoff', 'attendance'
    related_object_id = IntegerField()   # ID of related object
    created_at = DateTimeField()
    read_at = DateTimeField(null=True)
```

---

## 7. Testing

### 7.1 Test Email Notifications
```bash
# Start Django shell
python manage.py shell

# Test email
from authentication.notifications import EmailNotificationService
from authentication.models import User

user = User.objects.first()
EmailNotificationService.send_welcome_email(user, 'test123')
```

### 7.2 Test WhatsApp Notifications
```bash
# In Django shell
from authentication.notifications import WhatsAppNotificationService
from authentication.models import TimeOff

service = WhatsAppNotificationService()
time_off = TimeOff.objects.first()
service.send_leave_approval_whatsapp(time_off)
```

### 7.3 Test In-App Notifications
```bash
# In Django shell
from authentication.notifications import InAppNotificationService
from authentication.models import TimeOff

time_off = TimeOff.objects.first()
InAppNotificationService.notify_leave_approved(time_off)
```

### 7.4 Test Analytics APIs
```bash
# Using curl
curl -X GET "http://localhost:8000/api/auth/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Or use Postman/Insomnia
```

---

## 8. Troubleshooting

### Issue: Emails Not Sending
**Solutions**:
1. Verify `.env` email credentials are correct
2. Check if 2-Step Verification is enabled (Gmail)
3. Ensure App Password is generated (not regular password)
4. Check Django logs for errors
5. Test SMTP connection:
```python
from django.core.mail import send_mail
send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])
```

### Issue: WhatsApp Not Sending
**Solutions**:
1. Verify Twilio credentials in `.env`
2. Ensure phone number includes country code with `+`
3. For sandbox, verify recipient joined sandbox (send join code)
4. Check Twilio Console logs for errors
5. Verify account has credits

### Issue: Notifications Not Appearing
**Solutions**:
1. Run migrations: `python manage.py migrate`
2. Check if `Notification` model exists in database
3. Verify user is authenticated when fetching notifications
4. Check browser console for API errors

### Issue: Analytics Empty
**Solutions**:
1. Ensure there's data in database (employees, attendance, leave records)
2. Verify date filters (if using `?year=2026` or `?days=30`)
3. Check if user has permission to access analytics
4. Verify database relationships are correct

---

## 9. Production Considerations

### 9.1 Email Service
For production, consider using dedicated email services:
- **SendGrid**: 100 emails/day free, better deliverability
- **AWS SES**: Pay-as-you-go, highly scalable
- **Mailgun**: 5,000 emails/month free

Update `.env`:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

### 9.2 WhatsApp Business API
Twilio sandbox is for testing only. For production:
1. Apply for WhatsApp Business API access via Twilio
2. Get dedicated WhatsApp number
3. Configure webhook for incoming messages
4. Follow WhatsApp Business policies

### 9.3 Async Processing
For high-volume notifications, implement async processing:
```bash
pip install celery redis
```

Use Celery to queue notifications:
```python
@shared_task
def send_email_async(user_id, template, context):
    user = User.objects.get(id=user_id)
    EmailNotificationService.send_email(user, template, context)
```

### 9.4 Rate Limiting
Implement rate limiting to prevent abuse:
```python
# In settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '1000/day'
    }
}
```

---

## 10. Future Enhancements

### Planned Features
1. **Push Notifications** - Mobile app push notifications
2. **SMS Notifications** - Text message notifications via Twilio
3. **Slack Integration** - Send notifications to Slack channels
4. **Custom Templates** - Allow admins to customize email templates
5. **Notification Preferences** - Users choose which notifications to receive
6. **Scheduled Notifications** - Birthday wishes, work anniversaries
7. **Batch Processing** - Send bulk notifications efficiently
8. **Analytics Export** - Download analytics as PDF/Excel
9. **Real-time Dashboard** - WebSocket-based live analytics
10. **Notification History** - Archive of all sent notifications

---

## 11. API Summary

### Notification Management (5 endpoints)
- `GET /api/auth/notifications` - Get my notifications
- `PATCH /api/auth/notifications/{id}/read` - Mark as read
- `POST /api/auth/notifications/read-all` - Mark all as read
- `DELETE /api/auth/notifications/{id}/delete` - Delete notification
- `DELETE /api/auth/notifications/clear` - Clear read notifications

### Analytics Dashboards (4 endpoints)
- `GET /api/auth/analytics/dashboard` - Master dashboard
- `GET /api/auth/analytics/attendance-trend` - Attendance trends
- `GET /api/auth/analytics/leave` - Leave analytics
- `GET /api/auth/analytics/payroll` - Payroll analytics

---

## Support

For issues or questions:
1. Check this documentation
2. Review Django logs: `backend/logs/`
3. Check Twilio Console for WhatsApp errors
4. Contact development team

**Last Updated**: January 2026
