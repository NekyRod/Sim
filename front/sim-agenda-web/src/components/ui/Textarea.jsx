import React from 'react';

/**
 * Textarea Component
 * 
 * @param {string} label - Label text
 * @param {string} helper - Helper text below textarea
 * @param {string} error - Error message
 * @param {number} rows - Number of rows (default: 4)
 * @param {string} className - Additional classes
 */
export const Textarea = ({ 
  label, 
  helper,
  error, 
  rows = 4,
  className = '', 
  id,
  ...props 
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);
  
  const baseTextareaStyles = `
    w-full
    px-4 py-2.5
    border-2
    rounded-[var(--radius-md)]
    text-[var(--color-text-primary)]
    bg-[var(--color-surface-primary)]
    transition-all
    placeholder:text-[var(--color-text-muted)]
    disabled:bg-gray-100 
    disabled:text-[var(--color-text-disabled)]
    disabled:cursor-not-allowed
    resize-vertical
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
          htmlFor={textareaId}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={`${baseTextareaStyles} ${borderStyles} ${focusStyles} ${className}`}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${textareaId}-error` : helper ? `${textareaId}-helper` : undefined
        }
        {...props}
      />
      
      {helper && !error && (
        <span 
          id={`${textareaId}-helper`}
          className="text-xs text-[var(--color-text-tertiary)]"
        >
          {helper}
        </span>
      )}
      
      {error && (
        <span 
          id={`${textareaId}-error`}
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
