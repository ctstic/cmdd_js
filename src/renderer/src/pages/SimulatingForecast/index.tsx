import React, { useState } from 'react'
import { Card, Row, Col, Typography, InputNumber, Form, Button, message, Space } from 'antd'
import {
  CalculatorOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import PredictionTable from './PredictionTable'

const { Title, Text } = Typography

interface DataSourceItem {
  key: string
  code?: string
  filterVentilation: number
  filterPressureDrop: number
  permeability: number
  quantitative: number
  citrate: number
  potassiumRatio: number
  tar: number
  nicotine: number
  co: number
}

interface FormFieldConfig {
  name: string
  label: string
  unit?: string
}

// 公共必填规则
const requiredRule = (label: string) => [{ required: true, message: `请输入${label}` }]

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

const SimulatingForecast: React.FC = () => {
  const [baseForm] = Form.useForm()
  const [harmfulForm] = Form.useForm()
  const [dataSource, setDataSource] = useState<DataSourceItem[]>([])

  // 基准卷烟辅材参数
  const baseMaterialFields: FormFieldConfig[] = [
    { name: 'filterVentilation', label: '滤嘴通风率', unit: '%' },
    { name: 'filterPressureDrop', label: '滤棒压降', unit: 'Pa' },
    { name: 'permeability', label: '透气度', unit: 'CU' },
    { name: 'quantitative', label: '定量', unit: 'g/m²' },
    { name: 'citrate', label: '柠檬酸根(设计值)', unit: '%' },
    { name: 'potassiumRatio', label: '钾盐占比', unit: '%' }
  ]

  // 基准卷烟有害成分
  const harmfulFields: FormFieldConfig[] = [
    { name: 'tar', label: '焦油', unit: 'mg/支' },
    { name: 'nicotine', label: '烟碱', unit: 'mg/支' },
    { name: 'co', label: 'CO', unit: 'mg/支' }
  ]

  const handleDataChange = (newData: DataSourceItem[]): void => {
    setDataSource(newData)
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      const baseValues = await baseForm.validateFields()
      const harmfulValues = await harmfulForm.validateFields()
      console.log('表格数据:', { ...baseValues, ...harmfulValues }, dataSource)

      const res = await window.electronAPI.simulation.prediction({
        standardParams: { ...baseValues, ...harmfulValues },
        predictionParams: dataSource
      })

      // 确保将返回的预测数据更新到表格中
      const predictionData = res.data.map((item: any) => ({
        ...item, // 返回的数据结构
        key: item.key.toString() // 确保 key 为字符串类型
      }))
      setDataSource(predictionData) // 更新 dataSource

      console.log(predictionData)
    } catch (error) {
      message.error('请先填写完整的表单')
    }
  }

  const handleReset = (): void => {
    baseForm.resetFields()
    harmfulForm.resetFields()
    setDataSource([])
    message.success('已重置所有数据')
  }

  return (
    <div style={{ minHeight: '100vh' }}>
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

      <Row gutter={[24, 24]}>
        {/* 左侧表单 */}
        <Col xs={24} lg={8}>
          {/* 辅材参数 */}
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={styles.cardHeader}>
              <ExperimentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text strong style={{ fontSize: '16px' }}>
                基准卷烟辅材参数
              </Text>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <Form form={baseForm} layout="vertical">
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
              </Form>
            </div>
          </Card>

          {/* 有害成分 */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div
              style={{
                ...styles.cardHeader,
                background: 'linear-gradient(90deg, #fff7e6 0%, #ffffff 100%)'
              }}
            >
              <SafetyCertificateOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              <Text strong style={{ fontSize: '16px' }}>
                基准卷烟有害成分
              </Text>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <Form form={harmfulForm} layout="vertical">
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
              </Form>
            </div>
          </Card>
        </Col>

        {/* 右侧表格 */}
        <Col xs={24} lg={16}>
          <PredictionTable dataSource={dataSource} onDataChange={handleDataChange} />
        </Col>
      </Row>

      {/* 底部按钮 */}
      <Space style={{ marginTop: '20px' }}>
        <Button type="primary" onClick={handleSubmit}>
          提交
        </Button>
        <Button type="dashed" onClick={handleReset}>
          重置
        </Button>
      </Space>
    </div>
  )
}

export default SimulatingForecast
