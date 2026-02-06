import React from 'react'
import './Badge.css'

/**
 * Professional Badge Component
 * For status indicators and labels
 */
export const Badge = ({
    children,
    variant = 'primary',
    size = 'md',
    dot = false,
    className = '',
    ...props
}) => {
    const variantClass = `hrms-badge-${variant}`
    const sizeClass = `hrms-badge-${size}`
    const dotClass = dot ? 'hrms-badge-dot' : ''

    return (
        <span className={`hrms-badge ${variantClass} ${sizeClass} ${dotClass} ${className}`} {...props}>
            {dot && <span className="badge-dot-indicator"></span>}
            {children}
        </span>
    )
}

/**
 * Status Badge Component
 * Pre-configured badges for common statuses
 */
export const StatusBadge = ({ status }) => {
    const statusConfig = {
        // Attendance statuses
        PRESENT: { variant: 'success', label: 'Present', icon: 'check-circle-fill' },
        ABSENT: { variant: 'danger', label: 'Absent', icon: 'x-circle-fill' },
        LEAVE: { variant: 'warning', label: 'On Leave', icon: 'calendar-x' },
        HALF_DAY: { variant: 'info', label: 'Half Day', icon: 'clock' },

        // Leave statuses
        PENDING: { variant: 'warning', label: 'Pending', icon: 'clock-history' },
        APPROVED: { variant: 'success', label: 'Approved', icon: 'check-circle-fill' },
        REJECTED: { variant: 'danger', label: 'Rejected', icon: 'x-circle-fill' },

        // General statuses
        ACTIVE: { variant: 'success', label: 'Active', icon: 'check-circle-fill' },
        INACTIVE: { variant: 'gray', label: 'Inactive', icon: 'dash-circle' },
        COMPLETED: { variant: 'success', label: 'Completed', icon: 'check-circle-fill' },
        IN_PROGRESS: { variant: 'info', label: 'In Progress', icon: 'arrow-repeat' },
    }

    const config = statusConfig[status] || { variant: 'gray', label: status, icon: 'info-circle' }

    return (
        <Badge variant={config.variant}>
            <i className={`bi bi-${config.icon} me-1`}></i>
            {config.label}
        </Badge>
    )
}

export default Badge
