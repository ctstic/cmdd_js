// 定义字段接口
export interface FormFieldConfig {
  name: string
  label: string
  unit?: string
}

// 基准卷烟辅材参数
export const baseMaterialFields: FormFieldConfig[] = [
  { name: 'filterVentilation', label: '滤嘴通风率', unit: '%' },
  { name: 'filterPressureDrop', label: '滤棒压降', unit: 'Pa' },
  { name: 'permeability', label: '卷烟纸透气度', unit: 'CU' },
  { name: 'quantitative', label: '卷烟纸定量', unit: 'g/m²' },
  { name: 'citrate', label: '卷烟纸阻燃剂含量', unit: '%' }
]

// 基准卷烟有害成分
export const harmfulFields: FormFieldConfig[] = [
  { name: 'tar', label: '焦油', unit: 'mg/支' },
  { name: 'nicotine', label: '烟碱', unit: 'mg/支' },
  { name: 'co', label: 'CO', unit: 'mg/支' }
]

// 统一导出（可选）
export default {
  baseMaterialFields,
  harmfulFields
}
