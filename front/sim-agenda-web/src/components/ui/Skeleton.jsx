import React from 'react';

/**
 * Skeleton Loader Component
 * Subtle pulse animation for loading states
 * 
 * @param {string} variant - text | title | avatar | rectangle
 * @param {number} count - Number of skeleton items
 * @param {string} className - Additional classes
 */
export const Skeleton = ({ 
  variant = 'text',
  count = 1,
  className = '',
  ...props 
}) => {
  const baseStyles = `
    bg-gradient-to-r 
    from-gray-200 
    via-gray-100 
    to-gray-200
    bg-[length:200%_100%]
    animate-shimmer
    rounded-[var(--radius-md)]
  `.replace(/\s+/g, ' ').trim();
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    rectangle: 'h-32 w-full',
    button: 'h-10 w-24',
    input: 'h-10 w-full',
  };
  
  const items = Array.from({ length: count }, (_, i) => (
    <div 
      key={i}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  ));
  
  return count === 1 ? items[0] : <div className="space-y-3">{items}</div>;
};

/**
 * Table Skeleton Loader
 * For loading table data
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-[var(--color-border-primary)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-5" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Card Skeleton Loader
 * For loading card content
 */
export const CardSkeleton = () => {
  return (
    <div className="p-6 space-y-4">
      <Skeleton variant="title" />
      <Skeleton variant="text" count={3} />
      <div className="flex gap-2 pt-4">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
};
