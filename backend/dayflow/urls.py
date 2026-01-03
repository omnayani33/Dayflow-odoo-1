"""
URL configuration for dayflow project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """API root endpoint showing available endpoints"""
    return Response({
        'message': 'Welcome to Dayflow HRMS API',
        'version': '2.0',
        'endpoints': {
            'authentication': {
                'company_signup': '/api/auth/company/signup',
                'employee_create': '/api/auth/employee/create (Admin/HR only)',
                'login': '/api/auth/login',
                'change_password': '/api/auth/change-password',
                'current_user': '/api/auth/me',
            },
            'admin': '/admin/',
        },
        'notes': {
            'employee_id_format': 'OI[CompanyCode][NameCode][Year][SerialNum]',
            'example': 'OIJODO20220001',
            'login': 'Use employee_id or email to login'
        }
    })


urlpatterns = [
    path("", api_root, name='api-root'),
    path("admin/", admin.site.urls),
    path("api/auth/", include('authentication.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
