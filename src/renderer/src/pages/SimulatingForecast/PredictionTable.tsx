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
  expandedRowKeys: React.Key[]
}

const PredictionTable: React.FC<PredictionTableProps> = ({ actionRef, expandedRowKeys }) => {
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
    // {
    //   title: '钾盐占比（%）',
    //   dataIndex: 'potassiumRatio'
    // },
    {
      title: '操作',
      valueType: 'option',
      render: () => {
        return null
      }
    }
  ]

  return (
    <EditableProTable<DataSourceType>
      expandedRowKeys={expandedRowKeys}
      actionRef={editableTableRef}
      columns={columns}
      recordCreatorProps={{
        // position:'top',
        newRecordType: 'dataSource',
        record: () => ({ key: Date.now() })
      }}
      rowKey="key"
      scroll={{ x: 960 }}
      value={dataSource}
      onChange={setDataSource}
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
                  <strong>焦油:</strong>
                  <span style={{ color: prediction?.tar ? '#52c41a' : 'gray' }}>
                    {prediction?.tar || '未计算'}
                  </span>
                </p>
              </div>
              <div style={{ textAlign: 'left', width: '200px' }}>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  <strong>烟碱:</strong>
                  <span style={{ color: prediction?.nicotine ? '#52c41a' : 'gray' }}>
                    {prediction?.nicotine || '未计算'}
                  </span>
                </p>
              </div>
              <div style={{ textAlign: 'left', width: '200px' }}>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  <strong>CO:</strong>
                  <span style={{ color: prediction?.co ? '#52c41a' : 'gray' }}>
                    {prediction?.co || '未计算'}
                  </span>
                </p>
              </div>
            </div>
          )
        }
      }}
    />
  )
}

export default PredictionTable
