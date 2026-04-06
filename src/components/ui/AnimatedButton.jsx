import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ─── Animated Button Library ────────────────────────────────
   Premium interactive button components:
   - ShimmerButton   : sweeping light animation
   - GradientButton  : rotating gradient border
   - MagneticButton  : follows cursor magnetically
   - GlowButton      : pulsing halo effect
   - RippleButton    : Material-style ripple on click
   - ParticleButton  : Particle burst on click
──────────────────────────────────────────────────────────────── */

/* ── Shimmer Button ─────────────────────────────────────────── */
export function ShimmerButton({ children, onClick, className = '', style = {}, disabled = false }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden font-bold text-white rounded-2xl ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: 'linear-gradient(135deg, #0B1220 0%, #1e2d4a 100%)',
        boxShadow: '0 4px 20px rgba(11,18,32,0.30), inset 0 1px 0 rgba(255,255,255,0.10)',
        padding: '12px 28px',
        fontSize: '15px',
        letterSpacing: '-0.01em',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
          zIndex: 0,
        }}
      />
      {/* Top bevel */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)', zIndex: 1 }} />
      <span className="relative z-[2] inline-flex items-center justify-center gap-1.5">{children}</span>
    </motion.button>
  );
}

/* ── Gradient Border Button ──────────────────────────────────── */
export function GradientButton({ children, onClick, className = '', style = {} }) {
  return (
    <div className={`relative p-px rounded-2xl ${className}`} style={{ ...style, display: 'inline-block' }}>
      {/* Animated rotating gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'conic-gradient(from 0deg, #00D1C1, #6366f1, #f59e0b, #00D1C1)',
          borderRadius: 'inherit',
        }}
      />
      <motion.button
        onClick={onClick}
        className="relative z-10 font-bold rounded-2xl overflow-hidden"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
          background: 'white',
          padding: '11px 26px',
          fontSize: '15px',
          color: '#0B1220',
          letterSpacing: '-0.01em',
          border: 'none',
          cursor: 'pointer',
          display: 'block',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {children}
      </motion.button>
    </div>
  );
}

/* ── Magnetic Button ─────────────────────────────────────────── */
export function MagneticButton({ children, onClick, className = '', style = {}, strength = 0.35 }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }, [x, y, strength]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden font-bold rounded-2xl ${className}`}
      style={{
        x,
        y,
        background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
        boxShadow: '0 4px 20px rgba(0,209,193,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
        padding: '12px 28px',
        fontSize: '15px',
        color: '#0B1220',
        letterSpacing: '-0.01em',
        border: 'none',
        cursor: 'pointer',
        ...style,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.5 }}
        style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.40) 50%, transparent 70%)' }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}

/* ── Glow Button ────────────────────────────────────────────── */
export function GlowButton({ children, onClick, className = '', style = {}, color = '#00D1C1' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative font-bold rounded-2xl overflow-hidden ${className}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{
        background: 'linear-gradient(135deg, #0B1220 0%, #162035 100%)',
        border: `1px solid ${color}55`,
        boxShadow: hovered
          ? `0 0 0 1px ${color}66, 0 0 20px ${color}55, 0 0 40px ${color}33, 0 4px 20px rgba(0,0,0,0.30)`
          : `0 4px 16px rgba(0,0,0,0.20)`,
        padding: '12px 28px',
        fontSize: '15px',
        color: 'white',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
        ...style,
      }}
    >
      {/* Pulsing glow ring */}
      {hovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ boxShadow: `0 0 0 4px ${color}55`, borderRadius: 'inherit' }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}

/* ── Ripple Button ───────────────────────────────────────────── */
export function RippleButton({ children, onClick, className = '', style = {}, variant = 'primary' }) {
  const [ripples, setRipples] = useState([]);

  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700);
    onClick && onClick(e);
  };

  const variants = {
    primary: {
      bg: 'linear-gradient(135deg, #0B1220 0%, #1e2d4a 100%)',
      color: 'white',
      rippleColor: 'rgba(255,255,255,0.25)',
      shadow: '0 4px 16px rgba(11,18,32,0.30)',
    },
    teal: {
      bg: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
      color: '#0B1220',
      rippleColor: 'rgba(255,255,255,0.35)',
      shadow: '0 4px 16px rgba(0,209,193,0.40)',
    },
    ghost: {
      bg: 'transparent',
      color: '#0B1220',
      rippleColor: 'rgba(0,209,193,0.20)',
      shadow: 'none',
      border: '1.5px solid rgba(11,18,32,0.15)',
    },
  };
  const v = variants[variant] || variants.primary;

  return (
    <motion.button
      onClick={addRipple}
      className={`relative overflow-hidden font-bold rounded-2xl ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border || 'none',
        boxShadow: v.shadow,
        padding: '12px 28px',
        fontSize: '15px',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        ...style,
      }}
    >
      {ripples.map(rp => (
        <motion.div
          key={rp.id}
          className="absolute pointer-events-none"
          initial={{ opacity: 0.6, scale: 0 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            left: rp.x, top: rp.y,
            width: rp.size, height: rp.size,
            borderRadius: '50%',
            background: v.rippleColor,
          }}
        />
      ))}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}

/* ── Icon Button (animated) ─────────────────────────────────── */
export function IconButton({ icon: Icon, label, onClick, className = '', color = '#00D1C1', size = 40 }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden ${className}`}
      whileHover={{ scale: 1.10, rotate: 5 }}
      whileTap={{ scale: 0.90 }}
      title={label}
      style={{
        width: size, height: size,
        background: hovered ? `${color}22` : 'rgba(11,18,32,0.06)',
        border: `1px solid ${hovered ? color + '55' : 'rgba(11,18,32,0.08)'}`,
        boxShadow: hovered ? `0 4px 16px ${color}33` : 'none',
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <Icon size={size * 0.42} style={{ color: hovered ? color : '#6b7280', transition: 'color 0.2s ease' }} />
    </motion.button>
  );
}

/* ── Loading Button ──────────────────────────────────────────── */
export function LoadingButton({ children, loading = false, onClick, className = '', style = {} }) {
  return (
    <motion.button
      onClick={!loading ? onClick : undefined}
      className={`relative overflow-hidden font-bold rounded-2xl flex items-center justify-center gap-2 ${className}`}
      whileHover={!loading ? { scale: 1.03 } : {}}
      whileTap={!loading ? { scale: 0.97 } : {}}
      style={{
        background: loading
          ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
          : 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
        boxShadow: loading ? 'none' : '0 4px 20px rgba(0,209,193,0.40)',
        padding: '12px 28px',
        fontSize: '15px',
        color: loading ? '#9ca3af' : '#0B1220',
        letterSpacing: '-0.01em',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease',
        ...style,
      }}
    >
      {loading && (
        <motion.div
          className="rounded-full border-2 flex-shrink-0"
          style={{ width: 16, height: 16, borderColor: '#9ca3af', borderTopColor: 'transparent' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <span>{loading ? 'Loading...' : children}</span>
    </motion.button>
  );
}

export default ShimmerButton;
