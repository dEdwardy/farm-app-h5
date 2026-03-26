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
  signal?: AbortSignal
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  error?: string
}

interface FarmListQueryParams {
  page: number
  pageSize: number
  searchQuery?: string
}

const farmsCache = new Map<string, PaginatedResponse<FarmRow>>()
const farmCountCache = new Map<string, number>()
const FARM_LIST_SELECT_FIELDS = 'id,farm_name,address,responsible_person,water_area_acre,created_at'
const FARM_LIST_SEARCH_FIELDS = ['farm_name', 'responsible_person', 'address', 'water_area_acre'] as const

function buildFarmListSearchFilter(searchTerm: string) {
  return FARM_LIST_SEARCH_FIELDS.map(field => `${field}.ilike.${searchTerm}`).join(',')
}

function normalizeSearchQuery(searchQuery?: string) {
  return searchQuery?.trim() || ''
}

function getFarmsCacheKey(params: FarmListQueryParams) {
  return JSON.stringify({
    page: params.page,
    pageSize: params.pageSize,
    searchQuery: normalizeSearchQuery(params.searchQuery),
  })
}

function getFarmCountCacheKey(searchQuery?: string) {
  return normalizeSearchQuery(searchQuery)
}

function clearFarmsCache() {
  farmsCache.clear()
  farmCountCache.clear()
}

async function getClient() {
  const client = await getSupabase()
  if (!client) {
    return { ok: false, error: supabaseInitError ?? 'Supabase 未初始化', client: null }
  }
  return { ok: true, client }
}

