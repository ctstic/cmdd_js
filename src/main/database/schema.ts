import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

// 科研建模数据表
export const cigarettes = sqliteTable('cigarettes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull(), // 编号
  specimenName: text('specimen_name').notNull().unique(), // 样品名称
  filterVentilation: text('filter_ventilation').notNull(), // 滤嘴通风率
  filterPressureDrop: integer('filter_pressure_drop').notNull(), // 滤棒压降(Pa)
  permeability: text('permeability').notNull(), // 透气度/CU
  quantitative: text('quantitative').notNull(), // 定量 g/m2
  citrate: text('citrate').notNull(), // 柠檬酸根(设计值)
  potassiumRatio: text('potassium_ratio').notNull(), // 钾盐占比

  tar: text('tar').notNull(), // 焦油 mg/支
  nicotine: text('nicotine').notNull(), // 烟碱 mg/支
  co: text('co').notNull(), // CO mg/支

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
})

export const harmfulConstants = sqliteTable('harmful_constants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specimenName: text('specimen_name').notNull().unique(), // 建模数据样品名称
  type: text('type').notNull(), // 有害成分类型
  batchNo: text('batch_no').notNull(), // 批次号
  changliang: text('changliang').notNull(), //常量
  filterVentCoef: text('filter_vent_coef').notNull(), // 滤嘴通风率系数
  filterPressureCoef: text('filter_pressure_coef').notNull(), // 滤棒压降(Pa)系数
  permeabilityCoef: text('permeability_coef').notNull(), // 透气度/CU 系数
  quantitativeCoef: text('quantitative_coef').notNull(), // 定量 g/m2 系数
  citrateCoef: text('citrate_coef').notNull(), // 柠檬酸根(设计值)系数
  potassiumCoef: text('potassium_coef'), // 钾盐占比系数 todo 不做计算

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
})

// 基准卷烟辅材参数牌号
export const ramMark = sqliteTable('ram_mark', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mark: text('mark').notNull().unique(), // 牌号
  filterVentilation: text('filter_ventilation').notNull(), // 滤嘴通风率
  filterPressureDrop: integer('filter_pressure_drop').notNull(), // 滤棒压降(Pa)
  permeability: text('permeability').notNull(), // 透气度/CU
  quantitative: text('quantitative').notNull(), // 定量 g/m2
  citrate: text('citrate').notNull(), // 柠檬酸根(设计值)

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
})

// 基准卷烟主流烟气牌号
export const rfgMark = sqliteTable('rfg_mark', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mark: text('mark').notNull().unique(), // 牌号
  tar: text('tar').notNull(), // 焦油 mg/支
  nicotine: text('nicotine').notNull(), // 烟碱 mg/支
  co: text('co').notNull(), // CO mg/支

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
})

// 卷烟主流烟气仿真预测保存
export const simulationPredictionSave = sqliteTable('simulation_rediction_save', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specimenName: text('specimen_name').notNull().unique(), // 建模数据样品名称
  filterVentilation: text('filter_ventilation').notNull(), // 基准滤嘴通风率
  filterPressureDrop: integer('filter_pressure_drop').notNull(), // 基准滤棒压降(Pa)
  permeability: text('permeability').notNull(), // 基准透气度/CU
  quantitative: text('quantitative').notNull(), // 基准定量 g/m2
  citrate: text('citrate').notNull(), // 基准柠檬酸根(设计值)

  tar: text('tar').notNull(), //基准 焦油 mg/支
  nicotine: text('nicotine').notNull(), //基准 烟碱 mg/支
  co: text('co').notNull(), //基准 CO mg/支
  // 预测x 和 y 值
  profile: text('profile', { mode: 'json' }).notNull().default({}),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
})

