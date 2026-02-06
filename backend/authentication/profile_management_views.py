"""
Profile Management Views
Handles profile updates, avatar uploads, and document management
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from .document_models import EmployeeDocument
from .profile_serializers import EmployeeDocumentSerializer
import os


class AvatarUploadView(APIView):
    """Upload or update user avatar"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        avatar = request.FILES.get('avatar')
        
        if not avatar:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if avatar.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (5MB max)
        if avatar.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File size must be less than 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user profile
        profile = request.user.profile
        
        # Delete old avatar if exists
        if profile.avatar:
            if os.path.isfile(profile.avatar.path):
                os.remove(profile.avatar.path)
        
        profile.avatar = avatar
        profile.save()
        
        return Response({
            'message': 'Avatar uploaded successfully',
            'avatar_url': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        })


class DocumentListView(APIView):
    """Get all documents for current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        documents = EmployeeDocument.objects.filter(user=request.user)
        serializer = EmployeeDocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)


class DocumentUploadView(APIView):
    """Upload a new document"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        document_file = request.FILES.get('document')
        document_name = request.data.get('document_name', '')
        document_type = request.data.get('document_type', 'OTHER')
        
        if not document_file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (10MB max)
        if document_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File size must be less than 10MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use original filename if no name provided
        if not document_name:
            document_name = document_file.name
        
        # Create document
        document = EmployeeDocument.objects.create(
            user=request.user,
            document_name=document_name,
            document_type=document_type,
            document_file=document_file
        )
        
        serializer = EmployeeDocumentSerializer(document, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DocumentDownloadView(APIView):
    """Download a document"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        document = get_object_or_404(
            EmployeeDocument,
            pk=pk,
            user=request.user
        )
        
        if not document.document_file:
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return FileResponse(
            document.document_file.open('rb'),
            as_attachment=True,
            filename=document.document_name
        )


class DocumentDeleteView(APIView):
    """Delete a document"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        document = get_object_or_404(
            EmployeeDocument,
            pk=pk,
            user=request.user
        )
        
        # Delete file from storage
        if document.document_file:
            if os.path.isfile(document.document_file.path):
                os.remove(document.document_file.path)
        
        document.delete()
        
        return Response(
            {'message': 'Document deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