interface FileInsertData {
  farm_id: string
  url: string
  name: string
  size: number
  business_type: string
  type: string
  created_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeFileInput(file: FarmFile | string): FarmFile | null {
  if (typeof file === 'string') {
    return {
      url: file,
      name: file.split('/').pop() || '',
      size: 0,
    }
  }

  if (!file?.url) {
    return null
  }

  return {
    url: file.url,
    name: file.name || file.url.split('/').pop() || '',
    size: file.size || 0,
    type: file.type,
    business_type: file.business_type,
  }
}

function processFarmFiles(files: unknown[] | undefined) {
  const farmImages: FarmFile[] = []
  const tailWaterImages: FarmFile[] = []
  const safetyInfoFiles: FarmFile[] = []

  files?.forEach((file) => {
    if (!isRecord(file) || typeof file.url !== 'string') {
      return
    }

    const fileInfo: FarmFile = {
      url: file.url,
      name: typeof file.name === 'string' && file.name ? file.name : file.url.split('/').pop() || '',
      size: typeof file.size === 'number' ? file.size : 0,
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
    const cacheKey = getFarmsCacheKey(params)
    const cached = farmsCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const check = await getClient()
    if (!check.ok || !check.client) {
      return { data: [], totalCount: 0, error: check.error }
    }

    try {
      const offset = (params.page - 1) * params.pageSize
      let query = check.client
        .from('aquaculture_farms')
        .select(FARM_LIST_SELECT_FIELDS)
        .is('deleted_at', null)

      if (params.signal) {
        query = query.abortSignal(params.signal)
      }

      const normalizedQuery = normalizeSearchQuery(params.searchQuery)
      if (normalizedQuery) {
        const searchTerm = `%${normalizedQuery}%`
        query = query.or(buildFarmListSearchFilter(searchTerm))
      }

      const { data: farmData, error: fetchError } = await query
        .range(offset, offset + params.pageSize - 1)

      if (fetchError) {
        return { data: [], totalCount: 0, error: getSupabaseErrorMessage(fetchError) }
      }

      const cachedCount = farmCountCache.get(getFarmCountCacheKey(params.searchQuery))

      const cleaned = (farmData ?? []).map((row: unknown) => {
        if (!isRecord(row)) {
          return {
            farm_name: '',
            farm_images: [],
            tail_water_images: [],
            safety_info: [],
          } as FarmRow
        }

        const normalizedRow = row as Partial<FarmRow>

        return {
          ...normalizedRow,
          farm_name: typeof normalizedRow.farm_name === 'string' ? normalizedRow.farm_name : '',
          farm_images: [],
          tail_water_images: [],
          safety_info: []
        } as FarmRow
      })

      const result = {
        data: cleaned,
        totalCount: cachedCount ?? cleaned.length
      }
      farmsCache.set(cacheKey, result)
      return result
    } catch (error) {
      if (params.signal?.aborted) {
        return {
          data: [],
          totalCount: 0,
        }
      }

      return {
        data: [],
        totalCount: 0,
        error: getErrorMessage(error)
      }
    }
  },

  async prefetchFarms(params: PaginationParams): Promise<void> {
    try {
      await Promise.all([
        this.getFarms(params),
        this.getFarmCount(params.searchQuery),
      ])
    } catch {
    }
  },

  async getFarmCount(searchQuery?: string, signal?: AbortSignal): Promise<number> {
    const cacheKey = getFarmCountCacheKey(searchQuery)
    const cached = farmCountCache.get(cacheKey)
    if (typeof cached === 'number') {
      return cached
    }

    const check = await getClient()
    if (!check.ok || !check.client) {
      return 0
    }

    try {
      let query = check.client
        .from('aquaculture_farms')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)

      if (signal) {
        query = query.abortSignal(signal)
      }

      const normalizedQuery = normalizeSearchQuery(searchQuery)
      if (normalizedQuery) {
        const searchTerm = `%${normalizedQuery}%`
        query = query.or(buildFarmListSearchFilter(searchTerm))
      }

      const { count, error } = await query

      if (error) {
        return 0
      }

      const total = count ?? 0
      farmCountCache.set(cacheKey, total)
      return total
    } catch {
      if (signal?.aborted) {
        return 0
      }
      return 0
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

      const insertData: Record<string, unknown> = { ...farmData }
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

      const allFilesData: FileInsertData[] = []

      const addFilesToData = (files: Array<FarmFile | string>, businessType: string, type: string) => {
        files.forEach((file) => {
          const normalized = normalizeFileInput(file)
          if (!normalized) {
            return
          }

          allFilesData.push({
            farm_id: insertedFarm.id,
            url: normalized.url,
            name: normalized.name,
            size: normalized.size || 0,
            business_type: businessType,
            type,
            created_at: new Date().toISOString(),
          })
        })
      }

      addFilesToData(farm_images || [], 'farm_images', 'image')
      addFilesToData(tail_water_images || [], 'tail_water_images', 'image')
      addFilesToData(safety_info || [], 'safety_info', 'file')

      if (insertedFarm && allFilesData.length > 0) {
        try {
          await check.client.from('files').insert(allFilesData)
        } catch (error) {
          if (window.__showToast) {
            window.__showToast(getErrorMessage(error), 'error')
          }
        }
      }

      if (insertedFarm) {
        clearFarmsCache()
        const { data: filesData } = await check.client
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

      const updateData: Record<string, unknown> = { ...farmData }

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

            const allFilesData: FileInsertData[] = []

            fileGroups.forEach(group => {
              if (Array.isArray(group.files)) {
                group.files.forEach((file) => {
                  const normalized = normalizeFileInput(file)
                  if (!normalized) {
                    return
                  }

                  allFilesData.push({
                    farm_id: id,
                    url: normalized.url,
                    name: normalized.name,
                    business_type: group.businessType,
                    type: normalized.type || group.defaultType,
                    size: normalized.size || 0,
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
        } catch (error) {
          if (window.__showToast) {
            window.__showToast(getErrorMessage(error), 'error')
          }
        }
      }

      if (updatedFarm) {
        clearFarmsCache()
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
    } catch {
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

      if (!error) {
        clearFarmsCache()
      }

      return !error
    } catch (error) {
      if (window.__showToast) {
        window.__showToast(getErrorMessage(error), 'error')
      }
      return false
    }
  }
}