// 推荐辅材参数保存
export const recAuxMaterialsSave = sqliteTable('rec_aux_materials_save', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specimenName: text('specimen_name').notNull().unique(), // 建模数据样品名称
  recommendNumber: text('recommend_number').notNull(), // 生成推荐数量
  filterVentilation: text('filter_ventilation').notNull(), // 基准滤嘴通风率
  filterPressureDrop: integer('filter_pressure_drop').notNull(), // 基准滤棒压降(Pa)
  permeability: text('permeability').notNull(), // 基准透气度/CU
  quantitative: text('quantitative').notNull(), // 基准定量 g/m2
  citrate: text('citrate').notNull(), // 基准柠檬酸根(设计值)

  tar: text('tar').notNull(), // 基准焦油 mg/支
  nicotine: text('nicotine').notNull(), //基准 烟碱 mg/支
  co: text('co').notNull(), //基准 CO mg/支

  targetTar: text('target_tar').notNull(), // 目标焦油 mg/支
  targetNicotine: text('target_nicotine').notNull(), //目标 烟碱 mg/支
  targetCo: text('target_co').notNull(), //目标 CO mg/支

  tarWeight: text('tar_weight').notNull(), // 目标焦油权重 mg/支
  nicotineWeight: text('nicotine_weight').notNull(), //目标 烟碱权重 mg/支
  coWeight: text('co_weight').notNull(), //目标 CO权重 mg/支

  filterVentilationRanger: text('filter_ventilation_ranger').notNull(), // 基准滤嘴通风率
  filterPressureDropRanger: text('filter_pressure_drop_ranger').notNull(), // 基准滤棒压降(Pa)
  permeabilityRanger: text('permeability_ranger').notNull(), // 基准透气度/CU
  quantitativeRanger: text('quantitative_ranger').notNull(), // 基准定量 g/m2
  citrateRanger: text('citrate_ranger').notNull(), // 基准柠檬酸根(设计值)

  // 预测x 和 y 值
  profile: text('profile', { mode: 'json' }).notNull().default({}),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
})

// 🚬 卷烟检测结果表
export const insertCigaretteSchema = createInsertSchema(cigarettes)
export const selectCigaretteSchema = createSelectSchema(cigarettes)

// ⚗️ 有害成分系数表
export const insertHarmfulConstantSchema = createInsertSchema(harmfulConstants)
export const selectHarmfulConstantSchema = createSelectSchema(harmfulConstants)

// 导出类型
export type Cigarettes = typeof cigarettes.$inferSelect
export type HarmfulConstants = typeof harmfulConstants.$inferSelect
export type RamMark = typeof ramMark.$inferSelect
export type RfgMark = typeof rfgMark.$inferSelect
export type SimulationPredictionSave = typeof simulationPredictionSave.$inferSelect
export type RecAuxMaterialsSave = typeof recAuxMaterialsSave.$inferSelect

/**
 * Excel列名映射配置
 */
export interface ExcelColumnMapping {
  编号: string
  滤嘴通风率: string
  滤棒压降: string
  透气度: string
  定量: string
  柠檬酸根: string
  钾盐占比: string
  焦油: string
  烟碱: string
  CO: string
}

export interface ExcelRowData {
  编号: string
  滤嘴通风率: string
  滤棒压降: string
  透气度: string
  定量: string
  柠檬酸根: string
  钾盐占比: string
  焦油: string
  烟碱: string
  CO: string
}
/**
 * 导入结果统计
 */
export interface ImportResult {
  success: boolean
  totalRows: number
  successRows: number
  failedRows: number
  errors: string[]
  batchNo?: string
}

export interface PredictionParams {
  // x
  key: string // 索引
  filterVentilation: string // 滤嘴通风率预测参数
  filterPressureDrop: string // 滤棒压降预测参数
  permeability: string // 透气度预测参数
  quantitative: string // 定量预测参数
  citrate: string // 柠檬酸根预测参数
}

export interface PredictionResults {
  // y
  key: string // 索引
  tar: string // 焦油预测参数
  nicotine: string // 烟碱预测参数
  co: string // CO预测参数
}

export interface StandardParams {
  key: string // 索引
  // x
  filterVentilation: string // 滤嘴通风率基准参数
  filterPressureDrop: string // 滤棒压降基准参数
  permeability: string // 透气度基准参数
  quantitative: string // 定量基准参数
  citrate: string // 柠檬酸根基准参数
  // y
  tar: string // 焦油基准参数
  nicotine: string // 烟碱基准参数
  co: string // CO基准参数
}

export interface TargetParams {
  // y
  tar: string // 焦油目标参数
  nicotine: string // 烟碱目标参数
  co: string // CO目标参数
  tarWeight: string // 焦油预测参数权重
  nicotineWeight: string // 烟碱预测参数权重
  coWeight: string // CO预测参数权重
}

export interface StandardDesignRangeParams {
  filterVentilation: [number, number] // [最小值, 最大值]
  filterPressureDrop: [number, number]
  permeability: [number, number]
  quantitative: [number, number]
  citrate: [number, number]
}

