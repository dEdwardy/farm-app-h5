// 养殖场数据类型定义

// 文件信息
export interface FarmFile {
  id?: string;
  url: string;
  name: string;
  type?: string;
  size?: number;
  business_type?: string;
}

// 表单文件信息（用于表单提交）
export interface FormFile {
  url: string;
  name: string;
}

// 养殖场基础信息
export interface FarmBaseInfo {
  id?: string;
  farm_name: string;
  address?: string;
  longitude_latitude?: string;
  responsible_person?: string;
  contact_phone?: string;
  farm_mode?: string;
}

// 养殖情况信息
export interface FarmBreedingInfo {
  pond_count?: string;
  water_area_acre?: string;
  farm_area_acre?: string;
  other_water_area_sqm?: string;
  other_farm_area_acre?: string;
  avg_water_depth?: string;
  main_species?: string;
  farm_mode?: string;
  operation_status?: string | null;
  output?: string;
  output_value?: string;
  total_investment?: string;
}

// 尾水处理信息
export interface FarmTreatmentInfo {
  has_treatment_facility?: boolean;
  treatment_method?: string | null;
  treatment_facility_area?: string;
  treated_discharge_volume?: string;
  final_destination?: string | null;
}

// 完整养殖场数据
export interface FarmRow extends FarmBaseInfo, FarmBreedingInfo, FarmTreatmentInfo {
  farm_images?: FarmFile[] | string[] | FormFile[];
  tail_water_images?: FarmFile[] | string[] | FormFile[];
  safety_info?: FarmFile[] | string[] | FormFile[];
  created_at?: string;
  updated_at?: string;
}

// 养殖场列表查询参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  searchQuery?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  error?: string;
}
