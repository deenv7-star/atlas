import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageSquare, Send, Search, X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STALE_LIVE_MS } from '@/lib/queryStaleTimes';

const CHANNEL_ICONS = {
  whatsapp: '💬',
  email: '📧',
  sms: '📱',
  airbnb: '🏠',
  booking: '🔵',
};

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
      toast({ title: 'הודעה נשלחה' });
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
    sendMutation.mutate({
      guest_name: currentThread.guest_name,
      booking_id: currentThread.key,
      body: replyText.trim(),
      channel: currentThread.channel,
      direction: 'outbound',
      status: 'sent',
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-4 mx-4 mt-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">הודעות</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">כל ההודעות לאורחים וללידים במקום אחד. שלח הודעות WhatsApp, מייל או SMS ישירות מכאן.</p>
        <p className="text-indigo-500 text-xs mt-1 mr-[3.25rem]">💡 טיפ: תוכל לשלוח הודעות מוכנות מראש כדי לחסוך זמן</p>
      </div>
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
      {/* Threads list */}
      <div className={cn(
        "flex flex-col border-l border-gray-100 bg-white transition-all",
        "w-full md:w-72 lg:w-80 flex-shrink-0",
        selectedThread && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00D1C1]" />
              הודעות
            </h1>
            <Badge className="bg-[#00D1C1]/10 text-[#00D1C1] text-xs border-0">
              {logs.length} הודעות
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="חפש שיחה..."
              className="h-8 pr-8 text-sm bg-gray-50 border-0"
            />
          </div>
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">אין שיחות</p>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <button
                key={thread.key}
                onClick={() => setSelectedThread(thread.key)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-right",
                  selectedThread === thread.key && "bg-[#00D1C1]/5"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-teal-600">
                  {(thread.guest_name || 'א')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 truncate">{thread.guest_name}</p>
                    <div className="flex items-center gap-1">
                      {thread.unread > 0 && (
                        <span className="w-4 h-4 bg-[#00D1C1] rounded-full text-[10px] text-white flex items-center justify-center flex-shrink-0">
                          {thread.unread}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {thread.last_date ? format(parseISO(thread.last_date), 'HH:mm', { locale: he }) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{CHANNEL_ICONS[thread.channel] || '💬'}</span>
                    <p className="text-xs text-gray-400 truncate">
                      {thread.messages[thread.messages.length - 1]?.body || 'הודעה'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {/* Chat header */}
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSelectedThread(null)}
              className="md:hidden p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-sm font-semibold text-teal-600">
              {(currentThread?.guest_name || 'א')[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{currentThread?.guest_name}</p>
              <p className="text-xs text-gray-400">
                {CHANNEL_LABELS[currentThread?.channel] || 'הודעה'}
                {currentThread?.property_name && ` · ${currentThread.property_name}`}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentThread?.messages
              .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
              .map((msg, i) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div key={i} className={cn("flex", isOutbound ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl text-sm",
                      isOutbound
                        ? "bg-white text-gray-800 shadow-sm rounded-tr-sm"
                        : "bg-[#00D1C1] text-[#0B1220] rounded-tl-sm"
                    )}>
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className={cn("text-[10px] mt-0.5", isOutbound ? "text-gray-400" : "text-[#0B1220]/50")}>
                        {msg.created_at ? format(parseISO(msg.created_at), 'HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          <div className="bg-white border-t border-gray-100 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="כתוב הודעה... (Enter לשליחה)"
                rows={1}
                className="flex-1 text-sm resize-none min-h-[36px] max-h-[120px] border-gray-200"
              />
              <Button
                onClick={handleSend}
                disabled={!replyText.trim() || sendMutation.isPending}
                className="flex-shrink-0 h-9 w-9 p-0 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220]"
              >
                {sendMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">בחר שיחה להצגה</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}