"""
Notification System for HRMS
Handles Email, WhatsApp, and In-app notifications
"""

from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from twilio.rest import Client
from decouple import config
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# EMAIL NOTIFICATIONS
# ============================================================================

class EmailNotificationService:
    """Service for sending email notifications"""
    
    @staticmethod
    def send_welcome_email(user, temp_password):
        """Send welcome email to newly created employee"""
        subject = f'Welcome to {user.company.name} - Dayflow HRMS'
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px;">
                    Welcome to {user.company.name}! 🎉
                </h2>
                
                <p>Dear <strong>{user.get_full_name()}</strong>,</p>
                
                <p>Your employee account has been created successfully. Here are your login credentials:</p>
                
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                    <p style="margin: 5px 0;"><strong>Employee ID:</strong> {user.employee_id}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {user.email}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> 
                        <code style="background-color: #E5E7EB; padding: 5px 10px; border-radius: 4px; font-size: 14px;">{temp_password}</code>
                    </p>
                </div>
                
                <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                    <p style="margin: 0; color: #DC2626;"><strong>⚠️ Important:</strong> Please change your password on first login for security.</p>
                </div>
                
                <p>
                    <a href="http://localhost:5173/login" 
                       style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 10px 0;">
                        Login to HRMS
                    </a>
                </p>
                
                <p>If you have any questions, please contact your HR department.</p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                
                <p style="color: #6B7280; font-size: 12px;">
                    Best regards,<br>
                    <strong>{user.company.name} HR Team</strong><br>
                    Dayflow HRMS System
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_content = strip_tags(html_content)
        
        return EmailNotificationService._send_email(
            subject=subject,
            html_content=html_content,
            plain_content=plain_content,
            recipient_list=[user.email]
        )
    
    @staticmethod
    def send_leave_approval_email(time_off):
        """Send email when leave is approved"""
        subject = f'✅ Leave Request Approved - {time_off.user.get_full_name()}'
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10B981; border-bottom: 3px solid #10B981; padding-bottom: 10px;">
                    ✅ Leave Request Approved
                </h2>
                
                <p>Dear <strong>{time_off.user.get_full_name()}</strong>,</p>
                
                <p>Great news! Your leave request has been <strong style="color: #10B981;">APPROVED</strong>.</p>
                
                <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                    <p style="margin: 5px 0;"><strong>Leave Type:</strong> {time_off.get_time_off_type_display()}</p>
                    <p style="margin: 5px 0;"><strong>Start Date:</strong> {time_off.start_date.strftime('%B %d, %Y')}</p>
                    <p style="margin: 5px 0;"><strong>End Date:</strong> {time_off.end_date.strftime('%B %d, %Y')}</p>
                    <p style="margin: 5px 0;"><strong>Total Days:</strong> {time_off.total_days} day(s)</p>
                    <p style="margin: 5px 0;"><strong>Approved By:</strong> {time_off.approved_by.get_full_name()}</p>
                    <p style="margin: 5px 0;"><strong>Approved On:</strong> {time_off.approved_at.strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <p>Have a great time off! 🌴</p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                
                <p style="color: #6B7280; font-size: 12px;">
                    Best regards,<br>
                    <strong>{time_off.user.company.name} HR Team</strong>
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_content = strip_tags(html_content)
        
        return EmailNotificationService._send_email(
            subject=subject,
            html_content=html_content,
            plain_content=plain_content,
            recipient_list=[time_off.user.email]
        )
    
    @staticmethod
    def send_leave_rejection_email(time_off):
        """Send email when leave is rejected"""
        subject = f'❌ Leave Request Rejected - {time_off.user.get_full_name()}'
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #EF4444; border-bottom: 3px solid #EF4444; padding-bottom: 10px;">
                    ❌ Leave Request Rejected
                </h2>
                
                <p>Dear <strong>{time_off.user.get_full_name()}</strong>,</p>
                
                <p>We regret to inform you that your leave request has been <strong style="color: #EF4444;">REJECTED</strong>.</p>
                
                <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                    <p style="margin: 5px 0;"><strong>Leave Type:</strong> {time_off.get_time_off_type_display()}</p>
                    <p style="margin: 5px 0;"><strong>Start Date:</strong> {time_off.start_date.strftime('%B %d, %Y')}</p>
                    <p style="margin: 5px 0;"><strong>End Date:</strong> {time_off.end_date.strftime('%B %d, %Y')}</p>
                    <p style="margin: 5px 0;"><strong>Total Days:</strong> {time_off.total_days} day(s)</p>
                </div>
                
                {f'<div style="background-color: #FFFBEB; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0;"><strong>Reason:</strong> {time_off.rejection_reason}</p></div>' if time_off.rejection_reason else ''}
                
                <p>If you have any questions or would like to discuss this, please contact your manager or HR department.</p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                
                <p style="color: #6B7280; font-size: 12px;">
                    Best regards,<br>
                    <strong>{time_off.user.company.name} HR Team</strong>
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_content = strip_tags(html_content)
        
        return EmailNotificationService._send_email(
            subject=subject,
            html_content=html_content,
            plain_content=plain_content,
            recipient_list=[time_off.user.email]
        )
    
    @staticmethod
    def send_leave_request_to_admin(time_off):
        """Notify admin/HR when employee applies for leave"""
        subject = f'🔔 New Leave Request from {time_off.user.get_full_name()}'
        
        # Get all admin and HR emails
        admin_emails = list(time_off.user.company.employees.filter(
            role__in=['ADMIN', 'HR']
        ).values_list('email', flat=True))
        
        if not admin_emails:
            logger.warning(f"No admin/HR emails found for company {time_off.user.company.name}")
            return False
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #F59E0B; border-bottom: 3px solid #F59E0B; padding-bottom: 10px;">
                    🔔 New Leave Request Pending Approval
                </h2>
                
                <p>A new leave request requires your attention.</p>
                
                <div style="background-color: #FFFBEB; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                    <h3 style="margin-top: 0; color: #92400E;">Employee Details</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> {time_off.user.get_full_name()}</p>
                    <p style="margin: 5px 0;"><strong>Employee ID:</strong> {time_off.user.employee_id}</p>
                    <p style="margin: 5px 0;"><strong>Department:</strong> {time_off.user.profile.department if hasattr(time_off.user, 'profile') else 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {time_off.user.email}</p>
                </div>
                
                <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                    <h3 style="margin-top: 0; color: #1E3A8A;">Leave Details</h3>
                    <p style="margin: 5px 0;"><strong>Leave Type:</strong> {time_off.get_time_off_type_display()}</p>
                    <p style="margin: 5px 0;"><strong>Start Date:</strong> {time_off.start_date.strftime('%B %d, %Y')}</p>
                    <p style="margin: 5px 0;"><strong>End Date:</strong> {time_off.end_date.strftime('%B %d, %Y')}</p>
                    <p style="margin: 5px 0;"><strong>Total Days:</strong> {time_off.total_days} day(s)</p>
                    {f'<p style="margin: 5px 0;"><strong>Reason:</strong> {time_off.reason}</p>' if time_off.reason else ''}
                </div>
                
                <p>Please review and approve/reject this request in the HRMS admin panel.</p>
                
                <p>
                    <a href="http://localhost:5173/admin/leave" 
                       style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 10px 0;">
                        Review Leave Request
                    </a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                
                <p style="color: #6B7280; font-size: 12px;">
                    Dayflow HRMS - Automated Notification
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_content = strip_tags(html_content)
        
        return EmailNotificationService._send_email(
            subject=subject,
            html_content=html_content,
            plain_content=plain_content,
            recipient_list=admin_emails
        )
    
    @staticmethod
    def send_password_changed_email(user):
        """Send confirmation email after password change"""
        subject = '🔒 Password Changed Successfully'
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px;">
                    🔒 Password Changed Successfully
                </h2>
                
                <p>Dear <strong>{user.get_full_name()}</strong>,</p>
                
                <p>Your password has been changed successfully.</p>
                
                <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                    <p style="margin: 5px 0;"><strong>Account:</strong> {user.email}</p>
                    <p style="margin: 5px 0;"><strong>Employee ID:</strong> {user.employee_id}</p>
                    <p style="margin: 5px 0;"><strong>Changed At:</strong> Just now</p>
                </div>
                
                <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                    <p style="margin: 0; color: #DC2626;"><strong>⚠️ Security Notice:</strong> If you did not make this change, please contact your HR department immediately and secure your account.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                
                <p style="color: #6B7280; font-size: 12px;">
                    Best regards,<br>
                    <strong>{user.company.name} Security Team</strong>
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_content = strip_tags(html_content)
        
        return EmailNotificationService._send_email(
            subject=subject,
            html_content=html_content,
            plain_content=plain_content,
            recipient_list=[user.email]
        )
    
    @staticmethod
    def _send_email(subject, html_content, plain_content, recipient_list):
        """Internal method to send email"""
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_list
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            logger.info(f"Email sent successfully: {subject} to {recipient_list}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {subject}. Error: {str(e)}")
            return False


# ============================================================================
# WHATSAPP NOTIFICATIONS
# ============================================================================

class WhatsAppNotificationService:
    """Service for sending WhatsApp notifications via Twilio"""
    
    def __init__(self):
        try:
            self.account_sid = config('TWILIO_ACCOUNT_SID', default='')
            self.auth_token = config('TWILIO_AUTH_TOKEN', default='')
            self.whatsapp_from = config('TWILIO_WHATSAPP_NUMBER', default='')
            
            if self.account_sid and self.auth_token:
                self.client = Client(self.account_sid, self.auth_token)
                self.enabled = True
            else:
                self.enabled = False
                logger.warning("WhatsApp notifications disabled: Twilio credentials not configured")
        except Exception as e:
            self.enabled = False
            logger.error(f"Failed to initialize Twilio client: {str(e)}")
    
    def send_leave_approval_whatsapp(self, time_off):
        """Send WhatsApp notification when leave is approved"""
        if not self.enabled:
            return False
        
        phone = time_off.user.phone
        if not phone:
            logger.warning(f"No phone number for user {time_off.user.email}")
            return False
        
        message = f"""
✅ *Leave Request Approved*

Dear {time_off.user.get_full_name()},

Your leave request has been *APPROVED*.

*Details:*
• Type: {time_off.get_time_off_type_display()}
• From: {time_off.start_date.strftime('%b %d, %Y')}
• To: {time_off.end_date.strftime('%b %d, %Y')}
• Days: {time_off.total_days}
• Approved by: {time_off.approved_by.get_full_name()}

Have a great time off! 🌴

_{time_off.user.company.name} HR Team_
        """.strip()
        
        return self._send_whatsapp(phone, message)
    
    def send_leave_rejection_whatsapp(self, time_off):
        """Send WhatsApp notification when leave is rejected"""
        if not self.enabled:
            return False
        
        phone = time_off.user.phone
        if not phone:
            return False
        
        message = f"""
❌ *Leave Request Rejected*

Dear {time_off.user.get_full_name()},

Your leave request has been *REJECTED*.

*Details:*
• Type: {time_off.get_time_off_type_display()}
• From: {time_off.start_date.strftime('%b %d, %Y')}
• To: {time_off.end_date.strftime('%b %d, %Y')}
• Days: {time_off.total_days}

{f'*Reason:* {time_off.rejection_reason}' if time_off.rejection_reason else ''}

Please contact HR for more information.

_{time_off.user.company.name} HR Team_
        """.strip()
        
        return self._send_whatsapp(phone, message)
    
    def send_attendance_reminder(self, user):
        """Send daily attendance reminder"""
        if not self.enabled:
            return False
        
        phone = user.phone
        if not phone:
            return False
        
        message = f"""
⏰ *Attendance Reminder*

Hello {user.get_full_name()},

Don't forget to check in for today!

Login to Dayflow HRMS to mark your attendance.

_{user.company.name}_
        """.strip()
        
        return self._send_whatsapp(phone, message)
    
    def _send_whatsapp(self, phone, message):
        """Internal method to send WhatsApp message"""
        try:
            # Format phone number for WhatsApp (must include country code)
            if not phone.startswith('+'):
                phone = f'+91{phone}'  # Assuming India, change as needed
            
            whatsapp_to = f'whatsapp:{phone}'
            whatsapp_from = f'whatsapp:{self.whatsapp_from}'
            
            message = self.client.messages.create(
                body=message,
                from_=whatsapp_from,
                to=whatsapp_to
            )
            
            logger.info(f"WhatsApp sent successfully: {message.sid} to {phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send WhatsApp to {phone}: {str(e)}")
            return False


# ============================================================================
# IN-APP NOTIFICATIONS
# ============================================================================

class InAppNotificationService:
    """Service for creating in-app notifications"""
    
    @staticmethod
    def create_notification(user, title, message, notification_type='INFO', related_object_type=None, related_object_id=None):
        """Create an in-app notification for a user"""
        from .models import Notification
        
        try:
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                related_object_type=related_object_type,
                related_object_id=related_object_id
            )
            logger.info(f"In-app notification created: {notification.id} for {user.email}")
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification for {user.email}: {str(e)}")
            return None
    
    @staticmethod
    def notify_leave_request_submitted(time_off):
        """Create notification for employee when leave is submitted"""
        return InAppNotificationService.create_notification(
            user=time_off.user,
            title='Leave Request Submitted',
            message=f'Your {time_off.get_time_off_type_display()} request for {time_off.total_days} day(s) has been submitted and is pending approval.',
            notification_type='INFO',
            related_object_type='leave',
            related_object_id=time_off.id
        )
    
    @staticmethod
    def notify_leave_approved(time_off):
        """Create notification when leave is approved"""
        return InAppNotificationService.create_notification(
            user=time_off.user,
            title='Leave Request Approved ✅',
            message=f'Your {time_off.get_time_off_type_display()} from {time_off.start_date} to {time_off.end_date} has been approved by {time_off.approved_by.get_full_name()}.',
            notification_type='SUCCESS',
            related_object_type='leave',
            related_object_id=time_off.id
        )
    
    @staticmethod
    def notify_leave_rejected(time_off):
        """Create notification when leave is rejected"""
        reason = f' Reason: {time_off.rejection_reason}' if time_off.rejection_reason else ''
        return InAppNotificationService.create_notification(
            user=time_off.user,
            title='Leave Request Rejected ❌',
            message=f'Your {time_off.get_time_off_type_display()} from {time_off.start_date} to {time_off.end_date} has been rejected.{reason}',
            notification_type='ERROR',
            related_object_type='leave',
            related_object_id=time_off.id
        )
    
    @staticmethod
    def notify_admin_new_leave_request(time_off):
        """Notify all admins/HR about new leave request"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        admins = User.objects.filter(
            company=time_off.user.company,
            role__in=['ADMIN', 'HR']
        )
        
        notifications = []
        for admin in admins:
            notification = InAppNotificationService.create_notification(
                user=admin,
                title=f'New Leave Request from {time_off.user.get_full_name()}',
                message=f'{time_off.user.get_full_name()} has requested {time_off.get_time_off_type_display()} for {time_off.total_days} day(s) from {time_off.start_date} to {time_off.end_date}.',
                notification_type='WARNING',
                related_object_type='leave',
                related_object_id=time_off.id
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_attendance_milestone(user, days_count):
        """Notify user of attendance milestone"""
        return InAppNotificationService.create_notification(
            user=user,
            title=f'🎉 {days_count} Days Perfect Attendance!',
            message=f'Congratulations! You have maintained {days_count} days of perfect attendance. Keep up the great work!',
            notification_type='SUCCESS'
        )
