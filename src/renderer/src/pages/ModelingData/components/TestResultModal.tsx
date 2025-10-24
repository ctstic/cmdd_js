import React from 'react'
import { Modal, Card, Row, Col, Typography, Button } from 'antd'
import { LineChartOutlined, BarChartOutlined, ExperimentOutlined } from '@ant-design/icons'

const { Text } = Typography

export type TestResultModalProps = {
  data: any
  modalOpen: boolean
  onCancel: () => void
}

const TestResultModal: React.FC<TestResultModalProps> = ({ data, modalOpen, onCancel }) => {
  if (!data) return null

  // 将数据分类为X轴和Y轴数据
  const xDataItems = [
    { name: '滤嘴通风率', value: data.filterVentilation, unit: '%' },
    { name: '滤棒压降', value: data.filterPressureDrop, unit: 'Pa' },
    { name: '卷烟纸透气度', value: data.permeability, unit: 'CU' },
    { name: '卷烟纸定量', value: data.quantitative, unit: 'g/m²' },
    { name: '卷烟纸助燃剂用量', value: data.citrate, unit: '%' },
    { name: '钾盐占比', value: data.potassiumRatio, unit: '' }
  ]

  const yDataItems = [
    { name: '焦油', value: data.tar, unit: 'mg/支' },
    { name: '烟碱', value: data.nicotine, unit: 'mg/支' },
    { name: 'CO', value: data.co, unit: 'mg/支' }
  ]

  return (
    <Modal
      width="90%"
      //   style={{ maxWidth: 1000 }}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExperimentOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          <span>{data.code} - 数据详情</span>
        </div>
      }
      open={modalOpen}
      footer={
        <Button type="primary" onClick={onCancel}>
          关闭
        </Button>
      }
      onCancel={onCancel}
    >
      <div style={{ padding: '8px 0' }}>
        {/* X轴数据卡片 */}
        <Card
          title={
            <span>
              <LineChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              卷烟辅材参数
            </span>
          }
          style={{ marginBottom: 24 }}
          headStyle={{ backgroundColor: '#a3dcff', borderBottom: '1px solid #1890ff' }}
        >
          <Row gutter={[16, 16]}>
            {xDataItems.map((item, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 8,
                    border: '1px solid #1890ff',
                    textAlign: 'center'
                  }}
                >
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {item.name}
                    {item.unit && `(${item.unit})`}
                  </Text>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: '#1890ff',
                      marginTop: 8
                    }}
                  >
                    {item.unit === '%' || item.unit === '%'
                      ? (Number(item.value) * 100).toFixed(2)
                      : item.value}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Y轴数据卡片 */}
        <Card
          title={
            <span>
              <BarChartOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              主流烟气
            </span>
          }
          headStyle={{ backgroundColor: '#fff7e6', borderBottom: '1px solid #ffd591' }}
        >
          <Row gutter={[16, 16]}>
            {yDataItems.map((item, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <div
                  style={{
                    padding: '20px',
                    borderRadius: 8,
                    border: '1px solid #fae3b0',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <Text strong style={{ fontSize: '16px' }}>
                    {item.name}
                    {item.unit && `(${item.unit})`}
                  </Text>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: '#fae3b0',
                      marginTop: 12
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </Modal>
  )
}

export default TestResultModal
