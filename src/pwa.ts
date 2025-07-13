// PWA utilities and service worker registration

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // In development, the service worker might be at a different path
        const swPath = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';

        const registration = await navigator.serviceWorker.register(swPath, {
          scope: '/'
        });

        console.log('SW registered: ', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update notification
                showUpdateNotification();
              }
            });
          }
        });

      } catch (error) {
        console.log('SW registration failed: ', error);
        // In development, this is expected if the service worker isn't ready yet
        if (import.meta.env.DEV) {
          console.log('This is normal in development mode. The service worker will be available after the first build.');
        }
      }
    });
  }
}

function showUpdateNotification() {
  // You can integrate this with your toast system
  if (confirm('A new version is available. Reload to update?')) {
    window.location.reload();
  }
}

// Check if app is running in standalone mode
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Check if device is iOS
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Check if device is Android
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

// Get install prompt
export function getInstallPrompt(): Promise<any> {
  return new Promise((resolve) => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      resolve(e);
    });
  });
}

// Track PWA usage
export function trackPWAUsage() {
  // Track if user is using PWA
  if (isStandalone()) {
    console.log('User is using PWA in standalone mode');
    // You can send analytics here
  }
  
  // Track installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // You can send analytics here
  });
}

// Initialize PWA features
export function initPWA() {
  registerSW();
  trackPWAUsage();
}
