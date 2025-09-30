import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Form,
  Button,
  message,
  Slider,
  Table,
  InputNumber,
  Empty,
  Flex,
  Space,
  Select
} from 'antd'
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalculatorOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { createStyles } from 'antd-style'
import HistoryModal from './HistoryModal'
import BrandNameModal from '../SimulatingForecast/BrandNameModal'

const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `
  }
})
const { Title, Text } = Typography

const style = {
  headerGradient: {
    background: 'linear-gradient(135deg, #1890ff 0%, #a3dcff 100%)'
  },
  cardHeader: {
    background: 'linear-gradient(90deg, #a3dcff 0%, #ffffff 100%)',
    padding: '12px 16px',
    borderRadius: '12px 12px 0 0',
    borderBottom: '2px solid #a3dcff'
  }
}

interface DataType {
  id: number
  code: string
  filterVentilation: string
  filterPressureDrop: number
  permeability: string
  quantitative: string
  citrate: string
  potassiumRatio: string
  co: string
  nicotine: string
  tar: string
}

// 第三步滑块组件
const RangeSliders = ({ fields, form }) => {
  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.defaultSection
    return acc
  }, {})

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      <Flex gap={20} style={{ width: '100%' }}>
        {fields.map((field) => (
          <div
            key={field.name}
            style={{
              padding: '16px',
              background: 'rgba(82, 196, 26, 0.05)',
              borderRadius: '8px',
              border: '1px solid #e8f5e6',
              // height: '100%',
              width: '20%'
            }}
          >
            <Form.Item
              name={field.name}
              label={
                <Text strong style={{ color: '#262626', marginBottom: 0 }}>
                  {field.label}
                  {field.unit ? `(${field.unit})` : ''}&nbsp;&nbsp; 步长值{field.step}
                </Text>
              }
              style={{ margin: 0 }}
            >
              <Slider
                range
                value={form.getFieldValue(field.name)} // 获取当前值
                onChange={(value) => form.setFieldsValue({ [field.name]: value })} // 更新表单值
                min={field.min}
                max={field.max}
                defaultValue={field.defaultSection}
                step={field.step}
                tooltip={{
                  formatter: (value) => `${value}` + `${field.unit ? `(${field.unit})` : ''} `
                }}
                style={{ margin: 0 }}
              />
            </Form.Item>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 0,
                fontSize: '12px',
                color: '#8c8c8c'
              }}
            >
              <span>最小值</span>
              <span>最大值</span>
            </div>
          </div>
        ))}
      </Flex>
    </Form>
  )
}

// 可复用的卡片组件
const StyledCard = ({ title, icon, children, color = '#1890ff', style = {}, mark = '' }) => {
  const cardHeaderStyle = {
    background: `linear-gradient(90deg, ${color}20 0%, #ffffff 100%)`,
    padding: '10px 24px',
    borderRadius: '12px 12px 0 0',
    borderBottom: `2px solid ${color}40`
  }
  const markStyle = {
    background: `${color}15`,
    color: 'red',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '4px',
    marginLeft: '8px'
  }
  return (
    <Card
      style={{
        marginBottom: 15,
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: `1px solid ${color}30`,
        ...style
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={cardHeaderStyle}>
        {React.cloneElement(icon, {
          style: { marginRight: 12, color: color, fontSize: '18px' }
        })}
        <Text strong style={{ fontSize: '18px', color: color }}>
          {title}
        </Text>
        {mark && <span style={markStyle}>{mark}</span>}
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </Card>
  )
}

const RecommendParameter: React.FC = () => {
  const [baseForm] = Form.useForm()
  const [targetForm] = Form.useForm()
  const [weightForm] = Form.useForm()
  const [rangeForm] = Form.useForm()
  const [tableData, setTableData] = useState<DataType[]>([])
  const [messageApi, contextHolder] = message.useMessage()
  const { styles } = useStyle()
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false)
  const [historyData, setHistoryData] = useState<[]>([])
  const [brandNameOpen, setBrandNameOpen] = useState<boolean>(false)
  const [brandNameSmokeOpen, setBrandNameSmokeOpen] = useState<boolean>(false)
  const [brandNameOption, setBrandNameOption] = useState<{ label: string; value: string }[]>([])
  const [brandNameSmokeOption, setBrandNameSmokeOption] = useState<
    { label: string; value: string }[]
  >([])
  const [brandNameData, setBrandNameData] = useState<any>([])
  const [brandNameSmokeData, setBrandNameSmokeData] = useState<object>({})
  const [typeData, setTypeData] = useState<{ label: string; value: string }[]>([])
  const [selectType, setSelectType] = useState<string>('')

  // 第一  二步输入框
  const FormFieldGroup = ({
    fields,
    form,
    layout = 'vertical',
    cols,
    defaultValue,
    brandName,
    type
  }) => {
    return (
      <Form form={form} layout={layout} initialValues={{ size: 30 }}>
        <Row gutter={[24, 16]}>
          {fields.map((field) => (
            <Col xs={24} sm={24} md={cols} key={field.name}>
              <Form.Item
                style={{ marginBottom: field.name === 'size' ? 10 : 0 }}
                initialValue={defaultValue === undefined ? '' : defaultValue}
                required={true}
                name={field.name}
                label={
                  <Text strong style={{ color: '#262626', marginBottom: 8, display: 'block' }}>
                    {field.label}
                    {field.unit ? `(${field.unit})` : ''}
                  </Text>
                }
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={field.unit === '%' ? 100 : undefined}
                  step={field.name === 'size' ? 1 : 0.01}
                  precision={field.name === 'size' ? 0 : 2}
                  placeholder={`请输入${field.label}`}
                />
              </Form.Item>
            </Col>
          ))}
          {brandName && (
            <Col xs={24} sm={24} md={cols}>
              <Form.Item
                name=""
                label={
                  <Text strong style={{ color: '#262626', marginBottom: 8, display: 'block' }}>
                    牌号名称
                  </Text>
                }
              >
                <Flex gap={8} align="flex-end">
                  <Select
                    showSearch
                    placeholder="请选择牌号名称"
                    optionFilterProp="label"
                    onChange={(value) => {
                      if (type == 1) {
                        brandNameData.map((item) => {
                          if (value === item.mark) {
                            baseForm.setFieldsValue({
                              filterVentilation: item.filterVentilation,
                              filterPressureDrop: item.filterPressureDrop,
                              permeability: item.permeability,
                              quantitative: item.quantitative,
                              citrate: item.citrate
                            })
                          }
                        })
                      } else {
                        brandNameSmokeData.map((item) => {
                          if (value === item.mark) {
                            baseForm.setFieldsValue({
                              tar: item.tar,
                              co: item.co,
                              nicotine: item.nicotine
                            })
                          }
                        })
                      }
                    }}
                    // onSearch={onSearch}
                    options={type == 1 ? brandNameOption : brandNameSmokeOption}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      if (type == 1) {
                        setBrandNameOpen(true)
                      } else {
                        setBrandNameSmokeOpen(true)
                      }
                    }}
                  >
                    保存
                  </Button>
                </Flex>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    )
  }

  const handleBrandName = async (): Promise<void> => {
    try {
      const optionData = await window.electronAPI.ramMark.query('')
      setBrandNameData(optionData.data)
      setBrandNameOption(
        optionData.data.map((item) => ({ label: item.mark, value: item.mark })) || []
      )
      // console.log(optionData, 'bb')
    } catch {
      info('error', '网络错误！')
    }
  }

  const handleBrandNameSmoke = async (): Promise<void> => {
    try {
      const smokeOptionData = await window.electronAPI.rfgMark.query('')
      setBrandNameSmokeData(smokeOptionData.data)
      setBrandNameSmokeOption(
        smokeOptionData.data.map((item) => ({ label: item.mark, value: item.mark })) || []
      )
      // console.log(smokeOptionData, 'aa')
    } catch {
      info('error', '网络错误！')
    }
  }

  const handleTypeData = async (): Promise<void> => {
    try {
      const typeData = await window.electronAPI.cigarettes.getCigarettesType('')
      setTypeData(typeData.data.map((item) => ({ label: item, value: item })) || [])
    } catch {
      info('error', '网络错误！')
    }
  }

  useEffect(() => {
    handleBrandName()
    handleBrandNameSmoke()
    handleTypeData()
  }, [])

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  // 基准卷烟辅材参数数据
  const baseMaterialFields = [
    { name: 'filterVentilation', label: '滤嘴通风率', unit: '%' },
    { name: 'filterPressureDrop', label: '滤棒压降', unit: 'Pa' },
    { name: 'permeability', label: '透气度', unit: 'CU' },
    { name: 'quantitative', label: '定量', unit: 'g/m²' },
    { name: 'citrate', label: '柠檬酸根(含量)', unit: '%' }
  ]

  // 基准卷烟主流烟气数据
  const harmfulFields = [
    { name: 'tar', label: '焦油', unit: 'mg/支' },
    { name: 'nicotine', label: '烟碱', unit: 'mg/支' },
    { name: 'co', label: 'CO', unit: 'mg/支' }
  ]

  const harmfulWeightFields = [
    { name: 'tarWeight', label: '焦油权重', unit: '' },
    { name: 'nicotineWeight', label: '烟碱权重', unit: '' },
    { name: 'coWeight', label: 'CO权重', unit: '' }
  ]

  const rangeFields = [
    {
      name: 'filterVentilation',
      label: '滤嘴通风率',
      min: 0,
      max: 100,
      step: 5,
      defaultSection: [20, 80],
      unit: '%'
    },
    {
      name: 'filterPressureDrop',
      label: '滤棒压降',
      min: 2600,
      max: 5800,
      step: 200,
      defaultSection: [3400, 5800],
      unit: 'Pa'
    },
    {
      name: 'permeability',
      label: '透气度',
      min: 30,
      max: 80,
      step: 5,
      defaultSection: [40, 80],
      unit: 'CU'
    },
    {
      name: 'quantitative',
      label: '定量',
      min: 24,
      max: 36,
      step: 2,
      defaultSection: [24, 36],
      unit: 'g/m²'
    },
    {
      name: 'citrate',
      label: '柠檬酸根(含量)',
      min: 0.2,
      max: 3,
      step: 0.4,
      defaultSection: [0.6, 2.2],
      unit: '%'
    }
  ]

  const handleSubmit = async () => {
    // 获取每一步表单的所有值
    const baseValues = baseForm.getFieldsValue(true)
    const targetValues = targetForm.getFieldsValue(true)
    const weightValues = weightForm.getFieldsValue(true)
    const rangeValues = rangeForm.getFieldsValue(true)

    // // 打印所有表单的值
    console.log('基准卷烟辅材参数:', baseValues)
    // console.log('目标主流烟气:', targetValues)
    // console.log('成分权重设置:', weightValues)
    // console.log('辅材参数个性化设计范围:', rangeValues)

    if (Object.keys(baseValues).length !== 9) {
      info('warning', '请正确输入基准参数')
    } else if (Object.keys(targetValues).length !== 4) {
      info('warning', '请正确输入目标主流烟气')
    } else if (Object.keys(weightValues).length !== 4) {
      info('warning', '请正确输入成分权重设置')
    } else if (
      weightForm.getFieldValue('coWeight') +
        weightForm.getFieldValue('nicotineWeight') +
        weightForm.getFieldValue('tarWeight') >
      1
    ) {
      info('warning', '主流烟气权重之和不大于1')
    } else {
      const res = await window.electronAPI.rec.auxMaterials({
        count: rangeValues.size,
        specimenName: selectType,
        standardParams: baseValues,
        targetParams: { ...targetValues, ...weightValues },
        standardDesignParams: rangeValues
      })

      if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // 数据更新
        const transformedData = res.data.data.map((item, index) => ({
          id: index,
          filterVentilation: item.designParams.filterVentilation,
          filterPressureDrop: item.designParams.filterPressureDrop,
          permeability: item.designParams.permeability,
          quantitative: item.designParams.quantitative,
          citrate: item.designParams.citrate,
          tar: item.designParams.tar,
          nicotine: item.designParams.nicotine,
          co: item.designParams.co,
          prediction: item.prediction
        }))
        setTableData(transformedData)
        console.log(transformedData, 'transformedData')

        // baseForm.resetFields()
        // targetForm.resetFields()
        // weightForm.resetFields()
        message.success('参数推荐完成！')
      } else {
        message.error(`${res.data.errors}`)
      }
    }
  }

  // 用来计算百分比变化的函数
  const calculatePercentageChange = (prediction: number, originalValue: number) => {
    const diff = ((prediction / originalValue - 1) * 100).toFixed(2)
    return parseFloat(diff)
  }

  // 渲染箭头和百分比
  const renderArrow = (percentageChange: number) => {
    if (isNaN(percentageChange)) return null
    return percentageChange > 0 ? (
      <span style={{ color: 'green' }}>
        <ArrowUpOutlined /> {Math.abs(percentageChange)}%
      </span>
    ) : (
      <span style={{ color: 'red' }}>
        <ArrowDownOutlined /> {Math.abs(percentageChange)}%
      </span>
    )
  }

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '滤嘴通风率',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
    },
    {
      title: '滤棒压降 (Pa)',
      dataIndex: 'filterPressureDrop'
    },
    {
      title: '透气度 (CU)',
      dataIndex: 'permeability'
    },
    {
      title: '定量 (g/m²)',
      dataIndex: 'quantitative'
    },
    {
      title: '柠檬酸根 (含量)',
      dataIndex: 'citrate',
      render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
    },
    {
      title: '焦油',
      dataIndex: 'tar',
      render: (_, record) => {
        const tarPercentageChange = calculatePercentageChange(record.prediction[2], record.tar)
        return (
          <span style={{ color: record?.tar ? '#52c41a' : 'gray' }}>
            {record.prediction[2].toFixed(2)}
            {renderArrow(tarPercentageChange)}
          </span>
        )
      }
    },
    {
      title: '烟碱',
      dataIndex: 'nicotine',
      render: (_, record) => {
        const nicotinePercentageChange = calculatePercentageChange(
          record.prediction[1],
          record.nicotine
        )
        return (
          <span style={{ color: record?.nicotine ? '#52c41a' : 'gray' }}>
            {record.prediction[1].toFixed(2)}
            {renderArrow(nicotinePercentageChange)}
          </span>
        )
      }
    },
    {
      title: 'CO',
      dataIndex: 'co',
      render: (_, record) => {
        const coPercentageChange = calculatePercentageChange(record.prediction[0], record.co)

        return (
          <span style={{ color: record?.co ? '#52c41a' : 'gray' }}>
            {record.prediction[0].toFixed(2)}
            {renderArrow(coPercentageChange)}
          </span>
        )
      }
    }
  ]

  return (
    <div style={{ minHeight: 'calc(100vh - 145px)' }}>
      {contextHolder}
      <Card
        style={{
          marginBottom: 20,
          ...style.headerGradient,
          color: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 20px rgba(24, 144, 255, 0.3)',
          border: 'none'
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 700 }}>
          <CalculatorOutlined style={{ marginRight: 16, fontSize: '32px' }} />
          卷烟辅材参数推荐系统
        </Title>
        <Text
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '18px',
            display: 'block',
            marginTop: '8px'
          }}
        >
          <LineChartOutlined style={{ marginRight: 8 }} />
          基于多维数据的智能化推荐辅材参数
        </Text>
      </Card>
      <Flex align="center" justify="start" gap={2}>
        <span style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>请选择类型：</span>
        <Select
          style={{
            marginBottom: '10px',
            minWidth: '200px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          showSearch
          placeholder="请选择类型"
          optionFilterProp="label"
          options={typeData}
          allowClear
          onChange={(value) => {
            setSelectType(value)
          }}
          value={selectType}
          dropdownStyle={{ borderRadius: '8px' }}
        />
      </Flex>
      <Row gutter={[24, 16]}>
        <Col xs={16} md={8}>
          <StyledCard title="基准卷烟主流烟气" icon={<SafetyCertificateOutlined />}>
            <FormFieldGroup
              fields={harmfulFields}
              form={baseForm}
              cols={8}
              defaultValue={undefined}
              brandName={true}
              type={2}
            />
          </StyledCard>
          <StyledCard title="目标主流烟气" icon={<SafetyCertificateOutlined />} color="#fa8c16">
            <FormFieldGroup
              fields={harmfulFields}
              form={targetForm}
              cols={8}
              defaultValue={undefined}
              brandName={false}
              type={0}
            />
          </StyledCard>
          <StyledCard
            title="主流烟气权重设置"
            icon={<ExperimentOutlined />}
            mark="主流烟气权重之和不大于1"
            color="#fa8c16"
          >
            <FormFieldGroup
              fields={harmfulWeightFields}
              form={weightForm}
              cols={8}
              defaultValue={0.33}
              brandName={false}
              type={0}
            />
          </StyledCard>
        </Col>
        <Col xs={32} md={16}>
          <StyledCard title="基准卷烟辅材参数" icon={<ExperimentOutlined />}>
            <FormFieldGroup
              fields={baseMaterialFields}
              form={baseForm}
              cols={6}
              defaultValue={undefined}
              brandName={true}
              type={1}
            />
          </StyledCard>
          <StyledCard
            title="辅材参数个性化设计范围"
            icon={<SafetyCertificateOutlined />}
            color="#52c41a"
          >
            <FormFieldGroup
              fields={[{ name: 'size', label: '生成推荐数量', unit: '条' }]}
              form={rangeForm}
              cols={5}
              defaultValue={undefined}
              brandName={false}
              type={0}
            />
            <RangeSliders fields={rangeFields} form={rangeForm} />

            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: '#f6ffed',
                borderRadius: 8,
                border: '1px dashed #b7eb8f'
              }}
            >
              <Text type="secondary">
                提示：拖动滑块设置各参数的可调整范围，系统将在此范围内为您推荐最优参数组合。
              </Text>
            </div>
          </StyledCard>
        </Col>
      </Row>

      <StyledCard title="推荐辅材参数表格" icon={<SafetyCertificateOutlined />} color="#52c41a">
        <Table
          className={styles.customTable}
          scroll={{ x: 960, y: 55 * 3 }}
          rowKey="id"
          locale={{
            emptyText: <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          }}
          bordered
          dataSource={tableData}
          columns={columns}
          pagination={false}
          style={{
            borderRadius: '8px'
          }}
        />
      </StyledCard>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e8e8e8',
          marginBottom: 15
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '20px 24px', textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              onClick={handleSubmit}
              size="large"
              style={{
                minWidth: 140,
                margin: 0
              }}
            >
              提交并生成推荐
            </Button>
            <Button
              size="large"
              type="dashed"
              // onClick={handleReset}
              style={{
                background: '#ffdd8e',
                borderColor: '#ffdd8e',
                minWidth: 100,
                color: 'white'
              }}
            >
              重置
            </Button>
            <Button
              size="large"
              type="dashed"
              onClick={async () => {
                try {
                  const baseValues = baseForm.getFieldsValue(true)
                  const targetValues = targetForm.getFieldsValue(true)
                  const weightValues = weightForm.getFieldsValue(true)
                  const rangeValues = rangeForm.getFieldsValue(true)
                  await window.electronAPI.recAuxMaterialsSaveAPI.create({
                    count: rangeValues.size,
                    specimenName: selectType,
                    standardParams: baseValues,
                    targetParams: { ...targetValues, ...weightValues },
                    standardDesignParams: rangeValues
                  })
                  // console.log(res, 'resresres')
                  info('success', '保存成功！')
                } catch (error) {
                  console.log(error, 'aaaa')

                  info('error', '网络错误！')
                }
              }}
              style={{
                background: '#92d96f',
                borderColor: '#92d96f',
                minWidth: 100,
                color: 'white'
              }}
            >
              保存
            </Button>
            <Button
              size="large"
              type="dashed"
              onClick={async () => {
                try {
                  const baseValues = baseForm.getFieldsValue(true)
                  const targetValues = targetForm.getFieldsValue(true)
                  const weightValues = weightForm.getFieldsValue(true)
                  const rangeValues = rangeForm.getFieldsValue(true)

                  const res = await window.electronAPI.rec.exportResult({
                    count: rangeValues.size,
                    specimenName: selectType,
                    standardParams: baseValues,
                    targetParams: { ...targetValues, ...weightValues },
                    standardDesignParams: rangeValues
                  })
                  console.log(res, '导出成功')
                  info('success', '导出成功！')
                } catch {
                  info('error', '网络错误！')
                }
              }}
              style={{
                background: '#a689cf',
                borderColor: '#a689cf',
                minWidth: 100,
                color: 'white'
              }}
            >
              导出全部数据
            </Button>
            <Button
              size="large"
              type="dashed"
              onClick={async () => {
                const res = await window.electronAPI.recAuxMaterialsSaveAPI.query()
                setHistoryData(res.data)
                setHistoryModalOpen(true)
              }}
              style={{
                background: '#ffdd8e',
                borderColor: '#ffdd8e',
                minWidth: 100,
                color: 'white'
              }}
            >
              查看历史数据
            </Button>
          </Space>
        </div>
      </Card>
      <HistoryModal
        modalOpen={historyModalOpen}
        onCancel={() => {
          setHistoryModalOpen(false)
        }}
        type={0}
        historyData={historyData}
      />
      <BrandNameModal
        title="基准卷烟辅材参数"
        modalOpen={brandNameOpen}
        onCancel={() => {
          setBrandNameOpen(false)
        }}
        onSubmit={async (values) => {
          const { filterVentilation, filterPressureDrop, permeability, quantitative, citrate } =
            baseForm.getFieldsValue(true)
          if (
            filterVentilation === undefined ||
            filterPressureDrop === undefined ||
            permeability === undefined ||
            quantitative === undefined ||
            citrate === undefined
          ) {
            return false
          }
          // console.log(filterVentilation, filterPressureDrop, permeability, quantitative, citrate,111);

          const res = await window.electronAPI.ramMark.createRamMark({
            mark: values,
            filterVentilation,
            filterPressureDrop,
            permeability,
            quantitative,
            citrate
          })
          setBrandNameOpen(false)
          handleBrandName()
        }}
      />
      <BrandNameModal
        title="基准卷烟主流烟气"
        modalOpen={brandNameSmokeOpen}
        onCancel={() => {
          setBrandNameSmokeOpen(false)
        }}
        onSubmit={async (values) => {
          const { co, nicotine, tar } = baseForm.getFieldsValue(true)
          if (co === undefined || nicotine === undefined || tar === undefined) {
            return false
          }
          // console.log(co, nicotine, tar, 111)
          const res = await window.electronAPI.rfgMark.createRfgMark({
            mark: values,
            co,
            nicotine,
            tar
          })
          setBrandNameSmokeOpen(false)
          handleBrandNameSmoke()
        }}
      />
    </div>
  )
}

export default RecommendParameter
