/** The one action an insight offers: a link to the right screen, or a callback (WhatsApp composer, new booking). */
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BASE = 'press inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';
const TONES = {
  solid: 'bg-brand-600 text-white hover:bg-[#3322D9]',
  soft: 'bg-[#F1F1F8] text-navy-900 hover:bg-[#E8E8F2]',
};

export default function InsightActionButton({ item, onAction, tone = 'soft', className }) {
  const a = item.action || {};
  const cls = cn(BASE, TONES[tone], className);
  if (a.to) return <Link to={a.to} className={cls}>{a.label}</Link>;
  return <button type="button" className={cls} onClick={() => onAction?.(item)}>{a.label}</button>;
}
