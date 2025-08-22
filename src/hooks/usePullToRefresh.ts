import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 60, // Reduced from 80 to make it easier
  resistance = 2.0, // Reduced from 2.5 to make it more responsive
  enabled = true,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only trigger if we're at the top of the scroll container
    if (container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    hasTriggeredHaptic.current = false; // Reset haptic feedback flag
  }, [enabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Only trigger if we're at the top of the scroll container
    if (container.scrollTop > 0) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only pull down
    if (deltaY <= 0) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, canRefresh: false }));
      hasTriggeredHaptic.current = false; // Reset haptic flag
      return;
    }

    // Prevent default scrolling when pulling (only if cancelable)
    if (e.cancelable) {
      e.preventDefault();
    }

    // Make initial pull more responsive, then add resistance
    const adjustedDeltaY = deltaY < 30 ? deltaY * 1.2 : deltaY;
    const pullDistance = Math.min(adjustedDeltaY / resistance, threshold * 1.5);
    const canRefresh = pullDistance >= threshold;

    // Track when threshold is reached for the first time (for potential future haptic feedback)
    if (canRefresh && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      // Note: Vibration API removed to prevent browser intervention warnings
      // Modern browsers require explicit user gesture before allowing vibration
    }

    setState(prev => ({
      ...prev,
      isPulling: true,
      pullDistance,
      canRefresh,
    }));
  }, [enabled, state.isRefreshing, threshold, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || state.isRefreshing || !state.isPulling) return;

    if (state.canRefresh) {
      setState(prev => ({ ...prev, isRefreshing: true, isPulling: false }));
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setState(prev => ({ 
          ...prev, 
          isRefreshing: false, 
          pullDistance: 0, 
          canRefresh: false 
        }));
      }
    } else {
      setState(prev => ({ 
        ...prev, 
        isPulling: false, 
        pullDistance: 0, 
        canRefresh: false 
      }));
    }
  }, [enabled, state.isRefreshing, state.isPulling, state.canRefresh, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // Use passive listeners to avoid intervention warnings
    const touchMoveOptions = { passive: false, capture: false };
    const passiveOptions = { passive: true };

    container.addEventListener('touchstart', handleTouchStart, passiveOptions);
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    container.addEventListener('touchend', handleTouchEnd, passiveOptions);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);

  return {
    containerRef,
    ...state,
  };
}
