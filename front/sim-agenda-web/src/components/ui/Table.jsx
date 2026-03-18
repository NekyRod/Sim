import React from 'react';

/**
 * Table Component - Premium style
 * 
 * @param {Array} columns - Array of {key, label, render?} objects
 * @param {Array} data - Array of data objects
 * @param {string} emptyMessage - Message when no data
 * @param {boolean} hoverable - Enable row hover (default: true)
 * @param {string} className - Additional classes
 */
export const Table = ({ 
  columns = [],
  data = [],
  emptyMessage = 'No hay datos para mostrar',
  hoverable = true,
  className = '',
  ...props 
}) => {
  const tableStyles = `
    w-full
    border-collapse
    bg-[var(--color-surface-primary)]
    rounded-[var(--radius-lg)]
    overflow-hidden
    shadow-[var(--shadow-sm)]
  `.replace(/\s+/g, ' ').trim();
  
  const theadStyles = `
    bg-[var(--color-brand-primary)]
    text-[var(--color-text-inverse)]
  `.replace(/\s+/g, ' ').trim();
  
  const thStyles = `
    px-4 py-3
    text-left
    text-sm
    font-semibold
    uppercase
    tracking-wider
  `.replace(/\s+/g, ' ').trim();
  
  const tdStyles = `
    px-4 py-3
    text-sm
    text-[var(--color-text-primary)]
    border-t border-[var(--color-border-primary)]
  `.replace(/\s+/g, ' ').trim();
  
  const rowStyles = hoverable
    ? 'transition-colors hover:bg-[var(--color-surface-secondary)]'
    : '';
  
  const zebraStyles = 'even:bg-[var(--color-surface-secondary)]';

  if (data.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-primary)]">
        <svg 
          className="mx-auto h-12 w-12 text-[var(--color-text-muted)]" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <p className="mt-4 text-[var(--color-text-secondary)] font-medium">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
      <table className={`${tableStyles} ${className}`} {...props}>
        <thead className={theadStyles}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={thStyles}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`${rowStyles} ${zebraStyles}`}
            >
              {columns.map((column) => (
                <td key={column.key} className={tdStyles}>
                  {column.render 
                    ? column.render(row[column.key], row, rowIndex)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
