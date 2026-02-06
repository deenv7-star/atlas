import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const threshold = 80;

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (refreshing || containerRef.current?.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && distance < threshold * 2) {
      setPulling(true);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing]);

  const opacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {(pulling || refreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all z-50"
          style={{ 
            height: `${Math.min(pullDistance, threshold)}px`,
            opacity: refreshing ? 1 : opacity
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
            <Loader2 
              className="h-5 w-5 text-[#00D1C1]" 
              style={{ 
                transform: refreshing ? 'none' : `rotate(${rotation}deg)`,
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} 
            />
          </div>
        </div>
      )}
      <div style={{ paddingTop: pulling || refreshing ? `${Math.min(pullDistance, threshold)}px` : 0 }}>
        {children}
      </div>
    </div>
  );
}