import React from 'react';

/**
 * atlas spark: a compass rose whose north ray is the longest and the only filled one.
 * Accepts className / strokeWidth so it can stand in for a lucide icon in the navigation.
 */
export function SparkMark({ size = 24, className = '', live = false, strokeWidth: _sw, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
      className={`as-mark${live ? ' is-live' : ''} ${className}`} {...rest}>
      <path className="as-mark-n" d="M12 1.6c.5 3.9 1.3 6.9 2.4 8.4L12 12l-2.4-2C10.7 8.5 11.5 5.5 12 1.6Z" fill="currentColor" />
      <path d="M12 22.4c-.35-2.6-.9-4.6-1.65-5.7L12 12l1.65 4.7c-.75 1.1-1.3 3.1-1.65 5.7ZM21.4 12c-2.6.35-4.6.9-5.7 1.65L12 12l3.7-1.65c1.1.75 3.1 1.3 5.7 1.65ZM2.6 12c2.6-.35 4.6-.9 5.7-1.65L12 12l-3.7 1.65C7.2 12.9 5.2 12.35 2.6 12Z"
        fill="currentColor" opacity=".38" />
    </svg>
  );
}

