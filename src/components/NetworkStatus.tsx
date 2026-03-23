import { useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

type StatusType = 'online' | 'offline';

interface NetworkStatusProps {
  autoHideDelay?: number;
  showQuality?: boolean;
}

export function NetworkStatus({
  autoHideDelay = 3000,
  showQuality = true,
}: NetworkStatusProps) {
  const { isOnline, effectiveType, connectionType, downlink } = useNetworkStatus();
  const [status, setStatus] = useState<StatusType>(isOnline ? 'online' : 'offline');
  const [isVisible, setIsVisible] = useState(!isOnline);
  const prevIsOnline = useRef(isOnline);

  useEffect(() => {
    const wasOnline = prevIsOnline.current;
    
    if (!wasOnline && isOnline) {
      setStatus('online');
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    } else if (!isOnline) {
      setStatus('offline');
      setIsVisible(true);
    }
    
    prevIsOnline.current = isOnline;
  }, [isOnline, autoHideDelay]);

  const getQualityText = (): string | undefined => {
    if (!showQuality) return undefined;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'Slow connection';
    }
    
    if (effectiveType === '3g') {
      return '3G connection';
    }
    
    if (effectiveType === '4g' || connectionType === 'wifi') {
      return 'Fast connection';
    }
    
    if (downlink !== undefined && downlink < 1) {
      return 'Slow connection';
    }
    
    return undefined;
  };

  const qualityText = getQualityText();

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`pwa-network-status ${status}`} role="status" aria-live="polite">
      <span className="pwa-network-indicator" aria-hidden="true" />
      <span className="pwa-network-text">
        {status === 'offline' ? 'You are offline' : 'Back online'}
        {qualityText && ` · ${qualityText}`}
      </span>
    </div>
  );
}

export default NetworkStatus;