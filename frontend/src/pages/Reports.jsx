import { useState, useEffect } from 'react'
import { reportsAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

function Reports() {
    const [activeTab, setActiveTab] = useState('attendance')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)
    const [filter, setFilter] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    })
    const [autoRefresh, setAutoRefresh] = useState(true)

    useEffect(() => {
        fetchReport()

        // Auto-refresh every 30 seconds for real-time data
        let interval
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchReport()
            }, 30000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [activeTab, filter, autoRefresh])

    const fetchReport = async () => {
        try {
            setLoading(true)
            let response
            if (activeTab === 'attendance') {
                response = await reportsAPI.getAttendanceReport(filter.month, filter.year)
            } else if (activeTab === 'leave') {
                response = await reportsAPI.getLeaveReport(filter.year)
            } else if (activeTab === 'payroll') {
                response = await reportsAPI.getPayrollReport(filter.month, filter.year)
            }
            setData(response.data)
        } catch (err) {
            console.error('Report fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const downloadCSV = async () => {
        try {
            let response
            if (activeTab === 'attendance') {
                response = await reportsAPI.downloadAttendanceCSV(filter.month, filter.year)
            } else if (activeTab === 'leave') {
                response = await reportsAPI.downloadLeaveCSV(filter.year)
            } else if (activeTab === 'payroll') {
                response = await reportsAPI.downloadPayrollCSV(filter.month, filter.year)
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${activeTab}_report_${filter.month}_${filter.year}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            console.error('Download error:', err)
        }
    }

    const renderContent = () => {
        if (loading && !data) return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
                <p className="mt-3 text-muted">Loading real-time data...</p>
            </div>
        )
        if (!data) return <div className="empty-state"><i className="bi bi-graph-up"></i><h5>No Data Available</h5><p>Select a different period</p></div>

        if (activeTab === 'attendance') {
            const chartData = {
                labels: ['Present', 'Absent', 'Leave', 'Half Day'],
                datasets: [{
                    label: 'Attendance Stats',
                    data: [
                        data.summary?.present || 0,
                        data.summary?.absent || 0,
                        data.summary?.leave || 0,
                        data.summary?.half_day || 0
                    ],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
                    borderWidth: 0
                }]
            }

            // Daily trend data
            const trendData = {
                labels: data.daily_trend?.map(d => new Date(d.date).getDate()) || [],
                datasets: [{
                    label: 'Present',
                    data: data.daily_trend?.map(d => d.present) || [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Absent',
                    data: data.daily_trend?.map(d => d.absent) || [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }]
            }

            return (
                <div className="report-content animate-fade-in">
                    {/* Summary Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-primary">
                                <div className="stat-icon"><i className="bi bi-people-fill"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.total_employees || 0}</div>
                                    <div className="stat-card-label">Total Employees</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-success">
                                <div className="stat-icon"><i className="bi bi-check-circle-fill"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.present || 0}</div>
                                    <div className="stat-card-label">Present</div>
                                    <div className="stat-card-percentage">{((data.summary?.present / data.summary?.total_employees) * 100 || 0).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-danger">
                                <div className="stat-icon"><i className="bi bi-x-circle-fill"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.absent || 0}</div>
                                    <div className="stat-card-label">Absent</div>
                                    <div className="stat-card-percentage">{((data.summary?.absent / data.summary?.total_employees) * 100 || 0).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-warning">
                                <div className="stat-icon"><i className="bi bi-clock-history"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.avg_work_hours?.toFixed(1) || 0}h</div>
                                    <div className="stat-card-label">Avg Work Hours</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="row g-4 mb-4">
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-pie-chart me-2"></i>Attendance Distribution</h5>
                                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                    <Pie data={chartData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: { color: '#cbd5e1', padding: 15, font: { size: 12 } }
                                            }
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-graph-up me-2"></i>Daily Attendance Trend</h5>
                                <div style={{ height: '300px' }}>
                                    <Line data={trendData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { labels: { color: '#cbd5e1' } } },
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#cbd5e1' } },
                                            x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Stats & Top Performers */}
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-building me-2"></i>Department Wise Presence</h5>
                                <div className="department-stats">
                                    {Object.entries(data.department_stats || {}).map(([dept, stats], idx) => (
                                        <div key={idx} className="dept-stat-item">
                                            <div className="dept-info">
                                                <span className="dept-name">{dept}</span>
                                                <span className="dept-count">{stats.present}/{stats.total}</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{ width: `${stats.present_percentage}%` }}></div>
                                            </div>
                                            <span className="dept-percentage">{stats.present_percentage}%</span>
                                        </div>
                                    ))}
                                    {Object.keys(data.department_stats || {}).length === 0 && (
                                        <p className="text-center text-muted">No department data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-trophy me-2"></i>Top Performers (Attendance)</h5>
                                <div className="top-performers">
                                    {data.top_performers?.map((emp, idx) => (
                                        <div key={idx} className="performer-item">
                                            <div className="performer-rank">#{idx + 1}</div>
                                            <div className="performer-info">
                                                <div className="performer-name">{emp.name}</div>
                                                <div className="performer-dept">{emp.department}</div>
                                            </div>
                                            <div className="performer-stats">
                                                <div className="performer-percentage">{emp.attendance_percentage}%</div>
                                                <div className="performer-hours">{emp.avg_hours}h avg</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data.top_performers || data.top_performers.length === 0) && (
                                        <p className="text-center text-muted">No data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        if (activeTab === 'leave') {
            const chartData = {
                labels: Object.keys(data.leave_type_breakdown || {}),
                datasets: [{
                    label: 'Leave Requests',
                    data: Object.values(data.leave_type_breakdown || {}),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            }

            const statusData = {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    data: [
                        data.summary?.pending || 0,
                        data.summary?.approved || 0,
                        data.summary?.rejected || 0
                    ],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            }

            return (
                <div className="report-content animate-fade-in">
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-primary">
                                <div className="stat-icon"><i className="bi bi-calendar-event"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.total_requests || 0}</div>
                                    <div className="stat-card-label">Total Requests</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-success">
                                <div className="stat-icon"><i className="bi bi-check-circle-fill"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.approved || 0}</div>
                                    <div className="stat-card-label">Approved</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-warning">
                                <div className="stat-icon"><i className="bi bi-clock-history"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.pending || 0}</div>
                                    <div className="stat-card-label">Pending</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card stat-card-danger">
                                <div className="stat-icon"><i className="bi bi-x-circle-fill"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.rejected || 0}</div>
                                    <div className="stat-card-label">Rejected</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-bar-chart me-2"></i>Leave Breakdown by Type</h5>
                                <div style={{ height: '300px' }}>
                                    <Bar data={chartData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#cbd5e1' } },
                                            x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-pie-chart me-2"></i>Request Status Distribution</h5>
                                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                    <Pie data={statusData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 15 } } }
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        if (activeTab === 'payroll') {
            const departmentPayrollData = {
                labels: Object.keys(data.department_payroll || {}),
                datasets: [{
                    label: 'Total Payroll',
                    data: Object.values(data.department_payroll || {}).map(d => d.total),
                    backgroundColor: '#3b82f6',
                    borderWidth: 0
                }]
            }

            return (
                <div className="report-content animate-fade-in">
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="glass-card stat-card stat-card-success">
                                <div className="stat-icon"><i className="bi bi-cash-stack"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">₹{(data.summary?.total_payout || 0).toLocaleString()}</div>
                                    <div className="stat-card-label">Total Payout</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="glass-card stat-card stat-card-warning">
                                <div className="stat-icon"><i className="bi bi-wallet2"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">₹{(data.summary?.avg_salary || 0).toLocaleString()}</div>
                                    <div className="stat-card-label">Avg Salary</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="glass-card stat-card stat-card-info">
                                <div className="stat-icon"><i className="bi bi-people-fill"></i></div>
                                <div className="stat-content">
                                    <div className="stat-card-value">{data.summary?.processed_count || 0}</div>
                                    <div className="stat-card-label">Processed Employees</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-bar-chart me-2"></i>Department Wise Payroll</h5>
                                <div style={{ height: '300px' }}>
                                    <Bar data={departmentPayrollData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#cbd5e1', callback: (value) => '₹' + value.toLocaleString() } },
                                            x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="card-title mb-4"><i className="bi bi-table me-2"></i>Payroll Distribution</h5>
                                <div className="payroll-table">
                                    <div className="payroll-row">
                                        <span className="payroll-label">Basic Salary</span>
                                        <span className="payroll-value">₹{(data.distribution?.basic_salary || 0).toLocaleString()}</span>
                                        <span className="payroll-percent">{((data.distribution?.basic_salary / data.summary?.total_payout) * 100 || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="payroll-row">
                                        <span className="payroll-label">HRA</span>
                                        <span className="payroll-value">₹{(data.distribution?.hra || 0).toLocaleString()}</span>
                                        <span className="payroll-percent">{((data.distribution?.hra / data.summary?.total_payout) * 100 || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="payroll-row">
                                        <span className="payroll-label">Allowances</span>
                                        <span className="payroll-value">₹{(data.distribution?.allowances || 0).toLocaleString()}</span>
                                        <span className="payroll-percent">{((data.distribution?.allowances / data.summary?.total_payout) * 100 || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="payroll-row payroll-row-danger">
                                        <span className="payroll-label">Deductions</span>
                                        <span className="payroll-value">-₹{(data.distribution?.deductions || 0).toLocaleString()}</span>
                                        <span className="payroll-percent">{((data.distribution?.deductions / data.summary?.total_payout) * 100 || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="payroll-row payroll-row-total">
                                        <span className="payroll-label">Net Pay</span>
                                        <span className="payroll-value">₹{((data.summary?.total_payout || 0) - (data.distribution?.deductions || 0)).toLocaleString()}</span>
                                        <span className="payroll-percent">100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="reports-page">
            <div className="page-header mb-4">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">
                        Detailed insights into company performance
                        {autoRefresh && <span className="live-indicator"><i className="bi bi-circle-fill"></i> Live</span>}
                    </p>
                </div>
                <div className="header-actions">
                    <div className="filters d-flex gap-2">
                        <select className="glass-select" value={filter.month} onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select className="glass-select" value={filter.year} onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button className="glass-btn glass-btn-primary" onClick={() => setAutoRefresh(!autoRefresh)}>
                        <i className={`bi bi-${autoRefresh ? 'pause' : 'play'}-fill me-2`}></i>
                        {autoRefresh ? 'Pause' : 'Resume'}
                    </button>
                    <button className="glass-btn glass-btn-success" onClick={downloadCSV}>
                        <i className="bi bi-download me-2"></i>Export CSV
                    </button>
                </div>
            </div>

            <div className="tabs-glass mb-4">
                {['attendance', 'leave', 'payroll'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        <i className={`bi bi-${tab === 'attendance' ? 'calendar-check' : tab === 'leave' ? 'calendar-x' : 'cash-stack'} me-2`}></i>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {renderContent()}

            <style jsx>{`
                .reports-page { animation: fadeIn 0.4s ease-out; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
                .page-title { color: white; font-size: 1.75rem; margin-bottom: 0.25rem; }
                .page-subtitle { color: #94a3b8; margin-bottom: 0; display: flex; align-items: center; gap: 0.5rem; }
                .live-indicator { display: inline-flex; align-items: center; gap: 0.25rem; color: #10b981; font-size: 0.75rem; font-weight: 600; }
                .live-indicator i { font-size: 0.5rem; animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
                .glass-select { padding: 0.5rem 2rem 0.5rem 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; cursor: pointer; font-size: 0.875rem; }
                .glass-select option { background: #1e293b; }
                .tabs-glass { display: flex; gap: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.04); border-radius: 12px; overflow-x: auto; }
                .tab-btn { padding: 0.75rem 1.25rem; background: transparent; border: none; border-radius: 8px; color: #94a3b8; font-size: 0.9rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; display: flex; align-items: center; }
                .tab-btn:hover { background: rgba(255,255,255,0.06); color: white; }
                .tab-btn.active { background: rgba(37,99,235,0.2); color: white; }
                .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-radius: 12px; }
                .stat-card-primary { background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%); border: 1px solid rgba(59,130,246,0.3); }
                .stat-card-success { background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.15) 100%); border: 1px solid rgba(16,185,129,0.3); }
                .stat-card-danger { background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.15) 100%); border: 1px solid rgba(239,68,68,0.3); }
                .stat-card-warning { background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.15) 100%); border: 1px solid rgba(245,158,11,0.3); }
                .stat-card-info { background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%); border: 1px solid rgba(59,130,246,0.3); }
                .stat-icon { font-size: 2.5rem; opacity: 0.8; }
                .stat-content { flex: 1; }
                .stat-card-value { font-size: 2rem; font-weight: 700; color: white; line-height: 1; }
                .stat-card-label { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
                .stat-card-percentage { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
                .card-title { color: white; display: flex; align-items: center; font-size: 1.1rem; font-weight: 600; }
                .department-stats { display: flex; flex-direction: column; gap: 1rem; }
                .dept-stat-item { display: flex; align-items: center; gap: 1rem; }
                .dept-info { flex: 0 0 150px; }
                .dept-name { color: white; font-weight: 500; display: block; }
                .dept-count { color: #64748b; font-size: 0.85rem; }
                .progress-bar-container { flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
                .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 4px; transition: width 0.3s; }
                .dept-percentage { flex: 0 0 50px; text-align: right; color: white; font-weight: 600; }
                .top-performers { display: flex; flex-direction: column; gap: 0.75rem; }
                .performer-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: rgba(255,255,255,0.04); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
                .performer-rank { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #1e40af); border-radius: 50%; color: white; font-weight: 700; font-size: 0.85rem; }
                .performer-info { flex: 1; }
                .performer-name { color: white; font-weight: 500; }
                .performer-dept { color: #64748b; font-size: 0.85rem; }
                .performer-stats { text-align: right; }
                .performer-percentage { color: #10b981; font-weight: 600; font-size: 1.1rem; }
                .performer-hours { color: #64748b; font-size: 0.85rem; }
                .payroll-table { display: flex; flex-direction: column; gap: 0.75rem; }
                .payroll-row { display: flex; align-items: center; padding: 0.75rem; background: rgba(255,255,255,0.04); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
                .payroll-row-danger { border-color: rgba(239,68,68,0.3); }
                .payroll-row-danger .payroll-value { color: #fca5a5; }
                .payroll-row-total { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); font-weight: 600; }
                .payroll-row-total .payroll-value { color: #34d399; }
                .payroll-label { flex: 1; color: #cbd5e1; }
                .payroll-value { flex: 0 0 150px; text-align: right; color: white; font-weight: 500; }
                .payroll-percent { flex: 0 0 60px; text-align: right; color: #64748b; font-size: 0.85rem; }
                .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
                .empty-state i { font-size: 4rem; margin-bottom: 1rem; display: block; opacity: 0.5; }
                .empty-state h5 { color: #94a3b8; margin-bottom: 0.5rem; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 768px) { .page-header { flex-direction: column; } .header-actions { width: 100%; } }
            `}</style>
        </div>
    )
}

export default Reports
