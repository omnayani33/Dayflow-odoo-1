import React from 'react'
import './Button.css'

/**
 * Professional Button Component
 * Supports multiple variants, sizes, and states
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    outline = false,
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    onClick,
    type = 'button',
    ...props
}) => {
    const variantClass = outline ? `btn-outline-${variant}` : `btn-${variant}`
    const sizeClass = `btn-${size}`
    const widthClass = fullWidth ? 'btn-full-width' : ''
    const loadingClass = loading ? 'btn-loading' : ''

    return (
        <button
            type={type}
            className={`hrms-btn ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className="btn-spinner"></span>
            )}
            {!loading && icon && iconPosition === 'left' && (
                <i className={`bi bi-${icon}`}></i>
            )}
            <span>{children}</span>
            {!loading && icon && iconPosition === 'right' && (
                <i className={`bi bi-${icon}`}></i>
            )}
        </button>
    )
}

/**
 * Icon Button Component
 * For icon-only buttons
 */
export const IconButton = ({
    icon,
    variant = 'ghost',
    size = 'md',
    tooltip,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`hrms-icon-btn btn-${variant} btn-${size} ${className}`}
            title={tooltip}
            {...props}
        >
            <i className={`bi bi-${icon}`}></i>
        </button>
    )
}

/**
 * Button Group Component
 */
export const ButtonGroup = ({ children, className = '' }) => {
    return (
        <div className={`hrms-btn-group ${className}`}>
            {children}
        </div>
    )
}

export default Button
