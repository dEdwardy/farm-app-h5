import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router-dom'
import { dataService } from '../services/dataService'
import { uploadImage } from '../services/ossService'
import { farmFormSchema, FarmFormData, fieldMetaMap } from '../types/schemas'
import type { FarmFile } from '../types/farm'

const defaultValues: FarmFormData = {
  farm_name: '',
  address: undefined,
  longitude_latitude: undefined,
  responsible_person: undefined,
  contact_phone: undefined,
  pond_count: undefined,
  water_area_acre: undefined,
  farm_area_acre: undefined,
  other_water_area_sqm: undefined,
  other_farm_area_acre: undefined,
  avg_water_depth: undefined,
  main_species: undefined,
  farm_mode: undefined,
  operation_status: undefined,
  output: undefined,
  output_value: undefined,
  total_investment: undefined,
  farm_images: [],
  has_treatment_facility: false,
  treatment_method: undefined,
  treatment_facility_area: undefined,
  treated_discharge_volume: undefined,
  final_destination: undefined,
  tail_water_images: [],
  safety_info: [],
}

const numericFields = ['pond_count', 'water_area_acre', 'farm_area_acre', 'other_water_area_sqm', 'other_farm_area_acre', 'avg_water_depth', 'output', 'output_value', 'total_investment', 'treatment_facility_area', 'treated_discharge_volume']

const enumFields = ['operation_status', 'treatment_method', 'final_destination']

const formFields = Object.keys(fieldMetaMap).map(key => ({
  name: key,
  ...fieldMetaMap[key],
  required: fieldMetaMap[key].required || false,
}))

interface ImageItem {
  url: string
  name: string
  size?: number
  uploading?: boolean
  error?: boolean
}

