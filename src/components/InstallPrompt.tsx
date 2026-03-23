import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallPrompt() {
  const { canInstall, isIOS, installPrompt, dismissPrompt, dismissed, iosInstallInstructions } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const shouldShow = canInstall || (isIOS && !dismissed);
    if (shouldShow) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isIOS, dismissed]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      dismissPrompt();
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  if (!isVisible && !canInstall) {
    return null;
  }

  if (isIOS) {
    return (
      <div
        className={`pwa-install-banner ${isAnimatingOut ? 'slide-out' : ''}`}
        role="dialog"
        aria-label="Add to Home Screen instructions"
      >
        <div className="pwa-install-banner-content">
          <div className="pwa-install-banner-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zM12 17c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" />
            </svg>
          </div>
          <div className="pwa-install-banner-text">
            <div className="pwa-install-banner-title">Add to Home Screen</div>
            <div className="pwa-install-banner-subtitle">
              {iosInstallInstructions || 'Tap the share button and select "Add to Home Screen"'}
            </div>
          </div>
        </div>
        <div className="pwa-install-banner-actions">
          <button
            type="button"
            className="pwa-install-btn pwa-install-btn-secondary"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pwa-install-banner ${isAnimatingOut ? 'slide-out' : ''}`}
      role="dialog"
      aria-label="Install app"
    >
      <div className="pwa-install-banner-content">
        <div className="pwa-install-banner-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        </div>
        <div className="pwa-install-banner-text">
          <div className="pwa-install-banner-title">Install App</div>
          <div className="pwa-install-banner-subtitle">
            Add to your home screen for the best experience
          </div>
        </div>
      </div>
      <div className="pwa-install-banner-actions">
        <button
          type="button"
          className="pwa-install-btn pwa-install-btn-secondary"
          onClick={handleDismiss}
          aria-label="Not now"
        >
          Later
        </button>
        <button
          type="button"
          className="pwa-install-btn pwa-install-btn-primary"
          onClick={installPrompt}
          aria-label="Install app"
        >
          Install
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
