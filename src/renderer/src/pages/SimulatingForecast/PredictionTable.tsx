import { LineChartOutlined } from '@ant-design/icons'
import type { EditableFormInstance, ProColumns } from '@ant-design/pro-components'
import { EditableProTable } from '@ant-design/pro-components'
import { Card, Typography } from 'antd'
import React, { useState, useRef, useImperativeHandle } from 'react'
import { createStyles } from 'antd-style'

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
  // expandedRowKeys: React.Key[]
}

const cardHeaderStyle = {
  background: `linear-gradient(90deg, #52c41a20 0%, #ffffff 100%)`,
  padding: '16px 24px',
  borderRadius: '12px 12px 0 0',
  borderBottom: `2px solid #52c41a40`
}

const PredictionTable: React.FC<PredictionTableProps> = ({ actionRef }) => {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])
  const [dataSource, setDataSource] = useState<readonly DataSourceType[]>([])
  const editableTableRef = useRef<EditableFormInstance<DataSourceType>>()
  const { styles } = useStyle()

  useImperativeHandle(actionRef, () => ({
    getData: () => dataSource,
    setData: (newData: DataSourceType[]) => setDataSource(newData),
    setRowsData: (index, data) => {
      if (editableTableRef.current) {
        editableTableRef.current.setRowData?.(index, data)
      }
    }
  }))

  const columns: ProColumns<DataSourceType>[] = [
    {
      title: '基础数据',
      dataIndex: 'data',
      children: [
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
          title: '柠檬酸根（含量）（%）',
          dataIndex: 'citrate'
        }
        // {
        //   title: '钾盐占比（%）',
        //   dataIndex: 'potassiumRatio'
        // },
      ]
    },
    {
      title: '预测数据',
      dataIndex: 'foreCast',
      children: [
        {
          title: '焦油（mg/支）',
          dataIndex: 'tar',
          readonly: true
        },
        {
          title: '烟碱（mg/支）',
          dataIndex: 'nicotine',
          readonly: true
        },
        {
          title: 'CO（mg/支）',
          dataIndex: 'co',
          readonly: true
        }
      ]
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
      style={{
        marginBottom: 10,
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #52c41a30',
        flex: 1
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={cardHeaderStyle}>
        {React.cloneElement(<LineChartOutlined />, {
          style: { marginRight: 12, color: '#52c41a', fontSize: '18px' }
        })}
        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
          预测卷烟辅材参数
        </Text>
      </div>
      <div style={{ padding: '24px' }}>
        <EditableProTable<DataSourceType>
          // expandedRowKeys={expandedRowKeys}
          className={styles.customTable}
          scroll={{ x: 960 }}
          bordered
          editableFormRef={editableTableRef}
          columns={columns}
          recordCreatorProps={{
            // position:'top',
            newRecordType: 'dataSource',
            record: () => ({ key: Date.now() })
          }}
          rowKey="key"
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
        />
      </div>
    </Card>
  )
}

export default PredictionTable
