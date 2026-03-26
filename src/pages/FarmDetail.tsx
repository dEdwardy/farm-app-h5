import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowDownToLine, Leaf, Loader2, Pencil, Trash2, Waves, ShieldCheck } from 'lucide-react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { dataService } from '../services/dataService'
import { FarmFile, FarmRow, FormFile } from '../types/farm'
import { useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getErrorMessage } from '../utils/errorHandler'
import { getThumbnailUrl, normalizeImageUrl } from '../utils/imageUrl'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'

type FarmDetailFormData = ReturnType<typeof mapFormData>
type FarmAsset = FarmFile | FormFile | string
type PreviewImage = {
  url: string
  name: string
  size: number
}

const mapFormData = (farmData: FarmRow) => {
  return {
    farm_name: String(farmData.farm_name ?? ''),
    address: String(farmData.address ?? ''),
    longitude_latitude: String(farmData.longitude_latitude ?? ''),
    responsible_person: String(farmData.responsible_person ?? ''),
    contact_phone: String(farmData.contact_phone ?? ''),
    pond_count: String(farmData.pond_count ?? ''),
    water_area_acre: String(farmData.water_area_acre ?? ''),
    farm_area_acre: String(farmData.farm_area_acre ?? ''),
    other_water_area_sqm: String(farmData.other_water_area_sqm ?? ''),
    other_farm_area_acre: String(farmData.other_farm_area_acre ?? ''),
    avg_water_depth: String(farmData.avg_water_depth ?? ''),
    main_species: String(farmData.main_species ?? ''),
    farm_mode: String(farmData.farm_mode ?? ''),
    operation_status: String(farmData.operation_status ?? ''),
    output: String(farmData.output ?? ''),
    output_value: String(farmData.output_value ?? ''),
    total_investment: String(farmData.total_investment ?? ''),
    has_treatment_facility: Boolean(farmData.has_treatment_facility ?? false),
    treatment_method: String(farmData.treatment_method ?? ''),
    treatment_facility_area: String(farmData.treatment_facility_area ?? ''),
    treated_discharge_volume: String(farmData.treated_discharge_volume ?? ''),
    final_destination: String(farmData.final_destination ?? ''),
    farm_images: farmData.farm_images,
    tail_water_images: farmData.tail_water_images,
    safety_info: farmData.safety_info,
  }
}

const formatDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const formatValueWithUnit = (value: unknown, unit: string): string => {
  if (value === null || value === undefined || value === '') return '-'
  return `${value}${unit}`
}

const getAssetSize = (img: FarmAsset): number => {
  if (typeof img === 'string') {
    return 0
  }

  return 'size' in img && typeof img.size === 'number' ? img.size : 0
}

