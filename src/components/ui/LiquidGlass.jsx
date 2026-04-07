import React from 'react';
import { motion } from 'framer-motion';

/* ─── Liquid Glass Component — static glass (no tilt, no looping motion) ─ */

/* ── Liquid Glass Card ──────────────────────────────────────── */
export function LiquidGlassCard({
  children,
  className = '',
  tint = 'teal',      // 'teal' | 'purple' | 'blue' | 'neutral' | 'dark'
  size = 'md',        // 'sm' | 'md' | 'lg'
  style = {},
}) {
  const tints = {
    teal:    { from: 'rgba(0,209,193,0.22)', to: 'rgba(0,168,160,0.10)', glow: 'rgba(0,209,193,0.35)', border: 'rgba(0,209,193,0.40)' },
    purple:  { from: 'rgba(139,92,246,0.22)', to: 'rgba(109,40,217,0.10)', glow: 'rgba(139,92,246,0.35)', border: 'rgba(139,92,246,0.40)' },
    blue:    { from: 'rgba(59,130,246,0.22)', to: 'rgba(37,99,235,0.10)', glow: 'rgba(59,130,246,0.35)', border: 'rgba(59,130,246,0.40)' },
    neutral: { from: 'rgba(255,255,255,0.25)', to: 'rgba(255,255,255,0.08)', glow: 'rgba(255,255,255,0.20)', border: 'rgba(255,255,255,0.30)' },
    dark:    { from: 'rgba(11,18,32,0.70)', to: 'rgba(11,18,32,0.40)', glow: 'rgba(0,209,193,0.20)', border: 'rgba(0,209,193,0.25)' },
  };
  const t = tints[tint] || tints.teal;

  const padding = { sm: '16px', md: '24px', lg: '36px' }[size];
  const borderRadius = { sm: '16px', md: '24px', lg: '32px' }[size];

  return (
    <div
      className={`liquid-glass ${className}`}
      style={{
        ...style,
        position: 'relative',
        padding,
        borderRadius,
        background: `linear-gradient(145deg, ${t.from} 0%, ${t.to} 100%)`,
        backdropFilter: 'blur(32px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
        border: `1px solid ${t.border}`,
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.12),
          0 2px 8px rgba(0,0,0,0.08),
          inset 0 1px 0 rgba(255,255,255,0.45),
          inset 0 -1px 0 rgba(0,0,0,0.08),
          0 0 0 1px rgba(255,255,255,0.10)
        `,
        overflow: 'hidden',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius,
          zIndex: 0,
          background: `radial-gradient(ellipse 80% 60% at 30% 25%, ${t.from} 0%, transparent 55%)`,
        }}
      />

      {/* Inner highlight top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.9) 60%, transparent)',
          borderRadius: `${borderRadius} ${borderRadius} 0 0`,
          zIndex: 2,
        }}
      />

      <div style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Liquid Glass Panel (full bleed, wider) ───────────────── */
export function LiquidGlassPanel({ children, className = '', style = {}, blur = 40 }) {
  return (
    <div
      className={`liquid-glass-panel ${className}`}
      style={{
        ...style,
        position: 'relative',
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: `blur(${blur}px) saturate(1.8)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.8)`,
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.50),
          inset 0 -1px 0 rgba(0,0,0,0.05),
          0 4px 24px rgba(0,0,0,0.10)
        `,
        overflow: 'hidden',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, rgba(0,209,193,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(139,92,246,0.6) 100%)',
        }}
      />
      {children}
    </div>
  );
}

/* ── Liquid Glass Button ──────────────────────────────────── */
export function LiquidGlassButton({ children, onClick, className = '', variant = 'teal' }) {
  const variants = {
    teal: {
      bg: 'rgba(0,209,193,0.20)',
      hover: 'rgba(0,209,193,0.32)',
      border: 'rgba(0,209,193,0.45)',
      shadow: '0 4px 16px rgba(0,209,193,0.30)',
      text: '#0B1220',
    },
    dark: {
      bg: 'rgba(11,18,32,0.70)',
      hover: 'rgba(11,18,32,0.85)',
      border: 'rgba(0,209,193,0.30)',
      shadow: '0 4px 20px rgba(11,18,32,0.40)',
      text: 'white',
    },
    light: {
      bg: 'rgba(255,255,255,0.30)',
      hover: 'rgba(255,255,255,0.48)',
      border: 'rgba(255,255,255,0.50)',
      shadow: '0 4px 16px rgba(0,0,0,0.10)',
      text: '#0B1220',
    },
  };
  const v = variants[variant] || variants.teal;

  return (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden font-semibold ${className}`}
      style={{
        background: v.bg,
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        border: `1px solid ${v.border}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.40), ${v.shadow}`,
        borderRadius: '14px',
        padding: '10px 22px',
        color: v.text,
        cursor: 'pointer',
        fontSize: '14px',
        letterSpacing: '-0.01em',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'tween', duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}

/* ── Liquid Orb (decorative animated sphere) ──────────────── */
export function LiquidOrb({ size = 200, tint = 'teal', className = '', style = {} }) {
  const colors = {
    teal:   ['#00D1C1', '#00a8a0', '#0097a7'],
    purple: ['#a855f7', '#9333ea', '#7c3aed'],
    blue:   ['#3b82f6', '#2563eb', '#1d4ed8'],
    amber:  ['#f59e0b', '#d97706', '#b45309'],
  };
  const c = colors[tint] || colors.teal;

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
        background: `radial-gradient(ellipse at 35% 35%, ${c[0]} 0%, ${c[1]} 45%, ${c[2]} 100%)`,
        boxShadow: `0 0 ${size * 0.4}px ${c[0]}55, inset 0 ${size * 0.08}px ${size * 0.15}px rgba(255,255,255,0.35)`,
        filter: `blur(${size * 0.015}px)`,
      }}
    />
  );
}

/* ── Morphing Background ──────────────────────────────────── */
export function LiquidBackground({ children, className = '', style = {} }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-15%', left: '-10%',
          width: '60%', height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,209,193,0.25) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-15%', right: '-10%',
          width: '55%', height: '55%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%', left: '40%',
          width: '35%', height: '35%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

export default LiquidGlassCard;
