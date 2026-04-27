import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

const WELCOME_MESSAGE =
  'העוזר החכם מנתח את נתוני החשבון שלכם (הזמנות, תשלומים, לידים ועוד). השיחה המלאה מתבצעת במסך ייעודי — לחצו למטה או על אחת הקיצורי דרך.';

const QUICK_CHIPS = [
  { label: 'סיכום ביצועים', id: 'perf' },
  { label: 'מצב תשלומים', id: 'pay' },
  { label: 'לידים פתוחים', id: 'leads' },
];

export default function AIChatBubble() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const goAssistant = () => {
    setIsOpen(false);
    navigate(createPageUrl('AIAssistant'));
  };

  return (
    <div
      className={cn(
        'fixed z-40 left-4 sm:left-6',
        /* מעל שורת הטאבים במובייל (h-14) + מרווח; בדסקטופ אין טאב תחתון */
        'bottom-[calc(3.5rem+0.75rem+env(safe-area-inset-bottom,0px))]',
        'lg:bottom-6'
      )}
      dir="rtl"
      style={{ fontFamily: "'Heebo', sans-serif" }}
    >
      {isOpen && (
        <div
          className={cn(
            'absolute bottom-20 left-2 right-2 sm:left-0 sm:right-auto sm:w-full sm:max-w-[400px] max-h-[min(420px,70vh)]',
            'bg-white rounded-[24px] shadow-xl border border-gray-100',
            'flex flex-col overflow-hidden animate-fade-in'
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-[#4F46E5] to-[#7C3AED] text-white rounded-t-[24px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-semibold text-base">עוזר ATLAS</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-w-[44px] min-h-[44px] p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center touch-manipulation"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[220px]">
            <div className="bg-gray-50 rounded-2xl rounded-br-md px-4 py-3 text-gray-700 text-sm leading-relaxed">
              {WELCOME_MESSAGE}
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={goAssistant}
                  className={cn(
                    'min-h-[44px] px-4 py-3 rounded-full text-sm font-medium touch-manipulation',
                    'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200',
                    'border border-indigo-100 transition-colors'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goAssistant}
              className={cn(
                'w-full min-h-[48px] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2',
                'bg-gradient-to-l from-[#4F46E5] to-[#7C3AED] hover:opacity-95 shadow-md'
              )}
            >
              <Sparkles className="w-5 h-5 shrink-0" aria-hidden />
              פתיחת עוזר AI מלא
            </button>
          </div>
        </div>
      )}

      <div className="relative inline-flex items-center justify-center">
        <span
          className="pointer-events-none absolute inset-0 z-0 rounded-full animate-[pulse-bubble_2s_ease-in-out_infinite]"
          aria-hidden
        />
        <TooltipProvider delayDuration={400} skipDelayDuration={200}>
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  setTooltipOpen(false);
                  setIsOpen((prev) => !prev);
                }}
                className={cn(
                  'relative z-10 w-14 h-14 rounded-full flex items-center justify-center',
                  'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white',
                  'shadow-lg hover:shadow-xl transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2'
                )}
                aria-label="עוזר חכם — מעבר למסך העוזר"
                aria-expanded={isOpen}
              >
                <MessageCircle className="w-7 h-7" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="font-heebo max-w-[220px] text-center"
            >
              <p>עוזר חכם — מסך מלא עם נתוני החשבון</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <style>{`
        @keyframes pulse-bubble {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.35); }
          50% { box-shadow: 0 0 0 14px rgba(79, 70, 229, 0); }
        }
      `}</style>
    </div>
  );
}
