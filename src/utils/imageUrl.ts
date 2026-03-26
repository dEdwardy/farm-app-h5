function isBlobOrDataUrl(url: string) {
  return url.startsWith('blob:') || url.startsWith('data:')
}

export function getThumbnailUrl(url: string, width = 520) {
  if (!url || isBlobOrDataUrl(url)) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}x-oss-process=image/resize,m_lfit,w_${width}`
}
