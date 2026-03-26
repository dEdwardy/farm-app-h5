import { getSupabase } from './supabase'
import { authService } from './authService'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const IMAGE_COMPRESS_THRESHOLD = 450 * 1024
const IMAGE_MAX_DIMENSION = 1600
const IMAGE_QUALITY = 0.78
const SIGN_URL_TIMEOUT = 12000
const UPLOAD_TIMEOUT = 45000

function createTimeoutError(message: string) {
  const error = new Error(message)
  error.name = 'TimeoutError'
  return error
}

async function fetchWithTimeout(input: string, init: RequestInit, timeout: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw createTimeoutError('请求超时，请稍后重试')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function isCompressibleImage(file: File | Blob) {
  return typeof file.type === 'string' && file.type.startsWith('image/')
}

function getJpegName(fileName: string) {
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
  return `${nameWithoutExt || 'image'}_compressed.jpg`
}

async function loadImageBitmap(file: File | Blob) {
  if ('createImageBitmap' in window) {
    return await createImageBitmap(file)
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片读取失败'))
    }
    image.src = objectUrl
  })
}

async function maybeCompressImage(file: File | Blob): Promise<{ payload: File | Blob; fileName: string; fileType: string }> {
  const fallbackName = file instanceof File ? file.name : `image_${Date.now()}.jpg`
  const fallbackType = file.type || (file instanceof File ? file.type : 'image/jpeg') || 'image/jpeg'

  if (!isCompressibleImage(file)) {
    return {
      payload: file,
      fileName: fallbackName,
      fileType: fallbackType,
    }
  }

  if (file.size <= IMAGE_COMPRESS_THRESHOLD) {
    return {
      payload: file,
      fileName: fallbackName,
      fileType: fallbackType,
    }
  }

  try {
    const source = await loadImageBitmap(file)
    const sourceWidth = source.width
    const sourceHeight = source.height

    if (!sourceWidth || !sourceHeight) {
      return {
        payload: file,
        fileName: fallbackName,
        fileType: fallbackType,
      }
    }

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight))
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale))
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext('2d')
    if (!context) {
      return {
        payload: file,
        fileName: fallbackName,
        fileType: fallbackType,
      }
    }

    context.drawImage(source as CanvasImageSource, 0, 0, targetWidth, targetHeight)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY)
    })

    if (!blob || blob.size >= file.size) {
      return {
        payload: file,
        fileName: fallbackName,
        fileType: fallbackType,
      }
    }

    return {
      payload: blob,
      fileName: getJpegName(fallbackName),
      fileType: 'image/jpeg',
    }
  } catch {
    return {
      payload: file,
      fileName: fallbackName,
      fileType: fallbackType,
    }
  }
}

export async function uploadImage(file: File | Blob): Promise<string> {
  const supabase = await getSupabase()
  if (!supabase) {
    throw new Error('Supabase 未初始化，请刷新页面')
  }

  try {
    const token = await authService.getRequiredAccessToken()
    const prepared = await maybeCompressImage(file)
    const fileName = prepared.fileName
    const fileType = prepared.fileType

    const response = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/farm-file/sign-url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, fileType }),
    }, SIGN_URL_TIMEOUT)

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(authService.getProtectedActionErrorMessage(response.status, errText || '图片上传失败'))
    }

    const data = await response.json()

    if (!data?.uploadUrl || !data?.objectKey) {
      throw new Error('服务器返回数据格式错误')
    }

    const result = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', data.uploadUrl)
      xhr.timeout = UPLOAD_TIMEOUT
      xhr.setRequestHeader('Content-Type', fileType)
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const urlObj = new URL(data.uploadUrl)
          resolve(`${urlObj.origin}${urlObj.pathname}`)
        } else {
          reject(new Error(`上传失败: ${xhr.status} - ${xhr.responseText}`))
        }
      }
      xhr.onerror = () => reject(new Error('网络错误'))
      xhr.ontimeout = () => reject(createTimeoutError('上传超时，请检查网络后重试'))
      xhr.send(prepared.payload)
    })
    
    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('图片上传失败')
  }
}

export async function uploadImages(files: (File | Blob)[]): Promise<string[]> {
  if (!files.length) return []

  const results: string[] = []
  
  for (const file of files) {
    try {
      const url = await uploadImage(file)
      results.push(url)
    } catch (error) {
      throw error
    }
  }

  return results
}
