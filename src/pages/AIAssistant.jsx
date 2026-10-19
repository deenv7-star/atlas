import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Send, Sparkles, Loader2, TrendingUp, Calendar, 
  DollarSign, Users, Lightbulb
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { todayIsrael } from '@/lib/localDate';

const QUICK_QUESTIONS = [
  { icon: TrendingUp, text: 'ניתוח ביצועים החודש', prompt: 'תן לי ניתוח מפורט של הביצועים העסקיים שלי החודש - הזמנות, הכנסות, תפוסה, והשוואה לחודש הקודם. הוסף תובנות והמלצות.' },
  { icon: Calendar, text: 'סיכום היום שלי', prompt: 'תן לי סיכום מלא של היום: כניסות, יציאות, תשלומים לגביה, משימות פתוחות ופעולות דחופות שצריך לבצע.' },
  { icon: DollarSign, text: 'מצב כספי מלא', prompt: 'תן לי דוח כספי מלא: תשלומים ממתינים, באיחור, צפויים בשבוע הקרוב, והכנסות החודש. כלול המלצות לגבייה.' },
  { icon: Users, text: 'ניהול לידים חכם', prompt: 'נתח את הלידים הפתוחים שלי - סדר לפי עדיפות, תן לי טקסטים מוכנים לשליחה, והמלצות לסגירת עסקאות.' },
  { icon: Lightbulb, text: 'אסטרטגיה לצמיחה', prompt: 'על בסיס כל הנתונים, תן לי תוכנית פעולה אסטרטגית להגדלת ההכנסות והשיפור התפעולי - 5 צעדים קונקרטיים.' }
];

