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

const AUTH_REQUIRED_MESSAGE = '登录已过期，请重新登录'

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

function getProtectedActionErrorMessage(status?: number, error?: unknown): string {
  if (status === 401) {
    return AUTH_REQUIRED_MESSAGE
  }

  if (status === 403) {
    return '没有权限执行此操作'
  }

  return handleError(error, '操作失败，请稍后重试')
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
  },

  async getRequiredAccessToken(): Promise<string> {
    const check = await checkSupabase()
    if (!check.ok || !check.client) {
      throw new Error(check.error || AUTH_REQUIRED_MESSAGE)
    }

    try {
      const { data: { session }, error } = await check.client.auth.getSession()

      if (error) {
        throw new Error(handleError(error, AUTH_REQUIRED_MESSAGE))
      }

      if (!session?.access_token) {
        throw new Error(AUTH_REQUIRED_MESSAGE)
      }

      return session.access_token
    } catch (error) {
      throw new Error(handleError(error, AUTH_REQUIRED_MESSAGE))
    }
  },

  getProtectedActionErrorMessage,

  isAuthErrorMessage(message: string): boolean {
    return ['登录', '会话', '权限'].some(keyword => message.includes(keyword))
  }
}
