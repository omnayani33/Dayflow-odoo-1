# Dayflow HRMS - Backend API Testing Script
# Run this script from the backend directory with the Django server running

$baseUrl = "http://127.0.0.1:8000/api/auth"
$headers = @{ "Content-Type" = "application/json" }
$results = @{}

function Log-Test {
    param([string]$Name, [bool]$Success, [string]$Details = "")
    $status = if ($Success) { "✅ PASS" } else { "❌ FAIL" }
    Write-Host "$status - $Name"
    if ($Details) { Write-Host "   $Details" -ForegroundColor Gray }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DAYFLOW HRMS - BACKEND API TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# PHASE 1: COMPANY REGISTRATION
Write-Host "`n--- PHASE 1: Company Registration ---" -ForegroundColor Yellow
try {
    $signupBody = @{
        company_name = "TestCorp_$(Get-Date -Format 'HHmmss')"
        first_name = "Test"
        last_name = "Admin"
        email = "admin_$(Get-Date -Format 'HHmmss')@test.com"
        password = "Test@123456"
    } | ConvertTo-Json
    $signup = Invoke-RestMethod -Uri "$baseUrl/company/signup" -Method POST -Headers $headers -Body $signupBody
    Log-Test "Company Registration" $true "Company ID: $($signup.company.id)"
    $results["signup"] = $signup
} catch {
    Log-Test "Company Registration" $false $_.Exception.Message
}

# PHASE 2: LOGIN
Write-Host "`n--- PHASE 2: Authentication ---" -ForegroundColor Yellow
try {
    $loginBody = @{
        login_id = "admin@techcorp.com"
        password = "Admin@123456"
    } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Headers $headers -Body $loginBody
    $token = $login.token
    $authHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" }
    Log-Test "Login" $true "Token: $($token.Substring(0, 30))..."
    $results["token"] = $token
} catch {
    Log-Test "Login" $false $_.Exception.Message
    Write-Host "Cannot continue without authentication" -ForegroundColor Red
    exit 1
}

# PHASE 3: CURRENT USER
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/me" -Method GET -Headers $authHeaders
    Log-Test "Get Current User" $true "User: $($me.full_name) ($($me.role))"
} catch {
    Log-Test "Get Current User" $false $_.Exception.Message
}

# PHASE 4: CREATE EMPLOYEES
Write-Host "`n--- PHASE 3: Employee Management ---" -ForegroundColor Yellow
try {
    $emp1 = @{
        first_name = "Sarah"
        last_name = "Johnson"
        email = "sarah_$(Get-Date -Format 'HHmmss')@test.com"
        role = "HR"
    } | ConvertTo-Json
    $newEmp1 = Invoke-RestMethod -Uri "$baseUrl/employee/create" -Method POST -Headers $authHeaders -Body $emp1
    Log-Test "Create HR Employee" $true "Employee ID: $($newEmp1.employee_id)"
} catch {
    Log-Test "Create HR Employee" $false $_.Exception.Message
}

try {
    $emp2 = @{
        first_name = "Mike"
        last_name = "Chen"
        email = "mike_$(Get-Date -Format 'HHmmss')@test.com"
        role = "EMPLOYEE"
    } | ConvertTo-Json
    $newEmp2 = Invoke-RestMethod -Uri "$baseUrl/employee/create" -Method POST -Headers $authHeaders -Body $emp2
    Log-Test "Create Employee" $true "Employee ID: $($newEmp2.employee_id)"
    $results["employee"] = $newEmp2
} catch {
    Log-Test "Create Employee" $false $_.Exception.Message
}

# PHASE 5: PROFILE
Write-Host "`n--- PHASE 4: Profile Management ---" -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/profile/me" -Method GET -Headers $authHeaders
    Log-Test "View Profile" $true "Profile: $($profile.full_name)"
} catch {
    Log-Test "View Profile" $false $_.Exception.Message
}

try {
    $updateData = @{ bio = "Test bio for admin" } | ConvertTo-Json
    $updated = Invoke-RestMethod -Uri "$baseUrl/profile/update" -Method PATCH -Headers $authHeaders -Body $updateData
    Log-Test "Update Profile" $true "Bio updated"
} catch {
    Log-Test "Update Profile" $false $_.Exception.Message
}

# PHASE 6: ATTENDANCE
Write-Host "`n--- PHASE 5: Attendance ---" -ForegroundColor Yellow
try {
    $checkinBody = @{ action = "check_in" } | ConvertTo-Json
    $checkin = Invoke-RestMethod -Uri "$baseUrl/attendance/check" -Method POST -Headers $authHeaders -Body $checkinBody
    Log-Test "Check-In" $true $checkin.message
} catch {
    Log-Test "Check-In" $false $_.Exception.Message
}

try {
    $myAtt = Invoke-RestMethod -Uri "$baseUrl/attendance/my?days=30" -Method GET -Headers $authHeaders
    Log-Test "My Attendance" $true "Records: $($myAtt.attendance.Count)"
} catch {
    Log-Test "My Attendance" $false $_.Exception.Message
}

try {
    $checkoutBody = @{ action = "check_out" } | ConvertTo-Json
    $checkout = Invoke-RestMethod -Uri "$baseUrl/attendance/check" -Method POST -Headers $authHeaders -Body $checkoutBody
    Log-Test "Check-Out" $true $checkout.message
} catch {
    Log-Test "Check-Out" $false $_.Exception.Message
}

