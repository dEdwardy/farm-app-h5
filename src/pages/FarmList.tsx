import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Download, Home, Import, Plus, Search } from 'lucide-react'
import { dataService } from '../services/dataService'
import { FarmRow } from '../types/farm'
import { ImportExportModal } from '../components/ImportExportModal'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { clearPerfMeasure, endPerfMeasure, startPerfMeasure } from '../utils/perf'

const highlightClassName = 'rounded-[0.45rem] bg-primary/14 px-1 py-0 text-foreground'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlightedText(value: string, keyword: string, className = highlightClassName) {
  if (!keyword.trim() || !value) {
    return value
  }

  const normalizedKeyword = keyword.trim()
  const matcher = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'ig')
  const segments = value.split(matcher)

  if (segments.length === 1) {
    return value
  }

  return segments.map((segment, index) => {
    if (!segment) {
      return null
    }

    const isMatch = segment.toLowerCase() === normalizedKeyword.toLowerCase()

    return isMatch
      ? <mark key={`${segment}-${index}`} className={className}>{segment}</mark>
      : <span key={`${segment}-${index}`}>{segment}</span>
  })
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function FarmList() {
  const MIN_SEARCH_LENGTH = 2
  const navigate = useNavigate()
  const [farms, setFarms] = useState<FarmRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [countResolved, setCountResolved] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('import')
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const normalizedSearch = debouncedSearch.trim()
  const shouldBlockSearchRequest = normalizedSearch.length > 0 && normalizedSearch.length < MIN_SEARCH_LENGTH
  const effectiveSearch = shouldBlockSearchRequest ? '' : normalizedSearch
  const isInitialMount = useRef(true)
  const countRequestIdRef = useRef(0)
  const farmsAbortControllerRef = useRef<AbortController | null>(null)
  const countAbortControllerRef = useRef<AbortController | null>(null)

  const resolveCount = useCallback((searchTerm: string) => {
    const requestId = countRequestIdRef.current + 1
    countRequestIdRef.current = requestId
    countAbortControllerRef.current?.abort()
    const controller = new AbortController()
    countAbortControllerRef.current = controller

    setCountResolved(false)

    const run = async () => {
      startPerfMeasure('farmList:count')
      const total = await dataService.getFarmCount(searchTerm, controller.signal)
      if (controller.signal.aborted) {
        clearPerfMeasure('farmList:count')
        return
      }
      if (countRequestIdRef.current !== requestId) {
        clearPerfMeasure('farmList:count')
        return
      }
      setTotalCount(total)
      setCountResolved(true)
      endPerfMeasure('farmList:count')
    }

    window.setTimeout(() => {
      void run()
    }, 80)
  }, [])

  const fetchFarms = useCallback(async (reset = false, currentPage = 1) => {
    const perfKey = reset && currentPage === 1 ? 'farmList:first-page' : 'farmList:next-page'
    farmsAbortControllerRef.current?.abort()
    const controller = new AbortController()
    farmsAbortControllerRef.current = controller

    try {
      if (reset) {
        setLoading(true)
      }

      startPerfMeasure(perfKey)
      
      const response = await dataService.getFarms({
        page: currentPage,
        pageSize: 10,
        searchQuery: effectiveSearch,
        signal: controller.signal,
      })

      if (controller.signal.aborted) {
        clearPerfMeasure(perfKey)
        return
      }
      
      if (response.error) {
        endPerfMeasure(perfKey)
        if (reset || currentPage === 1) {
          setError(response.error)
          setFarms([])
          setTotalCount(0)
          setCountResolved(false)
        }
        return
      }

      setError(null)
      setTotalCount(response.totalCount)
      setCountResolved(false)
      
      if (reset || currentPage === 1) {
        setFarms(response.data)
        resolveCount(effectiveSearch)
      } else {
        setFarms(prev => [...prev, ...response.data])
      }
      setHasMore(response.data.length === 10)
      endPerfMeasure(perfKey)
    } catch {
      if (controller.signal.aborted) {
        clearPerfMeasure(perfKey)
        return
      }
      clearPerfMeasure(perfKey)
      if (reset || currentPage === 1) {
        setError('加载养殖场失败，请稍后重试')
        setFarms([])
        setTotalCount(0)
      }
    } finally {
      if (farmsAbortControllerRef.current === controller) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [effectiveSearch, resolveCount])

  useEffect(() => {
    return () => {
      farmsAbortControllerRef.current?.abort()
      countAbortControllerRef.current?.abort()
    }
  }, [])

  const openImportExportModal = (tab: 'import' | 'export') => {
    setImportExportTab(tab)
    setShowImportExport(true)
  }

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      fetchFarms(true, 1)
      return
    }
    
    if (shouldBlockSearchRequest) {
      farmsAbortControllerRef.current?.abort()
      countAbortControllerRef.current?.abort()
      setPage(1)
      setLoading(false)
      setRefreshing(false)
      setCountResolved(false)
      setError(null)
      setFarms([])
      setHasMore(false)
      setTotalCount(0)
      return
    }

    setPage(1)
    fetchFarms(true, 1)
  }, [fetchFarms, shouldBlockSearchRequest])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchFarms(false, nextPage)
    }
  }, [loading, hasMore, page, fetchFarms])

  const handleCardClick = (farmId?: string) => {
    if (farmId) {
      navigate(`/farm/${farmId}`)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return ''
    }
  }

  const farmCountText = countResolved
    ? (totalCount > 0 || normalizedSearch ? `共 ${totalCount} 个养殖场` : '管理您的养殖场')
    : shouldBlockSearchRequest
      ? `请输入至少 ${MIN_SEARCH_LENGTH} 个字再搜索`
      : (farms.length > 0 ? `已加载 ${farms.length} 个养殖场` : '正在准备列表…')

  const isInitialLoading = loading && farms.length === 0 && !error

  const renderSkeletonCards = () => (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="surface-card animate-pulse border-white/80 px-4 pb-3.5 pt-3.5"
          aria-hidden="true"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="h-5 w-24 rounded-full bg-[#e5e0d5]" />
                <div className="h-5 w-20 rounded-full bg-[#e5e0d5]" />
              </div>
              <div className="mt-2 h-8 w-32 rounded-lg bg-[#ddd7ca]" />
              <div className="mt-2.5 space-y-1.5">
                <div className="h-4 w-48 rounded bg-[#e7e2d7]" />
                <div className="h-4 w-28 rounded bg-[#e7e2d7]" />
              </div>
            </div>
            <div className="h-9 w-9 rounded-[0.95rem] bg-[#e7e2d7]" />
          </div>
          <div className="mt-3 border-t border-border/60 pt-2.5">
            <div className="h-4 w-20 rounded bg-[#e7e2d7]" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="app-page overflow-hidden">
      <div className="flex-shrink-0 space-y-2 px-4 pb-2 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[1.28rem] leading-none tracking-[-0.02em] text-foreground">养殖场</h1>
            <p className="mt-0.5 text-[0.82rem] text-muted-foreground">{farmCountText}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="h-8 rounded-[0.95rem] px-2.5 text-[0.82rem]" onClick={() => openImportExportModal('import')}>
              <Import className="h-4 w-4" />
              导入
            </Button>
            <Button variant="secondary" size="sm" className="h-8 rounded-[0.95rem] px-2.5 text-[0.82rem]" onClick={() => openImportExportModal('export')}>
              <Download className="h-4 w-4" />
              导出
            </Button>
          </div>
        </div>

        <div className="relative rounded-[1.2rem] border border-border/70 bg-white/82 px-3 py-2.5 shadow-sm">
          <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setError(null)
              setSearchQuery(e.target.value)
            }}
            placeholder="搜索养殖场、地址、负责人或水面面积"
            className="h-9 border-0 bg-transparent pl-9 pr-2 text-[0.92rem] shadow-none focus:bg-transparent focus:ring-0"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-6">
        <div className="h-full overflow-y-auto pb-20">
          {refreshing && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          )}

          {shouldBlockSearchRequest ? (
            <div className="state-panel">
              <div className="state-icon">
                <Search className="h-9 w-9 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">继续输入以开始搜索</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">为减少无效查询和流量消耗，请至少输入 {MIN_SEARCH_LENGTH} 个字。</p>
            </div>
          ) : !loading && error ? (
            <div className="state-panel">
              <div className="state-icon bg-destructive/10 text-destructive">
                <span>!</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">加载失败</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
              <Button type="button" className="mt-5" onClick={() => fetchFarms(true, 1)}>
                重试
              </Button>
            </div>
          ) : isInitialLoading ? (
            renderSkeletonCards()
          ) : !loading && farms.length === 0 ? (
            <div className="state-panel">
              <div className="state-icon">
                <Home className="h-9 w-9 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {searchQuery ? '未找到匹配的养殖场' : '暂无养殖场'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {searchQuery ? '尝试其他关键词' : '点击下方按钮添加'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 transition-opacity duration-200">
              {farms.map((farm) => (
                <Card
                  key={farm.id}
                  onClick={() => handleCardClick(farm.id)}
                  className="cursor-pointer border-white/80 transition hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-panel"
                >
                  <CardContent className="px-4 pb-3.5 pt-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="chip px-2.5 py-0.5 text-[0.72rem]">{farm.created_at ? formatDate(farm.created_at) : '待完善'}</span>
                          {farm.water_area_acre ? <span className="chip px-2.5 py-0.5 text-[0.72rem]">{renderHighlightedText(farm.water_area_acre, effectiveSearch)} 亩水面</span> : null}
                        </div>
                        <h3 className="mt-2 truncate font-display text-[1.22rem] leading-none tracking-[-0.01em] text-foreground">
                          {farm.farm_name ? renderHighlightedText(farm.farm_name, effectiveSearch) : '未命名'}
                        </h3>

                        <div className="mt-2.5 space-y-1">
                          {farm.address && (
                            <p className="flex items-start gap-2 text-[0.84rem] leading-5 text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/55"></span>
                              <span className="truncate">{renderHighlightedText(farm.address, effectiveSearch)}</span>
                            </p>
                          )}

                          {farm.responsible_person && (
                            <p className="flex items-start gap-2 text-[0.84rem] leading-5 text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/55"></span>
                              <span>{renderHighlightedText(farm.responsible_person, effectiveSearch)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-primary/10 text-primary">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-[0.78rem] text-muted-foreground">
                      <span>{farm.responsible_person ? renderHighlightedText(farm.responsible_person, effectiveSearch, 'rounded-[0.4rem] bg-primary/12 px-1 py-0 text-foreground') : '资料待补充'}</span>
                      <span>查看</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {loading && farms.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}

              {!loading && hasMore && farms.length > 0 && (
                <Button onClick={loadMore} variant="secondary" className="mt-1 w-full">
                  加载更多
                </Button>
              )}

              {!hasMore && farms.length > 0 && (
                <div className="py-5 text-center text-sm text-muted-foreground">
                  已加载全部
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/farm/add"
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground shadow-panel transition hover:-translate-y-0.5 hover:brightness-105"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.1rem)' }}
      >
        <Plus className="h-6 w-6" />
      </Link>

      <ImportExportModal
        visible={showImportExport}
        initialTab={importExportTab}
        onClose={() => setShowImportExport(false)}
        onRefresh={() => fetchFarms(true, 1)}
      />
    </div>
  )
}
