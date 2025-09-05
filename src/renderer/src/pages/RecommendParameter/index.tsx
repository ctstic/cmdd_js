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
  ArrowRightOutlined
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

// 可复用的表单字段组件
const FormFieldGroup = ({ fields, form, layout = 'vertical', cols = 2, showSlider = false }) => {
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
              {showSlider ? (
                <Slider range defaultValue={[20, 50]} style={{ marginTop: 8 }} />
              ) : (
                <Input placeholder={`请输入${field.label}`} style={{ borderRadius: '6px' }} />
              )}
            </Form.Item>
          </Col>
        ))}
      </Row>
    </Form>
  )
}

// 第三步专用的滑块组件
const RangeSliders = ({ fields, form }) => {
  return (
    <Form form={form} layout="vertical">
      <Row gutter={[32, 16]}>
        {fields.map((field) => (
          <Col xs={24} md={8} key={field.name}>
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
                  defaultValue={[30, 70]}
                  min={0}
                  max={100}
                  marks={{
                    0: '0',
                    25: '25',
                    50: '50',
                    75: '75',
                    100: '100'
                  }}
                  tooltip={{
                    formatter: (value) => `${value}%`
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
    { name: 'citrate', label: '柠檬酸根(设计值)', unit: '%' },
    { name: 'potassiumRatio', label: '钾盐占比', unit: '%' }
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
    { name: 'ventilationRange', label: '滤嘴通风率',min:1,max:0.8,step:0.05,defaultSection:'20-80', unit: '%' },
    { name: 'pressureRange', label: '滤棒压降', min:2600,max:5800,step:200,defaultSection:'3400-5800',unit: 'Pa' },
    { name: 'permeabilityRange', label: '透气度', min:30,max:80,step:5,defaultSection:'40-80',unit: 'CU' },
    { name: 'quantitative', label: '定量', min:24,max:36,step:2,defaultSection:'24-36',unit: 'g/m²' },
    { name: 'citrate', label: '柠檬酸根(设计值)',min:1,max:0.8,step:0.05,defaultSection:'20-80', unit: '%' },
    // { name: 'potassiumRatio', label: '钾盐占比', min:1,max:0.8,step:0.05,defaultSection:'20-80',unit: '%' }
  ]

  const next = () => {
    setCurrent(current + 1)
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const handleSubmit = () => {
    // const result = await window.electronAPI.user.getAll()
    // const result = await window.electronAPI.user.getAll()
    setTableData([
      {
        id: 1,
        code: 'M32',
        filterVentilation: '0.793',
        filterPressureDrop: 5313,
        permeability: '81.3',
        quantitative: '32.8',
        citrate: '0.022000000000000002',
        potassiumRatio: '0.7',
        tar: '1.983006386758969',
        nicotine: '0.245775244556189',
        co: '0.956'
      }
    ])
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
    },
    {
      title: '钾盐占比',
      dataIndex: 'potassiumRatio'
    }
  ]

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

          <StyledCard title="成分权重设置" icon={<ExperimentOutlined />} color={currentStep.color}>
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
            expandedRowRender: (record) => (
              <div>
                CO：{record.co}、烟碱：{record.nicotine}、焦油：{record.tar}
              </div>
            )
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
    </div>
  )
}

export default RecommendParameter
