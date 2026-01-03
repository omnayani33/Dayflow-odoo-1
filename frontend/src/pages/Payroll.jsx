import { useState, useEffect } from 'react'
import { FiDollarSign, FiDownload, FiUsers, FiTrendingUp } from 'react-icons/fi'
import { authUtils } from '../utils/authUtils'
import axios from '../api/axios'

function Payroll() {
  const [payrollData, setPayrollData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const isAdmin = authUtils.isAdmin()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  useEffect(() => {
    fetchPayrollData()
  }, [month, year])

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/auth/reports/payroll?month=${month}&year=${year}`)
      setPayrollData(response.data)
    } catch (err) {
      console.error('Payroll fetch error:', err)
      setMessage({ type: 'danger', text: 'Failed to load payroll data' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true)
      const response = await axios.get(`/api/auth/reports/payroll/csv?month=${month}&year=${year}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `payroll_report_${month}_${year}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      setMessage({ type: 'success', text: 'Report downloaded successfully!' })
    } catch (err) {
      console.error('Download error:', err)
      setMessage({ type: 'danger', text: 'Failed to download report' })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    )
  }

  // Employee View - Show only their own payroll
  if (!isAdmin && payrollData && payrollData.payroll_data && payrollData.payroll_data.length > 0) {
    const employeeData = payrollData.payroll_data[0]
    
    return (
      <div>
        <h2 className="mb-4">My Payroll</h2>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible`}>
            {message.text}
            <button className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Month/Year Selector */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Month</label>
                <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Year</label>
                <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Attendance Summary</h5>
            <div className="row text-center">
              <div className="col-md-3">
                <h3 className="text-success">{employeeData.attendance.present_days}</h3>
                <small className="text-muted">Present Days</small>
              </div>
              <div className="col-md-3">
                <h3 className="text-warning">{employeeData.attendance.leave_days}</h3>
                <small className="text-muted">Leave Days</small>
              </div>
              <div className="col-md-3">
                <h3 className="text-danger">{employeeData.attendance.absent_days}</h3>
                <small className="text-muted">Absent Days</small>
              </div>
              <div className="col-md-3">
                <h3 className="text-primary">{employeeData.attendance.working_days}</h3>
                <small className="text-muted">Working Days</small>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Earnings</h5>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td>Monthly Wage</td>
                      <td className="text-end"><strong>₹ {employeeData.salary_details.monthly_wage.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                      <td>Basic Salary</td>
                      <td className="text-end">₹ {employeeData.salary_details.basic_salary.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>HRA</td>
                      <td className="text-end">₹ {employeeData.salary_details.hra.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Standard Allowance</td>
                      <td className="text-end">₹ {employeeData.salary_details.standard_allowance.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Performance Bonus</td>
                      <td className="text-end">₹ {employeeData.salary_details.performance_bonus.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>LTA</td>
                      <td className="text-end">₹ {employeeData.salary_details.lta.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Fixed Allowance</td>
                      <td className="text-end">₹ {employeeData.salary_details.fixed_allowance.toFixed(2)}</td>
                    </tr>
                    <tr className="table-active">
                      <td><strong>Gross Salary</strong></td>
                      <td className="text-end"><strong>₹ {employeeData.salary_details.gross_salary.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Deductions</h5>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td>Professional Tax</td>
                      <td className="text-end">₹ {employeeData.deductions.professional_tax.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>PF (Employee)</td>
                      <td className="text-end">₹ {employeeData.deductions.pf_employee.toFixed(2)}</td>
                    </tr>
                    <tr className="table-active">
                      <td><strong>Total Deductions</strong></td>
                      <td className="text-end"><strong>₹ {employeeData.deductions.total_deductions.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Net Salary</h5>
                    <h4 className="mb-0 text-success">₹ {employeeData.net_salary.toFixed(2)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin View - Show all employees
  if (isAdmin && payrollData) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Payroll Management</h2>
          <button 
            className="btn btn-success"
            onClick={handleDownloadCSV}
            disabled={downloading}
          >
            <FiDownload className="me-2" />
            {downloading ? 'Downloading...' : 'Export CSV'}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible`}>
            {message.text}
            <button className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Month/Year Selector */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">Month</label>
                <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Year</label>
                <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FiUsers size={40} className="text-primary me-3" />
                  <div>
                    <h3 className="mb-0">{payrollData.summary.total_employees}</h3>
                    <small className="text-muted">Total Employees</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FiDollarSign size={40} className="text-success me-3" />
                  <div>
                    <h3 className="mb-0">₹ {payrollData.summary.total_payroll_cost.toFixed(2)}</h3>
                    <small className="text-muted">Total Payroll Cost</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Employee Payroll Details</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Working Days</th>
                    <th>Gross Salary</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.payroll_data && payrollData.payroll_data.length > 0 ? (
                    payrollData.payroll_data.map((emp) => (
                      <tr key={emp.employee_id}>
                        <td>
                          <div>
                            <strong>{emp.employee_name}</strong>
                            <br />
                            <small className="text-muted">{emp.employee_id}</small>
                          </div>
                        </td>
                        <td>{emp.department}</td>
                        <td>{emp.attendance.working_days} / {emp.attendance.total_working_days}</td>
                        <td>₹ {emp.salary_details.gross_salary.toFixed(2)}</td>
                        <td>₹ {emp.deductions.total_deductions.toFixed(2)}</td>
                        <td>
                          <strong className="text-success">₹ {emp.net_salary.toFixed(2)}</strong>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No payroll data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="alert alert-info">
      No payroll data available for this period
    </div>
  )
}

export default Payroll
