import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider, useToast } from './components/Toast'
import Layout from './components/Layout'
import Login from './pages/Login'
import FarmList from './pages/FarmList'
import { useSplashScreen } from './components/SplashScreen'
import { InstallPrompt } from './components/InstallPrompt'
import { NetworkStatus } from './components/NetworkStatus'

const basename = import.meta.env.PROD ? '/farm-app' : ''
const FarmDetail = lazy(() => import('./pages/FarmDetail'))
const FarmForm = lazy(() => import('./pages/FarmForm'))
const Settings = lazy(() => import('./pages/Settings'))

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-primary-500">加载中...</div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-primary-500">加载中...</div>
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

function App() {
  useSplashScreen()
  
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <ToastRegistrar />
          <InstallPrompt />
          <NetworkStatus />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<FarmList />} />
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
