import { getSupabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''

export async function uploadImage(file: File | Blob): Promise<string> {
  const supabase = await getSupabase()
  if (!supabase) {
    throw new Error('Supabase 未初始化，请刷新页面')
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY

    const fileName = file instanceof File ? file.name : `image_${Date.now()}.jpg`
    const fileType = file instanceof File ? file.type : 'image/jpeg'

    const response = await fetch(`${SUPABASE_URL}/functions/v1/farm-file/sign-url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, fileType }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Edge Function error: ${response.status} - ${errText}`)
    }

    const data = await response.json()

    if (!data?.uploadUrl || !data?.objectKey) {
      throw new Error('服务器返回数据格式错误')
    }

    const result = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', data.uploadUrl)
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
      xhr.send(file)
    })
    
    return result
  } catch (error) {
    console.error('Upload error:', error)
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
      console.error('Single file upload failed:', error)
      throw error
    }
  }

  return results
}
