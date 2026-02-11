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
  
  const { primary } = colors[variant];
  
  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985b1fe56d9d0df97ea2f90/ea15d56e9_Atlaslogo2.png"
        alt="ATLAS Logo"
        className="h-full w-auto"
      />
      <span 
        className="font-bold tracking-tight"
        style={{ 
          color: primary,
          fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.25rem'
        }}
      >
        ATLAS
      </span>
    </div>
  );
}