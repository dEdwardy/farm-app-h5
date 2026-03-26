function isBlobOrDataUrl(url: string) {
  return url.startsWith('blob:') || url.startsWith('data:')
}

export function normalizeImageUrl(url: string) {
  const trimmed = url.trim()

  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`
  }

  return trimmed
}

export function getThumbnailUrl(url: string, width = 520) {
  if (!url || isBlobOrDataUrl(url)) {
    return url
  }

  const normalizedUrl = normalizeImageUrl(url)
  const separator = normalizedUrl.includes('?') ? '&' : '?'
  return `${normalizedUrl}${separator}x-oss-process=image/resize,m_lfit,w_${width}`
}
