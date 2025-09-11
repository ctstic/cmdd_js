import React, { useRef, useState } from 'react'
import { Card, Typography, Button, Space, Popconfirm, message, Form, InputNumber } from 'antd'
import { PlusOutlined, LineChartOutlined } from '@ant-design/icons'
import { ActionType, EditableProTable, ProColumns } from '@ant-design/pro-components'

const { Text } = Typography

// 公共必填规则
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const requiredRule = (messageText: string) => ({
  rules: [{ required: true, message: messageText }]
})

// 公共数字输入框渲染器
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const renderNumberInput = () => (
  <InputNumber
    style={{ width: '100%' }}
    min={0}
    step={0.01}
    precision={2} // 最多保留2位小数，可以只输入整数
    placeholder="请输入"
  />
)

interface DataSourceItem {
  key: string
  filterVentilation: string | number
  filterPressureDrop: string | number
  permeability: string | number
  quantitative: string | number
  citrate: string | number
  potassiumRatio: string | number
  tar: string | number
  nicotine: string | number
  co: string | number
}

interface PredictionTableProps {
  dataSource?: DataSourceItem[]
  onDataChange?: (data: DataSourceItem[]) => void
}

const PredictionTable: React.FC<PredictionTableProps> = ({ dataSource = [], onDataChange }) => {
  const actionRef = useRef<ActionType>(undefined)
  const [editableDataSource, setEditableDataSource] = useState<DataSourceItem[]>(dataSource)
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()

  // 删除
  const handleDelete = (key: string): void => {
    const newData = editableDataSource.filter((item) => item.key !== key)
    setEditableDataSource(newData)
    onDataChange?.(newData)
    message.success('删除成功')
  }

  // 表格列
  const columns: ProColumns<DataSourceItem, 'text'>[] = [
    {
      title: '序号',
      dataIndex: 'key',
      editable: false,
      width: 40
    },
    {
      title: '滤嘴通风率（%）',
      dataIndex: 'filterVentilation',
      formItemProps: () => requiredRule('此项为必填项'),
      renderFormItem: renderNumberInput,
      width: 110
    },
    {
      title: '滤棒压降（Pa）',
      dataIndex: 'filterPressureDrop',
      formItemProps: () => requiredRule('此项为必填项'),
      renderFormItem: renderNumberInput,
      width: 110
    },
    {
      title: '透气度（CU）',
      dataIndex: 'permeability',
      formItemProps: () => requiredRule('此项为必填项'),
      renderFormItem: renderNumberInput,
      width: 90
    },
    {
      title: '定量（g/m²）',
      dataIndex: 'quantitative',
      formItemProps: () => requiredRule('此项为必填项'),
      renderFormItem: renderNumberInput,
      width: 100
    },
    {
      title: '柠檬酸根(设计值)（%）',
      dataIndex: 'citrate',
      formItemProps: () => requiredRule('此项为必填项'),
      renderFormItem: renderNumberInput,
      width: 160
    },
    {
      title: '钾盐占比（%）',
      dataIndex: 'potassiumRatio',
      formItemProps: () => requiredRule('此项为必填项'),
      renderFormItem: renderNumberInput,
      width: 110
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record, __, action) => [
        <a key="editable" onClick={() => action?.startEditable?.(record.key)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定要删除吗？" onConfirm={() => handleDelete(record.key)}>
          <a>删除</a>
        </Popconfirm>
      ]
    }
  ]

  return (
    <Card
      style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      bodyStyle={{ padding: 0 }}
    >
      {/* 表头 */}
      <div style={{ padding: '12px 16px', borderBottom: '2px solid #52c41a' }}>
        <LineChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
        <Text strong style={{ fontSize: '16px' }}>
          预测结果数据
        </Text>
      </div>

      {/* 表格 */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={editableKeys.length > 0} // 编辑时禁用
              onClick={() => {
                const newKey = (editableDataSource.length + 1).toString()
                const newData: DataSourceItem = {
                  key: newKey,
                  filterVentilation: '',
                  filterPressureDrop: '',
                  permeability: '',
                  quantitative: '',
                  citrate: '',
                  potassiumRatio: '',
                  tar: '',
                  nicotine: '',
                  co: ''
                }
                setEditableDataSource([...editableDataSource, newData])
                actionRef.current?.startEditable?.(newKey)
              }}
            >
              新增一行
            </Button>
          </Space>
        </div>

        <EditableProTable<DataSourceItem>
          rowKey="key"
          actionRef={actionRef}
          recordCreatorProps={false}
          columns={columns}
          value={editableDataSource}
          onChange={(data) => {
            setEditableDataSource(data as DataSourceItem[])
            onDataChange?.(data as DataSourceItem[])
          }}
          editable={{
            form,
            editableKeys,
            onChange: setEditableRowKeys,
            actionRender: (row, config, defaultDom) => [defaultDom.save, defaultDom.delete]
          }}
          expandable={{
            expandedRowRender: (record) => {
              // 使用 record.key 查找对应的数据
              const prediction = dataSource.find((item) => item.key === record.key)

              // 如果找到了对应的 prediction 数据，渲染相关内容
              return (
                <div>
                  <p>CO: {prediction ? prediction.co : '暂无数据'}</p>
                  <p>烟碱: {prediction ? prediction.nicotine : '暂无数据'}</p>
                  <p>焦油: {prediction ? prediction.tar : '暂无数据'}</p>
                </div>
              )
            }
          }}
        />
      </div>
    </Card>
  )
}

export default PredictionTable
