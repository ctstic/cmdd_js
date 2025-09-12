import { LineChartOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { EditableProTable } from '@ant-design/pro-components'
import { Card, Typography } from 'antd'
import React, { useState, useRef, useImperativeHandle } from 'react'

const { Text } = Typography

interface DataSourceType {
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
  actionRef?: React.Ref<any>
}

const PredictionTable: React.FC<PredictionTableProps> = ({ actionRef }) => {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])
  const [dataSource, setDataSource] = useState<readonly DataSourceType[]>([])

  const editableTableRef = useRef<any>(null)

  // Expose methods to the parent component via actionRef
  useImperativeHandle(actionRef, () => ({
    getData: () => dataSource, // Get data from the table
    setData: (newData: DataSourceType[]) => setDataSource(newData) // Set new data
  }))

  const columns: ProColumns<DataSourceType>[] = [
    {
      title: '滤嘴通风率（%）',
      dataIndex: 'filterVentilation'
    },
    {
      title: '滤棒压降（Pa）',
      dataIndex: 'filterPressureDrop'
    },
    {
      title: '透气度（CU）',
      dataIndex: 'permeability'
    },
    {
      title: '定量（g/m²）',
      dataIndex: 'quantitative'
    },
    {
      title: '柠檬酸根(设计值)（%）',
      dataIndex: 'citrate'
    },
    {
      title: '钾盐占比（%）',
      dataIndex: 'potassiumRatio'
    },
    {
      title: '操作',
      valueType: 'option',
      render: () => {
        return null
      }
    }
  ]

  return (
    <Card
      style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '2px solid #52c41a' }}>
        <LineChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
        <Text strong style={{ fontSize: '16px' }}>
          预测结果数据
        </Text>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <EditableProTable<DataSourceType>
          ref={editableTableRef}
          columns={columns}
          rowKey="key"
          scroll={{ x: 960 }}
          value={dataSource}
          onChange={setDataSource}
          recordCreatorProps={{
            newRecordType: 'dataSource',
            record: () => ({ key: Date.now() })
          }}
          editable={{
            type: 'multiple',
            editableKeys,
            actionRender: (row, config, defaultDoms) => {
              return [defaultDoms.delete]
            },
            onValuesChange: (record, recordList) => {
              setDataSource(recordList)
            },
            onChange: setEditableRowKeys
          }}
          expandable={{
            expandedRowRender: (record) => {
              // 找到对应的预测数据
              const prediction = dataSource.find((item) => item.key === record.key)

              return (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    padding: '10px',
                    fontFamily: 'Arial, sans-serif',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ textAlign: 'left', width: '200px' }}>
                    <p style={{ margin: 0, fontSize: '16px' }}>
                      <strong>CO:</strong>{' '}
                      <span style={{ color: prediction?.co ? '#52c41a' : 'gray' }}>
                        {prediction?.co || '未计算'}
                      </span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'left', width: '200px' }}>
                    <p style={{ margin: 0, fontSize: '16px' }}>
                      <strong>烟碱:</strong>{' '}
                      <span style={{ color: prediction?.nicotine ? '#52c41a' : 'gray' }}>
                        {prediction?.nicotine || '未计算'}
                      </span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'left', width: '200px' }}>
                    <p style={{ margin: 0, fontSize: '16px' }}>
                      <strong>焦油:</strong>{' '}
                      <span style={{ color: prediction?.tar ? '#52c41a' : 'gray' }}>
                        {prediction?.tar || '未计算'}
                      </span>
                    </p>
                  </div>
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
