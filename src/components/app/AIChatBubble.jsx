import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const WELCOME_MESSAGE = `שלום! אני העוזר החכם של ATLAS 👋
אפשר לשאול אותי על הזמנות, תשלומים, דוחות — או כל דבר אחר.`;

const QUICK_CHIPS = [
  { label: '📅 הזמנות היום', id: 'orders' },
  { label: '💰 הכנסות החודש', id: 'revenue' },
  { label: '🔧 עזרה', id: 'help' },
];

export default function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setShowComingSoon(true);
    setInputValue('');
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const handleChipClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-50"
      dir="rtl"
      style={{ fontFamily: "'Heebo', sans-serif" }}
    >
      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-20 left-2 right-2 sm:left-0 sm:right-auto sm:w-full sm:max-w-[400px] max-h-[min(500px,70vh)]",
            "bg-white rounded-[24px] shadow-xl border border-gray-100",
            "flex flex-col overflow-hidden animate-fade-in"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-[#4F46E5] to-[#7C3AED] text-white rounded-t-[24px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-semibold text-base">עוזר ATLAS</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="min-w-[44px] min-h-[44px] p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center touch-manipulation"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[280px]">
            {/* Welcome message */}
            <div className="bg-gray-50 rounded-2xl rounded-br-md px-4 py-3 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {WELCOME_MESSAGE}
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={handleChipClick}
                  className={cn(
                    "min-h-[44px] px-4 py-3 rounded-full text-sm font-medium touch-manipulation",
                    "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200",
                    "border border-indigo-100 transition-colors"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Coming soon message */}
            {showComingSoon && (
              <div className="text-center py-2 px-3 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-100 animate-fade-in">
                התכונה תהיה זמינה בקרוב
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="הקלד הודעה..."
                className={cn(
                  "flex-1 rounded-full px-4 py-2.5 text-sm",
                  "bg-white border border-gray-200 focus:border-indigo-400",
                  "focus:ring-2 focus:ring-indigo-100 focus:outline-none",
                  "placeholder:text-gray-400"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={cn(
                  "p-2.5 rounded-full transition-all",
                  "bg-gradient-to-l from-[#4F46E5] to-[#7C3AED] text-white",
                  "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-md hover:shadow-lg"
                )}
                aria-label="שלח"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white",
                "shadow-lg hover:shadow-xl transition-all duration-200",
                "hover:scale-105 active:scale-95",
                "animate-[pulse-bubble_2s_ease-in-out_infinite]"
              )}
              aria-label="עוזר חכם — שאל אותי הכל"
            >
              <MessageCircle className="w-7 h-7" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="font-heebo"
          >
            <p>עוזר חכם — שאל אותי הכל</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Pulse animation keyframes - inline style for the bubble */}
      <style>{`
        @keyframes pulse-bubble {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(79, 70, 229, 0); }
        }
      `}</style>
    </div>
  );
}
