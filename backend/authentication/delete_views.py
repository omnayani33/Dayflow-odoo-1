from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .permissions import IsAdmin

User = get_user_model()

class EmployeeDeleteView(APIView):
    """
    API endpoint for deleting (soft deleting) employees
    Only ADMIN or HR can delete employees
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def delete(self, request, pk):
        # Check if user is ADMIN or HR
        if request.user.role not in ['ADMIN', 'HR']:
            return Response(
                {'error': 'Only Admin or HR can delete employees'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            employee = User.objects.get(pk=pk, company=request.user.company)
            
            # Prevent deleting yourself
            if employee == request.user:
                return Response(
                    {'error': 'You cannot delete your own account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use soft delete by deactivating
            employee.is_active = False
            employee.save()
            
            # Alternatively: employee.delete() for hard delete if preferred
            # employee.delete()
            
            return Response(
                {'message': 'Employee deactivated successfully'},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
