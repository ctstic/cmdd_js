import React, { useRef, useState } from 'react'
import { Card, Row, Col, Typography, Button, Space, Form, InputNumber, notification } from 'antd'
import {
  CalculatorOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import PredictionTable from './PredictionTable'

const { Title, Text } = Typography

const styles = {
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

interface FormFieldConfig {
  name: string
  label: string
  unit?: string
}

// 基准卷烟辅材参数
const baseMaterialFields: FormFieldConfig[] = [
  { name: 'filterVentilation', label: '滤嘴通风率', unit: '%' },
  { name: 'filterPressureDrop', label: '滤棒压降', unit: 'Pa' },
  { name: 'permeability', label: '透气度', unit: 'CU' },
  { name: 'quantitative', label: '定量', unit: 'g/m²' },
  { name: 'citrate', label: '柠檬酸根(设计值)', unit: '%' }
  // { name: 'potassiumRatio', label: '钾盐占比', unit: '%' }
]

// 基准卷烟有害成分
const harmfulFields: FormFieldConfig[] = [
  { name: 'tar', label: '焦油', unit: 'mg/支' },
  { name: 'nicotine', label: '烟碱', unit: 'mg/支' },
  { name: 'co', label: 'CO', unit: 'mg/支' }
]

// 公共必填规则
const requiredRule = (label: string) => [{ required: true, message: `请输入${label}` }]

const SimulatingForecast: React.FC = () => {
  const [notificationApi, contextHolder] = notification.useNotification()
  const [form] = Form.useForm()
  const actionRef = useRef<any>(null)
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // 可复用的卡片组件
  const StyledCard = ({ title, icon, children, color = '#1890ff' }) => {
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
          border: `1px solid ${color}30`
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

  const handleSubmit = async (): Promise<void> => {
    try {
      const formValues = await form.validateFields()
      if (actionRef.current) {
        const dataSource = actionRef.current.getData()
        console.log('🚀 ~ handleSubmit ~ dataSource:', dataSource)
        console.log('🚀 ~ handleSubmit ~ formValues:', formValues)

        // 过滤数据，只传递输入参数，不传递预测结果
        const inputParams = dataSource.map((item) => ({
          key: item.key,
          filterVentilation: Number(item.filterVentilation),
          filterPressureDrop: Number(item.filterPressureDrop),
          permeability: Number(item.permeability),
          quantitative: Number(item.quantitative),
          citrate: Number(item.citrate)
          // potassiumRatio: Number(item.potassiumRatio) //钾盐占比
          // 不传递 tar, nicotine, co 字段
        }))
        const jsonString = JSON.stringify(inputParams)
        const isNaN = jsonString.includes('null')
        if (inputParams.length === 0 || isNaN) {
          notificationApi.error({
            message: '请正确填写预测结果数据表格'
          })
        } else {
          // 调用接口
          const res = await window.electronAPI.simulation.prediction({
            standardParams: formValues,
            predictionParams: inputParams
          })

          // 判断返回数据是否存在
          console.log('🚀 ~ handleSubmit ~ res.data:aaa', res.data)         
          if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
            notificationApi.success({
              message: '计算成功'
            })
            // 确保将返回的预测数据更新到表格中
            const predictionData = res.data.data.map((item: any) => {
              const params = inputParams.find((params) => params.key === item.key)

              return {
                ...item,
                key: item.key.toString(),
                filterVentilation: Number(params?.filterVentilation) || 0,
                filterPressureDrop: Number(params?.filterPressureDrop) || 0,
                permeability: Number(params?.permeability) || 0,
                quantitative: Number(params?.quantitative) || 0,
                citrate: Number(params?.citrate) || 0,
                potassiumRatio: Number(params?.potassiumRatio) || 0,
                tar: Number(item.tar) || 0,
                nicotine: Number(item.nicotine) || 0,
                co: Number(item.co) || 0
              }
            })
            actionRef.current.setData(predictionData)
            setExpandedRowKeys(predictionData.map((item) => item.key))
          } else {
            notificationApi.error({
              message: res.data.errors
            })
          }
        }
      }
    } catch (error) {
      console.error('计算异常:', error)
      // 4. 如果表单验证失败，或者接口调用失败，显示错误提示
      notificationApi.error({
        message: '计算异常，请检查表单填写'
      })
    }
  }

  const handleReset = (): void => {
    form.resetFields()
    if (actionRef.current) {
      actionRef.current.setData([])
    }
    setExpandedRowKeys([])
    notificationApi.success({
      message: '重置成功',
      description: '表单和表格数据已重置'
    })
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 145px)' }}>
      {contextHolder}
      {/* 标题 */}
      <Card
        style={{
          marginBottom: 24,
          ...styles.headerGradient,
          color: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 20px rgba(24, 144, 255, 0.3)',
          border: 'none'
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 700 }}>
          <CalculatorOutlined style={{ marginRight: 16, fontSize: '32px' }} />
          卷烟焦油和烟碱仿真预测系统
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
          基于多维数据的智能化预测分析
        </Text>
      </Card>

      <Row gutter={[24, 16]}>
        {/* 左侧表单 */}
        <Col xs={24} lg={8}>
          <Form form={form} layout="vertical">
            {/* 辅材参数 */}
            <StyledCard title="基准卷烟辅材参数" icon={<ExperimentOutlined />}>
              <Row gutter={16}>
                {baseMaterialFields.map((field) => (
                  <Col xs={24} sm={12} key={field.name}>
                    <Form.Item
                      name={field.name}
                      label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                      rules={requiredRule(field.label)}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder={`请输入${field.label}`}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </StyledCard>

            {/* 有害成分 */}
            <StyledCard
              title="基准卷烟有害成分"
              icon={<SafetyCertificateOutlined />}
              color="#fa8c16"
            >
              <Row gutter={16}>
                {harmfulFields.map((field) => (
                  <Col xs={24} sm={8} key={field.name}>
                    <Form.Item
                      name={field.name}
                      label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                      rules={requiredRule(field.label)}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder={`请输入${field.label}`}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </StyledCard>
          </Form>
          {/* 底部按钮 */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <Space>
                <Button
                  size="large"
                  type="primary"
                  onClick={handleSubmit}
                  style={{
                    background: '#2597ff',
                    borderColor: '#2597ff',
                    minWidth: 100
                  }}
                >
                  计算
                </Button>
                <Button
                  size="large"
                  type="dashed"
                  onClick={handleReset}
                  style={{
                    background: '#ffdd8e',
                    borderColor: '#ffdd8e',
                    minWidth: 100,
                    color: 'white'
                  }}
                >
                  重置
                </Button>
              </Space>
            </div>
          </Card>
        </Col>

        {/* 右侧表格 */}
        <Col xs={24} lg={16}>
          {/* <StyledCard title="预测结果数据" icon={<LineChartOutlined />} color="#52c41a"> */}
            <PredictionTable actionRef={actionRef} expandedRowKeys={expandedRowKeys} />
          {/* </StyledCard> */}
        </Col>
      </Row>
    </div>
  )
}

export default SimulatingForecast
