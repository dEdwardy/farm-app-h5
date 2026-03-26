import { useEffect, useMemo, useState } from 'react'
import { Gauge, X } from 'lucide-react'
import { getPerfMetrics, type PerfMetricEntry, subscribePerfMetrics } from '../utils/perf'

const metricLabels: Record<string, string> = {
  'auth:init': '鉴权初始化',
  'farmList:first-page': '列表首屏数据',
  'farmList:next-page': '列表分页数据',
}

function formatDuration(duration: number) {
  return `${duration.toFixed(0)}ms`
}

export function DevPerfPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [metrics, setMetrics] = useState<PerfMetricEntry[]>(() => getPerfMetrics())

  useEffect(() => {
    return subscribePerfMetrics(setMetrics)
  }, [])

  const visibleMetrics = useMemo(() => {
    const seen = new Set<string>()
    return metrics.filter(metric => {
      if (seen.has(metric.name)) {
        return false
      }

      seen.add(metric.name)
      return true
    })
  }, [metrics])

  if (import.meta.env.PROD) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-[220px] rounded-[1.15rem] border border-white/70 bg-[rgba(47,62,52,0.88)] p-3 text-white shadow-float backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-white/90">
          <Gauge className="h-4 w-4" />
          Dev 性能
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={() => setCollapsed(prev => !prev)}
            aria-label={collapsed ? '展开性能面板' : '收起性能面板'}
          >
            <span className="block h-3 w-3 text-xs leading-3">{collapsed ? '+' : '–'}</span>
          </button>
          <button
            type="button"
            className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={() => setMetrics([])}
            aria-label="清空性能记录"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div className="mt-3 space-y-2">
          {visibleMetrics.length > 0 ? (
            visibleMetrics.map(metric => (
              <div key={`${metric.name}-${metric.endedAt}`} className="rounded-[0.95rem] bg-white/8 px-3 py-2">
                <div className="text-[0.78rem] text-white/65">{metricLabels[metric.name] || metric.name}</div>
                <div className="mt-1 text-sm font-semibold text-white">{formatDuration(metric.duration)}</div>
              </div>
            ))
          ) : (
            <div className="rounded-[0.95rem] bg-white/8 px-3 py-2 text-[0.78rem] text-white/65">
              暂无记录，刷新或切换页面后会显示。
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
