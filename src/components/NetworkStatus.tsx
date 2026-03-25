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
      return '网络较慢';
    }
    
    if (effectiveType === '3g') {
      return '3G 网络';
    }
    
    if (effectiveType === '4g' || connectionType === 'wifi') {
      return '网络良好';
    }
    
    if (downlink !== undefined && downlink < 1) {
      return '网络较慢';
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
        {status === 'offline' ? '当前处于离线状态' : '网络已恢复'}
        {qualityText && ` · ${qualityText}`}
      </span>
    </div>
  );
}

export default NetworkStatus;
