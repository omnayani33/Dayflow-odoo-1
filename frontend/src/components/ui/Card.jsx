import React from 'react'
import './Card.css'

/**
 * Reusable Card Component
 * Professional card component with header, body, and footer sections
 */
export const Card = ({ children, className = '', hover = false, ...props }) => {
    return (
        <div className={`hrms-card ${hover ? 'hrms-card-hover' : ''} ${className}`} {...props}>
            {children}
        </div>
    )
}

export const CardHeader = ({ children, className = '', ...props }) => {
    return (
        <div className={`hrms-card-header ${className}`} {...props}>
            {children}
        </div>
    )
}

export const CardBody = ({ children, className = '', ...props }) => {
    return (
        <div className={`hrms-card-body ${className}`} {...props}>
            {children}
        </div>
    )
}

export const CardFooter = ({ children, className = '', ...props }) => {
    return (
        <div className={`hrms-card-footer ${className}`} {...props}>
            {children}
        </div>
    )
}

export const CardTitle = ({ children, className = '', ...props }) => {
    return (
        <h3 className={`hrms-card-title ${className}`} {...props}>
            {children}
        </h3>
    )
}

export const CardSubtitle = ({ children, className = '', ...props }) => {
    return (
        <p className={`hrms-card-subtitle ${className}`} {...props}>
            {children}
        </p>
    )
}

/**
 * Stat Card Component
 * For displaying metrics and statistics
 */
export const StatCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    variant = 'primary',
    className = ''
}) => {
    const variantClass = `stat-card-${variant}`

    return (
        <Card className={`stat-card ${variantClass} ${className}`}>
            <CardBody>
                <div className="stat-card-content">
                    <div className="stat-card-info">
                        <p className="stat-card-label">{title}</p>
                        <h2 className="stat-card-value">{value}</h2>
                        {trend && (
                            <div className={`stat-card-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                                <i className={`bi bi-arrow-${trend}`}></i>
                                <span>{trendValue}</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className="stat-card-icon">
                            <i className={`bi bi-${icon}`}></i>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    )
}

export default Card