export default function AIAssistantPage({ user, orgId, selectedPropertyId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch business data for context
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-ai', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }),
    enabled: !!orgId
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-ai', orgId],
    queryFn: () => base44.entities.Lead.filter({ org_id: orgId }),
    enabled: !!orgId
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-ai', orgId],
    queryFn: () => base44.entities.Payment.filter({ org_id: orgId }),
    enabled: !!orgId
  });

  const { data: cleaningTasks = [] } = useQuery({
    queryKey: ['cleaning-ai', orgId],
    queryFn: () => base44.entities.CleaningTask.filter({ org_id: orgId }),
    enabled: !!orgId
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-ai'],
    queryFn: () => base44.entities.Property.list(),
    staleTime: 5 * 60 * 1000,
  });

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    const today = todayIsrael();
    const thisMonth = today.substring(0, 7);

    // Calculate metrics
    const thisMonthBookings = bookings.filter(b => (b.check_in_date || b.checkin_date)?.startsWith(thisMonth));
    const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const todayCheckins = bookings.filter(b => b.checkin_date === today);
    const todayCheckouts = bookings.filter(b => b.checkout_date === today);
    const overduePayments = payments.filter(p => p.status === 'DUE' && p.due_date && p.due_date < today);
    const pendingPayments = payments.filter(p => p.status === 'DUE');
    const newLeads = leads.filter(l => l.status === 'NEW');
    const pendingCleaning = cleaningTasks.filter(t => t.status === 'OPEN');

    return `
אתה עוזר AI חכם של מערכת ניהול נכסים לטווח קצר בשם ATLAS.
אתה מדבר עברית, אדיב, מקצועי ונותן תשובות קצרות ומדויקות.

נתוני העסק:
- שם הנכס הנוכחי: ${selectedProperty?.name || 'לא נבחר'}
- מספר הזמנות החודש: ${thisMonthBookings.length}
- סה"כ הכנסות החודש: ₪${thisMonthRevenue.toLocaleString()}
- כניסות היום: ${todayCheckins.length}
- יציאות היום: ${todayCheckouts.length}
- תשלומים באיחור: ${overduePayments.length}
- תשלומים ממתינים: ${pendingPayments.length}
- לידים חדשים: ${newLeads.length}
- משימות ניקיון פתוחות: ${pendingCleaning.length}

התאריך היום: ${new Date().toLocaleDateString('he-IL')}
`;
  };

  const handleSend = async (customPrompt = null) => {
    const messageText = customPrompt || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = buildContext();
      const fullPrompt = `${context}\n\nשאלת המשתמש: ${messageText}\n\nתשובה:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt
      });

      const assistantMessage = { 
        role: 'assistant', 
        content: response || 'מצטער, לא הצלחתי לענות על השאלה. נסה שוב.' 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: error?.code === 'AI_NOT_CONFIGURED' || error?.code === 'AI_ERROR' ? error.message : 'משהו השתבש. נסו שוב.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleSend(question.prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-[calc(100dvh-180px)] h-[calc(100dvh-180px)] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: [
                "0 10px 30px rgba(79, 70, 229, 0.3)",
                "0 10px 40px rgba(79, 70, 229, 0.5)",
                "0 10px 30px rgba(79, 70, 229, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="h-7 w-7 text-white" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-navy-900">עוזר AI חכם</h1>
              <Badge className="bg-brand-500 text-white border-0 shadow-sm">
                <Sparkles className="h-3 w-3 ml-1" />
                AI מופעל
              </Badge>
            </div>
                    <p className="text-ink-600">העוזר האישי שלך לניהול הנכסים, ניתוח נתונים, המלצות והחלטות חכמות בזמן אמת</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="v7-card p-3 shadow-card">
            <div className="mb-1 text-[13px] font-medium text-ink-600">הזמנות החודש</div>
            <div className="tabular text-[22px] font-bold text-navy-900">{bookings.filter(b => (b.check_in_date || b.checkin_date)?.startsWith(new Date().toISOString().substring(0, 7))).length}</div>
          </div>
          <div className="v7-card p-3 shadow-card">
            <div className="mb-1 text-[13px] font-medium text-ink-600">לידים פעילים</div>
            <div className="tabular text-[22px] font-bold text-navy-900">{leads.filter(l => ['NEW', 'CONTACTED', 'OFFER_SENT'].includes(l.status)).length}</div>
          </div>
          <div className="v7-card p-3 shadow-card">
            <div className="mb-1 text-[13px] font-medium text-ink-600">תשלומים ממתינים</div>
            <div className="tabular text-[22px] font-bold text-navy-900">{payments.filter(p => p.status === 'DUE').length}</div>
          </div>
          <div className="v7-card p-3 shadow-card">
            <div className="mb-1 text-[13px] font-medium text-ink-600">משימות פתוחות</div>
            <div className="tabular text-[22px] font-bold text-navy-900">{cleaningTasks.filter(t => t.status === 'OPEN').length}</div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand-50 text-brand-600"><Bot className="h-7 w-7" strokeWidth={1.75} /></span>
                <h3 className="text-2xl font-bold text-navy-900 mb-2">העוזר של ATLAS</h3>
                <p className="text-ink-600 mb-3 leading-relaxed">אני מנתח את כל הנתונים שלך בזמן אמת ויכול לעזור לך עם:</p>
                <div className="grid grid-cols-2 gap-2 mb-6 text-sm text-right">
                <div className="flex items-start gap-2">
                    <div className="text-brand-500">✓</div>
                    <span className="text-ink-600">ניתוח ביצועים והמלצות</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-brand-500">✓</div>
                    <span className="text-ink-600">חיזוי הכנסות ותפוסה</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-brand-500">✓</div>
                    <span className="text-ink-600">אסטרטגיות תמחור</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-brand-500">✓</div>
                    <span className="text-ink-600">ניהול לידים אוטומטי</span>
                  </div>
                </div>
                
                {/* Quick Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {QUICK_QUESTIONS.map((question, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleQuickQuestion(question)}
                      className="flex items-center gap-3 p-4 min-h-[52px] bg-canvas hover:from-brand-50/50 hover:to-brand-50/30 border border-line hover:border-brand-100 rounded-xl transition-[background-color,border-color,color,box-shadow,transform] text-right group shadow-sm hover:shadow-md touch-manipulation"
                    >
                      <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <question.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-navy-900">{question.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-neutral-100 text-navy-900'
                    }`}>
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <ReactMarkdown 
                          className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc mr-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal mr-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">
                          {user?.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-neutral-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-line p-4">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="שאל אותי כל שאלה..."
                className="resize-none min-h-[60px] max-h-[120px]"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                aria-label="שליחה"
                disabled={!inputValue.trim() || isLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-ink-400 mt-2">
              לחץ Enter לשליחה • Shift+Enter לשורה חדשה
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}