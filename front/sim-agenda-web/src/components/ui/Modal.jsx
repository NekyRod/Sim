import React, { useEffect } from 'react';

/**
 * Modal Component
 * 
 * @param {boolean} open - Control modal visibility
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {string} size - sm | md | lg | xl
 * @param {boolean} closeOnOverlay - Close when clicking overlay (default: true)
 * @param {string} className - Additional classes for content
 */
export const Modal = ({ 
  open = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  className = '',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open && onClose) {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const overlayStyles = `
    fixed inset-0
    bg-[var(--color-surface-overlay)]
    backdrop-blur-sm
    z-[var(--z-index-modal-backdrop)]
    flex items-center justify-center
    p-4
    animate-fadeIn
  `.replace(/\s+/g, ' ').trim();

  const contentStyles = `
    bg-[var(--color-surface-elevated)]
    rounded-[var(--radius-xl)]
    shadow-[var(--shadow-2xl)]
    w-full
    ${sizes[size]}
    max-h-[90vh]
    overflow-hidden
    flex flex-col
    animate-slideUp
  `.replace(/\s+/g, ' ').trim();

  return (
    <div 
      className={overlayStyles}
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        className={`${contentStyles} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
            <h2 
              id="modal-title"
              className="text-xl font-semibold text-[var(--color-brand-primary)]"
            >
              {title}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded-[var(--radius-md)] hover:bg-gray-100"
                aria-label="Cerrar modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