export default function FarmDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [formData, setFormData] = useState<FarmDetailFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchDeltaXRef = useRef(0)

  const fetchFarm = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await dataService.getFarmById(id)
      if (data) {
        setFormData(mapFormData(data))
      } else {
        setError('未找到该养殖场')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchFarm()
  }, [fetchFarm])

  const handleDelete = async () => {
    if (!id) return
    
    try {
      setIsDeleting(true)
      const success = await dataService.deleteFarm(id)
      if (success) {
        setShowDeleteConfirm(false)
        showToast('删除成功', 'success')
        navigate('/')
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const getImageSrc = (img: FarmAsset): string => {
    if (typeof img === 'string') return normalizeImageUrl(img)
    return normalizeImageUrl(img?.url || '')
  }

  const getImageName = (img: FarmAsset, index: number) => {
    if (typeof img === 'string') {
      return img.split('/').pop() || `image_${index}`
    }

    return img.name || `image_${index}`
  }

  const getImages = (images: FarmAsset[] | undefined): PreviewImage[] => {
    if (!images || !Array.isArray(images)) return []
    return images
      .map((img, index) => ({
        url: normalizeImageUrl(getImageSrc(img)),
        name: getImageName(img, index),
        size: getAssetSize(img)
      }))
      .filter(image => image.url.length > 0)
  }

  const openImagePreview = (images: PreviewImage[], index: number) => {
    setPreviewImages(images)
    setPreviewIndex(index)
    setShowPreview(true)
  }

  const closePreview = () => {
    setShowPreview(false)
  }

  const showPreviousPreviewImage = () => {
    if (previewImages.length <= 1) {
      return
    }

    setPreviewIndex(prevIndex => (prevIndex - 1 + previewImages.length) % previewImages.length)
  }

  const showNextPreviewImage = () => {
    if (previewImages.length <= 1) {
      return
    }

    setPreviewIndex(prevIndex => (prevIndex + 1) % previewImages.length)
  }

  const handlePreviewTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (previewImages.length <= 1) {
      return
    }

    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
    touchDeltaXRef.current = 0
  }

  const handlePreviewTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return
    }

    const currentX = event.changedTouches[0]?.clientX
    if (typeof currentX !== 'number') {
      return
    }

    touchDeltaXRef.current = currentX - touchStartXRef.current
  }

  const handlePreviewTouchEnd = () => {
    if (touchStartXRef.current === null) {
      return
    }

    const swipeThreshold = 48

    if (touchDeltaXRef.current <= -swipeThreshold) {
      showNextPreviewImage()
    } else if (touchDeltaXRef.current >= swipeThreshold) {
      showPreviousPreviewImage()
    }

    touchStartXRef.current = null
    touchDeltaXRef.current = 0
  }

  useEffect(() => {
    if (!showPreview) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreview()
        return
      }

      if (event.key === 'ArrowLeft') {
        showPreviousPreviewImage()
      }

      if (event.key === 'ArrowRight') {
        showNextPreviewImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showPreview, previewImages.length])

  if (loading) {
    return (
      <div className="app-page items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-white/80 px-4 py-3 text-sm text-muted-foreground shadow-panel">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          加载中...
        </div>
      </div>
    )
  }

  if (error || !formData) {
    return (
      <div className="app-page items-center justify-center px-6">
        <div className="state-panel">
          <div className="state-icon">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <p className="text-base font-semibold text-foreground">{error || '未找到养殖场'}</p>
          <Button asChild className="mt-5">
            <Link to="/">返回首页</Link>
          </Button>
        </div>
      </div>
    )
  }

  const farmImages = getImages(formData.farm_images)
  const tailWaterImages = getImages(formData.tail_water_images)
  const safetyInfo = getImages(formData.safety_info)

  const renderMetaRow = (label: string, value: string, accent = false) => (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-right text-sm font-medium ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  )

  const renderImageGrid = (images: PreviewImage[], title: string) => (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={i}
              type="button"
              className="aspect-square overflow-hidden rounded-[1.2rem] border border-white/70 bg-secondary shadow-sm transition hover:opacity-90"
              onClick={() => openImagePreview(images, i)}
              aria-label={`预览图片 ${img.name}`}
            >
              <img src={getThumbnailUrl(img.url)} alt={img.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="surface-card-subtle mt-3 flex items-center justify-center py-8 text-sm text-muted-foreground">暂无数据</div>
      )}
    </div>
  )

  return (
    <div className="app-page">
      <div className="app-scroll space-y-4 pb-32">
        <PageHeader
          eyebrow="Farm Record"
          title={formatDisplayValue(formData.farm_name)}
          description="查看场所、养殖与尾水处理资料，确认现场档案是否完整。"
          onBack={() => navigate(-1)}
          action={<span className="chip">{formData.operation_status || '运行状态待补充'}</span>}
        />

        <Card>
          <CardHeader>
            <div className="section-heading-icon"><Leaf className="h-5 w-5" /></div>
            <div>
              <CardTitle>场所信息</CardTitle>
              <CardDescription>场所位置、负责人和联系方式概览。</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {renderMetaRow('详细地址', formatDisplayValue(formData.address))}
            {renderMetaRow('经纬度', formatDisplayValue(formData.longitude_latitude))}
            {renderMetaRow('负责人', formatDisplayValue(formData.responsible_person))}
            {renderMetaRow('联系电话', formatDisplayValue(formData.contact_phone), true)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="section-heading-icon"><Waves className="h-5 w-5" /></div>
            <div>
              <CardTitle>养殖信息</CardTitle>
              <CardDescription>面积、产量与养殖方式等核心经营数据。</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {renderMetaRow('池塘口数', formatDisplayValue(formData.pond_count))}
            {renderMetaRow('养殖水面面积', formatValueWithUnit(formData.water_area_acre, '亩'))}
            {renderMetaRow('养殖占地面积', formatValueWithUnit(formData.farm_area_acre, '亩'))}
            {renderMetaRow('其他养殖水面面积', formatValueWithUnit(formData.other_water_area_sqm, '平方米'))}
            {renderMetaRow('其他养殖占地面积', formatValueWithUnit(formData.other_farm_area_acre, '亩'))}
            {renderMetaRow('平均水深', formatValueWithUnit(formData.avg_water_depth, '米'))}
            {renderMetaRow('主养品种', formatDisplayValue(formData.main_species))}
            {renderMetaRow('养殖模式', formatDisplayValue(formData.farm_mode))}
            {renderMetaRow('生产运行情况', formatDisplayValue(formData.operation_status))}
            {renderMetaRow('总产量', formatValueWithUnit(formData.output, '吨'))}
            {renderMetaRow('年总产值', formatValueWithUnit(formData.output_value, '万元'))}
            {renderMetaRow('年总投入', formatValueWithUnit(formData.total_investment, '万元'))}
            {renderImageGrid(farmImages, '养殖情况图片')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="section-heading-icon"><Waves className="h-5 w-5" /></div>
            <div>
              <CardTitle>尾水处理</CardTitle>
              <CardDescription>尾水处理设施、治理排放与去向记录。</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {renderMetaRow('有无尾水处理设施', formData.has_treatment_facility ? '有' : '无', formData.has_treatment_facility)}
            {renderMetaRow('尾水处理方式', formatDisplayValue(formData.treatment_method))}
            {renderMetaRow('尾水处理设施面积', formatValueWithUnit(formData.treatment_facility_area, '亩'))}
            {renderMetaRow('治理排放量', formatValueWithUnit(formData.treated_discharge_volume, '吨'))}
            {renderMetaRow('最终去向', formatDisplayValue(formData.final_destination))}
            {renderImageGrid(tailWaterImages, '尾水处理图片')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="section-heading-icon"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <CardTitle>安全资料</CardTitle>
              <CardDescription>检查记录与安全文档下载。</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {safetyInfo.length > 0 ? (
              <div className="space-y-3">
                {safetyInfo.map((file, i) => (
                  <div key={i} className="surface-card-subtle flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">可用于归档或现场核验下载</p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                      <a href={normalizeImageUrl(file.url)} download={file.name}>
                        <ArrowDownToLine className="h-4 w-4" />
                        下载
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-card-subtle flex items-center justify-center py-8 text-sm text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="safe-bottom border-t border-border/70 bg-white/85 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button type="button" variant="destructive" size="md" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" />
            删除
          </Button>
          <Button asChild size="md" className="flex-1">
            <Link to={`/farm/edit/${id}`}>
              <Pencil className="h-4 w-4" />
              编辑资料
            </Link>
          </Button>
        </div>
      </div>

      {showPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={closePreview}
        >
          <button
            type="button"
            aria-label="关闭图片预览"
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl z-10"
            onClick={closePreview}
          >
            ✕
          </button>
          {previewImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一张图片"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl z-10"
                onClick={(event) => {
                  event.stopPropagation()
                  showPreviousPreviewImage()
                }}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="下一张图片"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl z-10"
                onClick={(event) => {
                  event.stopPropagation()
                  showNextPreviewImage()
                }}
              >
                ›
              </button>
            </>
          )}
          <div className="flex-1 flex items-center justify-center p-4">
            <div
              className="w-full h-full flex items-center justify-center"
              onClick={(event) => event.stopPropagation()}
              onTouchStart={handlePreviewTouchStart}
              onTouchMove={handlePreviewTouchMove}
              onTouchEnd={handlePreviewTouchEnd}
            >
              <img
                src={previewImages[previewIndex]?.url}
                alt={previewImages[previewIndex]?.name || '预览图片'}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
          {previewImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {previewImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`切换到第 ${i + 1} 张图片`}
                  className={`w-2 h-2 rounded-full ${i === previewIndex ? 'bg-white' : 'bg-white/50'}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setPreviewIndex(i)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除养殖场"
        message="确定要删除这个养殖场吗？删除后将无法恢复。"
        confirmText="确认删除"
        busyText="删除中..."
        danger
        busy={isDeleting}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
