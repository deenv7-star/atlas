import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ─── Liquid Glass Component ──────────────────────────────────
   Inspired by Apple's Liquid Glass design language — a living,
   refractive glass surface with morphing gradients and soft
   inner reflections.
──────────────────────────────────────────────────────────────── */

function useMagneticTilt(strength = 15) {
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [strength, -strength]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-strength, strength]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return { ref, rotateX, rotateY, handleMouseMove, handleMouseLeave };
}

/* ── Liquid Glass Card ──────────────────────────────────────── */
export function LiquidGlassCard({
  children,
  className = '',
  tint = 'teal',      // 'teal' | 'purple' | 'blue' | 'neutral' | 'dark'
  size = 'md',        // 'sm' | 'md' | 'lg'
  animated = true,
  shimmer = true,
  style = {},
}) {
  const { ref, rotateX, rotateY, handleMouseMove, handleMouseLeave } = useMagneticTilt(8);

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
    <motion.div
      ref={ref}
      className={`liquid-glass ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
        transformStyle: 'preserve-3d',
        rotateX: animated ? rotateX : 0,
        rotateY: animated ? rotateY : 0,
        overflow: 'hidden',
      }}
    >
      {/* Animated refraction gradient */}
      {animated && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              `radial-gradient(ellipse 80% 60% at 20% 20%, ${t.from} 0%, transparent 60%)`,
              `radial-gradient(ellipse 80% 60% at 80% 80%, ${t.from} 0%, transparent 60%)`,
              `radial-gradient(ellipse 80% 60% at 20% 80%, ${t.from} 0%, transparent 60%)`,
              `radial-gradient(ellipse 80% 60% at 80% 20%, ${t.from} 0%, transparent 60%)`,
              `radial-gradient(ellipse 80% 60% at 20% 20%, ${t.from} 0%, transparent 60%)`,
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ borderRadius, zIndex: 0 }}
        />
      )}

      {/* Shimmer sweep */}
      {shimmer && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.30) 50%, transparent 60%)',
            borderRadius,
            zIndex: 1,
          }}
        />
      )}

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

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </motion.div>
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
      {/* Chromatic aberration top highlight */}
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
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
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
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)',
        }}
      />
      {/* Top highlight */}
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
    <motion.div
      className={`pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.08, 0.96, 1.04, 1],
        borderRadius: [
          '60% 40% 70% 30% / 50% 60% 40% 50%',
          '40% 60% 30% 70% / 60% 40% 60% 40%',
          '70% 30% 50% 50% / 40% 70% 30% 60%',
          '50% 50% 40% 60% / 70% 30% 70% 30%',
          '60% 40% 70% 30% / 50% 60% 40% 50%',
        ],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        ...style,
        width: size,
        height: size,
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
      {/* Large orb 1 */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          x: [0, 60, -30, 20, 0],
          y: [0, -40, 60, -20, 0],
          scale: [1, 1.15, 0.90, 1.05, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          top: '-15%', left: '-10%',
          width: '60%', height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,209,193,0.25) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Large orb 2 */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          x: [0, -50, 30, -10, 0],
          y: [0, 50, -30, 40, 0],
          scale: [1, 0.90, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          bottom: '-15%', right: '-10%',
          width: '55%', height: '55%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Mid orb */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
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
