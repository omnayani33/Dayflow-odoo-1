import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dayflow.settings')
django.setup()

from authentication.models import User, Company

# Get or create company
company, _ = Company.objects.get_or_create(
    name='Test Company',
    defaults={'is_active': True}
)

# Check if user exists
existing_user = User.objects.filter(email='admin@test.com').first()

if existing_user:
    print(f"\n✅ User already exists:")
    print(f"   Email: {existing_user.email}")
    print(f"   Employee ID: {existing_user.employee_id}")
    print(f"   Role: {existing_user.role}")
    print(f"   First Login: {existing_user.is_first_login}")
    print(f"\n   Use password: admin123")
else:
    # Create test user
    user = User.objects.create_user(
        email='admin@test.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='ADMIN',
        company=company,
        is_staff=True,
        is_verified=True,
        is_first_login=True
    )
    
    print(f"\n✅ Test user created successfully!")
    print(f"   Email: {user.email}")
    print(f"   Password: admin123")
    print(f"   Employee ID: {user.employee_id}")
    print(f"   Role: {user.role}")
    print(f"\n   You will need to change password on first login.")
