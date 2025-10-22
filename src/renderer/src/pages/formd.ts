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

// 目标主流烟气
export const harmfulFields: FormFieldConfig[] = [
  { name: 'tar', label: '焦油', unit: 'mg/支' },
  { name: 'nicotine', label: '烟碱', unit: 'mg/支' },
  { name: 'co', label: 'CO', unit: 'mg/支' }
]

// 目标主流烟气
export const targetHarmfulFields: FormFieldConfig[] = [
  { name: 'tar', label: '目标焦油', unit: 'mg/支' },
  { name: 'nicotine', label: '目标烟碱', unit: 'mg/支' },
  { name: 'co', label: '目标CO', unit: 'mg/支' }
]

// 权重
export const harmfulWeightFields = [
  { name: 'tarWeight', label: '焦油权重', unit: '' },
  { name: 'nicotineWeight', label: '烟碱权重', unit: '' },
  { name: 'coWeight', label: 'CO权重', unit: '' }
]

// 个性化范围
export const rangeFields = [
  {
    name: 'filterVentilation',
    label: '滤嘴通风率',
    min: 0,
    max: 100,
    step: 5,
    defaultSection: [0, 100],
    unit: '%'
  },
  {
    name: 'filterPressureDrop',
    label: '滤棒压降',
    min: 2600,
    max: 5800,
    step: 200,
    defaultSection: [2600, 5800],
    unit: 'Pa'
  },
  {
    name: 'permeability',
    label: '卷烟纸透气度',
    min: 30,
    max: 80,
    step: 5,
    defaultSection: [30, 80],
    unit: 'CU'
  },
  {
    name: 'quantitative',
    label: '卷烟纸定量',
    min: 24,
    max: 36,
    step: 2,
    defaultSection: [24, 36],
    unit: 'g/m²'
  },
  {
    name: 'citrate',
    label: '卷烟纸阻燃剂含量',
    min: 0.2,
    max: 3,
    step: 0.4,
    defaultSection: [0.2, 3],
    unit: '%'
  }
]

// 统一导出
export default {
  baseMaterialFields,
  harmfulFields,
  targetHarmfulFields,
  harmfulWeightFields,
  rangeFields
}
