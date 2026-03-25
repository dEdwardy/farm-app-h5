import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dataService } from '../services/dataService'
import { FarmRow } from '../types/farm'
import { ImportExportModal } from '../components/ImportExportModal'

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
  const navigate = useNavigate()
  const [farms, setFarms] = useState<FarmRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [showImportExport, setShowImportExport] = useState(false)
  const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('import')
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const isInitialMount = useRef(true)

  const fetchFarms = useCallback(async (reset = false, currentPage = 1) => {
    try {
      if (reset) {
        setLoading(true)
      }
      
      const response = await dataService.getFarms({
        page: currentPage,
        pageSize: 10,
        searchQuery: debouncedSearch,
      })
      
      if (response.error) {
        console.error('Failed to fetch farms:', response.error)
        if (reset || currentPage === 1) {
          setError(response.error)
          setFarms([])
          setTotalCount(0)
        }
        return
      }

      setError(null)
      setTotalCount(response.totalCount)
      
      if (reset || currentPage === 1) {
        setFarms(response.data)
      } else {
        setFarms(prev => [...prev, ...response.data])
      }
      setHasMore(response.data.length === 10)
    } catch (error) {
      console.error('Failed to fetch farms:', error)
      if (reset || currentPage === 1) {
        setError('加载养殖场失败，请稍后重试')
        setFarms([])
        setTotalCount(0)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [debouncedSearch])

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
    
    setPage(1)
    fetchFarms(true, 1)
  }, [debouncedSearch])

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

  const farmCountText = totalCount > 0 || debouncedSearch.trim()
    ? `共 ${totalCount} 个养殖场`
    : '管理您的养殖场'

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-4 flex-shrink-0 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">养殖场列表</h1>
            <p className="text-primary-100 text-sm mt-1">
              {farmCountText}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openImportExportModal('import')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            >
              导入
            </button>
            <button
              onClick={() => openImportExportModal('export')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            >
              导出
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-white/20 flex-shrink-0">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setError(null)
              setSearchQuery(e.target.value)
            }}
            placeholder="搜索养殖场..."
            className="w-full px-4 py-2.5 pl-11 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all duration-200"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20">
        {refreshing && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
          </div>
        )}

        {!loading && error ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-base font-medium text-gray-700">加载失败</h3>
            <p className="text-gray-400 text-sm mt-1.5">{error}</p>
            <button
              type="button"
              onClick={() => fetchFarms(true, 1)}
              className="mt-5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-primary-600 transition-colors"
            >
              重试
            </button>
          </div>
        ) : !loading && farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <span className="text-4xl">🏠</span>
            </div>
            <h3 className="text-base font-medium text-gray-700">
              {searchQuery ? '未找到匹配的养殖场' : '暂无养殖场'}
            </h3>
            <p className="text-gray-400 text-sm mt-1.5">
              {searchQuery ? '尝试其他关键词' : '点击下方按钮添加'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {farms.map((farm) => (
              <div
                key={farm.id}
                onClick={() => handleCardClick(farm.id)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {farm.farm_name || '未命名'}
                    </h3>
                    
                    {farm.address && (
                      <p className="text-sm text-gray-500 mt-1.5 truncate flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {farm.address}
                      </p>
                    )}
                    
                    {farm.responsible_person && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {farm.responsible_person}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400">
                      {farm.created_at && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(farm.created_at)}
                        </span>
                      )}
                      {farm.water_area_acre && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                          {farm.water_area_acre} 亩
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center ml-3">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}

            {loading && farms.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            )}

            {!loading && hasMore && farms.length > 0 && (
              <button
                onClick={loadMore}
                className="w-full py-3 text-primary-500 text-sm font-medium"
              >
                加载更多
              </button>
            )}

            {!hasMore && farms.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                已加载全部
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        to="/farm/add"
        className="fixed right-4 bottom-20 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
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
