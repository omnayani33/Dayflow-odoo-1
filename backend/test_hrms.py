"""
Test script for HRMS modules
Tests employee profiles, attendance, time-off, and dashboards
"""
import requests
import json
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api/auth"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"✨ {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def test_hrms_flow():
    """Test complete HRMS flow"""
    
    # Step 1: Company Signup
    print("\n🏢 Step 1: Company Signup")
    company_data = {
        "company_name": "OdooIndia Pvt Ltd",
        "admin_first_name": "John",
        "admin_last_name": "Doe",
        "admin_email": "john@odooindia.com",
        "admin_password": "admin@123"
    }
    response = requests.post(f"{BASE_URL}/company/signup", json=company_data)
    print_response("Company Signup", response)
    
    if response.status_code != 201:
        print("❌ Company signup failed!")
        return
    
    # Step 2: Admin Login
    print("\n🔑 Step 2: Admin Login")
    login_data = {
        "employee_id": response.json()["user"]["employee_id"],
        "password": "admin@123"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print_response("Admin Login", response)
    
    if response.status_code != 200:
        print("❌ Login failed!")
        return
    
    admin_token = response.json()["access"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Step 3: Create Employee
    print("\n👤 Step 3: Create New Employee")
    employee_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@odooindia.com",
        "role": "EMPLOYEE"
    }
    response = requests.post(
        f"{BASE_URL}/employee/create",
        json=employee_data,
        headers=admin_headers
    )
    print_response("Create Employee", response)
    
    if response.status_code != 201:
        print("❌ Employee creation failed!")
        return
    
    employee_id = response.json()["employee"]["employee_id"]
    temp_password = response.json()["temporary_password"]
    
    # Step 4: Employee First Login
    print("\n🔐 Step 4: Employee First Login")
    login_data = {
        "employee_id": employee_id,
        "password": temp_password
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print_response("Employee First Login", response)
    
    if response.status_code != 200:
        print("❌ Employee login failed!")
        return
    
    employee_token = response.json()["access"]
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    
    # Step 5: Change Password
    print("\n🔄 Step 5: Change Password (First Time)")
    change_pwd_data = {
        "old_password": temp_password,
        "new_password": "newpass@123"
    }
    response = requests.post(
        f"{BASE_URL}/change-password",
        json=change_pwd_data,
        headers=employee_headers
    )
    print_response("Change Password", response)
    
    # Step 6: Login with New Password
    print("\n✅ Step 6: Login with New Password")
    login_data = {
        "employee_id": employee_id,
        "password": "newpass@123"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print_response("Login with New Password", response)
    
    if response.status_code != 200:
        print("❌ Login with new password failed!")
        return
    
    employee_token = response.json()["access"]
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    
    # Step 7: Get My Profile
    print("\n👤 Step 7: Get My Profile")
    response = requests.get(
        f"{BASE_URL}/profile/me",
        headers=employee_headers
    )
    print_response("My Profile", response)
    
    # Step 8: Update Profile (Employee)
    print("\n✏️ Step 8: Update Profile (Employee)")
    profile_data = {
        "phone": "9876543210",
        "residential_address": "123 Main Street, Bangalore",
        "about": "Experienced software developer with 5 years of experience",
        "skills": ["Python", "Django", "React", "PostgreSQL"]
    }
    response = requests.put(
        f"{BASE_URL}/profile/update",
        json=profile_data,
        headers=employee_headers
    )
    print_response("Update Profile", response)
    
    # Step 9: Admin Updates Employee Profile (with Salary)
    print("\n💰 Step 9: Admin Updates Employee Profile (with Salary)")
    admin_profile_data = {
        "department": "Engineering",
        "job_title": "Software Developer",
        "monthly_wage": 50000,
        "location": "Bangalore",
        "bank_name": "HDFC Bank",
        "account_number": "1234567890",
        "ifsc_code": "HDFC0001234"
    }
    response = requests.put(
        f"{BASE_URL}/profile/update",
        json=admin_profile_data,
        headers=admin_headers
    )
    print_response("Admin Updates Profile", response)
    
    # Step 10: Check In
    print("\n⏰ Step 10: Employee Check In")
    checkin_data = {"action": "check_in"}
    response = requests.post(
        f"{BASE_URL}/attendance/check",
        json=checkin_data,
        headers=employee_headers
    )
    print_response("Check In", response)
    
    # Step 11: Check Out (after some time)
    print("\n🚪 Step 11: Employee Check Out")
    checkout_data = {"action": "check_out"}
    response = requests.post(
        f"{BASE_URL}/attendance/check",
        json=checkout_data,
        headers=employee_headers
    )
    print_response("Check Out", response)
    
    # Step 12: View My Attendance
    print("\n📊 Step 12: View My Attendance")
    current_date = date.today()
    response = requests.get(
        f"{BASE_URL}/attendance/my?month={current_date.month}&year={current_date.year}",
        headers=employee_headers
    )
    print_response("My Attendance", response)
    
    # Step 13: Request Time Off
    print("\n🏖️ Step 13: Request Time Off")
    start_date = date.today() + timedelta(days=7)
    end_date = start_date + timedelta(days=2)
    timeoff_data = {
        "time_off_type": "PAID",
        "start_date": str(start_date),
        "end_date": str(end_date),
        "reason": "Family function"
    }
    response = requests.post(
        f"{BASE_URL}/timeoff/request",
        json=timeoff_data,
        headers=employee_headers
    )
    print_response("Request Time Off", response)
    
    if response.status_code == 201:
        timeoff_id = response.json()["request"]["id"]
        
        # Step 14: View My Time Off Requests
        print("\n📋 Step 14: View My Time Off Requests")
        response = requests.get(
            f"{BASE_URL}/timeoff/request",
            headers=employee_headers
        )
        print_response("My Time Off Requests", response)
        
        # Step 15: Admin Views Pending Requests
        print("\n📝 Step 15: Admin Views Pending Requests")
        response = requests.get(
            f"{BASE_URL}/timeoff/manage?status=PENDING",
            headers=admin_headers
        )
        print_response("Admin Views Pending Requests", response)
        
        # Step 16: Admin Approves Request
        print("\n✅ Step 16: Admin Approves Time Off Request")
        approve_data = {"action": "approve"}
        response = requests.patch(
            f"{BASE_URL}/timeoff/manage/{timeoff_id}",
            json=approve_data,
            headers=admin_headers
        )
        print_response("Approve Time Off", response)
    
    # Step 17: Employee Dashboard
    print("\n📊 Step 17: Employee Dashboard")
    response = requests.get(
        f"{BASE_URL}/dashboard/employee",
        headers=employee_headers
    )
    print_response("Employee Dashboard", response)
    
    # Step 18: Admin Dashboard
    print("\n📈 Step 18: Admin Dashboard")
    response = requests.get(
        f"{BASE_URL}/dashboard/admin",
        headers=admin_headers
    )
    print_response("Admin Dashboard", response)
    
    print("\n" + "="*60)
    print("🎉 HRMS Module Testing Completed!")
    print("="*60)

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════╗
    ║       HRMS Module Test Suite                      ║
    ║                                                    ║
    ║  Testing:                                         ║
    ║  ✓ Company Signup & Admin Creation               ║
    ║  ✓ Employee Creation with Temp Password          ║
    ║  ✓ First Login & Password Change                 ║
    ║  ✓ Profile Management (Role-based)               ║
    ║  ✓ Attendance Check In/Out                       ║
    ║  ✓ Time Off Request & Approval                   ║
    ║  ✓ Employee & Admin Dashboards                   ║
    ╚════════════════════════════════════════════════════╝
    """)
    
    print("\n⚠️  Make sure Django server is running on http://127.0.0.1:8000")
    input("Press Enter to start testing...")
    
    try:
        test_hrms_flow()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to Django server!")
        print("Please start the server with: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
