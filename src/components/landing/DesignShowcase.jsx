import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Star, Shield, ArrowLeft, Bell, Calendar,
  TrendingUp, Users, MessageSquare, CheckCircle2, Sparkles,
  CreditCard, Globe, Lock, Rocket,
} from 'lucide-react';

import LiquidGlassCard, { LiquidGlassPanel, LiquidGlassButton, LiquidOrb, LiquidBackground } from '../ui/LiquidGlass';
import { ShimmerButton, GradientButton, MagneticButton, GlowButton, RippleButton, IconButton, LoadingButton } from '../ui/AnimatedButton';
import { OrbitIcon, PulseIcon, AnimatedCheck, SparkleIcon, StatusDot, CounterBadge, FeatureIcon, WiggleIcon } from '../ui/AnimatedIcons';
import { DashboardIllustration, RocketIllustration, SuccessIllustration, DataFlowIllustration, WaveBackground } from '../ui/AnimatedIllustrations';
import FloatingOrbs3D from '../ui/FloatingOrbs3D';
import SplineEmbed from '../ui/SplineEmbed';

/* ─── Section wrapper ────────────────────────────────────────── */
function Section({ title, subtitle, children, dark = false, id }) {
  return (
    <section
      id={id}
      style={{
        background: dark ? '#0B1220' : 'white',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            {title && (
              <h2 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: dark ? 'white' : '#0B1220',
                marginBottom: 12,
              }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ fontSize: 16, color: dark ? 'rgba(255,255,255,0.55)' : '#6b7280', maxWidth: 500, margin: '0 auto' }}>
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}

/* ─── Main Showcase Component ────────────────────────────────── */
export default function DesignShowcase() {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(true);
  const [count, setCount] = useState(3);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════════════════════════════════════════════
          HERO — 3D orbs + liquid glass CTA
      ══════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: 600, background: '#030712', overflow: 'hidden' }}>
        {/* Three.js 3D background */}
        <FloatingOrbs3D
          style={{ position: 'absolute', inset: 0 }}
          orbCount={7}
          particleCount={250}
          interactive
        />

        {/* Overlay content */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 600, padding: '80px 24px', textAlign: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <SparkleIcon size={28} color="#00D1C1" active />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.60)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Design System
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: 'white',
              lineHeight: 1.0,
              marginBottom: 24,
            }}>
              Liquid Glass &{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00D1C1 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                3D Elements
              </span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.50)', maxWidth: 480, margin: '0 auto 40px' }}>
              Spline Design, Framer Motion, Three.js — beautiful interactive components for Atlas.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <MagneticButton style={{ fontSize: 16, padding: '14px 32px' }}>
                Explore Components
              </MagneticButton>
              <LiquidGlassButton variant="light" style={{ fontSize: 15, padding: '14px 28px' }}>
                View Source
              </LiquidGlassButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LIQUID GLASS SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="liquid-glass"
        title="Liquid Glass"
        subtitle="Refractive glass surfaces with animated gradients, shimmer, and 3D tilt"
        dark
      >
        <LiquidBackground style={{ borderRadius: 32, padding: '40px 32px', background: '#0f172a' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {/* Teal card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <LiquidGlassCard tint="teal" size="md">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <OrbitIcon icon={Zap} size={44} color="#00D1C1" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Fast Performance</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>Optimized rendering</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  Glass morphism with real-time refraction and chromatic aberration highlights.
                </p>
                <div style={{ marginTop: 16 }}>
                  <LiquidGlassButton variant="teal" style={{ width: '100%', justifyContent: 'center' }}>
                    Learn More
                  </LiquidGlassButton>
                </div>
              </LiquidGlassCard>
            </motion.div>

            {/* Purple card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <LiquidGlassCard tint="purple" size="md">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <PulseIcon icon={Star} size={44} color="#a855f7" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Premium Quality</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>5-star experience</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  Magnetic tilt, animated refraction gradients, and inner highlight edges.
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusDot status="online" showLabel />
                  <CounterBadge count={count} color="#a855f7" bg="rgba(168,85,247,0.15)" />
                  <button onClick={() => setCount(c => c + 1)} style={{ fontSize: 11, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    +1
                  </button>
                </div>
              </LiquidGlassCard>
            </motion.div>

            {/* Dark card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <LiquidGlassCard tint="dark" size="md">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <FeatureIcon icon={Shield} color="#00D1C1" size={44} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Secure by Design</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>Enterprise grade</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  Dark glass variant with teal accent glow and smooth hover transitions.
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <AnimatedCheck size={28} color="#00D1C1" visible={checked} />
                  <button
                    onClick={() => setChecked(c => !c)}
                    style={{ fontSize: 12, color: '#00D1C1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Toggle check
                  </button>
                </div>
              </LiquidGlassCard>
            </motion.div>
          </div>

          {/* Liquid Glass Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 20 }}
          >
            <LiquidGlassPanel style={{ borderRadius: 20, padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'white', marginBottom: 4 }}>Full-width Glass Panel</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>Chromatic aberration top edge · deep backdrop blur · saturate filter</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <LiquidOrb size={36} tint="teal" />
                  <LiquidOrb size={28} tint="purple" />
                  <LiquidOrb size={22} tint="blue" />
                </div>
              </div>
            </LiquidGlassPanel>
          </motion.div>
        </LiquidBackground>
      </Section>

      {/* ══════════════════════════════════════════════════════
          BUTTONS SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="buttons"
        title="Animated Buttons"
        subtitle="Six interactive button variants — shimmer, gradient border, magnetic, glow, ripple, loading"
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
          <ShimmerButton style={{ padding: '13px 28px', fontSize: 15, borderRadius: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WiggleIcon icon={Zap} size={16} color="white" />
              Shimmer Button
            </span>
          </ShimmerButton>

          <GradientButton style={{ fontSize: 15 }}>
            Gradient Border
          </GradientButton>

          <MagneticButton style={{ fontSize: 15, padding: '13px 28px' }}>
            🧲 Magnetic
          </MagneticButton>

          <GlowButton style={{ fontSize: 15, padding: '13px 28px' }}>
            ✨ Glow Effect
          </GlowButton>

          <RippleButton variant="teal" style={{ fontSize: 15, padding: '13px 28px' }}>
            Ripple Click
          </RippleButton>

          <RippleButton variant="ghost" style={{ fontSize: 15, padding: '13px 28px' }}>
            Ghost Ripple
          </RippleButton>

          <LoadingButton
            loading={loading}
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}
            style={{ fontSize: 15, padding: '13px 28px' }}
          >
            Click to Load
          </LoadingButton>
        </div>

        {/* Icon buttons row */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[Bell, Calendar, TrendingUp, Users, MessageSquare, CheckCircle2, Sparkles, CreditCard, Globe, Lock].map((Ico, i) => (
            <IconButton key={i} icon={Ico} label={Ico.name} size={44} color="#00D1C1" />
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          ICONS SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="icons"
        title="Animated Icons"
        subtitle="Orbit rings, pulse halos, sparkle bursts, wiggle attention, status indicators"
        dark
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <OrbitIcon icon={Rocket} size={72} color="#00D1C1" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Orbit</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <PulseIcon icon={Bell} size={64} color="#6366f1" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Pulse</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <SparkleIcon size={56} color="#f59e0b" active />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Sparkle</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FeatureIcon icon={Shield} color="#10b981" size={72} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Feature</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <WiggleIcon icon={Zap} size={40} color="#00D1C1" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Wiggle</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AnimatedCheck size={56} color="#00D1C1" visible />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Check</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['online', 'busy', 'away', 'offline'].map(s => (
                <StatusDot key={s} status={s} showLabel size={10} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Status</span>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          ILLUSTRATIONS SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="illustrations"
        title="Animated Illustrations"
        subtitle="SVG illustrations with Framer Motion — draw-on, morphing, particle effects"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <DashboardIllustration width={360} height={280} />
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Dashboard — animated bars & trend line</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <DataFlowIllustration width={320} height={200} />
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Data Flow — animated packets</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <RocketIllustration size={160} />
              <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Rocket</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <SuccessIllustration size={140} />
              <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Success</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          3D ORBS SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="3d"
        title="Three.js 3D Scene"
        subtitle="Floating glass spheres, torus rings, particle field — mouse parallax interactive"
        dark
      >
        <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <FloatingOrbs3D
            style={{ width: '100%', height: 420 }}
            orbCount={8}
            particleCount={300}
            interactive
          />
          <div style={{
            position: 'absolute', bottom: 20, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 12, zIndex: 10,
          }}>
            <LiquidGlassButton variant="dark">
              Move mouse to interact →
            </LiquidGlassButton>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          SPLINE SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="spline"
        title="Spline Design Integration"
        subtitle="Drop in any Spline scene URL — fully integrated with loading states and error handling"
      >
        <SplineEmbed
          // scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode"
          style={{ width: '100%', height: 400, borderRadius: 24, border: '1px solid rgba(226,232,240,0.8)' }}
        />
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9ca3af' }}>
          Pass your <code style={{ background: '#F4F6FB', padding: '2px 6px', borderRadius: 6 }}>scene</code> URL from{' '}
          <a href="https://spline.design" target="_blank" rel="noopener noreferrer" style={{ color: '#00D1C1', fontWeight: 600 }}>
            spline.design
          </a>
          {' '}to embed any 3D scene
        </p>
      </Section>

      {/* ══════════════════════════════════════════════════════
          LIQUID ORBS SECTION
      ══════════════════════════════════════════════════════ */}
      <Section
        id="orbs"
        title="Liquid Morphing Orbs"
        subtitle="CSS organic morphing shapes with radial gradients and soft glows"
        dark
      >
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <LiquidOrb size={160} tint="teal" />
          <LiquidOrb size={120} tint="purple" />
          <LiquidOrb size={100} tint="blue" />
          <LiquidOrb size={140} tint="amber" />
        </div>

        {/* CTA with wave background */}
        <div style={{ position: 'relative', marginTop: 60, borderRadius: 28, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '48px 32px', textAlign: 'center' }}>
          <WaveBackground color="#00D1C1" opacity={0.10} height={100} />
          <h3 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Ready to ship beautiful UIs?
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 15, marginBottom: 28 }}>
            All components are drop-in ready — just import and use.
          </p>
          <MagneticButton style={{ fontSize: 16, padding: '14px 36px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Get Started <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
            </span>
          </MagneticButton>
        </div>
      </Section>
    </div>
  );
}
