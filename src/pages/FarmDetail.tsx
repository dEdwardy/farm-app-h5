import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { dataService } from '../services/dataService'
import { FarmFile, FarmRow, FormFile } from '../types/farm'
import { useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'

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
      console.error('Failed to fetch farm:', err)
      setError('获取数据失败')
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
      console.error('Failed to delete:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const getImageSrc = (img: FarmAsset): string => {
    if (typeof img === 'string') return img
    return img?.url || ''
  }

  const getImageName = (img: FarmAsset, index: number) => {
    if (typeof img === 'string') {
      return img.split('/').pop() || `image_${index}`
    }

    return img.name || `image_${index}`
  }

  const getImages = (images: FarmAsset[] | undefined): PreviewImage[] => {
    if (!images || !Array.isArray(images)) return []
    return images.map((img, index) => ({
      url: getImageSrc(img),
      name: getImageName(img, index),
      size: getAssetSize(img)
    }))
  }

  const openImagePreview = (images: PreviewImage[], index: number) => {
    setPreviewImages(images)
    setPreviewIndex(index)
    setShowPreview(true)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-primary-500">加载中...</div>
      </div>
    )
  }

  if (error || !formData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500">{error || '未找到养殖场'}</p>
        <Link to="/" className="text-primary-500 mt-4">返回首页</Link>
      </div>
    )
  }

  const farmImages = getImages(formData.farm_images)
  const tailWaterImages = getImages(formData.tail_water_images)
  const safetyInfo = getImages(formData.safety_info)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* 场所信息 */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            场所信息
          </h3>
          <h1 className="text-xl font-bold text-gray-900">{formatDisplayValue(formData.farm_name)}</h1>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">详细地址</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.address)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">经纬度</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.longitude_latitude)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">负责人</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.responsible_person)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">联系电话</span>
              <span className="text-primary-600 font-medium">{formatDisplayValue(formData.contact_phone)}</span>
            </div>
          </div>
        </div>

        {/* 养殖信息 */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            养殖信息
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">池塘口数</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.pond_count)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">养殖水面面积</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.water_area_acre, '亩')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">养殖占地面积</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.farm_area_acre, '亩')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">其他养殖水面面积</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.other_water_area_sqm, '平方米')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">其他养殖占地面积</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.other_farm_area_acre, '亩')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">平均水深</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.avg_water_depth, '米')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">主养品种</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.main_species)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">养殖模式</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.farm_mode)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">生产运行情况</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.operation_status)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">总产量</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.output, '吨')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">年总产值</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.output_value, '万元')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">年总投入</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.total_investment, '万元')}</span>
            </div>
            
            {/* 养殖情况图片 */}
            <div className="mt-5">
              <span className="text-gray-500 text-xs uppercase tracking-wide">养殖情况图片</span>
              {farmImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 mt-3">
                  {farmImages.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => openImagePreview(farmImages, i)}
                      aria-label={`预览图片 ${img.name}`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 mt-3 bg-gray-50 rounded-xl">
                  <svg className="w-8 h-8 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400 text-sm">暂无数据</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 尾水处理 */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            尾水处理
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">有无尾水处理设施</span>
              <span className={formData.has_treatment_facility ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {formData.has_treatment_facility ? '有' : '无'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">尾水处理方式</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.treatment_method)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">尾水处理设施面积</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.treatment_facility_area, '亩')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">已完成尾水治理排放量</span>
              <span className="text-gray-900 font-medium">{formatValueWithUnit(formData.treated_discharge_volume, '吨')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">养殖尾水最终去向</span>
              <span className="text-gray-900 font-medium">{formatDisplayValue(formData.final_destination)}</span>
            </div>

            {/* 尾水处理图片 */}
            <div className="mt-5">
              <span className="text-gray-500 text-xs uppercase tracking-wide">尾水处理图片</span>
              {tailWaterImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 mt-3">
                  {tailWaterImages.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => openImagePreview(tailWaterImages, i)}
                      aria-label={`预览图片 ${img.name}`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 mt-3 bg-gray-50 rounded-xl">
                  <svg className="w-8 h-8 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400 text-sm">暂无数据</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 安全信息 */}
        <div className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            安全信息
          </h3>
          <span className="text-gray-500 text-xs uppercase tracking-wide">安全信息文件</span>
          {safetyInfo.length > 0 ? (
            <div className="mt-3 space-y-2">
              {safetyInfo.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3.5 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center flex-1 min-w-0">
                    <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-900 truncate">{file.name}</span>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="text-primary-500 text-sm ml-3 hover:text-primary-600 font-medium"
                  >
                    下载
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 mt-3 bg-gray-50 rounded-xl">
              <svg className="w-8 h-8 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-400 text-sm">暂无数据</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 py-3.5 border-2 border-red-500 text-red-500 rounded-xl font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          删除
        </button>
        <Link
          to={`/farm/edit/${id}`}
          className="flex-1 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center rounded-xl font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          编辑
        </Link>
      </div>

      {/* 图片预览 */}
      {showPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setShowPreview(false)}
        >
          <button
            type="button"
            aria-label="关闭图片预览"
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl z-10"
            onClick={() => setShowPreview(false)}
          >
            ✕
          </button>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={previewImages[previewIndex]?.url}
              alt={previewImages[previewIndex]?.name || '预览图片'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {previewImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {previewImages.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === previewIndex ? 'bg-white' : 'bg-white/50'}`}
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
