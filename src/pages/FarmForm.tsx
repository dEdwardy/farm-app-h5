import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router-dom'
import { Droplets, FileText, Leaf, Loader2, Save, Waves } from 'lucide-react'
import { authService } from '../services/authService'
import { dataService } from '../services/dataService'
import { uploadImage } from '../services/ossService'
import { farmFormSchema, FarmFormData, fieldMetaMap } from '../types/schemas'
import type { FarmFile } from '../types/farm'
import type { FarmRow as ServiceFarmRow } from '../services/dataService'
import { getErrorMessage } from '../utils/errorHandler'
import { getThumbnailUrl, normalizeImageUrl } from '../utils/imageUrl'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'

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

type NumericFieldKey =
  | 'pond_count'
  | 'water_area_acre'
  | 'farm_area_acre'
  | 'other_water_area_sqm'
  | 'other_farm_area_acre'
  | 'avg_water_depth'
  | 'output'
  | 'output_value'
  | 'total_investment'
  | 'treatment_facility_area'
  | 'treated_discharge_volume'

type EnumFieldKey = 'operation_status' | 'treatment_method' | 'final_destination'

const numericFields: NumericFieldKey[] = ['pond_count', 'water_area_acre', 'farm_area_acre', 'other_water_area_sqm', 'other_farm_area_acre', 'avg_water_depth', 'output', 'output_value', 'total_investment', 'treatment_facility_area', 'treated_discharge_volume']

const enumFields: EnumFieldKey[] = ['operation_status', 'treatment_method', 'final_destination']

const formFields = Object.keys(fieldMetaMap).map(key => ({
  name: key,
  ...fieldMetaMap[key],
  required: fieldMetaMap[key].required || false,
}))

const venueSectionFieldNames = [
  'farm_name',
  'address',
  'longitude_latitude',
  'responsible_person',
  'contact_phone',
]

const breedingSectionFieldNames = [
  'pond_count',
  'water_area_acre',
  'farm_area_acre',
  'other_water_area_sqm',
  'other_farm_area_acre',
  'avg_water_depth',
  'main_species',
  'farm_mode',
  'operation_status',
  'output',
  'output_value',
  'total_investment',
]

const treatmentToggleFieldNames = ['has_treatment_facility']

const treatmentDetailFieldNames = [
  'treatment_method',
  'treatment_facility_area',
  'treated_discharge_volume',
  'final_destination',
]

interface ImageItem {
  url: string
  name: string
  size?: number
  uploading?: boolean
  error?: boolean
}

const getFieldInputId = (name: string) => `farm-form-${name}`
const getFieldErrorId = (name: string) => `farm-form-${name}-error`

const isObjectUrl = (url: string) => url.startsWith('blob:')

const revokeObjectUrl = (url: string) => {
  if (isObjectUrl(url)) {
    URL.revokeObjectURL(url)
  }
}

const toImageItem = (file: FarmFile | string, fallbackName: string, index: number): ImageItem => {
  if (typeof file === 'string') {
    return {
      url: normalizeImageUrl(file),
      name: file.split('/').pop() || `${fallbackName}_${index}`,
      size: 0,
    }
  }

  return {
    url: normalizeImageUrl(file.url),
    name: file.name || file.url.split('/').pop() || `${fallbackName}_${index}`,
    size: file.size || 0,
  }
}

const toFarmFile = (file: FarmFile | string, index: number): FarmFile => {
  if (typeof file === 'string') {
    return {
      url: normalizeImageUrl(file),
      name: file.split('/').pop() || `file_${index}`,
      size: 0,
    }
  }

  return {
    url: normalizeImageUrl(file.url),
    name: file.name || file.url.split('/').pop() || `file_${index}`,
    size: file.size || 0,
    type: file.type,
    business_type: file.business_type,
  }
}

const imageItemsToFiles = (images: ImageItem[]) => {
  return images.filter(img => !img.uploading && !img.error).map(img => ({
    url: img.url,
    name: img.name,
    size: img.size,
  }))
}

