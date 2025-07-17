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
  threshold = 80,
  resistance = 2.5,
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

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorScale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1);

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
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex flex-col items-center justify-center py-4 z-10"
        style={{
          opacity: indicatorOpacity,
          transform: `translateX(-50%) translateY(-100%) scale(${indicatorScale})`,
        }}
      >
        <div className={cn(
          'w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center mb-2',
          canRefresh ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
        )}>
          {isRefreshing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className={cn(
              'w-4 h-4 border-2 border-current rounded-full transition-transform',
              canRefresh && 'rotate-180'
            )}>
              <div className="w-2 h-2 bg-current rounded-full mx-auto mt-0.5" />
            </div>
          )}
        </div>
        <span className={cn(
          'text-xs font-medium transition-colors',
          canRefresh ? 'text-green-600' : 'text-gray-500'
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
