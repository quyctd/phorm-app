import { useState, useEffect } from 'react';
import { WifiSlash, Wifi } from '@phosphor-icons/react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className={`offline-indicator ${showOfflineMessage ? 'show' : ''}`}>
      <div className="flex items-center justify-center gap-2">
        <WifiSlash size={16} />
        <span>You're offline. Some features may not work.</span>
      </div>
    </div>
  );
}