// --------------仿真预测--------------------
export class ScientificDataDto {
  specimenName: string = ''
  standardParams: StandardParams = {
    key: '',
    filterVentilation: '',
    filterPressureDrop: '',
    permeability: '',
    quantitative: '',
    citrate: '',
    tar: '',
    nicotine: '',
    co: ''
  } // 基准参数x+y
  predictionParams: StandardParams[] = [] // 预测x参数数组
  constructor(data: Partial<ScientificDataDto> = {}) {
    Object.assign(this, data)
  }
}

export class ScientificDataVo {
  PredictionResults: PredictionResults[] = [] // 预测结果y数组
  constructor(data: Partial<ScientificDataVo> = {}) {
    Object.assign(this, data)
  }
}

// --------------推荐辅材参数--------------------
export class AuxMaterialsDto {
  count: number = 100 // 生成数量
  specimenName: string = '' // 样品名称
  standardParams: StandardParams = {
    key: '',
    filterVentilation: '',
    filterPressureDrop: '',
    permeability: '',
    quantitative: '',
    citrate: '',
    tar: '',
    nicotine: '',
    co: ''
  } // 基准参数x+y

  targetParams: TargetParams = {
    tar: '',
    nicotine: '',
    co: '',
    tarWeight: '',
    nicotineWeight: '',
    coWeight: ''
  } // 目标参数y和权重
  standardDesignParams: StandardDesignRangeParams = {
    filterVentilation: [0.2, 0.8],
    filterPressureDrop: [3400, 5800],
    permeability: [40, 80],
    quantitative: [24, 36],
    citrate: [0.006, 0.022]
  } // 设计值范围
  recommendedValue: StandardParams[] = [] // 推荐值
  constructor(data: Partial<AuxMaterialsDto> = {}) {
    Object.assign(this, data)
  }
}

export class AuxMaterialsVo {
  PredictionResults: PredictionResults[] = [] // 预测结果y数组
  constructor(data: Partial<ScientificDataVo> = {}) {
    Object.assign(this, data)
  }
}