const toFarmRowPayload = (data: FarmFormData, farmImages: ImageItem[], tailWaterImages: ImageItem[], safetyInfo: ImageItem[]): ServiceFarmRow => {
  const submitData: FarmFormData = { ...data }

  numericFields.forEach(field => {
    const value = submitData[field]
    if (value === '' || value === undefined || value === null) {
      submitData[field] = undefined
    }
  })

  enumFields.forEach(field => {
    const value = submitData[field]
    if (value === '' || value === undefined || value === null) {
      submitData[field] = undefined
    }
  })

  return {
    ...submitData,
    pond_count: submitData.pond_count ?? undefined,
    water_area_acre: submitData.water_area_acre ?? undefined,
    farm_area_acre: submitData.farm_area_acre ?? undefined,
    other_water_area_sqm: submitData.other_water_area_sqm ?? undefined,
    other_farm_area_acre: submitData.other_farm_area_acre ?? undefined,
    avg_water_depth: submitData.avg_water_depth ?? undefined,
    output: submitData.output ?? undefined,
    output_value: submitData.output_value ?? undefined,
    total_investment: submitData.total_investment ?? undefined,
    treatment_facility_area: submitData.treatment_facility_area ?? undefined,
    treated_discharge_volume: submitData.treated_discharge_volume ?? undefined,
    operation_status: submitData.operation_status ?? undefined,
    treatment_method: submitData.treatment_method ?? undefined,
    final_destination: submitData.final_destination ?? undefined,
    farm_images: imageItemsToFiles(farmImages),
    tail_water_images: imageItemsToFiles(tailWaterImages),
    safety_info: imageItemsToFiles(safetyInfo),
  }
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
  const previewImagesRef = useRef<ImageItem[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FarmFormData>({
    resolver: zodResolver(farmFormSchema),
    defaultValues,
  })

  const hasTreatment = watch('has_treatment_facility')

  const getFieldsByNames = (fieldNames: string[]) => {
    const fieldSet = new Set(fieldNames)
    return formFields.filter(field => fieldSet.has(field.name))
  }

  const venueFields = getFieldsByNames(venueSectionFieldNames)
  const breedingFields = getFieldsByNames(breedingSectionFieldNames)
  const treatmentToggleFields = getFieldsByNames(treatmentToggleFieldNames)
  const treatmentDetailFields = getFieldsByNames(treatmentDetailFieldNames)

  useEffect(() => {
    previewImagesRef.current = [...farmImages, ...tailWaterImages, ...safetyInfo]
  }, [farmImages, tailWaterImages, safetyInfo])

  useEffect(() => {
    return () => {
      previewImagesRef.current.forEach(image => revokeObjectUrl(image.url))
    }
  }, [])

  const loadFarm = useCallback(async (farmId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await dataService.getFarmById(farmId)
      if (data) {
        const normalizedData = data as Partial<Record<keyof FarmFormData, unknown>>

        ;(Object.keys(defaultValues) as Array<keyof FarmFormData>).forEach((key) => {
          if (key === 'farm_images' || key === 'tail_water_images' || key === 'safety_info') {
            return
          }

          const value = normalizedData[key]

          if (key === 'has_treatment_facility') {
            setValue(key, Boolean(value))
            return
          }

          setValue(key, value === null ? undefined : value as FarmFormData[typeof key])
        })

        if (Array.isArray(data.farm_images)) {
          setFarmImages(data.farm_images.map((img, index) => toImageItem(img, 'image', index)))
        }

        if (Array.isArray(data.tail_water_images)) {
          setTailWaterImages(data.tail_water_images.map((img, index) => toImageItem(img, 'image', index)))
        }

        if (Array.isArray(data.safety_info)) {
          setSafetyInfo(data.safety_info.map((img, index) => toImageItem(img, 'file', index)))
        }

        const existingFiles: FarmFile[] = [
          ...(Array.isArray(data.farm_images) ? data.farm_images : []),
          ...(Array.isArray(data.tail_water_images) ? data.tail_water_images : []),
          ...(Array.isArray(data.safety_info) ? data.safety_info : []),
        ].map((img, index) => toFarmFile(img, index))

        setOriginalFiles(existingFiles)
      }
    } catch (err) {
      setError(getErrorMessage(err))
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
        revokeObjectUrl(tempItem.url)
      } catch (err) {
        const message = getErrorMessage(err)
        if (authService.isAuthErrorMessage(message)) {
          setError(message)
        }
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
    setImages(prev => {
      const removedImage = prev[index]
      if (removedImage) {
        revokeObjectUrl(removedImage.url)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const onSubmit = async (data: FarmFormData) => {
    if (submitting) return

    setSubmitting(true)
    setError(null)

    const submitData = toFarmRowPayload(data, farmImages, tailWaterImages, safetyInfo)

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
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

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

  const renderField = (field: typeof formFields[0]) => {
    const inputId = getFieldInputId(field.name)
    const errorId = getFieldErrorId(field.name)
    const fieldError = errors[field.name as keyof typeof errors]

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.name} className="mb-5">
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              id={inputId}
              type={field.type === 'number' ? 'text' : 'text'}
              inputMode={field.type === 'number' ? 'decimal' : 'text'}
              {...register(field.name as keyof FarmFormData)}
              placeholder={field.placeholder}
              aria-invalid={fieldError ? 'true' : 'false'}
              aria-describedby={fieldError ? errorId : undefined}
              className="app-input"
            />
            {fieldError && (
              <p id={errorId} className="text-red-500 text-xs mt-1.5">{fieldError?.message}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="mb-5">
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            <select
              id={inputId}
              {...register(field.name as keyof FarmFormData)}
              aria-invalid={fieldError ? 'true' : 'false'}
              aria-describedby={fieldError ? errorId : undefined}
              className="app-select"
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {fieldError && (
              <p id={errorId} className="text-red-500 text-xs mt-1.5">{fieldError?.message}</p>
            )}
          </div>
        )

      case 'switch':
        return (
          <div key={field.name} className="mb-5">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
              <div className="relative rounded-full bg-secondary p-1 shadow-insetsoft">
                <input
                  type="checkbox"
                  {...register(field.name as keyof FarmFormData)}
                  className="sr-only peer"
                />
                <div className="h-7 w-12 rounded-full bg-transparent peer-checked:bg-primary/85 peer-checked:after:translate-x-full after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all"></div>
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
        <label className="app-label">{label}</label>
        {type === 'safety' ? (
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="surface-card-subtle flex items-center justify-between p-3.5">
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
                      aria-label={`删除文件 ${img.name}`}
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[1.15rem] border border-dashed border-primary/25 bg-white/75 text-sm text-muted-foreground transition hover:border-primary/45 hover:bg-white hover:text-primary">
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
          <div className="mt-3 grid grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-[1.2rem] border border-white/70 bg-secondary shadow-sm">
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
                    <img src={getThumbnailUrl(img.url)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(type)(i)}
                      aria-label={`删除图片 ${img.name}`}
                      className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-bl-xl bg-destructive text-destructive-foreground transition hover:brightness-105"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[1.2rem] border border-dashed border-primary/30 bg-white/70 transition hover:border-primary/50 hover:bg-white">
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
    <div className="app-page">
      <div className="app-scroll space-y-4 pb-32">
        <PageHeader
          eyebrow={isEdit ? 'Edit Farm' : 'New Farm'}
          title={isEdit ? '编辑养殖场' : '新增养殖场'}
          description="把场所、养殖、尾水与安全资料整理成一份结构清晰的现场档案。"
          onBack={() => navigate(-1)}
        />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="section-heading-icon"><Leaf className="h-5 w-5" /></div>
              <div>
                <CardTitle>场所信息</CardTitle>
                <CardDescription>先记录养殖场位置、负责人和联系方式。</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
            {venueFields.map(renderField)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-heading-icon"><Droplets className="h-5 w-5" /></div>
              <div>
                <CardTitle>养殖信息</CardTitle>
                <CardDescription>整理面积、产量和养殖方式，形成核心经营画像。</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
            {breedingFields.map(renderField)}
            {renderImageUpload('farm', '养殖情况图片', farmImages, 'image/*')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-heading-icon"><Waves className="h-5 w-5" /></div>
              <div>
                <CardTitle>尾水处理</CardTitle>
                <CardDescription>补齐治理设施与排放去向，方便后续检查与复盘。</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
            {treatmentToggleFields.map(renderField)}
            {hasTreatment && treatmentDetailFields.map(renderField)}
            {hasTreatment && renderImageUpload('tailWater', '尾水处理图片', tailWaterImages, 'image/*')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-heading-icon"><FileText className="h-5 w-5" /></div>
              <div>
                <CardTitle>安全信息</CardTitle>
                <CardDescription>上传检查材料或安全资料，保持现场档案完整。</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
            {renderImageUpload('safety', '安全信息文件', safetyInfo, '*/*')}
            </CardContent>
          </Card>
        </div>
      </form>
      </div>

      <div className="safe-bottom border-t border-border/70 bg-white/85 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            size="md"
            className="flex-1"
            onClick={handleSubmit(onSubmit)}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? '保存中...' : '保存资料'}
          </Button>
        </div>
      </div>
    </div>
  )
}
