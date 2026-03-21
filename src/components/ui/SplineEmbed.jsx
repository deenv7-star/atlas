import React, { Suspense, lazy, useState } from 'react';
import { motion } from 'framer-motion';

const Spline = lazy(() => import('@splinetool/react-spline'));

/* ─── SplineEmbed ────────────────────────────────────────────
   Drop-in wrapper for Spline Design 3D scenes.

   Usage:
     <SplineEmbed
       scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode"
       style={{ height: 400 }}
     />

   Get a scene URL from:
     1. Open your scene at spline.design
     2. Click Export → Web → Copy URL

   Includes graceful loading skeleton + error boundary.
──────────────────────────────────────────────────────────────── */

function SplineSkeleton({ style = {} }) {
  return (
    <motion.div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(11,18,32,0.06) 0%, rgba(0,209,193,0.04) 100%)',
        borderRadius: 'inherit',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Shimmer skeleton */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,209,193,0.08), transparent)',
        }}
      />

      {/* Animated placeholder orbs */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #00D1C1, #6366f1, #00D1C1)',
            opacity: 0.6,
          }}
        />
        <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
          Loading 3D scene...
        </span>
      </div>
    </motion.div>
  );
}

export default function SplineEmbed({ scene, style = {}, className = '', onLoad, fallback }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!scene) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(11,18,32,0.04), rgba(0,209,193,0.04))',
          border: '2px dashed rgba(0,209,193,0.30)',
          borderRadius: 24,
          padding: 40,
          flexDirection: 'column',
          gap: 12,
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: 'rgba(0,209,193,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#00D1C1" strokeWidth={1.5}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: 0 }}>Spline 3D Scene</p>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
            Pass a <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>scene</code> URL from{' '}
            <a href="https://spline.design" target="_blank" rel="noopener noreferrer" style={{ color: '#00D1C1' }}>spline.design</a>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return fallback || (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        Failed to load 3D scene
      </div>
    );
  }

  return (
    <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {!loaded && <SplineSkeleton style={{ position: 'absolute', inset: 0, zIndex: 1 }} />}
      <Suspense fallback={<SplineSkeleton style={{ width: '100%', height: '100%' }} />}>
        <Spline
          scene={scene}
          onLoad={(app) => {
            setLoaded(true);
            onLoad && onLoad(app);
          }}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      </Suspense>
    </div>
  );
}
