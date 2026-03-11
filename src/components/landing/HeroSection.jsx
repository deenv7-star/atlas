import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Star, Shield, TrendingUp, Calendar, MessageSquare, CreditCard, CheckCircle2, Zap, Bell, Settings, LayoutDashboard, Users, Sparkles, FileText } from 'lucide-react';

/* ─── Realistic App Screenshot Mockup ─────────────────────────── */
function AppScreenshot() {
  const bookings = [
    { name: 'משפחת לוי', property: 'וילה ים', nights: '15-18 יול׳', status: 'מאושר', statusColor: '#10b981', statusBg: 'rgba(16,185,129,0.10)' },
    { name: 'דני כהן', property: 'צימר גליל', nights: '20-23 יול׳', status: 'ממתין', statusColor: '#f59e0b', statusBg: 'rgba(245,158,11,0.10)' },
    { name: 'שרה פרץ', property: 'וילה ים', nights: '25-28 יול׳', status: 'חדש', statusColor: '#6366f1', statusBg: 'rgba(99,102,241,0.10)' },
    { name: 'מוטי אברהם', property: 'פנטהאוז TLV', nights: '1-4 אוג׳', status: 'מאושר', statusColor: '#10b981', statusBg: 'rgba(16,185,129,0.10)' },
  ];

  const messages = [
    { from: 'דני כ.', text: 'האם יש חניה פרטית?', time: 'לפני 5 דק׳', color: '#6366f1', unread: true },
    { from: 'שרה פ.', text: 'תודה רבה על האירוח!', time: 'לפני שעה', color: '#00D1C1', unread: false },
    { from: 'מוטי א.', text: 'מה שעות הצ׳קאין?', time: 'לפני 2 שע׳', color: '#f97316', unread: false },
  ];

  const navItems = [
    { icon: LayoutDashboard, label: 'לוח בקרה', active: true },
    { icon: Calendar, label: 'הזמנות', active: false },
    { icon: Users, label: 'לידים', active: false },
    { icon: MessageSquare, label: 'הודעות', badge: 3, active: false },
    { icon: CreditCard, label: 'תשלומים', active: false },
    { icon: Sparkles, label: 'ניקיון', active: false },
    { icon: FileText, label: 'חוזים', active: false },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Assistant', 'Heebo', sans-serif", direction: 'rtl', background: '#F4F6FB', borderRadius: '16px', overflow: 'hidden' }}>

      {/* ── Sidebar ───────────────────────────────────── */}
      <div style={{ width: '210px', flexShrink: 0, background: 'linear-gradient(180deg, #0B1220 0%, #0f1a2e 100%)', display: 'flex', flexDirection: 'column', padding: '0', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Logo row */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #00D1C1, #00a8a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#0B1220', fontWeight: 900, fontSize: '12px' }}>A</span>
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.01em' }}>ATLAS</span>
        </div>

        {/* Nav */}
        <div style={{ padding: '12px 10px', flex: 1 }}>
          {navItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', marginBottom: '2px',
              background: item.active ? 'rgba(0,209,193,0.12)' : 'transparent',
              cursor: 'default',
            }}>
              <item.icon size={14} style={{ color: item.active ? '#00D1C1' : 'rgba(255,255,255,0.38)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: item.active ? '#00D1C1' : 'rgba(255,255,255,0.45)', flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: '#00D1C1', color: '#0B1220', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '10px' }}>{item.badge}</span>
              )}
            </div>
          ))}
        </div>

        {/* User strip */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, #00D1C1, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '10px' }}>י</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>ישי כהן</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.30)' }}>מנהל נכסים</div>
          </div>
          <Settings size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
      </div>

      {/* ── Main content ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFF' }}>

        {/* Top header */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(226,232,240,0.8)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0B1220', lineHeight: 1.2 }}>לוח בקרה</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>יום שלישי, 15 יולי 2025</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F4F6FB', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={12} style={{ color: '#6b7280' }} />
              </div>
              <div style={{ position: 'absolute', top: '5px', right: '5px', width: '7px', height: '7px', borderRadius: '50%', background: '#00D1C1', border: '1.5px solid white' }} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0B1220, #1a2744)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', cursor: 'default' }}>
              + הזמנה חדשה
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'הכנסות החודש', value: '₪24,800', change: '↑ 18%', color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: TrendingUp },
              { label: 'הזמנות פעילות', value: '14', change: '3 כניסות היום', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: Calendar },
              { label: 'לידים חדשים', value: '28', change: '5 השבוע', color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: Users },
              { label: 'דירוג ממוצע', value: '4.9★', change: '42 ביקורות', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: Star },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid rgba(226,232,240,0.9)', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 4px rgba(11,18,32,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={10} style={{ color: s.color }} />
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0B1220', lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '9px', color: s.color, fontWeight: 600 }}>{s.change}</div>
              </div>
            ))}
          </div>

          {/* Two-panel row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', flex: 1, overflow: 'hidden' }}>

            {/* Bookings list */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.9)', padding: '12px', boxShadow: '0 1px 4px rgba(11,18,32,0.04)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0B1220' }}>הזמנות קרובות</span>
                <span style={{ fontSize: '9px', color: '#00D1C1', fontWeight: 600 }}>הצג הכל</span>
              </div>
              {bookings.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: i < bookings.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(0,209,193,0.25), rgba(99,102,241,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0B1220' }}>{b.name[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>{b.property} · {b.nights}</div>
                  </div>
                  <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, color: b.statusColor, background: b.statusBg, flexShrink: 0 }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Messages */}
            <div style={{ background: 'linear-gradient(145deg, #0B1220 0%, #162035 100%)', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 16px rgba(11,18,32,0.15)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(0,209,193,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>הודעות</span>
                <span style={{ fontSize: '9px', background: '#00D1C1', color: '#0B1220', padding: '1px 6px', borderRadius: '8px', fontWeight: 800 }}>3 חדשות</span>
              </div>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>{m.from[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>{m.from}</span>
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.28)' }}>{m.time}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.48)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.text}</div>
                  </div>
                </div>
              ))}
              {/* Quick reply box */}
              <div style={{ marginTop: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)' }}>כתבו תשובה...</span>
                <div style={{ width: '18px', height: '18px', background: '#00D1C1', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeft size={9} style={{ color: '#0B1220' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─── Hero Section ──────────────────────────────────────────── */
export default function HeroSection({ onLoginClick }) {
  return (
    <section
      dir="rtl"
      className="relative overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* ── Noise texture overlay ──────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* ── Gradient orbs ─────────────────────────────────── */}
      <div className="absolute pointer-events-none" style={{ top: '-120px', right: '-80px', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,209,193,0.13) 0%, transparent 65%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-100px', left: '-80px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)' }} />
      <div className="absolute pointer-events-none" style={{ top: '40%', left: '30%', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(0,209,193,0.05) 0%, transparent 70%)' }} />

      {/* ── Dot grid ──────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(11,18,32,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 1,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center" style={{ paddingTop: '130px', paddingBottom: '0' }}>

        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 cursor-default"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,209,193,0.30)',
            boxShadow: '0 2px 16px rgba(0,209,193,0.12), 0 1px 3px rgba(11,18,32,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1C1] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D1C1]" />
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
            פלטפורמת ניהול נכסי נופש #1 בישראל
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            color: '#0B1220',
            marginBottom: '24px',
          }}
        >
          ניהול נכסי נופש
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #00D1C1 0%, #0097a7 60%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            בצורה חכמה יותר
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.6 }}
          style={{ fontSize: '18px', color: '#6b7280', lineHeight: 1.65, maxWidth: '520px', margin: '0 auto 36px', fontWeight: 450 }}
        >
          הזמנות, לידים, תשלומים, ניקיון ותקשורת עם אורחים — הכל במקום אחד, על אוטומט.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="flex items-center justify-center gap-3 flex-wrap mb-12"
        >
          <button
            onClick={onLoginClick}
            className="btn-premium inline-flex items-center gap-2.5 text-white font-bold rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #0B1220 0%, #1e2d4a 100%)',
              boxShadow: '0 4px 20px rgba(11,18,32,0.30), inset 0 1px 0 rgba(255,255,255,0.08)',
              padding: '13px 28px',
              fontSize: '15px',
              letterSpacing: '-0.01em',
            }}
          >
            התחל בחינם
            <ArrowLeft size={16} />
          </button>
          <button
            className="inline-flex items-center gap-2.5 font-semibold rounded-2xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(11,18,32,0.10)',
              boxShadow: '0 2px 10px rgba(11,18,32,0.06)',
              padding: '13px 24px',
              fontSize: '15px',
              color: '#374151',
              letterSpacing: '-0.01em',
            }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #0B1220, #1e2d4a)' }}>
              <Play size={10} className="text-white fill-white" style={{ marginRight: '-1px' }} />
            </div>
            צפו בהדגמה
          </button>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48 }}
          className="flex items-center justify-center gap-8 flex-wrap mb-16"
        >
          <div className="flex items-center gap-3">
            <div className="flex" style={{ gap: '-8px' }}>
              {[
                'linear-gradient(135deg,#4dd0e1,#00acc1)',
                'linear-gradient(135deg,#ce93d8,#ab47bc)',
                'linear-gradient(135deg,#ffcc80,#ffa726)',
                'linear-gradient(135deg,#90caf9,#42a5f5)',
                'linear-gradient(135deg,#a5d6a7,#66bb6a)',
              ].map((g, i) => (
                <div key={i} className="rounded-full border-2 border-white shadow-sm"
                     style={{ width: '32px', height: '32px', background: g, marginRight: i > 0 ? '-8px' : '0', zIndex: 5 - i }} />
              ))}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0B1220', lineHeight: 1 }}>+5,000</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>לקוחות מרוצים</div>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>דירוג 4.9 ממוצע</span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-1.5">
            <Shield size={14} style={{ color: '#00D1C1' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>אין צורך בכרטיס אשראי</span>
          </div>
        </motion.div>
      </div>

      {/* ── Full-width App Screenshot ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6"
        style={{ paddingBottom: '0' }}
      >
        {/* Screenshot frame */}
        <div
          style={{
            borderRadius: '20px 20px 0 0',
            overflow: 'hidden',
            boxShadow: '0 -2px 0 0 rgba(226,232,240,0.9), 0 -30px 60px rgba(11,18,32,0.10), 0 -8px 20px rgba(11,18,32,0.06)',
            border: '1px solid rgba(226,232,240,0.9)',
            borderBottom: 'none',
            background: '#F4F6FB',
          }}
        >
          {/* Browser chrome bar */}
          <div style={{
            background: 'rgba(248,250,252,0.98)',
            borderBottom: '1px solid rgba(226,232,240,0.9)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, background: 'rgba(11,18,32,0.05)', borderRadius: '7px', padding: '4px 12px', fontSize: '11px', color: '#9ca3af', fontWeight: 500, textAlign: 'center' }}>
              app.atlas.co.il/dashboard
            </div>
          </div>

          {/* App UI */}
          <div style={{ height: '420px' }}>
            <AppScreenshot />
          </div>
        </div>

        {/* Bottom fade-in gradient */}
        <div style={{
          height: '80px',
          background: 'linear-gradient(to bottom, transparent, #ffffff)',
          marginTop: '-1px',
        }} />
      </motion.div>

      {/* ── Stats strip ───────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20" style={{ marginTop: '-20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(226,232,240,0.8)',
            borderRadius: '20px',
            padding: '20px 32px',
            boxShadow: '0 4px 24px rgba(11,18,32,0.07), 0 1px 4px rgba(11,18,32,0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="grid grid-cols-3 gap-4" style={{ borderRadius: 0 }}>
            {[
              { value: '87%', label: 'חיסכון בזמן ניהולי', sub: 'בממוצע ללקוח' },
              { value: '25K+', label: 'הזמנות מנוהלות', sub: 'מדי חודש בפלטפורמה' },
              { value: '4.9★', label: 'דירוג ממוצע', sub: 'מ-42 ביקורות מאומתות' },
            ].map((stat, i) => (
              <div key={i} className="text-center relative">
                {i > 0 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-gray-100" />
                )}
                <div style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#0B1220', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>{stat.label}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
