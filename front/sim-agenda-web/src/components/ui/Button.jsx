import React from 'react';

/**
 * Button Component
 * 
 * @param {string} variant - primary | secondary | ghost | danger
 * @param {string} size - sm | md | lg
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {string} className - Additional classes
 */
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium
    transition-all
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    cursor-pointer
  `.replace(/\s+/g, ' ').trim();
  
  const variants = {
    primary: `
      bg-[var(--color-brand-primary)]
      text-[var(--color-text-inverse)]
      hover:bg-[var(--color-brand-primary-dark)]
      active:bg-[var(--color-brand-primary-dark)]
      shadow-[var(--shadow-sm)]
      hover:shadow-[var(--shadow-md)]
      hover:-translate-y-[1px]
      active:translate-y-0
    `.replace(/\s+/g, ' ').trim(),
    
    secondary: `
      bg-[var(--color-brand-accent)]
      text-[var(--color-text-inverse)]
      hover:bg-[var(--color-brand-accent-dark)]
      active:bg-[var(--color-brand-accent-dark)]
      shadow-[var(--shadow-sm)]
      hover:shadow-[var(--shadow-md)]
      hover:-translate-y-[1px]
      active:translate-y-0
    `.replace(/\s+/g, ' ').trim(),
    
    ghost: `
      bg-transparent
      text-[var(--color-brand-primary)]
      border-2 border-[var(--color-border-primary)]
      hover:bg-[var(--color-brand-primary-light)]
      hover:border-[var(--color-brand-primary)]
      active:bg-[var(--color-brand-primary-light)]
    `.replace(/\s+/g, ' ').trim(),
    
    danger: `
      bg-[var(--color-status-danger)]
      text-[var(--color-text-inverse)]
      hover:bg-red-600
      active:bg-red-700
      shadow-[var(--shadow-sm)]
      hover:shadow-[var(--shadow-md)]
      hover:-translate-y-[1px]
      active:translate-y-0
    `.replace(/\s+/g, ' ').trim(),
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-md)]',
    md: 'px-5 py-2.5 text-base rounded-[var(--radius-lg)]',
    lg: 'px-6 py-3 text-lg rounded-[var(--radius-lg)]',
  };
  
  const focusStyles = `
    focus-visible:ring-2 
    focus-visible:ring-offset-2 
    focus-visible:ring-[var(--color-brand-primary)]
  `;

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${focusStyles} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
