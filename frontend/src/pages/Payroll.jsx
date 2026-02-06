import { useState, useEffect } from 'react'
import { payrollAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'

function Payroll() {
  const [payrollData, setPayrollData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdmin = authUtils.isAdmin()
  const userInfo = authUtils.getUserInfo()

  useEffect(() => {
    fetchPayroll()
  }, [])

  const fetchPayroll = async () => {
    try {
      setLoading(true)
      const response = await payrollAPI.getMySalary()
      const profile = response.data

      // Calculate derived values if not present
      const basic = parseFloat(profile.basic_salary) || 0
      const hra = parseFloat(profile.house_rent_allowance) || 0
      const other = parseFloat(profile.other_allowance) || 0
      const gross = basic + hra + other // Simplistic calculation if not provided

      // Mocking deductions for display as backend might not have full tax engine yet
      // In a real app, this would come from a dedicated /payslip endpoint
      const pf = basic * 0.12
      const tax = gross > 50000 ? gross * 0.1 : 0
      const totalDeductions = pf + tax

      setPayrollData({
        employee_name: userInfo?.full_name,
        employee_id: userInfo?.employee_id,
        department: profile.department || 'N/A',
        designation: profile.designation || 'N/A',
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        earnings: {
          basic_salary: basic,
          hra: hra,
          standard_allowance: 0, // Not in profile?
          performance_bonus: 0,
          lta: 0,
          fixed_allowance: other,
          gross_salary: gross
        },
        deductions: {
          professional_tax: 200,
          pf_employee: pf,
          income_tax: tax,
          total_deductions: totalDeductions + 200
        },
        net_salary: gross - (totalDeductions + 200)
      })
    } catch (err) {
      console.error('Payroll error:', err)
      setError('Failed to load payroll data. Please contact HR if this persists.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-3 text-muted-light">Loading payroll...</p>
      </div>
    )
  }

  return (
    <div className="payroll-page">
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">View your salary details and payslips</p>
        </div>
        <div className="d-flex gap-2">
          {isAdmin && (
            <button className="glass-btn glass-btn-primary" onClick={() => alert('Edit Salary Structure - Feature coming implementation')}>
              <i className="bi bi-pencil me-2"></i>Edit Structure
            </button>
          )}
          <button className="glass-btn">
            <i className="bi bi-download me-2"></i>
            Download Payslip
          </button>
        </div>
      </div>

      {/* Payslip Card */}
      <div className="glass-card payslip-card">
        {/* Header */}
        <div className="payslip-header">
          <div className="company-info">
            <div className="company-logo">
              <i className="bi bi-layers-fill"></i>
            </div>
            <div>
              <h4>Dayflow HRMS</h4>
              <p>Salary Slip - {payrollData?.month} {payrollData?.year}</p>
            </div>
          </div>
          <span className="payslip-badge">
            <i className="bi bi-check-circle me-1"></i>
            Paid
          </span>
        </div>

        {/* Employee Info */}
        <div className="employee-info-row">
          <div className="info-block">
            <span className="info-label">Employee Name</span>
            <span className="info-value">{payrollData?.employee_name}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Employee ID</span>
            <span className="info-value">{payrollData?.employee_id}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Department</span>
            <span className="info-value">{payrollData?.department}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Designation</span>
            <span className="info-value">{payrollData?.designation}</span>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="salary-breakdown">
          <div className="row">
            {/* Earnings */}
            <div className="col-md-6 mb-4 mb-md-0">
              <div className="breakdown-section">
                <h5 className="section-title">
                  <i className="bi bi-plus-circle me-2 text-success"></i>
                  Earnings
                </h5>
                <div className="breakdown-items">
                  <div className="breakdown-item">
                    <span>Basic Salary</span>
                    <span>₹{payrollData?.earnings?.basic_salary?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>House Rent Allowance (HRA)</span>
                    <span>₹{payrollData?.earnings?.hra?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Standard Allowance</span>
                    <span>₹{payrollData?.earnings?.standard_allowance?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Performance Bonus</span>
                    <span>₹{payrollData?.earnings?.performance_bonus?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Leave Travel Allowance</span>
                    <span>₹{payrollData?.earnings?.lta?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Fixed Allowance</span>
                    <span>₹{payrollData?.earnings?.fixed_allowance?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-total">
                    <span>Gross Salary</span>
                    <span>₹{payrollData?.earnings?.gross_salary?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="col-md-6">
              <div className="breakdown-section">
                <h5 className="section-title">
                  <i className="bi bi-dash-circle me-2 text-danger"></i>
                  Deductions
                </h5>
                <div className="breakdown-items">
                  <div className="breakdown-item">
                    <span>Professional Tax</span>
                    <span>₹{payrollData?.deductions?.professional_tax?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>PF Employee Contribution (12%)</span>
                    <span>₹{payrollData?.deductions?.pf_employee?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Income Tax (TDS)</span>
                    <span>₹{payrollData?.deductions?.income_tax?.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-total deduction">
                    <span>Total Deductions</span>
                    <span>₹{payrollData?.deductions?.total_deductions?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="net-salary-section">
          <div className="net-salary-box">
            <span className="net-label">Net Salary</span>
            <span className="net-value">₹{payrollData?.net_salary?.toLocaleString()}</span>
            <span className="net-words">Forty Four Thousand Three Hundred Only</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .payroll-page {
          animation: fadeIn 0.4s ease-out;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          color: white;
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .page-subtitle {
          color: #94a3b8;
          margin-bottom: 0;
        }

        .text-muted-light {
          color: #94a3b8;
        }

        .payslip-card {
          overflow: hidden;
        }

        .payslip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0.05) 100%);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .company-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .company-logo {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 12px;
          color: white;
          font-size: 1.5rem;
        }

        .company-info h4 {
          color: white;
          margin: 0 0 0.25rem;
        }

        .company-info p {
          color: #94a3b8;
          margin: 0;
          font-size: 0.9rem;
        }

        .payslip-badge {
          padding: 0.5rem 1rem;
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3);
          border-radius: 50px;
          color: #34d399;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .employee-info-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .info-block {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 0.95rem;
          color: white;
          font-weight: 500;
        }

        .salary-breakdown {
          padding: 1.5rem;
        }

        .section-title {
          color: white;
          font-size: 1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }

        .breakdown-section {
          padding: 1.25rem;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .breakdown-total {
          display: flex;
          justify-content: space-between;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-weight: 600;
          color: #34d399;
        }

        .breakdown-total.deduction {
          color: #f87171;
        }

        .net-salary-section {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%);
          border-top: 1px solid rgba(16,185,129,0.2);
        }

        .net-salary-box {
          text-align: center;
        }

        .net-label {
          display: block;
          font-size: 0.85rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
        }

        .net-value {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: #34d399;
          margin-bottom: 0.25rem;
        }

        .net-words {
          font-size: 0.85rem;
          color: #94a3b8;
          font-style: italic;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .payslip-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .company-info {
            flex-direction: column;
          }

          .net-value {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Payroll
