/**
 * 统一错误处理工具
 * 将各种错误转换为用户友好的中文提示
 */

// Supabase 错误码映射
const SUPABASE_ERROR_MAP: Record<string, string> = {
  // 认证错误
  'invalid_credentials': '邮箱或密码错误，请重新输入',
  'email_not_confirmed': '邮箱尚未验证，请检查邮箱并完成验证',
  'user_not_found': '用户不存在，请检查邮箱地址',
  'weak_password': '密码强度不够，请使用至少6位包含字母和数字的密码',
  'email_already_registered': '该邮箱已注册，请直接登录或使用其他邮箱',
  'signup_disabled': '注册功能暂未开放，请联系管理员',
  'email_rate_limit': '发送邮件过于频繁，请稍后再试',
  'phone_not_confirmed': '手机号尚未验证',
  'provider_email_needs_to_be_verified': '第三方邮箱需要验证',

  // 令牌错误
  'token_expired': '登录已过期，请重新登录',
  'invalid_token': '登录凭证无效，请重新登录',
  'refresh_token_not_found': '会话已失效，请重新登录',

  // 数据库错误
  '23505': '数据已存在，请勿重复添加',
  '23503': '关联数据不存在，请检查相关记录',
  '23502': '必填字段不能为空',
  '42501': '没有权限执行此操作',
  'PGRST116': '未找到相关数据',
  'PGRST204': '请求的列不存在',

  // 存储错误
  'StorageError': '文件存储服务异常，请稍后重试',
  'BuckerNotFound': '存储桶不存在',
  'KeyError': '文件名无效或已存在',
  'InvalidToken': '文件上传凭证无效',

  // 网络错误
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT': '请求超时，请稍后重试',
}

// 通用错误消息映射
const GENERIC_ERROR_MAP: Record<string, string> = {
  'Failed to fetch': '网络连接失败，请检查网络设置',
  'NetworkError': '网络错误，请检查网络连接',
  'TypeError: Failed to fetch': '无法连接到服务器，请检查网络',
  '请求超时，请稍后重试': '请求超时，请稍后重试',
  '上传超时，请检查网络后重试': '上传超时，请检查网络后重试',
}

// 数据库错误码映射 (PostgreSQL)
const DB_ERROR_CODE_MAP: Record<string, string> = {
  '23505': '数据已存在，不允许重复',
  '23503': '关联的数据不存在',
  '23502': '缺少必填字段',
  '23514': '数据不符合约束条件',
  '42501': '权限不足，无法执行此操作',
  '42601': 'SQL语法错误',
  '42P01': '数据表不存在',
  '42703': '字段不存在',
}

interface ErrorWithCode {
  code?: string
  message?: string
  details?: string
  hint?: string
  name?: string
}

function isErrorWithFields(error: unknown): error is ErrorWithCode {
  return typeof error === 'object' && error !== null
}

/**
 * 从 Supabase 错误对象中提取友好错误消息
 */
export function getSupabaseErrorMessage(error: unknown): string {
  if (!error) return '操作失败，请稍后重试'

  // 如果是字符串直接返回
  if (typeof error === 'string') {
    return SUPABASE_ERROR_MAP[error] || error
  }

  // Supabase Auth 错误
  if (isErrorWithFields(error) && error.code && SUPABASE_ERROR_MAP[error.code]) {
    return SUPABASE_ERROR_MAP[error.code]
  }

  // PostgreSQL 错误码 (dataService 返回的错误)
  if (isErrorWithFields(error) && error.code && DB_ERROR_CODE_MAP[error.code]) {
    return DB_ERROR_CODE_MAP[error.code]
  }

  // Supabase 错误消息
  if (isErrorWithFields(error) && error.message) {
    // 检查是否是已知的英文错误消息
    for (const [key, value] of Object.entries(GENERIC_ERROR_MAP)) {
      if (error.message.includes(key)) {
        return value
      }
    }
    return error.message
  }

  // PostgREST 错误
  if (isErrorWithFields(error) && error.details) {
    return `数据错误: ${error.details}`
  }

  if (isErrorWithFields(error) && error.hint) {
    return error.hint
  }

  return '操作失败，请稍后重试'
}

/**
 * 从网络错误中提取友好消息
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (!error) return '网络错误，请稍后重试'

  const message = isErrorWithFields(error) && error.message ? error.message : String(error)

  for (const [key, value] of Object.entries(GENERIC_ERROR_MAP)) {
    if (message.includes(key)) {
      return value
    }
  }

  if (message.includes('timeout') || message.includes('Timeout')) {
    return '请求超时，请检查网络后重试'
  }

  if (message.includes('404')) {
    return '请求的资源不存在'
  }

  if (message.includes('500')) {
    return '服务器错误，请稍后重试'
  }

  if (message.includes('502') || message.includes('503')) {
    return '服务暂时不可用，请稍后重试'
  }

  return message || '网络错误，请稍后重试'
}

/**
 * 统一错误处理函数
 * 自动识别错误类型并返回友好消息
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return '操作失败，请稍后重试'

  // 如果已经是字符串
  if (typeof error === 'string') {
    // 检查是否是 Supabase 错误码
    if (SUPABASE_ERROR_MAP[error]) {
      return SUPABASE_ERROR_MAP[error]
    }
    // 检查是否是网络错误
    if (GENERIC_ERROR_MAP[error]) {
      return GENERIC_ERROR_MAP[error]
    }
    return error
  }

  // Supabase 错误 (包含 code)
  if (isErrorWithFields(error) && error.code) {
    return getSupabaseErrorMessage(error)
  }

  // 网络错误
  if (isErrorWithFields(error) && (error.name === 'TypeError' || error.message?.includes('fetch'))) {
    return getNetworkErrorMessage(error)
  }

  // 通用 Error 对象
  if (error instanceof Error) {
    return getNetworkErrorMessage(error)
  }

  return '操作失败，请稍后重试'
}

/**
 * 显示错误提示（用于非 React 环境）
 */
export function showErrorToast(message: string | unknown): void {
  const text = typeof message === 'string' ? message : getErrorMessage(message)

  // 如果有全局 toast 函数，调用它
  if (window.__showToast) {
    window.__showToast(text, 'error')
  } else {
    // 降级到 alert
    alert(text)
  }
}

/**
 * 显示成功提示
 */
export function showSuccessToast(message: string): void {
  if (window.__showToast) {
    window.__showToast(message, 'success')
  }
}

// 扩展全局 Window 类型
declare global {
  interface Window {
    __showToast?: (message: string, type: 'success' | 'error' | 'info') => void
  }
}
