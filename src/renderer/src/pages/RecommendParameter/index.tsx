import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Form,
  Button,
  message,
  Slider,
  Steps,
  Table
} from 'antd'
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import type { TableProps } from 'antd'

const { Title, Text } = Typography

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

// 步骤配置
const stepConfigs = [
  {
    title: '基准参数',
    color: '#1890ff',
    icon: <ExperimentOutlined />
  },
  {
    title: '目标设置',
    color: '#fa8c16',
    icon: <SafetyCertificateOutlined />
  },
  {
    title: '参数范围',
    color: '#52c41a',
    icon: <ExperimentOutlined />
  }
]

// 第一  二步输入框
const FormFieldGroup = ({ fields, form, layout = 'vertical', cols = 2 }) => {
  return (
    <Form form={form} layout={layout}>
      <Row gutter={[24, 16]}>
        {fields.map((field) => (
          <Col xs={24} sm={24} md={24 / cols} key={field.name}>
            <Form.Item
              name={field.name}
              label={
                <Text strong style={{ color: '#262626', marginBottom: 8, display: 'block' }}>
                  {field.label}
                  {field.unit ? `(${field.unit})` : ''}
                </Text>
              }
            >
              <Input placeholder={`请输入${field.label}`} style={{ borderRadius: '6px' }} />
            </Form.Item>
          </Col>
        ))}
      </Row>
    </Form>
  )
}

// 第三步滑块组件
const RangeSliders = ({ fields, form }) => {
  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.defaultSection
    return acc
  }, {})

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      <Row gutter={[10, 10]}>
        {fields.map((field) => (
          <Col xs={24} md={12} key={field.name}>
            <div
              style={{
                padding: '16px',
                background: 'rgba(82, 196, 26, 0.05)',
                borderRadius: '8px',
                border: '1px solid #e8f5e6',
                height: '100%'
              }}
            >
              <Form.Item
                name={field.name}
                label={
                  <Text strong style={{ color: '#262626', marginBottom: 12 }}>
                    {field.label}
                    {field.unit ? `(${field.unit})` : ''}
                  </Text>
                }
                style={{ marginBottom: 0 }}
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
                  style={{ marginTop: 12 }}
                />
              </Form.Item>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: '12px',
                  color: '#8c8c8c'
                }}
              >
                <span>最小值</span>
                <span>最大值</span>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Form>
  )
}

