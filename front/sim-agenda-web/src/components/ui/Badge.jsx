import React from 'react';

/**
 * Badge Component
 * 
 * @param {string} variant - success | warning | danger | info | neutral
 * @param {string} size - sm | md
 * @param {string} className - Additional classes
 */
export const Badge = ({ 
  children, 
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium
    rounded-full
    whitespace-nowrap
  `.replace(/\s+/g, ' ').trim();
  
  const variants = {
    success: `
      bg-[var(--color-status-success-bg)]
      text-[var(--color-status-success)]
      border border-[var(--color-status-success-border)]
    `.replace(/\s+/g, ' ').trim(),
    
    warning: `
      bg-[var(--color-status-warning-bg)]
      text-[var(--color-status-warning)]
      border border-[var(--color-status-warning-border)]
    `.replace(/\s+/g, ' ').trim(),
    
    danger: `
      bg-[var(--color-status-danger-bg)]
      text-[var(--color-status-danger)]
      border border-[var(--color-status-danger-border)]
    `.replace(/\s+/g, ' ').trim(),
    
    info: `
      bg-[var(--color-status-info-bg)]
      text-[var(--color-status-info)]
      border border-[var(--color-status-info-border)]
    `.replace(/\s+/g, ' ').trim(),
    
    neutral: `
      bg-gray-100
      text-[var(--color-text-secondary)]
      border border-gray-300
    `.replace(/\s+/g, ' ').trim(),
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
