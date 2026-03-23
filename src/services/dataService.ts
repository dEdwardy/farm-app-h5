import { getSupabase, supabaseInitError } from './supabase'
import { getSupabaseErrorMessage, getErrorMessage } from '../utils/errorHandler'

// Types
export interface FarmFile {
  id?: string
  url: string
  name: string
  type?: string
  size?: number
  business_type?: string
}

export interface FarmRow {
  id?: string
  farm_name: string
  address?: string
  longitude_latitude?: string
  responsible_person?: string
  contact_phone?: string
  farm_mode?: string
  pond_count?: string
  water_area_acre?: string
  farm_area_acre?: string
  other_water_area_sqm?: string
  other_farm_area_acre?: string
  avg_water_depth?: string
  main_species?: string
  operation_status?: string | null
  output?: string
  output_value?: string
  total_investment?: string
  has_treatment_facility?: boolean
  treatment_method?: string | null
  treatment_facility_area?: string
  treated_discharge_volume?: string
  final_destination?: string | null
  farm_images?: FarmFile[]
  tail_water_images?: FarmFile[]
  safety_info?: FarmFile[]
  created_at?: string
  updated_at?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  searchQuery?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  error?: string
}

async function getClient() {
  const client = await getSupabase()
  if (!client) {
    return { ok: false, error: supabaseInitError ?? 'Supabase 未初始化', client: null }
  }
  return { ok: true, client }
}

function processFarmFiles(files: any[] | undefined) {
  const farmImages: FarmFile[] = []
  const tailWaterImages: FarmFile[] = []
  const safetyInfoFiles: FarmFile[] = []

  files?.forEach((file: any) => {
    const fileInfo = {
      url: file.url,
      name: file.name || file.url.split('/').pop() || '',
      size: file.size || 0
    }
    switch (file.business_type) {
      case 'farm_images':
        farmImages.push(fileInfo)
        break
      case 'tail_water_images':
        tailWaterImages.push(fileInfo)
        break
      case 'safety_info':
        safetyInfoFiles.push(fileInfo)
        break
    }
  })

  return { farmImages, tailWaterImages, safetyInfoFiles }
}

