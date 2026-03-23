import { useEffect, useState } from 'react'

interface NetworkInformation {
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  readonly downlink?: number
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown'
  readonly addEventListener: (type: string, listener: () => void) => void
  readonly removeEventListener: (type: string, listener: () => void) => void
  readonly onchange?: () => void
}

declare global {
  interface Navigator {
    connection?: NetworkInformation
    mozConnection?: NetworkInformation
    webkitConnection?: NetworkInformation
  }
}

export interface NetworkStatusResult {
  isOnline: boolean
  connectionType: string | undefined
  effectiveType: string | undefined
  downlink: number | undefined
}

export function useNetworkStatus(): NetworkStatusResult {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [connectionType, setConnectionType] = useState<string | undefined>()
  const [effectiveType, setEffectiveType] = useState<string | undefined>()
  const [downlink, setDownlink] = useState<number | undefined>()

  useEffect(() => {
    const connection = navigator.connection 
      || navigator.mozConnection 
      || navigator.webkitConnection

    const syncNetworkInfo = () => {
      setConnectionType(connection?.type)
      setEffectiveType(connection?.effectiveType)
      setDownlink(connection?.downlink)
    }

    const handleOnline = () => {
      setIsOnline(true)
      syncNetworkInfo()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionType(undefined)
      setEffectiveType(undefined)
      setDownlink(undefined)
    }

    syncNetworkInfo()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (connection) {
      connection.addEventListener('change', syncNetworkInfo)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', syncNetworkInfo)
      }
    }
  }, [])

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
  }
}
