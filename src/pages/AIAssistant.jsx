import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Send, Sparkles, Loader2, TrendingUp, Calendar, 
  DollarSign, Users, MessageSquare, Lightbulb
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_QUESTIONS = [
  { icon: TrendingUp, text: 'מה הביצועים שלי החודש?', prompt: 'תן לי סיכום של הביצועים העסקיים שלי החודש - הזמנות, הכנסות, תפוסה' },
  { icon: Calendar, text: 'מה יש לי היום?', prompt: 'מה המשימות והאירועים החשובים שיש לי היום?' },
  { icon: DollarSign, text: 'איזה תשלומים ממתינים?', prompt: 'תן לי רשימה של כל התשלומים שממתינים או באיחור' },
  { icon: Users, text: 'מה עם הלידים החדשים?', prompt: 'מה סטטוס הלידים החדשים שיש לי? תן לי המלצות איך לטפל בהם' },
  { icon: Lightbulb, text: 'תן לי המלצות לשיפור', prompt: 'תן לי 3 המלצות קונקרטיות לשיפור העסק שלי על בסיס הנתונים' }
];

export default function AIAssistantPage({ user, orgId, selectedPropertyId, properties }) {
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

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    // Calculate metrics
    const thisMonthBookings = bookings.filter(b => b.checkin_date?.startsWith(thisMonth));
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
        content: 'אופס! משהו השתבש. בבקשה נסה שוב.' 
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
    <div className="h-[calc(100vh-140px)] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Bot className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">עוזר AI חכם</h1>
          <p className="text-gray-500">שאל אותי כל שאלה על העסק שלך</p>
        </div>
        <Badge className="bg-[#00D1C1] text-[#0B1220] mr-auto">
          <Sparkles className="h-3 w-3 ml-1" />
          מונע AI
        </Badge>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="h-16 w-16 text-[#00D1C1] mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">שלום! איך אוכל לעזור?</h3>
                <p className="text-gray-500 mb-6">אני יכול לענות על שאלות על העסק שלך, לתת המלצות, ולנתח נתונים</p>
                
                {/* Quick Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {QUICK_QUESTIONS.map((question, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleQuickQuestion(question)}
                      className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-right"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#00D1C1]/10 flex items-center justify-center flex-shrink-0">
                        <question.icon className="h-5 w-5 text-[#00D1C1]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{question.text}</span>
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
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-[#0B1220] text-white' 
                        : 'bg-gray-100 text-gray-900'
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
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
          <div className="border-t border-gray-200 p-4">
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
                disabled={!inputValue.trim() || isLoading}
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              לחץ Enter לשליחה • Shift+Enter לשורה חדשה
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}