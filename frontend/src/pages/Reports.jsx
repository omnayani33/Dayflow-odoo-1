import { useState, useEffect } from 'react'
import { reportsAPI } from '../api/endpoints'
import { authUtils } from '../utils/authUtils'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

function Reports() {
    const [activeTab, setActiveTab] = useState('attendance')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)
    const [filter, setFilter] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    })

    useEffect(() => {
        fetchReport()
    }, [activeTab, filter])

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

    const renderContent = () => {
        if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        if (!data) return <div className="text-center py-5">No Data Available</div>

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
            return (
                <div className="report-content animate-fade-in">
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="glass-card stat-card glass-card-primary">
                                <div className="stat-card-value text-center">{data.summary?.total_employees}</div>
                                <div className="stat-card-label text-center">Total Employees</div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card glass-card-success">
                                <div className="stat-card-value text-center">{data.summary?.present}</div>
                                <div className="stat-card-label text-center">Present</div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card glass-card-danger">
                                <div className="stat-card-value text-center">{data.summary?.absent}</div>
                                <div className="stat-card-label text-center">Absent</div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="glass-card stat-card glass-card-warning">
                                <div className="stat-card-value text-center">{data.summary?.avg_work_hours?.toFixed(1) || 0}h</div>
                                <div className="stat-card-label text-center">Avg Work Hours</div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="mb-4 text-white">Attendance Distribution</h5>
                                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                    <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="glass-card p-4 h-100">
                                <h5 className="mb-4 text-white">Department Wise Presence</h5>
                                {/* Determine visual representation for department stats if available in API response */}
                                <ul className="list-group list-group-flush glass-list">
                                    {Object.entries(data.department_stats || {}).map(([dept, stats], idx) => (
                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom border-light-subtle text-white">
                                            {dept}
                                            <span className="badge bg-primary rounded-pill">{stats.present_percentage}% Present</span>
                                        </li>
                                    ))}
                                    {Object.keys(data.department_stats || {}).length === 0 && <p className="text-center text-muted">No department data</p>}
                                </ul>
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
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }]
            }
            return (
                <div className="report-content animate-fade-in">
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-primary">
                                <div className="stat-card-value text-center">{data.summary?.total_requests}</div>
                                <div className="stat-card-label text-center">Total Requests</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-success">
                                <div className="stat-card-value text-center">{data.summary?.approved}</div>
                                <div className="stat-card-label text-center">Approved</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-danger">
                                <div className="stat-card-value text-center">{data.summary?.rejected}</div>
                                <div className="stat-card-label text-center">Rejected</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <h5 className="mb-4 text-white">Leave Breakdown by Type</h5>
                        <div style={{ height: '300px' }}>
                            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#cbd5e1' } }, x: { grid: { display: false }, ticks: { color: '#cbd5e1' } } } }} />
                        </div>
                    </div>
                </div>
            )
        }

        if (activeTab === 'payroll') {
            return (
                <div className="report-content animate-fade-in">
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-success">
                                <div className="stat-card-value text-center">₹{data.summary?.total_payout?.toLocaleString()}</div>
                                <div className="stat-card-label text-center">Total Payout</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-warning">
                                <div className="stat-card-value text-center">₹{data.summary?.avg_salary?.toLocaleString()}</div>
                                <div className="stat-card-label text-center">Avg Salary</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="glass-card stat-card glass-card-info">
                                <div className="stat-card-value text-center">{data.summary?.processed_count}</div>
                                <div className="stat-card-label text-center">Processed Employees</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <h5 className="mb-4 text-white">Payroll Distribution</h5>
                        <div className="table-responsive">
                            <table className="table table-dark table-hover bg-transparent mb-0" style={{ '--bs-table-bg': 'transparent' }}>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th className="text-end">Amount</th>
                                        <th className="text-end">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Basic Salary</td>
                                        <td className="text-end">₹{data.distribution?.basic_salary?.toLocaleString()}</td>
                                        <td className="text-end">{((data.distribution?.basic_salary / data.summary?.total_payout) * 100).toFixed(1)}%</td>
                                    </tr>
                                    <tr>
                                        <td>Allowances</td>
                                        <td className="text-end">₹{data.distribution?.allowances?.toLocaleString()}</td>
                                        <td className="text-end">{((data.distribution?.allowances / data.summary?.total_payout) * 100).toFixed(1)}%</td>
                                    </tr>
                                    <tr>
                                        <td>Deductions</td>
                                        <td className="text-end text-danger">-₹{data.distribution?.deductions?.toLocaleString()}</td>
                                        <td className="text-end text-danger">{((data.distribution?.deductions / data.summary?.total_payout) * 100).toFixed(1)}%</td>
                                    </tr>
                                    <tr className="fw-bold">
                                        <td>Net Pay</td>
                                        <td className="text-end text-success">₹{(data.summary?.total_payout - (data.distribution?.deductions || 0)).toLocaleString()}</td>
                                        <td className="text-end"></td>
                                    </tr>
                                </tbody>
                            </table>
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
                    <p className="page-subtitle">Detailed insights into company performance</p>
                </div>
                <div className="filters d-flex gap-3">
                    <select className="glass-select" value={filter.month} onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select className="glass-select" value={filter.year} onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
                {['attendance', 'leave', 'payroll'].map(tab => (
                    <button
                        key={tab}
                        className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {renderContent()}

            <style jsx>{`
                .reports-page { animation: fadeIn 0.4s ease-out; }
                .page-title { color: white; font-size: 1.75rem; margin-bottom: 0.25rem; }
                .page-subtitle { color: #94a3b8; margin-bottom: 0; }
                .glass-select { padding: 0.5rem 2rem 0.5rem 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; cursor: pointer; }
                .glass-select option { background: #1e293b; }
                .filter-tab { padding: 0.5rem 1.25rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #94a3b8; font-weight: 500; cursor: pointer; transition: all 0.2s; text-transform: capitalize; }
                .filter-tab:hover { background: rgba(255,255,255,0.08); color: white; }
                .filter-tab.active { background: rgba(37,99,235,0.2); border-color: rgba(37,99,235,0.3); color: white; }
                .stat-card-value { font-size: 2rem; font-weight: 700; color: white; }
                .stat-card-label { font-size: 0.85rem; color: #94a3b8; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}

export default Reports