// 默认卷烟数据
export const defaultCigarettes: Omit<Cigarettes, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    code: 'M06',
    filterVentilation: '0.409',
    filterPressureDrop: 4318,
    permeability: '71.2',
    quantitative: '27.8',
    citrate: '0.022',
    potassiumRatio: '1.0',
    tar: '6.88201061090464',
    nicotine: '0.592059469957721',
    co: '3.933',
    specimenName: '多因素数据'
  },
  {
    code: 'S0-2',
    filterVentilation: '0.39',
    filterPressureDrop: 4272,
    permeability: '71.2',
    quantitative: '27.8',
    citrate: '0.022',
    potassiumRatio: '1.0',
    tar: '6.938704055407103',
    nicotine: '0.606108118323836',
    co: '3.8686666666666665',
    specimenName: '多因素数据'
  },
  {
    code: 'M17',
    filterVentilation: '0.385',
    filterPressureDrop: 4313,
    permeability: '71.2',
    quantitative: '27.8',
    citrate: '0.022',
    potassiumRatio: '1.0',
    tar: '6.88008538346379',
    nicotine: '0.609073072643856',
    co: '3.756',
    specimenName: '多因素数据'
  },
  {
    code: 'M01',
    filterVentilation: '0.218',
    filterPressureDrop: 3868,
    permeability: '41.3',
    quantitative: '25.4',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '9.674505032200457',
    nicotine: '0.815132110493353',
    co: '5.636',
    specimenName: '多因素数据'
  },
  {
    code: 'M02',
    filterVentilation: '0.202',
    filterPressureDrop: 3868,
    permeability: '72.0',
    quantitative: '28.4',
    citrate: '0.009',
    potassiumRatio: '1.0',
    tar: '9.997684233415136',
    nicotine: '0.865028902966716',
    co: '5.823',
    specimenName: '多因素数据'
  },
  {
    code: 'M03',
    filterVentilation: '0.21',
    filterPressureDrop: 4272,
    permeability: '60.6',
    quantitative: '25.1',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '9.215296359953719',
    nicotine: '0.775943255261382',
    co: '5.463',
    specimenName: '多因素数据'
  },
  {
    code: 'M04',
    filterVentilation: '0.197',
    filterPressureDrop: 4272,
    permeability: '72.1',
    quantitative: '26.7',
    citrate: '0.013',
    potassiumRatio: '0.7',
    tar: '9.31756726622841',
    nicotine: '0.8167436773038',
    co: '5.663',
    specimenName: '多因素数据'
  },
  {
    code: 'M05',
    filterVentilation: '0.192',
    filterPressureDrop: 4567,
    permeability: '61.2',
    quantitative: '29.2',
    citrate: '0.009',
    potassiumRatio: '0.7',
    tar: '9.149617470030904',
    nicotine: '0.786067169007716',
    co: '6.168',
    specimenName: '多因素数据'
  },
  {
    code: 'M07',
    filterVentilation: '0.198',
    filterPressureDrop: 5313,
    permeability: '82.6',
    quantitative: '25.6',
    citrate: '0.013',
    potassiumRatio: '0.4',
    tar: '8.509333466002252',
    nicotine: '0.721069145805097',
    co: '5.26',
    specimenName: '多因素数据'
  },
  {
    code: 'M08',
    filterVentilation: '0.209',
    filterPressureDrop: 5831,
    permeability: '81.3',
    quantitative: '32.8',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '7.306653745974666',
    nicotine: '0.72',
    co: '4.957',
    specimenName: '多因素数据'
  },
  {
    code: 'M09',
    filterVentilation: '0.412',
    filterPressureDrop: 3868,
    permeability: '40.8',
    quantitative: '28.9',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '7.66383548276469',
    nicotine: '0.647240885555945',
    co: '4.822',
    specimenName: '多因素数据'
  },
  {
    code: 'M10',
    filterVentilation: '0.418',
    filterPressureDrop: 3868,
    permeability: '41.3',
    quantitative: '25.4',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '8.19047357664283',
    nicotine: '0.695278220014253',
    co: '5.005',
    specimenName: '多因素数据'
  },
  {
    code: 'M11',
    filterVentilation: '0.403',
    filterPressureDrop: 4272,
    permeability: '49.5',
    quantitative: '25.1',
    citrate: '0.017',
    potassiumRatio: '0.7',
    tar: '7.92308022967455',
    nicotine: '0.675122517473582',
    co: '4.43',
    specimenName: '多因素数据'
  },
  {
    code: 'M12',
    filterVentilation: '0.403',
    filterPressureDrop: 4272,
    permeability: '50.3',
    quantitative: '26.5',
    citrate: '0.013',
    potassiumRatio: '0.7',
    tar: '7.854320281800892',
    nicotine: '0.693163143971973',
    co: '5.085',
    specimenName: '多因素数据'
  },
  {
    code: 'M13',
    filterVentilation: '0.405',
    filterPressureDrop: 4567,
    permeability: '61.2',
    quantitative: '29.2',
    citrate: '0.009',
    potassiumRatio: '0.7',
    tar: '7.628771884217969',
    nicotine: '0.686848628901918',
    co: '5.097',
    specimenName: '多因素数据'
  },
  {
    code: 'M14',
    filterVentilation: '0.405',
    filterPressureDrop: 5831,
    permeability: '61.0',
    quantitative: '29.1',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '6.345643373836174',
    nicotine: '0.563184987802125',
    co: '4.157',
    specimenName: '多因素数据'
  },
  {
    code: 'M15',
    filterVentilation: '0.403',
    filterPressureDrop: 5313,
    permeability: '72.0',
    quantitative: '28.4',
    citrate: '0.009',
    potassiumRatio: '1.0',
    tar: '7.248698664876443',
    nicotine: '0.674180501076417',
    co: '4.57',
    specimenName: '多因素数据'
  },
  {
    code: 'M16',
    filterVentilation: '0.408',
    filterPressureDrop: 5313,
    permeability: '81.7',
    quantitative: '25.4',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '6.352876838382236',
    nicotine: '0.608168073355355',
    co: '4.032',
    specimenName: '多因素数据'
  },
  {
    code: 'M18',
    filterVentilation: '0.612',
    filterPressureDrop: 3868,
    permeability: '81.7',
    quantitative: '25.4',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '5.1228826543437975',
    nicotine: '0.520369657852149',
    co: '2.795',
    specimenName: '多因素数据'
  },
  {
    code: 'M19',
    filterVentilation: '0.613',
    filterPressureDrop: 4272,
    permeability: '50.3',
    quantitative: '26.5',
    citrate: '0.013',
    potassiumRatio: '0.7',
    tar: '5.8690127846242595',
    nicotine: '0.54746721449634',
    co: '3.325',
    specimenName: '多因素数据'
  },
  {
    code: 'M20',
    filterVentilation: '0.616',
    filterPressureDrop: 4272,
    permeability: '40.5',
    quantitative: '28.0',
    citrate: '0.017',
    potassiumRatio: '0.55',
    tar: '5.965465083834044',
    nicotine: '0.548135434935723',
    co: '3.443',
    specimenName: '多因素数据'
  },
  {
    code: 'M21',
    filterVentilation: '0.626',
    filterPressureDrop: 4567,
    permeability: '49.3',
    quantitative: '28.6',
    citrate: '0.013',
    potassiumRatio: '1.0',
    tar: '5.399943558248553',
    nicotine: '0.537133848549752',
    co: '3.028',
    specimenName: '多因素数据'
  },
  {
    code: 'M22',
    filterVentilation: '0.592',
    filterPressureDrop: 5831,
    permeability: '62.3',
    quantitative: '32.7',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '4.571090431224639',
    nicotine: '0.365804776022978',
    co: '2.947',
    specimenName: '多因素数据'
  },
  {
    code: 'M23',
    filterVentilation: '0.625',
    filterPressureDrop: 5313,
    permeability: '40.1',
    quantitative: '32.8',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '5.126457006211051',
    nicotine: '0.361009592202934',
    co: '2.998',
    specimenName: '多因素数据'
  },
  {
    code: 'M24',
    filterVentilation: '0.587',
    filterPressureDrop: 5313,
    permeability: '82.4',
    quantitative: '28.9',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '4.5',
    nicotine: '0.348800321459478',
    co: '2.606',
    specimenName: '多因素数据'
  },
  {
    code: 'M25',
    filterVentilation: '0.796',
    filterPressureDrop: 5831,
    permeability: '40.5',
    quantitative: '28.0',
    citrate: '0.017',
    potassiumRatio: '0.55',
    tar: '2.8237359432941567',
    nicotine: '0.295820398780028',
    co: '2.8',
    specimenName: '多因素数据'
  },
  {
    code: 'M26',
    filterVentilation: '0.787',
    filterPressureDrop: 5831,
    permeability: '40.1',
    quantitative: '32.8',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '2.557585353879815',
    nicotine: '0.269260611304518',
    co: '1.437',
    specimenName: '多因素数据'
  },
  {
    code: 'M27',
    filterVentilation: '0.752',
    filterPressureDrop: 4272,
    permeability: '49.3',
    quantitative: '28.6',
    citrate: '0.013',
    potassiumRatio: '1.0',
    tar: '4.023923312191393',
    nicotine: '0.416046166094955',
    co: '1.973',
    specimenName: '多因素数据'
  },
  {
    code: 'M28',
    filterVentilation: '0.746',
    filterPressureDrop: 4272,
    permeability: '60.6',
    quantitative: '25.1',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '3.4209890720373504',
    nicotine: '0.363008253199657',
    co: '1.674',
    specimenName: '多因素数据'
  },
  {
    code: 'M29',
    filterVentilation: '0.777',
    filterPressureDrop: 4567,
    permeability: '62.3',
    quantitative: '32.7',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '2.34241198112558',
    nicotine: '0.251138743400015',
    co: '1.077',
    specimenName: '多因素数据'
  },
  {
    code: 'M30',
    filterVentilation: '0.785',
    filterPressureDrop: 4567,
    permeability: '72.1',
    quantitative: '26.7',
    citrate: '0.013',
    potassiumRatio: '0.7',
    tar: '3.210149103172675',
    nicotine: '0.330165571538312',
    co: '1.319',
    specimenName: '多因素数据'
  },
  {
    code: 'M31',
    filterVentilation: '0.788',
    filterPressureDrop: 5313,
    permeability: '82.4',
    quantitative: '28.9',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '2.360327423327017',
    nicotine: '0.283321968957196',
    co: '1.127',
    specimenName: '多因素数据'
  },
  {
    code: 'M32',
    filterVentilation: '0.793',
    filterPressureDrop: 5313,
    permeability: '81.3',
    quantitative: '32.8',
    citrate: '0.022',
    potassiumRatio: '0.7',
    tar: '1.983006386758969',
    nicotine: '0.245775244556189',
    co: '0.956',
    specimenName: '多因素数据'
  }
]
