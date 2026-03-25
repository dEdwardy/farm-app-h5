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
        aria-label="添加到主屏幕说明"
      >
        <div className="pwa-install-banner-content">
          <div className="pwa-install-banner-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zM12 17c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" />
            </svg>
          </div>
          <div className="pwa-install-banner-text">
            <div className="pwa-install-banner-title">添加到主屏幕</div>
            <div className="pwa-install-banner-subtitle">
              {iosInstallInstructions || '点击分享按钮，然后选择“添加到主屏幕”'}
            </div>
          </div>
        </div>
        <div className="pwa-install-banner-actions">
          <button
            type="button"
            className="pwa-install-btn pwa-install-btn-secondary"
            onClick={handleDismiss}
            aria-label="知道了"
          >
            知道了
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pwa-install-banner ${isAnimatingOut ? 'slide-out' : ''}`}
      role="dialog"
      aria-label="安装应用"
    >
      <div className="pwa-install-banner-content">
        <div className="pwa-install-banner-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        </div>
        <div className="pwa-install-banner-text">
          <div className="pwa-install-banner-title">安装应用</div>
          <div className="pwa-install-banner-subtitle">
            添加到主屏幕，获得更好的使用体验
          </div>
        </div>
      </div>
      <div className="pwa-install-banner-actions">
        <button
          type="button"
          className="pwa-install-btn pwa-install-btn-secondary"
          onClick={handleDismiss}
          aria-label="稍后再说"
        >
          稍后再说
        </button>
        <button
          type="button"
          className="pwa-install-btn pwa-install-btn-primary"
          onClick={installPrompt}
          aria-label="立即安装"
        >
          立即安装
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
