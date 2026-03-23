import { z } from 'zod'

export const OPERATION_STATUS_OPTIONS = [
  { label: '正常生产', value: '正常生产' },
  { label: '临时性停产', value: '临时性停产' },
  { label: '永久性停产', value: '永久性停产' },
]

export const TREATMENT_METHOD_OPTIONS = [
  { label: '沉淀池', value: '沉淀池' },
  { label: '生态沟渠', value: '生态沟渠' },
  { label: '池塘鱼菜共生', value: '池塘鱼菜共生' },
  { label: '多级人工湿地', value: '多级人工湿地' },
  { label: '其他资源化利用方式', value: '其他资源化利用方式' },
]

export const FINAL_DESTINATION_OPTIONS = [
  { label: '瓜果林地', value: '瓜果林地' },
  { label: '江河湖库', value: '江河湖库' },
  { label: '农田灌溉', value: '农田灌溉' },
  { label: '其他', value: '其他' },
]

export interface FieldMeta {
  label: string
  type: 'text' | 'number' | 'select' | 'switch'
  placeholder: string
  options?: { label: string; value: string }[]
  required?: boolean
}

export const fieldMetaMap: Record<string, FieldMeta> = {
  farm_name: { label: '养殖场(业主)名称', type: 'text', placeholder: '请输入养殖场(业主)名称', required: true },
  address: { label: '详细地址(精确到村社)', type: 'text', placeholder: '请输入详细地址' },
  longitude_latitude: { label: '经纬度', type: 'text', placeholder: '请输入经纬度' },
  responsible_person: { label: '负责人', type: 'text', placeholder: '请输入负责人' },
  contact_phone: { label: '联系电话', type: 'text', placeholder: '请输入联系电话' },
  pond_count: { label: '池塘口数', type: 'number', placeholder: '请输入池塘口数' },
  water_area_acre: { label: '养殖水面面积(亩)', type: 'number', placeholder: '请输入养殖水面面积' },
  farm_area_acre: { label: '养殖场占地面积(亩)', type: 'number', placeholder: '请输入养殖场占地面积' },
  other_water_area_sqm: { label: '其它养殖水面面积(平方米)', type: 'number', placeholder: '请输入其它养殖水面面积' },
  other_farm_area_acre: { label: '其它养殖占地面积(亩)', type: 'number', placeholder: '请输入其它养殖占地面积' },
  avg_water_depth: { label: '平均水深(米)', type: 'number', placeholder: '请输入平均水深' },
  main_species: { label: '主养品种', type: 'text', placeholder: '请输入主养品种' },
  farm_mode: { label: '养殖模式', type: 'text', placeholder: '请输入养殖模式' },
  operation_status: { label: '生产运行情况', type: 'select', placeholder: '请选择生产运行情况', options: OPERATION_STATUS_OPTIONS },
  output: { label: '总产量（吨）', type: 'number', placeholder: '请输入总产量' },
  output_value: { label: '年总产值（万元）', type: 'number', placeholder: '请输入年总产值' },
  total_investment: { label: '年总投入（万元）', type: 'number', placeholder: '请输入年总投入' },
  has_treatment_facility: { label: '有无尾水处理设施', type: 'switch', placeholder: '' },
  treatment_method: { label: '尾水处理方式', type: 'select', placeholder: '请选择尾水处理方式', options: TREATMENT_METHOD_OPTIONS },
  treatment_facility_area: { label: '尾水处理设施面积(亩)', type: 'number', placeholder: '请输入尾水处理设施面积' },
  treated_discharge_volume: { label: '已完成尾水治理排放量(吨)', type: 'number', placeholder: '请输入已完成尾水治理排放量' },
  final_destination: { label: '养殖尾水最终去向', type: 'select', placeholder: '请选择养殖尾水最终去向', options: FINAL_DESTINATION_OPTIONS },
}

export const farmFormSchema = z.object({
  farm_name: z.string().min(1, '请输入养殖场(业主)名称'),
  address: z.string().optional(),
  longitude_latitude: z.string().optional(),
  responsible_person: z.string().optional(),
  contact_phone: z.string().optional(),
  pond_count: z.union([z.string(), z.null(), z.undefined()]),
  water_area_acre: z.union([z.string(), z.null(), z.undefined()]),
  farm_area_acre: z.union([z.string(), z.null(), z.undefined()]),
  other_water_area_sqm: z.union([z.string(), z.null(), z.undefined()]),
  other_farm_area_acre: z.union([z.string(), z.null(), z.undefined()]),
  avg_water_depth: z.union([z.string(), z.null(), z.undefined()]),
  main_species: z.string().optional(),
  farm_mode: z.string().optional(),
  operation_status: z.union([z.string(), z.null(), z.undefined()]),
  output: z.union([z.string(), z.undefined()]),
  output_value: z.union([z.string(), z.undefined()]),
  total_investment: z.union([z.string(), z.undefined()]),
  farm_images: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number().optional()
  })).nullable().optional(),
  has_treatment_facility: z.boolean().optional(),
  treatment_method: z.union([z.string(), z.null(), z.undefined()]),
  treatment_facility_area: z.union([z.string(), z.undefined()]),
  treated_discharge_volume: z.union([z.string(), z.undefined()]),
  final_destination: z.union([z.string(), z.null(), z.undefined()]),
  tail_water_images: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number().optional()
  })).nullable().optional(),
  safety_info: z.array(z.object({
    url: z.string(),
    name: z.string(),
    size: z.number().optional()
  })).nullable().optional(),
})

export type FarmFormData = z.infer<typeof farmFormSchema>
