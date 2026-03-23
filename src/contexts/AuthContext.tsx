import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { authService } from '../services/authService'
import { getSupabase } from '../services/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function hasLocalSession(): boolean {
  try {
    const keys = Object.keys(localStorage)
    return keys.some(key => key.includes('sb-') && key.includes('-auth-token'))
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!hasLocalSession()) {
          setLoading(false)
          return
        }

        const client = await getSupabase()
        if (!client) {
          setLoading(false)
          return
        }

        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn({ email, password })
    if (!response.success) {
      throw new Error(response.error || '登录失败')
    }

    const client = await getSupabase()
    if (client) {
      const { data: { user: currentUser } } = await client.auth.getUser()
      setUser(currentUser)
    }
  }

  const signOut = async () => {
    const client = await getSupabase()
    if (client) {
      await client.auth.signOut()
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}