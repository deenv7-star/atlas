import React from 'react';
import { motion } from 'framer-motion';

/* ─── Animated Illustrations ─────────────────────────────────
   Rich SVG-based illustrations with Framer Motion:
   - DashboardIllustration : animated app dashboard
   - RocketIllustration    : launching rocket
   - SuccessIllustration   : success state
   - DataFlowIllustration  : data pipeline
   - BuildingIllustration  : property/building
   - WaveBackground        : animated wave shapes
──────────────────────────────────────────────────────────────── */

/* ── Dashboard Illustration ──────────────────────────────────── */
export function DashboardIllustration({ width = 400, height = 320 }) {
  const bars = [0.55, 0.80, 0.40, 0.90, 0.65, 0.75, 0.50];

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 400 320"
      fill="none"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* ── Background card ────────────────────────────────── */}
      <rect x="20" y="20" width="360" height="280" rx="20" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* ── Header bar ─────────────────────────────────────── */}
      <rect x="20" y="20" width="360" height="44" rx="20" fill="#0B1220" />
      <rect x="38" y="34" width="6" height="6" rx="3" fill="#ff5f56" />
      <rect x="52" y="34" width="6" height="6" rx="3" fill="#ffbd2e" />
      <rect x="66" y="34" width="6" height="6" rx="3" fill="#27c93f" />

      {/* Search bar skeleton */}
      <rect x="120" y="29" width="170" height="16" rx="8" fill="rgba(255,255,255,0.12)" />
      <motion.rect
        x="120" y="29" width="170" height="16" rx="8"
        fill="rgba(255,255,255,0.06)"
        animate={{ x: [120, 290, 120] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Stat cards row ─────────────────────────────────── */}
      {[
        { x: 38,  color: '#00D1C1', label: '₪24,800', sub: '+18%' },
        { x: 140, color: '#6366f1', label: '14',      sub: 'active' },
        { x: 242, color: '#f59e0b', label: '4.9★',   sub: 'rating' },
        { x: 344, color: '#10b981', label: '98%',     sub: 'happy'  },
      ].map((card, i) => (
        <motion.g
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.1 } },
          }}
        >
          <rect x={card.x} y="76" width="88" height="52" rx="12" fill={`${card.color}11`} stroke={`${card.color}33`} strokeWidth="1" />
          <text x={card.x + 44} y="100" textAnchor="middle" fill={card.color} fontSize="13" fontWeight="800">{card.label}</text>
          <text x={card.x + 44} y="116" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="500">{card.sub}</text>
          {/* Icon dot */}
          <circle cx={card.x + 12} cy="86" r="4" fill={card.color} opacity="0.8" />
        </motion.g>
      ))}

      {/* ── Bar chart ──────────────────────────────────────── */}
      <text x="38" y="152" fill="#374151" fontSize="10" fontWeight="700">Monthly Revenue</text>

      {bars.map((h, i) => {
        const barH = h * 72;
        const x = 38 + i * 44;
        const y = 220 - barH;
        return (
          <motion.g key={i}>
            {/* BG bar */}
            <rect x={x} y={148} width="30" height="72" rx="6" fill="#F4F6FB" />
            {/* Fill bar */}
            <motion.rect
              x={x} y={220} width="30" rx="6"
              fill={i === 3 ? '#00D1C1' : '#0B1220'}
              opacity={i === 3 ? 1 : 0.12 + i * 0.08}
              variants={{
                hidden: { height: 0, y: 220 },
                visible: {
                  height: barH,
                  y,
                  transition: { delay: 0.4 + i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            />
            {/* Value label */}
            <motion.text
              x={x + 15} y={y - 4}
              textAnchor="middle"
              fill={i === 3 ? '#00D1C1' : '#9ca3af'}
              fontSize="8"
              fontWeight="600"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { delay: 0.8 + i * 0.07 } },
              }}
            >
              {Math.round(h * 100)}%
            </motion.text>
          </motion.g>
        );
      })}

      {/* ── Trend line ─────────────────────────────────────── */}
      <motion.path
        d="M53 210 L97 192 L141 218 L185 176 L229 199 L273 185 L317 204"
        stroke="#00D1C1"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
        }}
      />

      {/* ── Status bar bottom ──────────────────────────────── */}
      <motion.g
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 1.0 } },
        }}
      >
        <rect x="38" y="240" width="200" height="42" rx="10" fill="#F8FAFF" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="58" cy="261" r="8" fill="rgba(0,209,193,0.15)" />
        <rect x="72" y="255" width="80" height="5" rx="2.5" fill="#E2E8F0" />
        <rect x="72" y="265" width="50" height="4" rx="2" fill="#E2E8F0" />
        <rect x="185" y="250" width="40" height="14" rx="7" fill="rgba(16,185,129,0.12)" />
        <text x="205" y="261" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="700">Done</text>

        <rect x="252" y="240" width="108" height="42" rx="10" fill="#0B1220" />
        <text x="306" y="264" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">+ New Booking</text>
      </motion.g>
    </motion.svg>
  );
}

