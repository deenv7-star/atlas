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
    <div className={`flex items-center gap-2 ${sizeClasses[size]} select-none`}>
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985b1fe56d9d0df97ea2f90/ea15d56e9_Atlaslogo2.png"
        alt="ATLAS Logo"
        className="h-full w-auto"
      />
      <div 
        className="font-bold tracking-tight flex"
        style={{ 
          color: primary,
          fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.25rem'
        }}
      >
        <span>A</span>
        <span style={{ color: colors[variant].accent }}>T</span>
        <span>L</span>
        <span style={{ color: colors[variant].accent }}>A</span>
        <span>S</span>
      </div>
    </div>
  );
}