// 可复用的卡片组件
const StyledCard = ({ title, icon, children, color = '#1890ff', style = {} }) => {
  const cardHeaderStyle = {
    background: `linear-gradient(90deg, ${color}20 0%, #ffffff 100%)`,
    padding: '16px 24px',
    borderRadius: '12px 12px 0 0',
    borderBottom: `2px solid ${color}40`
  }

  return (
    <Card
      style={{
        marginBottom: 20,
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
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </Card>
  )
}

const RecommendParameter: React.FC = () => {
  const [current, setCurrent] = useState(0)
  const [baseForm] = Form.useForm()
  const [targetForm] = Form.useForm()
  const [weightForm] = Form.useForm()
  const [rangeForm] = Form.useForm()
  const [tableData, setTableData] = useState<DataType[]>([])

  // 基准卷烟辅材参数数据
  const baseMaterialFields = [
    { name: 'filterVentilation', label: '滤嘴通风率', unit: '%' },
    { name: 'filterPressureDrop', label: '滤棒压降', unit: 'Pa' },
    { name: 'permeability', label: '透气度', unit: 'CU' },
    { name: 'quantitative', label: '定量', unit: 'g/m²' },
    { name: 'citrate', label: '柠檬酸根(设计值)', unit: '%' }
  ]

  // 基准卷烟有害成分数据
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
      min: 0.1,
      max: 0.8,
      step: 0.05,
      defaultSection: [0.4, 0.6],
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
      label: '柠檬酸根(设计值)',
      min: 0.1,
      max: 0.8,
      step: 0.05,
      defaultSection: [0.4, 0.6],
      unit: '%'
    }
  ]

  const next = () => {
    setCurrent(current + 1)
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const handleSubmit = async () => {
    // 获取每一步表单的所有值
    const baseValues = baseForm.getFieldsValue(true) // true 表示获取所有表单字段（即使它们没有被渲染）
    const targetValues = targetForm.getFieldsValue(true)
    const weightValues = weightForm.getFieldsValue(true)
    const rangeValues = rangeForm.getFieldsValue(true)

    // 打印所有表单的值
    console.log('基准卷烟辅材参数:', baseValues)
    console.log('目标有害成分:', targetValues)
    console.log('成分权重设置:', weightValues)
    console.log('辅材参数个性化设计范围:', rangeValues)

    const res = await window.electronAPI.rec.auxMaterials({
      count: rangeValues.size,
      standardParams: baseValues,
      targetParams: { ...targetValues, ...weightValues },
      standardDesignParams: rangeValues
    })

    console.log(res, 'resres')

    // 数据更新
    const transformedData = res.data.map((item) => ({
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
    message.success('参数推荐完成！')
  }

  const currentStep = stepConfigs[current]

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '滤嘴通风率',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{Number(text) * 100}%</span>
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
      title: '柠檬酸根 (设计值)',
      dataIndex: 'citrate',
      render: (text) => <span>{Number(text) * 100}%</span>
    }
  ]

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
  return (
    <div
      style={{
        padding: 24,
        //   background: currentStep.gradient.replace('135deg', '0deg').replace('100%)', '20%)'),
        minHeight: '100vh',
        borderRadius: 8
      }}
    >
      {/* 步骤指示器 */}
      <Steps
        current={current}
        items={stepConfigs.map((config, index) => ({
          title: config.title,
          icon: React.cloneElement(config.icon, {
            style: { color: index === current ? config.color : '#bfbfbf' }
          })
        }))}
        style={{
          marginBottom: 20,
          padding: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
      <Row gutter={[24, 16]}>
        {/* 表单在左侧 */}
        <Col xs={24} md={8}>
          {/* 第一步：基准参数 */}
          {current === 0 && (
            <>
              <StyledCard
                title="基准卷烟辅材参数"
                icon={<ExperimentOutlined />}
                color={currentStep.color}
              >
                <FormFieldGroup fields={baseMaterialFields} form={baseForm} cols={3} />
              </StyledCard>

              <StyledCard
                title="基准卷烟有害成分"
                icon={<SafetyCertificateOutlined />}
                color={currentStep.color}
              >
                <FormFieldGroup fields={harmfulFields} form={baseForm} cols={3} />
              </StyledCard>
            </>
          )}

          {/* 第二步：目标设置 */}
          {current === 1 && (
            <>
              <StyledCard
                title="目标有害成分"
                icon={<SafetyCertificateOutlined />}
                color={currentStep.color}
              >
                <FormFieldGroup fields={harmfulFields} form={targetForm} cols={3} />
              </StyledCard>

              <StyledCard
                title="成分权重设置"
                icon={<ExperimentOutlined />}
                color={currentStep.color}
              >
                <FormFieldGroup fields={harmfulWeightFields} form={weightForm} cols={3} />
              </StyledCard>
            </>
          )}

          {/* 第三步：参数范围 */}
          {current === 2 && (
            <StyledCard
              title="辅材参数个性化设计范围"
              icon={<SafetyCertificateOutlined />}
              color={currentStep.color}
              style={{ marginBottom: 12 }}
            >
              <FormFieldGroup
                fields={[{ name: 'size', label: '生成有害成分数量', unit: '条' }]}
                form={rangeForm}
                cols={3}
              />

              <RangeSliders fields={rangeFields} form={rangeForm} />

              <div
                style={{
                  marginTop: 24,
                  padding: 16,
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
          )}

          {/* 导航按钮 */}
          <div
            style={{
              marginTop: 20,
              textAlign: 'center',
              padding: 20,
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {current > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={prev}
                style={{ marginRight: 16, minWidth: 100 }}
                size="large"
              >
                上一步
              </Button>
            )}

            {current < stepConfigs.length - 1 ? (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={next}
                size="large"
                style={{
                  background: currentStep.color,
                  borderColor: currentStep.color,
                  minWidth: 100
                }}
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                size="large"
                style={{
                  background: currentStep.color,
                  borderColor: currentStep.color,
                  minWidth: 140
                }}
              >
                提交并生成推荐
              </Button>
            )}
          </div>
        </Col>
        <Col xs={24} md={16}>
          <div
            style={{
              marginTop: 20,
              textAlign: 'center',
              padding: 20,
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Table
              expandable={{
                expandedRowRender: (record) => {
                  // 计算每个项的百分比变化
                  const coPercentageChange = calculatePercentageChange(
                    record.prediction[0],
                    record.co
                  )
                  const nicotinePercentageChange = calculatePercentageChange(
                    record.prediction[1],
                    record.nicotine
                  )
                  const tarPercentageChange = calculatePercentageChange(
                    record.prediction[2],
                    record.tar
                  )

                  return (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', marginRight: '10px' }}>CO:</div>
                      <div>
                        {record.prediction[0].toFixed(2)} {renderArrow(coPercentageChange)}
                      </div>

                      <div style={{ fontWeight: 'bold', marginLeft: '20px', marginRight: '10px' }}>
                        烟碱:
                      </div>
                      <div>
                        {record.prediction[1].toFixed(2)} {renderArrow(nicotinePercentageChange)}
                      </div>

                      <div style={{ fontWeight: 'bold', marginLeft: '20px', marginRight: '10px' }}>
                        焦油:
                      </div>
                      <div>
                        {record.prediction[2].toFixed(2)} {renderArrow(tarPercentageChange)}
                      </div>
                    </div>
                  )
                }
              }}
              bordered
              dataSource={tableData}
              columns={columns}
              pagination={false}
              style={{
                borderRadius: '8px'
              }}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default RecommendParameter