# PHASE 7: LEAVE
Write-Host "`n--- PHASE 6: Leave Management ---" -ForegroundColor Yellow
try {
    $leaveBody = @{
        leave_type = "PAID"
        start_date = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
        end_date = (Get-Date).AddDays(9).ToString("yyyy-MM-dd")
        reason = "Family vacation"
    } | ConvertTo-Json
    $leave = Invoke-RestMethod -Uri "$baseUrl/timeoff/request" -Method POST -Headers $authHeaders -Body $leaveBody
    Log-Test "Request Leave" $true "Leave ID: $($leave.id)"
    $results["leave_id"] = $leave.id
} catch {
    Log-Test "Request Leave" $false $_.Exception.Message
}

try {
    $myLeaves = Invoke-RestMethod -Uri "$baseUrl/timeoff/request" -Method GET -Headers $authHeaders
    Log-Test "My Leaves" $true "Count: $($myLeaves.Count)"
} catch {
    Log-Test "My Leaves" $false $_.Exception.Message
}

try {
    $allLeaves = Invoke-RestMethod -Uri "$baseUrl/timeoff/manage" -Method GET -Headers $authHeaders
    Log-Test "All Leaves (Admin)" $true "Count: $($allLeaves.Count)"
} catch {
    Log-Test "All Leaves (Admin)" $false $_.Exception.Message
}

# PHASE 8: DASHBOARDS
Write-Host "`n--- PHASE 7: Dashboards ---" -ForegroundColor Yellow
try {
    $empDash = Invoke-RestMethod -Uri "$baseUrl/dashboard/employee" -Method GET -Headers $authHeaders
    Log-Test "Employee Dashboard" $true
} catch {
    Log-Test "Employee Dashboard" $false $_.Exception.Message
}

try {
    $adminDash = Invoke-RestMethod -Uri "$baseUrl/dashboard/admin" -Method GET -Headers $authHeaders
    Log-Test "Admin Dashboard" $true "Total Employees: $($adminDash.total_employees)"
} catch {
    Log-Test "Admin Dashboard" $false $_.Exception.Message
}

# PHASE 9: REPORTS
Write-Host "`n--- PHASE 8: Reports ---" -ForegroundColor Yellow
try {
    $attReport = Invoke-RestMethod -Uri "$baseUrl/reports/attendance?start_date=2026-01-01&end_date=2026-12-31" -Method GET -Headers $authHeaders
    Log-Test "Attendance Report (JSON)" $true
} catch {
    Log-Test "Attendance Report (JSON)" $false $_.Exception.Message
}

try {
    $payrollReport = Invoke-RestMethod -Uri "$baseUrl/reports/payroll?month=1&year=2026" -Method GET -Headers $authHeaders
    Log-Test "Payroll Report (JSON)" $true
} catch {
    Log-Test "Payroll Report (JSON)" $false $_.Exception.Message
}

try {
    $leaveReport = Invoke-RestMethod -Uri "$baseUrl/reports/leave?start_date=2026-01-01&end_date=2026-12-31" -Method GET -Headers $authHeaders
    Log-Test "Leave Report (JSON)" $true
} catch {
    Log-Test "Leave Report (JSON)" $false $_.Exception.Message
}

# PHASE 10: NOTIFICATIONS
Write-Host "`n--- PHASE 9: Notifications ---" -ForegroundColor Yellow
try {
    $notifs = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers $authHeaders
    Log-Test "Get Notifications" $true "Count: $($notifs.Count)"
} catch {
    Log-Test "Get Notifications" $false $_.Exception.Message
}

# PHASE 11: ANALYTICS
Write-Host "`n--- PHASE 10: Analytics Dashboard ---" -ForegroundColor Yellow
try {
    $analyticsDash = Invoke-RestMethod -Uri "$baseUrl/analytics/dashboard" -Method GET -Headers $authHeaders
    Log-Test "Master Dashboard" $true
} catch {
    Log-Test "Master Dashboard" $false $_.Exception.Message
}

try {
    $attTrend = Invoke-RestMethod -Uri "$baseUrl/analytics/attendance-trend?days=90" -Method GET -Headers $authHeaders
    Log-Test "Attendance Trends" $true
} catch {
    Log-Test "Attendance Trends" $false $_.Exception.Message
}

try {
    $leaveAn = Invoke-RestMethod -Uri "$baseUrl/analytics/leave?year=2026" -Method GET -Headers $authHeaders
    Log-Test "Leave Analytics" $true
} catch {
    Log-Test "Leave Analytics" $false $_.Exception.Message
}

try {
    $payrollAn = Invoke-RestMethod -Uri "$baseUrl/analytics/payroll" -Method GET -Headers $authHeaders
    Log-Test "Payroll Analytics" $true
} catch {
    Log-Test "Payroll Analytics" $false $_.Exception.Message
}

# PHASE 12: ADVANCED ANALYTICS
Write-Host "`n--- PHASE 11: Advanced Analytics (Unique Features) ---" -ForegroundColor Yellow
try {
    $predictive = Invoke-RestMethod -Uri "$baseUrl/analytics/predictive" -Method GET -Headers $authHeaders
    Log-Test "Predictive Analytics" $true
} catch {
    Log-Test "Predictive Analytics" $false $_.Exception.Message
}

try {
    $anomalies = Invoke-RestMethod -Uri "$baseUrl/analytics/anomalies" -Method GET -Headers $authHeaders
    Log-Test "Anomaly Detection" $true
} catch {
    Log-Test "Anomaly Detection" $false $_.Exception.Message
}

try {
    $perfScores = Invoke-RestMethod -Uri "$baseUrl/analytics/performance-scores" -Method GET -Headers $authHeaders
    Log-Test "Performance Scores" $true
} catch {
    Log-Test "Performance Scores" $false $_.Exception.Message
}

try {
    $graphData = Invoke-RestMethod -Uri "$baseUrl/analytics/graph-data" -Method GET -Headers $authHeaders
    Log-Test "Graph Data (All Types)" $true
} catch {
    Log-Test "Graph Data (All Types)" $false $_.Exception.Message
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
