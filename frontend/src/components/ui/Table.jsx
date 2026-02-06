import React from 'react'
import './Table.css'

/**
 * Professional Table Component
 * Responsive table with sorting, pagination support
 */
export const Table = ({
    children,
    striped = false,
    hover = true,
    bordered = false,
    responsive = true,
    className = '',
    ...props
}) => {
    const stripedClass = striped ? 'table-striped' : ''
    const hoverClass = hover ? 'table-hover' : ''
    const borderedClass = bordered ? 'table-bordered' : ''

    const table = (
        <table className={`hrms-table ${stripedClass} ${hoverClass} ${borderedClass} ${className}`} {...props}>
            {children}
        </table>
    )

    if (responsive) {
        return <div className="hrms-table-container">{table}</div>
    }

    return table
}

export const TableHead = ({ children, className = '', ...props }) => {
    return (
        <thead className={`hrms-table-head ${className}`} {...props}>
            {children}
        </thead>
    )
}

export const TableBody = ({ children, className = '', ...props }) => {
    return (
        <tbody className={`hrms-table-body ${className}`} {...props}>
            {children}
        </tbody>
    )
}

export const TableRow = ({ children, className = '', ...props }) => {
    return (
        <tr className={`hrms-table-row ${className}`} {...props}>
            {children}
        </tr>
    )
}

export const TableHeader = ({ children, sortable = false, sorted, onSort, className = '', ...props }) => {
    return (
        <th
            className={`hrms-table-header ${sortable ? 'sortable' : ''} ${sorted ? `sorted-${sorted}` : ''} ${className}`}
            onClick={sortable ? onSort : undefined}
            {...props}
        >
            <div className="th-content">
                <span>{children}</span>
                {sortable && (
                    <span className="sort-icon">
                        {!sorted && <i className="bi bi-arrow-down-up"></i>}
                        {sorted === 'asc' && <i className="bi bi-arrow-up"></i>}
                        {sorted === 'desc' && <i className="bi bi-arrow-down"></i>}
                    </span>
                )}
            </div>
        </th>
    )
}

export const TableCell = ({ children, className = '', ...props }) => {
    return (
        <td className={`hrms-table-cell ${className}`} {...props}>
            {children}
        </td>
    )
}

/**
 * Empty State Component for Tables
 */
export const TableEmptyState = ({
    icon = 'inbox',
    title = 'No data available',
    description = 'There are no records to display',
    action
}) => {
    return (
        <div className="table-empty-state">
            <i className={`bi bi-${icon} empty-icon`}></i>
            <h4 className="empty-title">{title}</h4>
            <p className="empty-description">{description}</p>
            {action && <div className="empty-action">{action}</div>}
        </div>
    )
}

/**
 * Table Loading State
 */
export const TableLoading = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="table-loading">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="loading-row">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div key={colIndex} className="loading-cell">
                            <div className="skeleton"></div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

export default Table
