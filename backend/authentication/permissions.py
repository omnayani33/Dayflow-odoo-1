from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Permission class to check if user has ADMIN role"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IsEmployee(BasePermission):
    """Permission class to check if user has EMPLOYEE role"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'EMPLOYEE'


class IsAdminOrEmployee(BasePermission):
    """Permission class to check if user is either ADMIN or EMPLOYEE"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'EMPLOYEE']


class IsAdminOrHR(BasePermission):
    """Permission class to check if user is either ADMIN or HR role"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'HR']
