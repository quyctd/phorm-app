import type { ReactNode } from 'react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { cn } from '../lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 60, // Reduced from 80 to make it easier
  resistance = 2.0, // Reduced from 2.5 to make it more responsive
  enabled = true,
}: PullToRefreshProps) {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled,
  });

  const indicatorOpacity = Math.min(pullDistance / (threshold * 0.3), 1); // Show indicator earlier
  const indicatorScale = Math.min(0.6 + (pullDistance / threshold) * 0.4, 1); // Start larger and scale less

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, threshold)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex flex-col items-center justify-center py-6 z-10"
        style={{
          opacity: indicatorOpacity,
          transform: `translateX(-50%) translateY(-100%) scale(${indicatorScale})`,
        }}
      >
        <div className={cn(
          'w-10 h-10 rounded-full shadow-xl flex items-center justify-center mb-3 transition-all duration-200',
          canRefresh
            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110'
            : 'bg-white text-gray-600 border-2 border-gray-200'
        )}>
          {isRefreshing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className={cn(
              'transition-transform duration-300',
              canRefresh ? 'rotate-180' : 'rotate-0'
            )}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}
        </div>
        <span className={cn(
          'text-sm font-semibold transition-all duration-200 px-3 py-1 rounded-full',
          canRefresh
            ? 'text-green-700 bg-green-100'
            : 'text-gray-600 bg-gray-100'
        )}>
          {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
