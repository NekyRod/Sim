import React from 'react';

/**
 * Select Component
 * 
 * @param {string} label - Label text
 * @param {string} helper - Helper text below select
 * @param {string} error - Error message
 * @param {Array} options - Array of {value, label} objects
 * @param {React.ReactNode} children - Alternative to options prop
 * @param {string} className - Additional classes
 */
export const Select = ({ 
  label, 
  helper,
  options = [], 
  children, 
  error, 
  className = '',
  id,
  ...props 
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);
  
  const baseSelectStyles = `
    w-full
    px-4 py-2.5
    border-2
    rounded-[var(--radius-md)]
    text-[var(--color-text-primary)]
    bg-[var(--color-surface-primary)]
    transition-all
    disabled:bg-gray-100 
    disabled:text-[var(--color-text-disabled)]
    disabled:cursor-not-allowed
    appearance-none
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%236b7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8l4 4 4-4"/%3E%3C/svg%3E')]
    bg-[length:1.5em_1.5em]
    bg-[right_0.5rem_center]
    bg-no-repeat
    pr-10
  `.replace(/\s+/g, ' ').trim();
  
  const borderStyles = hasError
    ? 'border-[var(--color-status-danger)] focus:border-[var(--color-status-danger)]'
    : 'border-[var(--color-border-primary)] focus:border-[var(--color-brand-primary)]';
    
  const focusStyles = hasError
    ? 'focus:ring-2 focus:ring-[var(--color-status-danger-bg)] focus:outline-none'
    : 'focus:shadow-[var(--shadow-focus)] focus:outline-none';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label 
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
      
      <select
        id={selectId}
        className={`${baseSelectStyles} ${borderStyles} ${focusStyles} ${className}`}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined
        }
        {...props}
      >
        {options.length > 0 ? options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )) : children}
      </select>
      
      {helper && !error && (
        <span 
          id={`${selectId}-helper`}
          className="text-xs text-[var(--color-text-tertiary)]"
        >
          {helper}
        </span>
      )}
      
      {error && (
        <span 
          id={`${selectId}-error`}
          className="text-xs text-[var(--color-status-danger)] flex items-center gap-1"
          role="alert"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};
