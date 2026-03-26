import { useEffect, useState } from 'react'
import { Download, FileUp, Loader2, UploadCloud } from 'lucide-react'
import { exportFarms, importFarms, ImportResult } from '../services/fileService'
import { showErrorToast, showSuccessToast } from '../utils/errorHandler'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface ImportExportModalProps {
  visible: boolean
  initialTab?: 'import' | 'export'
  onClose: () => void
  onRefresh: () => void
}

export function ImportExportModal({
  visible,
  initialTab = 'import',
  onClose,
  onRefresh,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab)
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab)
      setImportResult(null)
    }
  }, [visible, initialTab])

  const handleImport = async (file: File) => {
    setIsLoading(true)
    setImportResult(null)
    try {
      const result = await importFarms(file)
      setImportResult(result)
      if (result.success) {
        showSuccessToast(result.message)
        onRefresh()
        window.setTimeout(() => {
          onClose()
        }, 1800)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败，请稍后重试'
      showErrorToast(message)
      setImportResult({ success: false, message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const blob = await exportFarms()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `养殖场数据_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      showSuccessToast('导出成功')
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden p-0" hideClose>
        <DialogHeader>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-primary/12 text-primary">
            {activeTab === 'import' ? <FileUp className="h-6 w-6" /> : <Download className="h-6 w-6" />}
          </div>
          <DialogTitle>数据导入导出</DialogTitle>
          <DialogDescription>让养殖场资料在移动端和 Excel 之间轻松流转。</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'import' | 'export')}>
            <TabsList>
              <TabsTrigger value="import">导入</TabsTrigger>
              <TabsTrigger value="export">导出</TabsTrigger>
            </TabsList>

            <TabsContent value="import">
              <div className="surface-card-subtle p-4">
                <p className="text-sm leading-6 text-[#5e6d64]">支持 `.xlsx`、`.xls`、`.csv` 文件。建议先在电脑整理后再导入到移动端。</p>
                <label className="mt-4 flex min-h-[164px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-primary/30 bg-white/75 px-6 text-center transition hover:border-primary/55 hover:bg-white">
                  {isLoading ? (
                      <span className="inline-flex flex-col items-center gap-3 text-sm text-[#5e6d64]">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      正在处理文件...
                    </span>
                  ) : (
                    <>
                      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UploadCloud className="h-6 w-6" />
                      </span>
                      <span className="text-base font-medium text-foreground">点击选择文件</span>
                      <span className="mt-2 text-sm text-[#5e6d64]">适合批量导入养殖场资料，上传后将自动校验并反馈结果。</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    disabled={isLoading}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        void handleImport(file)
                      }
                    }}
                  />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="export">
              <div className="surface-card-subtle p-4">
                <p className="text-sm leading-6 text-[#5e6d64]">将当前系统中的养殖场资料导出为 Excel 文件，便于归档、审阅或线下交接。</p>
                <div className="mt-5 rounded-[1.5rem] border border-white/70 bg-[linear-gradient(135deg,rgba(111,138,121,0.92),rgba(94,118,103,0.9))] p-5 text-primary-foreground shadow-panel">
                  <p className="text-sm uppercase tracking-[0.24em] text-white/65">Export</p>
                  <p className="mt-3 font-display text-3xl tracking-[-0.04em]">一键导出完整资料</p>
                  <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/80">适合提交报表、复盘养殖情况或在桌面端继续处理数据。</p>
                  <Button className="mt-5 w-full" size="lg" onClick={() => void handleExport()} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {isLoading ? '导出中...' : '导出数据'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {importResult ? (
            <div className={`mt-5 rounded-[1.25rem] border px-4 py-4 ${importResult.success ? 'border-primary/18 bg-primary/8' : 'border-destructive/20 bg-destructive/10'}`}>
              <p className={`text-sm font-medium ${importResult.success ? 'text-[#355142]' : 'text-[#9f3f36]'}`}>{importResult.message}</p>
              {importResult.success && importResult.data ? (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="surface-card-subtle px-3 py-3 text-center">
                    <p className="text-xl font-semibold text-foreground">{importResult.data.total}</p>
                    <p className="mt-1 text-xs text-[#66746b]">总记录</p>
                  </div>
                  <div className="surface-card-subtle px-3 py-3 text-center">
                    <p className="text-xl font-semibold text-primary">{importResult.data.successCount}</p>
                    <p className="mt-1 text-xs text-[#66746b]">成功</p>
                  </div>
                  <div className="surface-card-subtle px-3 py-3 text-center">
                    <p className="text-xl font-semibold text-destructive">{importResult.data.failCount}</p>
                    <p className="mt-1 text-xs text-[#66746b]">失败</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
