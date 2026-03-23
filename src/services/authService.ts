import { getSupabase, supabaseInitError } from './supabase'
import type { User } from '@supabase/supabase-js'
import { getErrorMessage } from '../utils/errorHandler'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
}

async function checkSupabase() {
  const client = await getSupabase()
  if (!client) {
    return { ok: false, error: supabaseInitError ?? 'Supabase 未初始化' }
  }
  return { ok: true, client }
}

function handleError(error: unknown, defaultMessage: string): string {
  return getErrorMessage(error) || defaultMessage
}

export const authService = {
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    const check = await checkSupabase()
    if (!check.ok) {
      return { success: false, error: check.error }
    }

    try {
      const { data, error: authError } = await check.client!.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        return {
          success: false,
          error: authError.code === 'invalid_credentials' ? '邮箱或密码错误' : '登录失败，请稍后重试'
        }
      } else if (data.user) {
        return { success: true }
      } else {
        return { success: false, error: '邮箱或密码错误' }
      }
    } catch (error) {
      return { success: false, error: handleError(error, '登录失败，请稍后重试') }
    }
  },

  async signUp(credentials: LoginCredentials): Promise<AuthResponse> {
    const check = await checkSupabase()
    if (!check.ok) {
      return { success: false, error: check.error }
    }

    try {
      const { data, error: authError } = await check.client!.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        return { success: false, error: '注册失败，请稍后重试' }
      }

      if (data.user) {
        return { success: true }
      }

      return { success: false, error: '注册失败，请稍后重试' }
    } catch (error) {
      return { success: false, error: handleError(error, '注册失败，请稍后重试') }
    }
  },

  async signOut(): Promise<boolean> {
    const check = await checkSupabase()
    if (!check.ok) {
      return false
    }

    try {
      const { error } = await check.client!.auth.signOut()
      return !error
    } catch {
      return false
    }
  },

  async checkAuthStatus(): Promise<boolean> {
    const check = await checkSupabase()
    if (!check.ok) {
      return false
    }

    try {
      const { data: { session } } = await check.client!.auth.getSession()
      return !!session
    } catch {
      return false
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const check = await checkSupabase()
    if (!check.ok || !check.client) {
      return null
    }

    try {
      const { data: { user } } = await check.client.auth.getUser()
      return user
    } catch {
      return null
    }
  }
}