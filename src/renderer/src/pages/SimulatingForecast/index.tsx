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
  Table,
  Space,
  InputNumber,
  Popconfirm
} from 'antd'
import {
  CalculatorOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  LineChartOutlined
} from '@ant-design/icons'

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
  },
  primaryButton: {
    background: '#fa8c16',
    borderColor: '#fa8c16',
    fontWeight: '600'
  },
  secondaryButton: {
    background: '#a3dcff',
    borderColor: '#a3dcff',
    color: '#262626',
    fontWeight: '600'
  },
  tableHeader: {
    background: '#f0f8ff',
    fontWeight: '600'
  }
  // editingRow: {
  //   background: '#fff7e6'
  // }
}

const SimulatingForecast: React.FC = () => {
  const [baseForm] = Form.useForm()
  const [harmfulForm] = Form.useForm()
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
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
  const [editingKey, setEditingKey] = useState('')
  const [editForm] = Form.useForm()

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

  const columns = [
    {
      title: '序号',
      dataIndex: 'key',
      width: 80,
      align: 'center' as const,
      render: (_, record, index) => (
        <div
          style={{
            background: '#a3dcff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontWeight: '600',
            color: '#262626'
          }}
        >
          {index + 1}
        </div>
      )
    },
    {
      title: '滤嘴通风率（%）',
      dataIndex: 'filterVentilation',
      editable: true,
      align: 'center' as const,
      render: (text) => (
        <Text strong style={{ color: '#389e0d' }}>
          {text}
        </Text>
      )
    },
    {
      title: '滤棒压降（Pa）',
      dataIndex: 'filterPressureDrop',
      editable: true,
      align: 'center' as const,
      render: (text) => (
        <Text strong style={{ color: '#389e0d' }}>
          {text}
        </Text>
      )
    },
    {
      title: '透气度（CU）',
      dataIndex: 'permeability',
      editable: true,
      align: 'center' as const,
      render: (text) => (
        <Text strong style={{ color: '#389e0d' }}>
          {text}
        </Text>
      )
    },

    {
      title: '定量（g/m²）',
      dataIndex: 'quantitative',
      editable: true,
      align: 'center' as const,
      render: (text) => (
        <Text strong style={{ color: '#389e0d' }}>
          {text}
        </Text>
      )
    },
    {
      title: '柠檬酸根(设计值)（%）',
      dataIndex: 'citrate',
      editable: true,
      align: 'center' as const,
      render: (text) => (
        <Text strong style={{ color: '#389e0d' }}>
          {text}
        </Text>
      )
    },
    {
      title: '钾盐占比（%）',
      dataIndex: 'potassiumRatio',
      editable: true,
      align: 'center' as const,
      render: (text) => (
        <Text strong style={{ color: '#389e0d' }}>
          {text}
        </Text>
      )
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 140,
      align: 'center' as const,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => save(record.key)}
              size="small"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            />
            <Button icon={<CloseOutlined />} onClick={cancel} size="small" />
          </Space>
        ) : (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit(record)}
              disabled={editingKey !== ''}
              size="small"
              style={styles.secondaryButton}
            />
            <Popconfirm
              title="确定要删除这行数据吗?"
              onConfirm={() => handleDelete(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  const isEditing = (record) => record.key === editingKey

  const edit = (record) => {
    editForm.setFieldsValue({
      tar: record.tar,
      nicotine: record.nicotine,
      co: record.co,
      ...record
    })
    setEditingKey(record.key)
  }

  const cancel = () => {
    setEditingKey('')
  }

  const save = async (key) => {
    try {
      const row = await editForm.validateFields()
      const newData = [...dataSource]
      const index = newData.findIndex((item) => key === item.key)

      if (index > -1) {
        const item = newData[index]
        newData.splice(index, 1, { ...item, ...row })
        setDataSource(newData)
        setEditingKey('')
        message.success('保存成功')
      } else {
        newData.push(row)
        setDataSource(newData)
        setEditingKey('')
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  }

  const handleAdd = () => {
    const newKey = Date.now().toString()
    const newData = {
      key: newKey,
      tar: 0,
      nicotine: 0,
      co: 0
    }
    setDataSource([...dataSource, newData])
    edit(newData)
  }

  const handleDelete = (key) => {
    const newData = dataSource.filter((item) => item.key !== key)
    setDataSource(newData)
    message.success('删除成功')
  }

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'number',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    }
  })

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `请输入${title}!`
              },
              {
                pattern: /^\d+(\.\d{1,2})?$/,
                message: '请输入有效的数字（最多两位小数）'
              }
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh'
      }}
    >
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
        {/* 左侧*/}
        <Col xs={24} lg={10}>
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
                  {baseMaterialFields.map((field, index) => (
                    <Col xs={24} sm={12} key={field.name}>
                      <Form.Item
                        name={field.name}
                        label={
                          <Text strong style={{ color: '#262626' }}>
                            {field.label}
                            {field.unit ? `(${field.unit})` : ''}
                          </Text>
                        }
                      >
                        <Input
                          placeholder={`请输入${field.label}`}
                          style={{ borderRadius: '6px' }}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Form>
            </div>
          </Card>

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
                        label={
                          <Text strong style={{ color: '#262626' }}>
                            {field.label}({field.unit})
                          </Text>
                        }
                      >
                        <Input
                          placeholder={`请输入${field.label}`}
                          style={{ borderRadius: '6px' }}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Form>
            </div>
          </Card>
        </Col>

        {/* 右侧 */}
        <Col xs={24} lg={14}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8',
              height: '100%'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div
              style={{
                ...styles.cardHeader,
                background: 'linear-gradient(90deg, #f6ffed 0%, #ffffff 100%)'
              }}
            >
              <LineChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              <Text strong style={{ fontSize: '16px' }}>
                预测结果数据
              </Text>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <Form form={editForm} component={false}>
                <div
                  style={{
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text strong style={{ color: '#262626' }}>
                    预测结果数据列表
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    disabled={editingKey !== ''}
                    style={styles.primaryButton}
                  >
                    新增一行
                  </Button>
                </div>
                <Table
                  components={{
                    body: {
                      cell: EditableCell
                    }
                  }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div>
                        CO：{record.co}、烟碱：{record.nicotine}、焦油：{record.tar}
                      </div>
                    )
                  }}
                  bordered
                  dataSource={dataSource}
                  columns={mergedColumns}
                  rowClassName={(record) => (isEditing(record) ? 'editing-row' : '')}
                  pagination={false}
                  style={{
                    borderRadius: '8px'
                  }}
                />
              </Form>
            </div>
          </Card>
        </Col>
      </Row>

      <Space style={{ marginTop: '20px' }}>
        <Button
          type="primary"
          onClick={() => {
            console.log(dataSource, 'aaa')
          }}
        >
          提交
        </Button>
        <Button
          type="dashed"
          onClick={() => {
            baseForm.resetFields()
            harmfulForm.resetFields()
            setDataSource([])
            setEditingKey('')
            message.success('已重置所有数据')
          }}
        >
          重置
        </Button>
      </Space>
    </div>
  )
}

export default SimulatingForecast
