import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider, useToast } from './components/Toast'
import Layout from './components/Layout'
import { useSplashScreen } from './components/SplashScreen'
import { InstallPrompt } from './components/InstallPrompt'
import { NetworkStatus } from './components/NetworkStatus'

const basename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '')
const Login = lazy(() => import('./pages/Login'))
const FarmList = lazy(() => import('./pages/FarmList'))
const FarmDetail = lazy(() => import('./pages/FarmDetail'))
const FarmForm = lazy(() => import('./pages/FarmForm'))
const Settings = lazy(() => import('./pages/Settings'))

function PageLoading() {
  return (
    <div className="flex h-screen items-center justify-center px-6">
      <div className="surface-card-subtle inline-flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/35 border-t-primary" />
        页面载入中...
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false

    void import('./services/dataService').then(({ dataService }) => {
      if (cancelled) {
        return
      }

      void import('./pages/FarmList')
      void dataService.prefetchFarms({ page: 1, pageSize: 10, searchQuery: '' })
    })

    return () => {
      cancelled = true
    }
  }, [user])
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center px-6">
        <div className="surface-card-subtle inline-flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/35 border-t-primary" />
          账户校验中...
        </div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

function ToastRegistrar() {
  const { showToast } = useToast()
  
  useEffect(() => {
    window.__showToast = showToast
    return () => {
      window.__showToast = undefined
    }
  }, [showToast])
  
  return null
}

function DevPerfPanelGate() {
  const [Panel, setPanel] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    let cancelled = false

    void import('./components/DevPerfPanel').then(({ DevPerfPanel }) => {
      if (!cancelled) {
        setPanel(() => DevPerfPanel)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!Panel) {
    return null
  }

  return <Panel />
}

function App() {
  useSplashScreen()
  
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <ToastRegistrar />
          <InstallPrompt />
          <NetworkStatus />
          <DevPerfPanelGate />
          <Routes>
            <Route path="/login" element={<Suspense fallback={<PageLoading />}><Login /></Suspense>} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Suspense fallback={<PageLoading />}><FarmList /></Suspense>} />
              <Route path="farm/:id" element={<Suspense fallback={<PageLoading />}><FarmDetail /></Suspense>} />
              <Route path="farm/add" element={<Suspense fallback={<PageLoading />}><FarmForm /></Suspense>} />
              <Route path="farm/edit/:id" element={<Suspense fallback={<PageLoading />}><FarmForm /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoading />}><Settings /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