export const dataService = {
  async getFarms(params: PaginationParams): Promise<PaginatedResponse<FarmRow>> {
    const check = await getClient()
    if (!check.ok || !check.client) {
      return { data: [], totalCount: 0, error: check.error }
    }

    try {
      const offset = (params.page - 1) * params.pageSize
      let query = check.client
        .from('aquaculture_farms')
        .select('*, files (url, business_type, type, name, size)', { count: 'exact' })
        .is('deleted_at', null)

      if (params.searchQuery && params.searchQuery.trim()) {
        const searchTerm = `%${params.searchQuery.trim()}%`
        query = query.or(
          `farm_name.ilike.${searchTerm},address.ilike.${searchTerm},responsible_person.ilike.${searchTerm},contact_phone.ilike.${searchTerm},longitude_latitude.ilike.${searchTerm}`
        )
      }

      const { data: farmData, error: fetchError, count } = await query
        .range(offset, offset + params.pageSize - 1)

      if (fetchError) {
        return { data: [], totalCount: 0, error: getSupabaseErrorMessage(fetchError) }
      }

      const cleaned = farmData?.map((row: any) => {
        const { files, ...rest } = row
        const { farmImages, tailWaterImages, safetyInfoFiles } = processFarmFiles(files)

        return {
          ...rest,
          farm_images: farmImages,
          tail_water_images: tailWaterImages,
          safety_info: safetyInfoFiles
        }
      }) ?? []

      return {
        data: cleaned,
        totalCount: count ?? 0
      }
    } catch (error) {
      console.error('getFarms 错误:', error)
      return {
        data: [],
        totalCount: 0,
        error: getErrorMessage(error)
      }
    }
  },

  async getFarmById(id: string): Promise<FarmRow | null> {
    const check = await getClient()
    if (!check.ok || !check.client) return null

    try {
      const { data, error } = await check.client
        .from('aquaculture_farms')
        .select('*, files (id, url, business_type, type, name, size)')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) return null

      const { files, ...rest } = data
      const { farmImages, tailWaterImages, safetyInfoFiles } = processFarmFiles(files)

      return {
        ...rest,
        farm_images: farmImages,
        tail_water_images: tailWaterImages,
        safety_info: safetyInfoFiles
      }
    } catch {
      return null
    }
  },

  async createFarm(data: FarmRow): Promise<FarmRow | null> {
    const check = await getClient()
    if (!check.ok || !check.client) return null

    try {
      const { farm_images, tail_water_images, safety_info, ...farmData } = data

      const numericFields = [
        'pond_count', 'water_area_acre', 'farm_area_acre',
        'other_water_area_sqm', 'other_farm_area_acre', 'avg_water_depth',
        'output', 'output_value', 'total_investment',
        'treatment_facility_area', 'treated_discharge_volume'
      ]

      const insertData: any = { ...farmData }
      numericFields.forEach((field) => {
        if (insertData[field] === '' || insertData[field] === undefined || insertData[field] === null) {
          insertData[field] = null
        }
      })

      const { data: insertedFarm, error } = await check.client
        .from('aquaculture_farms')
        .insert(insertData)
        .select()
        .single()

      if (error) return null

      const allFilesData: any[] = []

      const addFilesToData = (files: any[], businessType: string, type: string) => {
        files?.forEach((file: any) => {
          const url = typeof file === 'string' ? file : file.url
          const name = typeof file === 'string' ? url.split('/').pop() || '' : file.name
          const size = typeof file === 'string' ? 0 : file.size || 0
            allFilesData.push({
              farm_id: insertedFarm.id,
              url,
              name,
              size,
              business_type: businessType,
              type,
              created_at: new Date().toISOString()
            })
        })
      }

      addFilesToData(farm_images || [], 'farm_images', 'image')
      addFilesToData(tail_water_images || [], 'tail_water_images', 'image')
      addFilesToData(safety_info || [], 'safety_info', 'file')

      if (insertedFarm && allFilesData.length > 0) {
        try {
          await check.client!.from('files').insert(allFilesData)
        } catch (e) {
          console.error('添加文件失败:', e)
        }
      }

      if (insertedFarm) {
        const { data: filesData } = await check.client!
          .from('files')
          .select('id, url, business_type, name, size, type')
          .eq('farm_id', insertedFarm.id)
        
        const { farmImages, tailWaterImages, safetyInfoFiles } = processFarmFiles(filesData || [])
        
        const { created_at, ...rest } = insertedFarm
        return {
          ...rest,
          farm_images: farmImages,
          tail_water_images: tailWaterImages,
          safety_info: safetyInfoFiles
        }
      }

      return null
    } catch {
      return null
    }
  },

  async updateFarm(id: string, data: FarmRow, existingFiles?: FarmFile[]): Promise<FarmRow | null> {
    const check = await getClient()
    if (!check.ok || !check.client) return null

    try {
      const { farm_images, tail_water_images, safety_info, created_at, updated_at, ...farmData } = data

      const numericFields = [
        'pond_count', 'water_area_acre', 'farm_area_acre',
        'other_water_area_sqm', 'other_farm_area_acre', 'avg_water_depth',
        'output', 'output_value', 'total_investment',
        'treatment_facility_area', 'treated_discharge_volume'
      ]

      const enumFields = ['operation_status', 'treatment_method', 'final_destination']

      const updateData: any = { ...farmData }

      numericFields.forEach((field) => {
        if (updateData[field] === '' || updateData[field] === undefined || updateData[field] === null) {
          updateData[field] = null
        }
      })

      enumFields.forEach((field) => {
        if (updateData[field] === '' || updateData[field] === undefined) {
          updateData[field] = null
        }
      })

      const { data: updatedFarm, error: updateError } = await check.client!
        .from('aquaculture_farms')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('更新农场失败:', updateError)
        if (window.__showToast) {
          window.__showToast(getSupabaseErrorMessage(updateError), 'error')
        }
        return null
      }

      const fileGroups = [
        { files: farm_images, businessType: 'farm_images', defaultType: 'image' },
        { files: tail_water_images, businessType: 'tail_water_images', defaultType: 'image' },
        { files: safety_info, businessType: 'safety_info', defaultType: 'file' }
      ]

      if (updatedFarm) {
        try {
          let dbFiles = existingFiles
          
          if (!dbFiles || dbFiles.length === 0) {
            const { data: filesFromDb } = await check.client!
              .from('files')
              .select('id, url, business_type, name, type')
              .eq('farm_id', id)
            
            if (filesFromDb) {
              dbFiles = filesFromDb as FarmFile[]
            }
          }
          
          if (dbFiles) {
            const existingFileMap = new Map<string, FarmFile>()
            dbFiles.forEach(file => existingFileMap.set(file.url, file))

            const allFilesData: any[] = []

            fileGroups.forEach(group => {
              if (Array.isArray(group.files)) {
                group.files.forEach((file: any) => {
                  const url = typeof file === 'string' ? file : file.url
                  const name = typeof file === 'string' ? url.split('/').pop() || '' : file.name
                  const type = typeof file === 'string' ? group.defaultType : file.type || group.defaultType
                  const size = typeof file === 'string' ? 0 : file.size || 0
                  allFilesData.push({
                    farm_id: id,
                    url,
                    name,
                    business_type: group.businessType,
                    type,
                    size,
                    created_at: new Date().toISOString()
                  })
                })
              }
            })

            const filesToDelete: string[] = []
            existingFileMap.forEach(file => {
              const existsInNew = allFilesData.some(newFile => newFile.url === file.url)
              if (!existsInNew && file.id) {
                filesToDelete.push(file.id)
              }
            })

            const filesToAdd = allFilesData.filter(newFile => !existingFileMap.has(newFile.url))

            if (filesToDelete.length > 0) {
              await check.client.from('files').delete().in('id', filesToDelete)
            }

            if (filesToAdd.length > 0) {
              await check.client.from('files').insert(filesToAdd)
            }
          }
        } catch (e) {
          console.error('更新文件失败:', e)
        }
      }

      if (updatedFarm) {
        const { data: filesData } = await check.client!
          .from('files')
          .select('id, url, business_type, name, size, type')
          .eq('farm_id', id)
        
        const { farmImages, tailWaterImages, safetyInfoFiles } = processFarmFiles(filesData || [])
        
        const { created_at: _, ...rest } = updatedFarm
        return {
          ...rest,
          farm_images: farmImages,
          tail_water_images: tailWaterImages,
          safety_info: safetyInfoFiles
        }
      }

      return null
    } catch (error) {
      console.error('更新农场信息失败:', error)
      return null
    }
  },

  async deleteFarm(id: string): Promise<boolean> {
    const check = await getClient()
    if (!check.ok || !check.client) return false

    try {
      const { error } = await check.client
        .from('aquaculture_farms')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      return !error
    } catch (error) {
      console.error('删除失败:', error)
      if (window.__showToast) {
        window.__showToast(getErrorMessage(error), 'error')
      }
      return false
    }
  }
}