export default function FarmForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [farmImages, setFarmImages] = useState<ImageItem[]>([])
  const [tailWaterImages, setTailWaterImages] = useState<ImageItem[]>([])
  const [safetyInfo, setSafetyInfo] = useState<ImageItem[]>([])
  const [originalFiles, setOriginalFiles] = useState<FarmFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FarmFormData>({
    resolver: zodResolver(farmFormSchema),
    defaultValues,
  })

  const hasTreatment = watch('has_treatment_facility')

  const loadFarm = useCallback(async (farmId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await dataService.getFarmById(farmId)
      if (data) {
        Object.keys(defaultValues).forEach(key => {
          if (key in data) {
            const value = (data as any)[key]
            if (key === 'has_treatment_facility') {
              setValue(key as keyof FarmFormData, Boolean(value))
            } else if (key === 'farm_images' && data.farm_images) {
              const imgs = data.farm_images.map((img: any) => ({
                url: typeof img === 'string' ? img : img.url,
                name: typeof img === 'string' ? img.split('/').pop() || 'image' : (img as any).name || 'image',
                size: (img as any).size || 0,
              }))
              setFarmImages(imgs)
            } else if (key === 'tail_water_images' && data.tail_water_images) {
              const imgs = data.tail_water_images.map((img: any) => ({
                url: typeof img === 'string' ? img : img.url,
                name: typeof img === 'string' ? img.split('/').pop() || 'image' : (img as any).name || 'image',
                size: (img as any).size || 0,
              }))
              setTailWaterImages(imgs)
            } else if (key === 'safety_info' && data.safety_info) {
              const files = data.safety_info.map((img: any) => ({
                url: typeof img === 'string' ? img : img.url,
                name: typeof img === 'string' ? img.split('/').pop() || 'file' : (img as any).name || 'file',
                size: (img as any).size || 0,
              }))
              setSafetyInfo(files)
            } else {
              setValue(key as keyof FarmFormData, value === null ? undefined : value)
            }
          }
        })
        
        if (data.farm_images) {
          const existingFiles: FarmFile[] = [
            ...data.farm_images,
            ...(data.tail_water_images || []),
            ...(data.safety_info || [])
          ].map((img: any, index: number) => ({
            url: typeof img === 'string' ? img : img.url,
            name: typeof img === 'string' ? img.split('/').pop() || `file_${index}` : img.name || `file_${index}`,
            size: img.size || 0,
          }))
          setOriginalFiles(existingFiles)
        }
      }
    } catch (err) {
      console.error('Failed to load farm:', err)
      setError('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [setValue])

  useEffect(() => {
    if (id) {
      loadFarm(id)
    }
  }, [id, loadFarm])

  const handleImageUpload = (type: 'farm' | 'tailWater' | 'safety') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    const setImages = type === 'farm' ? setFarmImages : type === 'tailWater' ? setTailWaterImages : setSafetyInfo

    for (const file of Array.from(files)) {
      const tempItem: ImageItem = {
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        uploading: true,
      }
      setImages(prev => [...prev, tempItem])

      try {
        const url = await uploadImage(file)
        setImages(prev => prev.map(item => 
          item.url === tempItem.url && item.uploading
            ? { url, name: file.name, size: file.size }
            : item
        ))
      } catch (err) {
        console.error('Upload failed:', err)
        setImages(prev => prev.map(item => 
          item.url === tempItem.url && item.uploading
            ? { ...item, uploading: false, error: true }
            : item
        ))
      }
    }

    e.target.value = ''
  }

  const handleImageRemove = (type: 'farm' | 'tailWater' | 'safety') => (index: number) => {
    const setImages = type === 'farm' ? setFarmImages : type === 'tailWater' ? setTailWaterImages : setSafetyInfo
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const getImageUrls = (images: ImageItem[]) => {
    return images.filter(img => !img.uploading && !img.error).map(img => ({
      url: img.url,
      name: img.name,
      size: img.size,
    }))
  }

  const onSubmit = async (data: FarmFormData) => {
    if (submitting) return

    setSubmitting(true)
    setError(null)

    const submitData: any = { ...data }

    numericFields.forEach(field => {
      const value = submitData[field]
      if (value === '' || value === undefined || value === null) {
        submitData[field] = undefined
      }
    })

    enumFields.forEach(field => {
      const value = submitData[field]
      if (value === '' || value === undefined) {
        submitData[field] = undefined
      }
    })

    submitData.farm_images = getImageUrls(farmImages)
    submitData.tail_water_images = getImageUrls(tailWaterImages)
    submitData.safety_info = getImageUrls(safetyInfo)

    try {
      let result
      if (isEdit && id) {
        result = await dataService.updateFarm(id, submitData, originalFiles)
      } else {
        result = await dataService.createFarm(submitData)
      }

      if (result) {
        navigate('/')
      } else {
        setError('保存失败，请稍后重试')
      }
    } catch (err) {
      console.error('Submit failed:', err)
      setError('保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-primary-500">加载中...</div>
      </div>
    )
  }

  const renderField = (field: typeof formFields[0]) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.name} className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type={field.type === 'number' ? 'text' : 'text'}
              inputMode={field.type === 'number' ? 'decimal' : 'text'}
              {...register(field.name as keyof FarmFormData)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200"
            />
            {errors[field.name as keyof typeof errors] && (
              <p className="text-red-500 text-xs mt-1.5">{errors[field.name as keyof typeof errors]?.message}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            <select
              {...register(field.name as keyof FarmFormData)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200"
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )

      case 'switch':
        return (
          <div key={field.name} className="mb-5">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  {...register(field.name as keyof FarmFormData)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all cursor-pointer"></div>
              </div>
            </label>
          </div>
        )

      default:
        return null
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const renderImageUpload = (
    type: 'farm' | 'tailWater' | 'safety',
    label: string,
    images: ImageItem[],
    accept: string
  ) => {
    const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleImageUpload(type)(e)
    }

    const renderUploadButton = () => (
      <label className={type === 'safety' 
        ? "flex items-center justify-center w-full h-14 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer text-sm text-gray-500 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-500 transition-all duration-200"
        : "w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200"
      }>
        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <input
          type="file"
          accept={accept}
          multiple
          onChange={onImageChange}
          className="hidden"
        />
      </label>
    )

    if (images.length === 0) {
      return (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          {renderUploadButton()}
        </div>
      )
    }

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        {type === 'safety' ? (
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5 hover:bg-gray-100 transition-colors">
                <div className="flex items-center flex-1 min-w-0">
                  <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{img.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(img.size)}</p>
                  </div>
                </div>
                {img.uploading ? (
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                ) : img.error ? (
                  <span className="text-red-500 text-xs ml-2">失败</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleImageRemove(type)(i)}
                    className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer text-sm text-gray-500 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-500 transition-all duration-200">
              <span>选择文件</span>
              <input
                type="file"
                accept={accept}
                multiple
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                {img.uploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : img.error ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 text-xs">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>失败</span>
                  </div>
                ) : (
                  <>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(type)(i)}
                      className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-bl-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="file"
                accept={accept}
                multiple
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-4 flex-shrink-0 flex items-center shadow-lg">
        <button onClick={() => navigate(-1)} className="mr-3 p-1.5 -ml-1.5 rounded-lg hover:bg-white/20 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? '编辑养殖场' : '新增养殖场'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pb-20">
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="p-4 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center pb-3 border-b border-gray-100">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              场所信息
            </h3>
            {formFields.slice(0, 5).map(renderField)}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center pb-3 border-b border-gray-100">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              养殖信息
            </h3>
            {formFields.slice(5, 17).map(renderField)}
            {renderImageUpload('farm', '养殖情况图片', farmImages, 'image/*')}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center pb-3 border-b border-gray-100">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              尾水处理
            </h3>
            {formFields.slice(17, 18).map(renderField)}
            {hasTreatment && formFields.slice(18, 22).map(renderField)}
            {hasTreatment && renderImageUpload('tailWater', '尾水处理图片', tailWaterImages, 'image/*')}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center pb-3 border-b border-gray-100">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              安全信息
            </h3>
            {renderImageUpload('safety', '安全信息文件', safetyInfo, '*/*')}
          </div>
        </div>
      </form>

      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
            className="flex-1 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-200 disabled:shadow-none disabled:translate-y-0 transition-all duration-200"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
