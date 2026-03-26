import { useState, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    DeferredInstallPromptEvent?: DeferredInstallPromptEvent
  }
}

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallState {
  canInstall: boolean
  isIOS: boolean
  dismissed: boolean
  installPrompt: (() => Promise<string | void>) | null
}

const STORAGE_KEY = 'pwa-install-dismissed'
const IOS_INSTALL_INSTRUCTIONS = '在Safari中，点击分享按钮，然后选择"添加到主屏幕"'

const logPwaDebug = (...args: unknown[]) => {
  void args
}

const logPwaError = (...args: unknown[]) => {
  void args
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    isIOS: false,
    dismissed: false,
    installPrompt: null,
  })

  const checkIsIOS = useCallback((): boolean => {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }, [])

  const checkDismissed = useCallback((): boolean => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  }, [])

  const saveDismissPreference = useCallback((dismissed: boolean) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, dismissed.toString())
    }
  }, [])

  const handleBeforeInstallPrompt = useCallback((event: Event) => {
    event.preventDefault()
    const deferredPrompt = event as DeferredInstallPromptEvent
    logPwaDebug('beforeinstallprompt event fired')
    
    setState(prev => ({
      ...prev,
      canInstall: true,
      installPrompt: async () => {
        try {
          await deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          logPwaDebug('User choice:', outcome)
          return outcome
        } catch (err) {
          logPwaError('Install prompt error:', err)
          throw err
        }
      },
    }))
  }, [])

  useEffect(() => {
    const isIOS = checkIsIOS()
    const dismissed = checkDismissed()
    
    if (isIOS) {
      setState({ canInstall: false, isIOS: true, dismissed, installPrompt: null })
      return
    }

    setState(prev => ({ ...prev, isIOS: false, dismissed }))
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [checkIsIOS, checkDismissed, handleBeforeInstallPrompt])

  const showInstallPrompt = useCallback(async (): Promise<string | void> => {
    if (state.installPrompt) {
      const result = await state.installPrompt()
      setState(prev => ({ ...prev, canInstall: false, installPrompt: null }))
      return result
    }
    logPwaDebug('Install prompt not available. beforeinstallprompt event may not have fired.')
  }, [state.installPrompt])

  const dismissPrompt = useCallback(() => {
    saveDismissPreference(true)
    setState(prev => ({ ...prev, canInstall: false, dismissed: true }))
  }, [saveDismissPreference])

  const resetDismissal = useCallback(() => {
    saveDismissPreference(false)
    setState(prev => ({ ...prev, dismissed: false }))
  }, [saveDismissPreference])

  return {
    canInstall: state.canInstall && !state.dismissed,
    isIOS: state.isIOS,
    installPrompt: showInstallPrompt,
    dismissed: state.dismissed,
    dismissPrompt,
    resetDismissal,
    iosInstallInstructions: state.isIOS ? IOS_INSTALL_INSTRUCTIONS : null,
  }
}