/* ── Rocket Illustration ─────────────────────────────────────── */
export function RocketIllustration({ size = 200 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
      {/* Stars */}
      {[[20, 30], [160, 20], [170, 80], [30, 120], [150, 140], [80, 170], [40, 60]].map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x} cy={y} r={1.5}
          fill="#00D1C1"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: [0, 1, 0.5], transition: { delay: i * 0.15, duration: 1.5, repeat: Infinity, repeatType: 'reverse' } },
          }}
        />
      ))}

      {/* Exhaust flame */}
      <motion.g
        animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '100px 145px' }}
      >
        <ellipse cx="100" cy="155" rx="12" ry="18" fill="#f59e0b" opacity="0.8" />
        <ellipse cx="100" cy="160" rx="7" ry="12" fill="#ef4444" opacity="0.9" />
        <ellipse cx="100" cy="163" rx="4" ry="8" fill="#fbbf24" />
      </motion.g>

      {/* Rocket body */}
      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Main body */}
        <motion.path
          d="M100 40 C88 40 80 55 80 80 L80 130 C80 135 86 140 100 140 C114 140 120 135 120 130 L120 80 C120 55 112 40 100 40z"
          fill="linear-gradient(180deg,#0B1220,#1e2d4a)"
          stroke="#00D1C1"
          strokeWidth="1"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
          }}
        />
        <path d="M100 40 C88 40 80 55 80 80 L80 130 C80 135 86 140 100 140 C114 140 120 135 120 130 L120 80 C120 55 112 40 100 40z" fill="#0B1220" />

        {/* Nose cone */}
        <motion.path
          d="M100 20 C95 25 85 35 80 50 L120 50 C115 35 105 25 100 20z"
          fill="#00D1C1"
          variants={{
            hidden: { opacity: 0, y: -10 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.2 } },
          }}
        />

        {/* Window */}
        <motion.circle
          cx="100" cy="85" r="12"
          fill="rgba(99,102,241,0.20)"
          stroke="#6366f1"
          strokeWidth="2"
          animate={{ boxShadow: ['0 0 0px #6366f1', '0 0 16px #6366f155', '0 0 0px #6366f1'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle cx="100" cy="85" r="6" fill="rgba(99,102,241,0.35)" />

        {/* Left fin */}
        <path d="M80 120 L65 140 L80 135z" fill="#00D1C1" opacity="0.8" />
        {/* Right fin */}
        <path d="M120 120 L135 140 L120 135z" fill="#00D1C1" opacity="0.8" />

        {/* Stripes */}
        <rect x="80" y="105" width="40" height="4" rx="2" fill="rgba(0,209,193,0.30)" />
        <rect x="80" y="113" width="40" height="3" rx="1.5" fill="rgba(0,209,193,0.20)" />
      </motion.g>
    </motion.svg>
  );
}

/* ── Success Illustration ─────────────────────────────────────── */
export function SuccessIllustration({ size = 180 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      {/* Background circles */}
      <motion.circle
        cx="90" cy="90" r="75"
        fill="rgba(0,209,193,0.06)"
        stroke="rgba(0,209,193,0.15)"
        strokeWidth="1"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
        }}
      />
      <motion.circle
        cx="90" cy="90" r="58"
        fill="rgba(0,209,193,0.10)"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: { scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.5 } },
        }}
      />

      {/* Center circle */}
      <motion.circle
        cx="90" cy="90" r="40"
        fill="linear-gradient(135deg,#00D1C1,#00a8a0)"
        variants={{
          hidden: { scale: 0 },
          visible: { scale: 1, transition: { delay: 0.2, type: 'spring', stiffness: 300, damping: 15 } },
        }}
      />
      <circle cx="90" cy="90" r="40" fill="#00D1C1" />

      {/* Check path */}
      <motion.path
        d="M72 90 L84 102 L108 76"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        }}
      />

      {/* Sparkle dots */}
      {[
        [90, 20], [150, 55], [150, 130], [90, 165], [30, 130], [30, 55],
      ].map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x} cy={y} r="4"
          fill="#00D1C1"
          variants={{
            hidden: { scale: 0, opacity: 0 },
            visible: {
              scale: [0, 1.4, 1],
              opacity: 1,
              transition: { delay: 0.6 + i * 0.07, type: 'spring', stiffness: 400 },
            },
          }}
        />
      ))}
    </motion.svg>
  );
}

