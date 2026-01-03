"""
Notification Management Views
Handles in-app notifications for users
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Notification
from .profile_serializers import NotificationSerializer


class MyNotificationsView(APIView):
    """Get all notifications for current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get query parameters
        is_read = request.query_params.get('is_read')
        notification_type = request.query_params.get('type')
        limit = request.query_params.get('limit', 50)
        
        # Base query
        notifications = Notification.objects.filter(user=request.user)
        
        # Apply filters
        if is_read is not None:
            is_read_bool = is_read.lower() in ['true', '1', 'yes']
            notifications = notifications.filter(is_read=is_read_bool)
        
        if notification_type:
            notifications = notifications.filter(notification_type=notification_type.upper())
        
        # Limit results
        notifications = notifications[:int(limit)]
        
        # Get counts
        total_count = Notification.objects.filter(user=request.user).count()
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        
        serializer = NotificationSerializer(notifications, many=True)
        
        return Response({
            'total_count': total_count,
            'unread_count': unread_count,
            'notifications': serializer.data
        })


class MarkNotificationReadView(APIView):
    """Mark a notification as read"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        notification = get_object_or_404(
            Notification,
            pk=pk,
            user=request.user
        )
        
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marked as read',
            'notification': NotificationSerializer(notification).data
        })


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        
        count = notifications.count()
        
        for notification in notifications:
            notification.mark_as_read()
        
        return Response({
            'message': f'{count} notification(s) marked as read',
            'count': count
        })


class DeleteNotificationView(APIView):
    """Delete a notification"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        notification = get_object_or_404(
            Notification,
            pk=pk,
            user=request.user
        )
        
        notification.delete()
        
        return Response({
            'message': 'Notification deleted successfully'
        }, status=status.HTTP_204_NO_CONTENT)


class ClearAllNotificationsView(APIView):
    """Clear all read notifications"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=True
        )
        
        count = notifications.count()
        notifications.delete()
        
        return Response({
            'message': f'{count} notification(s) cleared',
            'count': count
        }, status=status.HTTP_204_NO_CONTENT)
