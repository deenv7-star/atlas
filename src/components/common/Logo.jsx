import React from 'react';

export default function Logo({ variant = 'dark', size = 'default' }) {
  const sizeClasses = {
    small: 'h-6',
    default: 'h-8',
    large: 'h-10'
  };
  
  const colors = {
    dark: { primary: '#0B1220', accent: '#00D1C1' },
    light: { primary: '#FFFFFF', accent: '#00D1C1' },
    aqua: { primary: '#00D1C1', accent: '#00D1C1' }
  };
  
  const { primary, accent } = colors[variant];
  
  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      <svg viewBox="0 0 40 40" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Flow S with location pin */}
        <path 
          d="M20 4C12 4 8 8 8 14C8 18 10 20 14 22C18 24 20 26 20 30C20 34 16 36 12 36" 
          stroke={accent} 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="28" cy="12" r="6" fill={accent} />
        <circle cx="28" cy="12" r="2.5" fill={variant === 'light' ? '#0B1220' : '#FFFFFF'} />
        <path d="M28 18L28 24" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span 
        className="font-bold tracking-tight"
        style={{ 
          color: primary,
          fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.25rem'
        }}
      >
        STAYFLOW
      </span>
    </div>
  );
}