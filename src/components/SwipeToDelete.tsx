import { useState, useRef, useEffect, useCallback } from "react";
import { Trash } from "@phosphor-icons/react";

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteThreshold?: number;
  className?: string;
  showHint?: boolean;
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteThreshold = 100,
  className = "",
  showHint = false
}: SwipeToDeleteProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    if (isDeleting) return;
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = clientX;
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || isDeleting) return;

    currentX.current = clientX;
    const deltaX = currentX.current - startX.current;

    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      // Add some resistance after threshold
      const maxSwipe = deleteThreshold * 1.2;
      const resistance = Math.abs(deltaX) > deleteThreshold ? 0.3 : 1;
      setTranslateX(Math.max(deltaX * resistance, -maxSwipe));
    } else if (deltaX > 0 && translateX < 0) {
      // Allow right swipe to cancel if already swiped left
      setTranslateX(Math.min(0, translateX + deltaX * 0.5));
    }
  }, [isDragging, isDeleting, deleteThreshold, translateX]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isDeleting) return;

    setIsDragging(false);
    const deltaX = currentX.current - startX.current;

    if (Math.abs(deltaX) >= deleteThreshold) {
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Trigger delete animation
      setIsDeleting(true);
      setTranslateX(-window.innerWidth);

      // Call onDelete after animation
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      // Snap back to original position
      setTranslateX(0);
    }
  }, [isDragging, isDeleting, deleteThreshold, onDelete]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Global mouse events for when mouse leaves the component
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const deleteProgress = Math.min(Math.abs(translateX) / deleteThreshold, 1);
  const showDeleteIndicator = Math.abs(translateX) > 20;

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Delete indicator background */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-6 transition-all duration-200 ${
          deleteProgress >= 1 ? 'bg-red-600' : 'bg-red-500'
        }`}
        style={{
          opacity: showDeleteIndicator ? Math.max(deleteProgress * 0.9, 0.1) : 0,
          transform: `scale(${0.95 + deleteProgress * 0.05})`,
        }}
      >
        <div className={`flex items-center gap-2 text-white transition-transform duration-200 ${
          deleteProgress >= 1 ? 'scale-110' : 'scale-100'
        }`}>
          <Trash className={`h-5 w-5 transition-transform duration-200 ${
            deleteProgress >= 1 ? 'animate-pulse' : ''
          }`} />
          <span className="font-medium text-sm">
            {deleteProgress >= 1 ? "Release to delete" : "Keep swiping"}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 transition-transform ${
          isDragging ? 'duration-0' : 'duration-300'
        } ${isDeleting ? 'duration-300' : ''}`}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Swipe hint overlay for first few items */}
      {showHint && !isDragging && translateX === 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs opacity-30 animate-pulse">
            ← Swipe to delete
          </div>
        </div>
      )}
    </div>
  );
}
