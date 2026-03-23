import { getSupabase } from './supabase'

const SESSION_KEY = 'supabase_session'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private session: { access_token: string; refresh_token?: string } | null = null
  private isRefreshing: boolean = false
  private refreshSubscribers: Array<(token: string) => void> = []

  constructor() {
    this.initSession()
  }

  private initSession() {
    try {
      const sessionJson = localStorage.getItem(SESSION_KEY)
      if (sessionJson) {
        this.session = JSON.parse(sessionJson)
      }
    } catch (error) {
      console.error('初始化会话失败:', error)
    }
  }

  private saveSession(session: any) {
    try {
      this.session = session
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('保存会话失败:', error)
    }
  }

  private clearSession() {
    try {
      this.session = null
      localStorage.removeItem(SESSION_KEY)
    } catch (error) {
      console.error('清除会话失败:', error)
    }
  }

  private async getToken(): Promise<string | null> {
    if (this.session?.access_token) {
      return this.session.access_token
    }

    try {
      const supabase = await getSupabase()
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await this.saveSession(session)
          return session.access_token
        }
      }
    } catch (error) {
      console.error('从supabase获取token失败:', error)
    }

    return null
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve)
      })
    }

    this.isRefreshing = true

    try {
      const supabase = await getSupabase()
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.refreshSession()
        if (error) {
          console.error('supabase刷新token失败:', error)
          await this.clearSession()
          return null
        }
        if (session?.access_token) {
          await this.saveSession(session)
          return session.access_token
        }
      }
      return null
    } catch (error) {
      console.error('刷新token失败:', error)
      await this.clearSession()
      return null
    } finally {
      this.isRefreshing = false
      const newToken = await this.getToken()
      this.refreshSubscribers.forEach((callback) => callback(newToken as string))
      this.refreshSubscribers = []
    }
  }

  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      }

      const token = await this.getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (response.status === 401 && token) {
        const newToken = await this.refreshToken()
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          })

          let retryData: any
          try {
            retryData = await retryResponse.json()
          } catch {
            retryData = null
          }

          return {
            success: retryResponse.ok,
            data: retryResponse.ok ? retryData : undefined,
            error: !retryResponse.ok ? (retryData?.error || '请求失败') : undefined,
          }
        }
      }

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? (data?.error || '请求失败') : undefined,
        message: data?.message,
      }
    } catch (error) {
      console.error('API请求失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      }
    }
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    return this.request<T>(`${url}${queryString}`, { method: 'GET' })
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()