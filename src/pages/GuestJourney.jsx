import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStayData } from '@/hooks/useStayData';
import { PageHeader } from '@/components/ds';
import { MessageCircle, Mail, Phone, Clock, CheckCircle, ArrowDown, Send, Gift, Star, Home, FileText, Zap, ToggleLeft, ToggleRight, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = {
  whatsapp: { icon: MessageCircle, label: 'וואטסאפ', color: 'text-green-600 bg-green-50' },
  email: { icon: Mail, label: 'אימייל', color: 'text-brand-600 bg-brand-50' },
  sms: { icon: Phone, label: 'SMS', color: 'text-brand-600 bg-brand-50' },
};

const STAGE_THEMES = [
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-brand-50', border: 'border-brand-100', ring: 'ring-brand-400/30', dot: 'bg-brand-500' },
  { gradient: 'from-brand-500 to-brand-500', bg: 'bg-brand-50', border: 'border-brand-100', ring: 'ring-brand-400/30', dot: 'bg-brand-500' },
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-400/30', dot: 'bg-emerald-500' },
  { gradient: 'from-brand-300 to-brand-300', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-400/30', dot: 'bg-brand-300' },
  { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-400/30', dot: 'bg-rose-500' },
  { gradient: 'from-brand-500 to-blue-500', bg: 'bg-brand-50', border: 'border-brand-100', ring: 'ring-brand-400/30', dot: 'bg-brand-500' },
  { gradient: 'from-brand-500 to-brand-500', bg: 'bg-brand-50', border: 'border-brand-100', ring: 'ring-brand-400/30', dot: 'bg-brand-500' },
];

const INITIAL_STAGES = [
  {
    id: 1,
    name: 'פנייה חדשה',
    subtitle: 'New Inquiry',
    trigger: 'ליד חדש נכנס',
    action: 'הודעת וואטסאפ: שלום! תודה על הפנייה...',
    timing: 'מיידי',
    channel: 'whatsapp',
    active: true,
    icon: Send,
  },
  {
    id: 2,
    name: 'הצעת מחיר',
    subtitle: 'Quote Sent',
    trigger: '2 שעות אחרי פנייה',
    action: 'הצעת מחיר מותאמת אישית',
    timing: '2 שעות',
    channel: 'email',
    active: true,
    icon: FileText,
  },
  {
    id: 3,
    name: 'אישור הזמנה',
    subtitle: 'Booking Confirmed',
    trigger: 'הזמנה אושרה',
    action: 'אישור, חוזה לחתימה ובקשת תשלום',
    timing: 'מיידי',
    channel: 'whatsapp',
    active: true,
    icon: CheckCircle,
  },
  {
    id: 4,
    name: 'לפני הגעה',
    subtitle: 'Pre-Arrival',
    trigger: 'יום לפני הכניסה',
    action: 'שליחת דף האורח + הוראות הגעה + קוד WiFi',
    timing: '24 שעות לפני',
    channel: 'whatsapp',
    active: true,
    icon: Home,
  },
  {
    id: 5,
    name: 'במהלך השהייה',
    subtitle: 'During Stay',
    trigger: 'יום אחרי הכניסה',
    action: 'הודעה: הכל בסדר? צריכים משהו?',
    timing: '24 שעות אחרי',
    channel: 'whatsapp',
    active: true,
    icon: MessageCircle,
  },
  {
    id: 6,
    name: 'יציאה',
    subtitle: 'Check-out',
    trigger: 'יום היציאה',
    action: 'תודה, בקשת ביקורת וחשבונית',
    timing: 'ביום',
    channel: 'email',
    active: true,
    icon: Star,
  },
  {
    id: 7,
    name: 'לאחר השהייה',
    subtitle: 'Post-Stay',
    trigger: 'שבוע אחרי',
    action: 'קופון להזמנה חוזרת: 10% הנחה',
    timing: '7 ימים',
    channel: 'whatsapp',
    active: false,
    icon: Gift,
  },
];

const TEMPLATES = [
  {
    id: 'standard',
    name: 'רגיל',
    description: '7 שלבים, מהפנייה ועד אחרי היציאה',
    badge: 'מומלץ',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    stages: 7,
  },
  {
    id: 'vip',
    name: 'VIP',
    description: '10 שלבים, עם עוד הודעות ומתנות אישיות',
    badge: 'VIP',
    badgeColor: 'bg-amber-100 text-amber-700',
    stages: 10,
  },
  {
    id: 'minimal',
    name: 'מינימלי',
    description: '4 שלבים, רק ההודעות החיוניות',
    badge: 'בסיסי',
    badgeColor: 'bg-neutral-100 text-ink-600',
    stages: 4,
  },
];

function StageCard({ stage, theme, index, total, onToggle }) {
  const ChannelMeta = CHANNELS[stage.channel];
  const ChannelIcon = ChannelMeta.icon;
  const StageIcon = stage.icon;

  return (
    <div className="relative flex flex-col items-center">
      {/* Connector line from previous */}
      {index > 0 && (
        <div className="w-0.5 h-8 bg-gray-200 -mt-0" />
      )}

      {/* Step number circle */}
      <div className={cn(
        'relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-white mb-3',
        `bg-gradient-to-br ${theme.gradient}`,
        !stage.active && 'opacity-50 grayscale'
      )}>
        {stage.id}
      </div>

      {/* Card */}
      <div className={cn(
        'relative w-full max-w-[320px] min-w-0 rounded-2xl border p-4 transition-[background-color,border-color,color,box-shadow,transform] duration-300 group',
        stage.active
          ? `${theme.bg}/60 ${theme.border} shadow-sm hover:shadow-md hover:ring-2 ${theme.ring}`
          : 'bg-canvas border-line opacity-60'
      )}>
        {/* Active dot */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            stage.active ? `${theme.dot} animate-pulse` : 'bg-gray-300'
          )} />
        </div>

        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            stage.active ? `bg-gradient-to-br ${theme.gradient} text-white shadow-sm` : 'bg-gray-200 text-ink-400'
          )}>
            <StageIcon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn('font-bold text-sm', stage.active ? 'text-navy-900' : 'text-ink-400')}>
              {stage.name}
            </h3>
          </div>
        </div>

        {/* Trigger */}
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 mb-2 text-xs',
          stage.active ? 'bg-white/80 border border-line' : 'bg-neutral-100/60 border border-line'
        )}>
          <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          <span className="text-ink-600 shrink-0">מתי:</span>
          <span className={cn('font-medium', stage.active ? 'text-ink-600' : 'text-ink-400')}>{stage.trigger}</span>
        </div>

        {/* Action */}
        <div className={cn(
          'flex items-start gap-2 rounded-lg px-3 py-2 mb-3 text-xs',
          stage.active ? 'bg-white/80 border border-line' : 'bg-neutral-100/60 border border-line'
        )}>
          <Zap className="w-3.5 h-3.5 text-ink-400 shrink-0 mt-0.5" />
          <span className="text-ink-600 shrink-0">פעולה:</span>
          <span className={cn('font-medium leading-relaxed', stage.active ? 'text-ink-600' : 'text-ink-400')}>{stage.action}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Channel badge */}
            <span className={cn(
              'inline-flex items-center gap-1 text-[12px] font-medium rounded-full px-2.5 py-1',
              stage.active ? ChannelMeta.color : 'bg-neutral-100 text-ink-400'
            )}>
              <ChannelIcon className="w-3 h-3" />
              {ChannelMeta.label}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 text-[12px] font-medium rounded-full px-2.5 py-1 bg-white/80 border border-line',
              stage.active ? 'text-ink-600' : 'text-neutral-300'
            )}>
              <Clock className="w-3 h-3" />
              {stage.timing}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggle(stage.id)}
              aria-label={stage.active ? 'כיבוי שלב' : 'הפעלת שלב'}
              aria-pressed={!!stage.active}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
            >
              {stage.active ? (
                <ToggleRight className="w-7 h-7 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-neutral-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Arrow to next */}
      {index < total - 1 && (
        <div className="flex flex-col items-center mt-1">
          <div className="w-0.5 h-6 bg-gray-300" />
          <ArrowDown className="w-4 h-4 text-neutral-300 -mt-1" />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-white rounded-xl border border-line p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-navy-900">{value}</p>
        <p className="text-xs text-ink-600">{label}</p>
      </div>
    </div>
  );
}

function TemplateCard({ template, onUse }) {
  return (
    <div className="bg-white rounded-xl border border-line p-4 shadow-sm hover:shadow-md transition-[background-color,border-color,color,box-shadow,transform] hover:border-brand-100 group">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-sm text-navy-900">{template.name}</h3>
        <span className={cn('text-[12px] font-semibold px-2 py-0.5 rounded-full', template.badgeColor)}>
          {template.badge}
        </span>
      </div>
      <p className="text-xs text-ink-600 mb-3 leading-relaxed">{template.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-ink-400">{template.stages} שלבים</span>
        <button
          onClick={() => onUse(template.id)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          שימוש בתבנית
        </button>
      </div>
    </div>
  );
}

export default function GuestJourney() {
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [showTemplates, setShowTemplates] = useState(false);

  const toggleStage = (id) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const activeCount = stages.filter(s => s.active).length;

  // Real numbers from the organization's own data (were hard-coded 234 / 89% / 12 / 8).
  const { bookings, messageLogs, isLoading } = useStayData({ withCleaning: false });
  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const sent = (messageLogs || []).filter((l) => String(l.created_date || l.created_at || l.sent_at || '').slice(0, 7) === month).length;
    const guestKey = (b) => String(b.guest_phone || '').replace(/\D/g, '').slice(-9) || String(b.guest_email || '').toLowerCase();
    const counts = new Map();
    for (const b of bookings || []) {
      if (['CANCELLED', 'CANCELED'].includes(String(b.status || '').toUpperCase()) || b.is_block) continue;
      const k = guestKey(b);
      if (!k) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const returning = [...counts.values()].filter((n) => n > 1).length;
    const stays = (bookings || []).filter((b) => !b.is_block && !['CANCELLED', 'CANCELED'].includes(String(b.status || '').toUpperCase())).length;
    return { sent, returning, stays };
  }, [bookings, messageLogs]);
  const show = (n) => (isLoading ? '—' : n.toLocaleString('he-IL'));

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[960px] px-5 pb-16 pt-6 md:px-10 md:pt-10">

      {/* Header */}
      <PageHeader title="שלבי האירוח" subtitle="כל מה שהאורח מקבל מכם, מהפנייה ועד הביקורת." className="!mb-0" />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Send} value={show(stats.sent)} label="הודעות שנשלחו החודש" color="bg-brand-50 text-brand-600" />
        <StatCard icon={Home} value={show(stats.stays)} label="שהיות עד היום" color="bg-brand-50 text-brand-600" />
        <StatCard icon={Gift} value={show(stats.returning)} label="אורחים שחזרו" color="bg-brand-50 text-brand-600" />
        <StatCard icon={Star} value={show(activeCount)} label="שלבים מסומנים" color="bg-brand-50 text-brand-600" />
      </div>
      <p className="-mt-3 mb-6 px-1 text-[13px] leading-relaxed text-ink-400">
        זה תכנון בלבד. את ההודעות שנשלחות בפועל מגדירים ב<Link to="/automations" className="font-semibold text-brand-600 hover:underline">אוטומציות</Link>.
      </p>

      {/* Journey Info Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-600" />
          <span className="text-sm font-medium text-ink-600">
            {activeCount} מתוך {stages.length} שלבים פעילים
          </span>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          תבניות מוכנות
          <ChevronDown className={cn('w-4 h-4 transition-transform', showTemplates && 'rotate-180')} />
        </button>
      </div>

      {/* Template Gallery */}
      {showTemplates && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEMPLATES.map(t => (
              <TemplateCard key={t.id} template={t} onUse={(id) => setShowTemplates(false)} />
            ))}
          </div>
        </div>
      )}

      {/* Visual Journey Timeline */}
      <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-line shadow-sm p-6 md:p-8">
        {/* Decorative bg elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-brand-100/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-0 py-4">
          {/* Start marker */}
          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg">
            <Zap className="w-3.5 h-3.5" />
            הפנייה הראשונה
          </div>
          <div className="w-0.5 h-6 bg-brand-100" />

          {stages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              theme={STAGE_THEMES[index % STAGE_THEMES.length]}
              index={index}
              total={stages.length}
              onToggle={toggleStage}
            />
          ))}

          {/* End marker */}
          <div className="mt-2">
            <div className="w-0.5 h-6 bg-gray-200 mx-auto" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg mt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              אחרי היציאה
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