/* ── Data Flow Illustration ──────────────────────────────────── */
export function DataFlowIllustration({ width = 360, height = 200 }) {
  const nodes = [
    { x: 40,  y: 100, label: 'Source', color: '#6366f1' },
    { x: 160, y: 60,  label: 'Process', color: '#00D1C1' },
    { x: 160, y: 140, label: 'Filter', color: '#f59e0b' },
    { x: 280, y: 100, label: 'Output', color: '#10b981' },
    { x: 320, y: 50,  label: 'API', color: '#00D1C1', small: true },
    { x: 320, y: 150, label: 'DB', color: '#6366f1', small: true },
  ];
  const edges = [
    [nodes[0], nodes[1]], [nodes[0], nodes[2]],
    [nodes[1], nodes[3]], [nodes[2], nodes[3]],
    [nodes[3], nodes[4]], [nodes[3], nodes[5]],
  ];

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 360 200"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
      {/* Edges */}
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeDasharray="4 3"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delay: 0.1 + i * 0.08 } },
          }}
        />
      ))}

      {/* Animated data packets */}
      {edges.map(([a, b], i) => (
        <motion.circle
          key={`packet-${i}`}
          r="3"
          fill={a.color}
          animate={{
            cx: [a.x, b.x],
            cy: [a.y, b.y],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.4,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          variants={{
            hidden: { scale: 0, opacity: 0 },
            visible: { scale: 1, opacity: 1, transition: { delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300 } },
          }}
          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
        >
          <circle cx={n.x} cy={n.y} r={n.small ? 14 : 20} fill={`${n.color}18`} stroke={`${n.color}55`} strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y} r={n.small ? 8 : 12} fill={n.color} opacity="0.9" />
          {!n.small && (
            <text x={n.x} y={n.y + 28} textAnchor="middle" fill="#374151" fontSize="8" fontWeight="600">{n.label}</text>
          )}
          {n.small && (
            <text x={n.x} y={n.y + 22} textAnchor="middle" fill={n.color} fontSize="7" fontWeight="700">{n.label}</text>
          )}
        </motion.g>
      ))}
    </motion.svg>
  );
}

/* ── Wave Background ─────────────────────────────────────────── */
export function WaveBackground({ color = '#00D1C1', opacity = 0.08, height = 120 }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <motion.path
          d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
          fill={color}
          fillOpacity={opacity}
          animate={{
            d: [
              'M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z',
              'M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z',
              'M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z',
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z"
          fill={color}
          fillOpacity={opacity * 0.6}
          animate={{
            d: [
              'M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z',
              'M0,70 C360,100 720,40 1080,80 C1260,100 1380,50 1440,80 L1440,120 L0,120 Z',
              'M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

export default DashboardIllustration;
