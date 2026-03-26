export interface PerfMetricEntry {
  name: string
  duration: number
  startedAt: number
  endedAt: number
}

type PerfMetricsListener = (entries: PerfMetricEntry[]) => void

declare global {
  interface Window {
    __perfMetrics?: PerfMetricEntry[]
  }
}

const activePerfMarks = new Map<string, number>()
const perfListeners = new Set<PerfMetricsListener>()

function getPerfStore(): PerfMetricEntry[] {
  if (!window.__perfMetrics) {
    window.__perfMetrics = []
  }

  return window.__perfMetrics
}

function notifyPerfListeners(entries: PerfMetricEntry[]) {
  perfListeners.forEach(listener => listener(entries))
}

export function getPerfMetrics(): PerfMetricEntry[] {
  return [...getPerfStore()].sort((a, b) => b.endedAt - a.endedAt)
}

export function subscribePerfMetrics(listener: PerfMetricsListener) {
  perfListeners.add(listener)
  listener(getPerfMetrics())

  return () => {
    perfListeners.delete(listener)
  }
}

export function startPerfMeasure(name: string) {
  activePerfMarks.set(name, performance.now())
}

export function endPerfMeasure(name: string) {
  const startedAt = activePerfMarks.get(name)
  if (typeof startedAt !== 'number') {
    return
  }

  const endedAt = performance.now()
  const store = getPerfStore()

  store.push({
    name,
    duration: Number((endedAt - startedAt).toFixed(2)),
    startedAt,
    endedAt,
  })

  if (store.length > 30) {
    store.splice(0, store.length - 30)
  }

  activePerfMarks.delete(name)
  notifyPerfListeners(getPerfMetrics())
}

export function clearPerfMeasure(name: string) {
  activePerfMarks.delete(name)
}
