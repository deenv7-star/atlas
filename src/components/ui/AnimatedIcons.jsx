import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Animated Icon Library ──────────────────────────────────
   SVG-based animated icons using Framer Motion:
   - DrawIcon       : stroke draw-on animation
   - MorphIcon      : morphs between two paths
   - OrbitIcon      : orbiting ring decoration
   - PulseIcon      : breathing pulsing glow
   - CounterBadge   : animated number badge
   - StatusDot      : online/offline indicator
   - AnimatedCheck  : checkmark draw animation
   - SparkleIcon    : sparkle burst effect
──────────────────────────────────────────────────────────────── */

/* ── Draw Icon (stroke animation) ────────────────────────────── */
export function DrawIcon({ size = 32, color = '#00D1C1', strokeWidth = 2, delay = 0, children }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      {React.Children.map(children, (child, i) =>
        React.cloneElement(child, {
          variants: {
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 1,
              transition: { duration: 0.8, delay: delay + i * 0.15, ease: [0.16, 1, 0.3, 1] },
            },
          },
        })
      )}
    </motion.svg>
  );
}

/* ── Orbit Icon (decorative rings) ──────────────────────────── */
export function OrbitIcon({ icon: Icon, size = 56, color = '#00D1C1', bg = 'rgba(0,209,193,0.12)' }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer orbit ring */}
      <motion.div
        className="absolute"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          border: `1.5px dashed ${color}55`,
        }}
      >
        {/* Orbit dot */}
        <div
          style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) translateY(-50%)',
            width: 6, height: 6, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </motion.div>

      {/* Inner ring */}
      <motion.div
        className="absolute"
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '70%', height: '70%',
          borderRadius: '50%',
          border: `1px solid ${color}33`,
        }}
      >
        <div
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 4, height: 4, borderRadius: '50%', background: `${color}99`,
          }}
        />
      </motion.div>

      {/* Center icon */}
      <div
        style={{
          width: '52%', height: '52%',
          borderRadius: '50%',
          background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 1px ${color}33, 0 4px 12px ${color}22`,
        }}
      >
        <Icon size={size * 0.22} style={{ color }} />
      </div>
    </div>
  );
}

/* ── Pulse Icon ──────────────────────────────────────────────── */
export function PulseIcon({ icon: Icon, size = 48, color = '#00D1C1' }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulse rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          initial={{ opacity: 0.6, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          style={{
            width: '100%', height: '100%',
            border: `1.5px solid ${color}`,
            borderRadius: '50%',
          }}
        />
      ))}

      {/* Core */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: '62%', height: '62%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, ${color}bb 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${color}77`,
        }}
      >
        <Icon size={size * 0.28} style={{ color: '#0B1220' }} />
      </motion.div>
    </div>
  );
}

/* ── Animated Check ──────────────────────────────────────────── */
export function AnimatedCheck({ size = 40, color = '#00D1C1', bgColor = 'rgba(0,209,193,0.12)', visible = true }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: bgColor,
        border: `1.5px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${color}33`,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M5 12l5 5L19 7"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: visible ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.div>
  );
}

/* ── Sparkle Icon ────────────────────────────────────────────── */
export function SparkleIcon({ size = 32, color = '#00D1C1', active = true }) {
  const sparks = [
    { angle: 0,   dist: 12, delay: 0    },
    { angle: 45,  dist: 10, delay: 0.1  },
    { angle: 90,  dist: 13, delay: 0.05 },
    { angle: 135, dist: 10, delay: 0.15 },
    { angle: 180, dist: 12, delay: 0.08 },
    { angle: 225, dist: 10, delay: 0.18 },
    { angle: 270, dist: 13, delay: 0.03 },
    { angle: 315, dist: 10, delay: 0.12 },
  ];

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {active && sparks.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.cos(rad) * s.dist,
              y: Math.sin(rad) * s.dist,
            }}
            transition={{ duration: 0.6, delay: s.delay, repeat: Infinity, repeatDelay: 1.4 }}
            style={{
              position: 'absolute',
              width: 3, height: 3,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 4px ${color}`,
            }}
          />
        );
      })}

      {/* Star center */}
      <motion.svg
        width={size * 0.55} height={size * 0.55}
        viewBox="0 0 24 24"
        animate={{ rotate: active ? 360 : 0, scale: active ? [1, 1.15, 1] : 1 }}
        transition={{ rotate: { duration: 6, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
      >
        <path
          d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
          fill={color}
          opacity={0.9}
        />
      </motion.svg>
    </div>
  );
}

/* ── Status Dot ──────────────────────────────────────────────── */
export function StatusDot({ status = 'online', size = 10, showLabel = false }) {
  const colors = {
    online:  '#22c55e',
    offline: '#6b7280',
    busy:    '#ef4444',
    away:    '#f59e0b',
  };
  const labels = { online: 'Online', offline: 'Offline', busy: 'Busy', away: 'Away' };
  const color = colors[status] || colors.offline;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {status === 'online' && (
          <motion.div
            className="absolute"
            animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ inset: 0, borderRadius: '50%', background: color }}
          />
        )}
        <div style={{ width: size, height: size, borderRadius: '50%', background: color, position: 'relative', zIndex: 1 }} />
      </div>
      {showLabel && <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{labels[status]}</span>}
    </div>
  );
}

/* ── Counter Badge ───────────────────────────────────────────── */
export function CounterBadge({ count, color = '#00D1C1', bg = 'rgba(0,209,193,0.15)', size = 20 }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={count}
        initial={{ scale: 0.5, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{
          minWidth: size, height: size,
          borderRadius: size,
          background: bg,
          border: `1px solid ${color}44`,
          color,
          fontSize: Math.max(9, size * 0.5),
          fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 5px',
          boxShadow: `0 2px 8px ${color}33`,
        }}
      >
        {count > 99 ? '99+' : count}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Animated Feature Icon (large, for landing page) ─────────── */
export function FeatureIcon({ icon: Icon, color = '#00D1C1', bg, size = 64 }) {
  const [hovered, setHovered] = useState(false);
  const resolvedBg = bg || `${color}18`;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.08, rotate: -5 }}
      whileTap={{ scale: 0.92 }}
      style={{
        width: size, height: size,
        borderRadius: size * 0.3,
        background: hovered ? `${color}25` : resolvedBg,
        border: `1px solid ${hovered ? color + '55' : color + '25'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hovered ? `0 8px 24px ${color}40, 0 2px 8px ${color}25` : `0 2px 8px ${color}18`,
        cursor: 'default',
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
        flexShrink: 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <Icon size={size * 0.44} style={{ color, transition: 'transform 0.2s' }} />
    </motion.div>
  );
}

/* ── Wiggle Icon (CTA attention) ─────────────────────────────── */
export function WiggleIcon({ icon: Icon, size = 24, color = '#00D1C1', trigger = true }) {
  return (
    <motion.div
      animate={trigger ? { rotate: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.7, delay: 1, repeat: Infinity, repeatDelay: 3 }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon size={size} style={{ color }} />
    </motion.div>
  );
}

export default FeatureIcon;
