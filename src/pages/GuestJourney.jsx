import React, { useState } from 'react';
import { Workflow, MessageCircle, Mail, Phone, Clock, CheckCircle, ArrowDown, Send, Gift, Star, Home, FileText, Zap, ToggleLeft, ToggleRight, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-600 bg-green-50' },
  email: { icon: Mail, label: 'אימייל', color: 'text-blue-600 bg-blue-50' },
  sms: { icon: Phone, label: 'SMS', color: 'text-purple-600 bg-purple-50' },
};

const STAGE_THEMES = [
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-400/30', dot: 'bg-blue-500' },
  { gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-400/30', dot: 'bg-violet-500' },
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-400/30', dot: 'bg-emerald-500' },
  { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-400/30', dot: 'bg-amber-500' },
  { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-400/30', dot: 'bg-rose-500' },
  { gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', border: 'border-indigo-200', ring: 'ring-indigo-400/30', dot: 'bg-indigo-500' },
  { gradient: 'from-fuchsia-500 to-purple-500', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', ring: 'ring-fuchsia-400/30', dot: 'bg-fuchsia-500' },
];

const INITIAL_STAGES = [
  {
    id: 1,
    name: 'פנייה חדשה',
    subtitle: 'New Inquiry',
    trigger: 'ליד חדש נכנס',
    action: 'שלח הודעת WhatsApp: שלום! תודה על הפנייה...',
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
    action: 'שלח הצעת מחיר מותאמת אישית',
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
    action: 'שלח אישור + חוזה לחתימה + בקשת תשלום',
    timing: 'מיידי',
    channel: 'whatsapp',
    active: true,
    icon: CheckCircle,
  },
  {
    id: 4,
    name: 'לפני הגעה',
    subtitle: 'Pre-Arrival',
    trigger: 'יום לפני צ׳ק-אין',
    action: 'שלח לינק לפורטל אורחים + הוראות הגעה + קוד WiFi',
    timing: '24 שעות לפני',
    channel: 'whatsapp',
    active: true,
    icon: Home,
  },
  {
    id: 5,
    name: 'במהלך השהייה',
    subtitle: 'During Stay',
    trigger: 'יום אחרי צ׳ק-אין',
    action: 'שלח הודעה: הכל בסדר? צריכים משהו?',
    timing: '24 שעות אחרי',
    channel: 'whatsapp',
    active: true,
    icon: MessageCircle,
  },
  {
    id: 6,
    name: 'צ׳ק-אאוט',
    subtitle: 'Check-out',
    trigger: 'יום הצ׳ק-אאוט',
    action: 'שלח תודה + בקשת ביקורת + הנפק חשבונית',
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
    action: 'שלח קופון להזמנה חוזרת: 10% הנחה',
    timing: '7 ימים',
    channel: 'whatsapp',
    active: false,
    icon: Gift,
  },
];

const TEMPLATES = [
  {
    id: 'standard',
    name: 'מסע סטנדרטי',
    description: '7 שלבים — מכסה את כל מחזור החיים של האורח',
    badge: 'מומלץ',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    stages: 7,
  },
  {
    id: 'vip',
    name: 'מסע VIP',
    description: '10 שלבים — נקודות מגע נוספות ומתנות אישיות',
    badge: 'VIP',
    badgeColor: 'bg-amber-100 text-amber-700',
    stages: 10,
  },
  {
    id: 'minimal',
    name: 'מסע מינימלי',
    description: '4 שלבים — רק ההודעות החיוניות',
    badge: 'בסיסי',
    badgeColor: 'bg-gray-100 text-gray-600',
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
        <div className="w-0.5 h-8 bg-gradient-to-b from-gray-200 to-gray-300 -mt-0" />
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
        'relative w-[320px] rounded-2xl border p-4 transition-all duration-300 group',
        stage.active
          ? `${theme.bg}/60 ${theme.border} shadow-sm hover:shadow-md hover:ring-2 ${theme.ring}`
          : 'bg-gray-50/60 border-gray-200 opacity-60'
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
            stage.active ? `bg-gradient-to-br ${theme.gradient} text-white shadow-sm` : 'bg-gray-200 text-gray-400'
          )}>
            <StageIcon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn('font-bold text-sm', stage.active ? 'text-gray-900' : 'text-gray-400')}>
              {stage.name}
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">{stage.subtitle}</span>
          </div>
        </div>

        {/* Trigger */}
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 mb-2 text-xs',
          stage.active ? 'bg-white/80 border border-gray-100' : 'bg-gray-100/60 border border-gray-100'
        )}>
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-500 shrink-0">מתי:</span>
          <span className={cn('font-medium', stage.active ? 'text-gray-700' : 'text-gray-400')}>{stage.trigger}</span>
        </div>

        {/* Action */}
        <div className={cn(
          'flex items-start gap-2 rounded-lg px-3 py-2 mb-3 text-xs',
          stage.active ? 'bg-white/80 border border-gray-100' : 'bg-gray-100/60 border border-gray-100'
        )}>
          <Zap className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span className="text-gray-500 shrink-0">פעולה:</span>
          <span className={cn('font-medium leading-relaxed', stage.active ? 'text-gray-700' : 'text-gray-400')}>{stage.action}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Channel badge */}
            <span className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1',
              stage.active ? ChannelMeta.color : 'bg-gray-100 text-gray-400'
            )}>
              <ChannelIcon className="w-3 h-3" />
              {ChannelMeta.label}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 bg-white/80 border border-gray-100',
              stage.active ? 'text-gray-500' : 'text-gray-300'
            )}>
              <Clock className="w-3 h-3" />
              {stage.timing}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button className={cn(
              'text-[11px] font-medium px-2 py-1 rounded-lg transition-colors',
              stage.active
                ? 'text-gray-500 hover:text-gray-700 hover:bg-white/80'
                : 'text-gray-300'
            )}>
              ערוך
            </button>
            <button
              onClick={() => onToggle(stage.id)}
              className="transition-colors"
            >
              {stage.active ? (
                <ToggleRight className="w-7 h-7 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Arrow to next */}
      {index < total - 1 && (
        <div className="flex flex-col items-center mt-1">
          <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-gray-200" />
          <ArrowDown className="w-4 h-4 text-gray-300 -mt-1" />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function TemplateCard({ template, onUse }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all hover:border-violet-200 group">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-sm text-gray-900">{template.name}</h3>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', template.badgeColor)}>
          {template.badge}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{template.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{template.stages} שלבים</span>
        <button
          onClick={() => onUse(template.id)}
          className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          השתמש בתבנית
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

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white p-4 md:p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">מסע אורח</h1>
              <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">
          בנה את מסע האורח המושלם — מהפנייה הראשונה ועד הביקורת. כל שלב אוטומטי, כל הודעה בזמן הנכון.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Send} value="234" label="הודעות שנשלחו החודש" color="bg-blue-50 text-blue-600" />
        <StatCard icon={Sparkles} value="89%" label="שיעור פתיחה" color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Star} value="12" label="ביקורות שהתקבלו" color="bg-amber-50 text-amber-600" />
        <StatCard icon={Gift} value="8" label="הזמנות חוזרות" color="bg-violet-50 text-violet-600" />
      </div>

      {/* Journey Info Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            {activeCount} מתוך {stages.length} שלבים פעילים
          </span>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
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
      <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        {/* Decorative bg elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-violet-100/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-0 py-4">
          {/* Start marker */}
          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold shadow-lg">
            <Zap className="w-3.5 h-3.5" />
            התחלת המסע
          </div>
          <div className="w-0.5 h-6 bg-gradient-to-b from-violet-300 to-gray-200" />

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
            <div className="w-0.5 h-6 bg-gradient-to-b from-gray-200 to-gray-300 mx-auto" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg mt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              סיום המסע
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
