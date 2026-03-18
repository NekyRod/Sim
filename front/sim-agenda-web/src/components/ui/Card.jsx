import React from 'react';

/**
 * Card Component
 * 
 * @param {React.ReactNode} header - Optional header content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {string} title - Optional title (shorthand for header)
 * @param {string} className - Additional classes
 */
export const Card = ({ 
  children, 
  header,
  footer,
  title,
  className = '',
  ...props 
}) => {
  const cardStyles = `
    bg-[var(--color-surface-primary)]
    rounded-[var(--radius-xl)]
    shadow-[var(--shadow-md)]
    border border-[var(--color-border-primary)]
    overflow-hidden
    transition-clinical
    hover:shadow-[var(--shadow-lg)]
    animate-slideUp
  `.replace(/\s+/g, ' ').trim();
  
  const headerContent = header || (title && (
    <h3 className="text-lg font-semibold text-[var(--color-brand-primary)]">
      {title}
    </h3>
  ));

  return (
    <div className={`${cardStyles} ${className}`} {...props}>
      {headerContent && (
        <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]">
          {headerContent}
        </div>
      )}
      
      <div className="px-6 py-5">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]">
          {footer}
        </div>
      )}
    </div>
  );
};
