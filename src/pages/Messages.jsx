import React, { useState, useMemo, useRef, useEffect } from 'react';
import { isUuid } from '@/lib/entityPayloads';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { waLink } from '@/lib/stay/whatsapp';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { PageHeader, EmptyState, SkelRows, Avatar } from '@/components/ds';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageSquare, Send, Search, ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STALE_LIVE_MS } from '@/lib/queryStaleTimes';

const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  email: 'אימייל',
  sms: 'SMS',
  airbnb: 'Airbnb',
  booking: 'Booking.com',
};

export default function MessagesPage({ user, selectedPropertyId, orgId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['message-logs', orgId, selectedPropertyId],
    queryFn: async () => {
      const filters = {};
      if (orgId) filters.org_id = orgId;
      if (selectedPropertyId) filters.property_id = selectedPropertyId;
      return base44.entities.MessageLog.filter(filters, '-created_date', 250);
    },
    enabled: !!orgId,
    staleTime: STALE_LIVE_MS,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread, logs]);

  const sendMutation = useMutation({
    mutationFn: async (payload) => {
      return base44.entities.MessageLog.create({
        ...payload,
        org_id: orgId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-logs'] });
      setReplyText('');
      toast({ title: 'וואטסאפ נפתח עם ההודעה', description: 'שלחו אותה בוואטסאפ. היא נשמרה בשיחה כאן.' });
    },
    onError: () => toast({ title: 'שגיאה בשליחת ההודעה', variant: 'destructive' }),
  });

  // Group messages by conversation (guest/booking)
  const threads = useMemo(() => {
    const grouped = {};
    logs.forEach(log => {
      const key = log.booking_id || log.guest_id || log.guest_name || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          key,
          guest_name: log.guest_name || log.recipient_name || 'אורח',
          property_name: log.property_name || '',
          channel: log.channel || 'whatsapp',
          messages: [],
          last_date: log.created_at,
          unread: 0,
        };
      }
      grouped[key].messages.push(log);
      if (log.created_at > (grouped[key].last_date || '')) {
        grouped[key].last_date = log.created_at;
      }
    });
    return Object.values(grouped)
      .sort((a, b) => new Date(b.last_date || 0) - new Date(a.last_date || 0));
  }, [logs]);

  const filteredThreads = useMemo(() => {
    if (!searchTerm) return threads;
    return threads.filter(t =>
      t.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.property_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [threads, searchTerm]);

  const currentThread = selectedThread
    ? threads.find(t => t.key === selectedThread)
    : null;

  const handleSend = () => {
    if (!replyText.trim() || !currentThread) return;
    const lastMsg = currentThread.messages?.[currentThread.messages.length - 1] || {};
    // No WhatsApp API is connected yet: the message goes out from the owner's own WhatsApp (wa.me, prefilled),
    // opened inside the tap so mobile browsers allow it. We only log what the owner chose to send.
    const phone = currentThread.messages.map((m) => m.recipient).filter(Boolean).pop() || '';
    if (String(currentThread.channel || 'whatsapp').toLowerCase().includes('whatsapp')) {
      window.open(waLink(phone, replyText.trim()), '_blank', 'noopener,noreferrer');
    }
    sendMutation.mutate({
      guest_name: currentThread.guest_name,
      // thread key falls back to guest name when there is no booking — only send real ids
      booking_id: isUuid(currentThread.key) ? currentThread.key : (lastMsg.booking_id || null),
      lead_id: lastMsg.lead_id || null,
      property_id: lastMsg.property_id || null,
      recipient: lastMsg.recipient || null,
      body: replyText.trim(),
      channel: currentThread.channel,
      direction: 'outbound',
      status: 'sent',
      subject: 'וואטסאפ · הודעה ידנית',
    });
  };

  // Desktop shows list + conversation side by side: open the newest thread instead of an empty pane.
  useEffect(() => {
    if (selectedThread || typeof window === 'undefined' || window.innerWidth < 768) return;
    if (filteredThreads?.length) setSelectedThread(filteredThreads[0].key);
  }, [filteredThreads, selectedThread]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const CHANNEL_TONE = { whatsapp: 'bg-success-50 text-success-600', sms: 'bg-brand-50 text-brand-700', email: 'bg-neutral-100 text-ink-600', airbnb: 'bg-danger-50 text-danger-600', booking: 'bg-neutral-100 text-navy-900' };
  const ChannelTag = ({ channel }) => (
    <span className={cn('inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[12px] font-bold leading-none', CHANNEL_TONE[channel] || 'bg-neutral-100 text-ink-600')}>
      {CHANNEL_LABELS[channel] || 'הודעה'}
    </span>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden" dir="rtl">
      <div className="mx-auto w-full max-w-[var(--page-max,1200px)] flex-shrink-0 px-5 pt-3 md:px-10 md:pt-5">
        <PageHeader title="הודעות" help="messages.page" tour="messages-page" subtitle="וואטסאפ, SMS ומייל לאורחים, במקום אחד." className="!mb-4 md:!mb-5" />
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-[var(--page-max,1200px)] flex-1 flex-col overflow-hidden md:mb-6 md:px-10">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-line bg-white md:flex-row md:rounded-[22px] md:border md:shadow-card">
      {/* Threads list */}
      <div data-tour="messages-list" className={cn(
        'flex w-full flex-shrink-0 flex-col border-line bg-white md:w-80 md:border-l lg:w-96',
        selectedThread && 'hidden md:flex'
      )}>
        <div className="border-b border-line px-4 pb-3 pt-1 md:pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" strokeWidth={1.5} aria-hidden />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם אורח"
              aria-label="חיפוש שיחה"
              className="rounded-full pr-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4"><SkelRows rows={5} /></div>
          ) : filteredThreads.length === 0 ? (
            <EmptyState compact icon={MessageSquare} title={searchTerm ? 'לא נמצאו שיחות' : 'עוד לא נשלחו הודעות'} description={searchTerm ? 'נסו שם אחר.' : 'פותחים הזמנה ולוחצים "שליחה בוואטסאפ". השיחה תופיע כאן.'} action={searchTerm ? null : <Button asChild><Link to={createPageUrl('Bookings')}>להזמנות</Link></Button>} />
          ) : (
            filteredThreads.map(thread => {
              const last = thread.messages[thread.messages.length - 1];
              const active = selectedThread === thread.key;
              return (
                <button
                  key={thread.key}
                  type="button"
                  onClick={() => setSelectedThread(thread.key)}
                  className={cn(
                    'flex min-h-[72px] w-full items-start gap-3 border-b border-line px-4 py-3 text-right transition-colors duration-150 hover:bg-canvas',
                    active && 'bg-brand-50 hover:bg-brand-50'
                  )}
                >
                  <Avatar name={thread.guest_name} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[15px] font-bold text-navy-900">{thread.guest_name}</p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {thread.unread > 0 && (
                          <span className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[12px] font-bold text-white">{thread.unread}</span>
                        )}
                        <span className="tabular text-[13px] text-ink-400">
                          {thread.last_date ? format(parseISO(thread.last_date), 'HH:mm', { locale: he }) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ChannelTag channel={thread.channel} />
                      <p className="truncate text-[14px] text-ink-600">{last?.body || 'הודעה'}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      {selectedThread ? (
        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setSelectedThread(null)}
              aria-label="חזרה לרשימת השיחות"
              className="press -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-ink-600 hover:bg-neutral-100 md:hidden"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Avatar name={currentThread?.guest_name} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-navy-900">{currentThread?.guest_name}</p>
              <p className="truncate text-[13px] text-ink-400">
                {CHANNEL_LABELS[currentThread?.channel] || 'הודעה'}
                {currentThread?.property_name && ` · ${currentThread.property_name}`}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
            {currentThread?.messages
              .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
              .map((msg, i) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div key={i} className={cn('flex', isOutbound ? 'justify-start' : 'justify-end')}>
                    <div className={cn(
                      'max-w-[80%] rounded-[22px] px-3.5 py-2.5 text-[15px] lg:max-w-md',
                      isOutbound
                        ? 'rounded-tr-[6px] bg-brand-600 text-white'
                        : 'rounded-tl-[6px] border border-line bg-white text-navy-900'
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      <p className={cn('tabular mt-1 text-[12px]', isOutbound ? 'text-white/85' : 'text-ink-400')}>
                        {msg.created_at ? format(parseISO(msg.created_at), 'HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-line bg-white p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:pb-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="כתיבת הודעה (תישלח מהוואטסאפ שלכם)"
                aria-label="כתיבת הודעה, תישלח מהוואטסאפ שלכם"
                rows={1}
                className="max-h-[120px] min-h-[44px] flex-1 resize-none text-[15px]"
              />
              <Button
                onClick={handleSend}
                disabled={!replyText.trim() || sendMutation.isPending}
                size="icon"
                aria-label="שליחה"
                className="shrink-0"
              >
                <Send className="h-[18px] w-[18px] -scale-x-100" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center bg-canvas md:flex">
          <EmptyState compact icon={MessageSquare} title="בחרו שיחה מהרשימה" description="לוחצים על שם של אורח כדי לראות את ההודעות ולכתוב לו." />
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
