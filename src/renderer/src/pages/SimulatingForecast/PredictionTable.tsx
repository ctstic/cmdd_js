import { LineChartOutlined } from '@ant-design/icons'
import type { EditableFormInstance, ProColumns } from '@ant-design/pro-components'
import { EditableProTable } from '@ant-design/pro-components'
import React, { useState, useRef, useImperativeHandle } from 'react'
import { createStyles } from 'antd-style'
import { StyledCard } from '@renderer/components/base'

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
          title: '滤嘴通风率 (%)',
          dataIndex: 'filterVentilation'
        },
        {
          title: '滤棒压降 (Pa)',
          dataIndex: 'filterPressureDrop'
        },
        {
          title: '卷烟纸透气度 (CU)',
          dataIndex: 'permeability'
        },
        {
          title: '卷烟纸定量 (g/m²)',
          dataIndex: 'quantitative'
        },
        {
          title: '卷烟纸阻燃剂含量 (%)',
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
          title: '焦油 (mg/支)',
          dataIndex: 'tar',
          readonly: true
        },
        {
          title: '烟碱 (mg/支)',
          dataIndex: 'nicotine',
          readonly: true
        },
        {
          title: 'CO (mg/支)',
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
    <StyledCard title="基准卷烟主流烟气" icon={<LineChartOutlined />} color="#52c41a">
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
    </StyledCard>
  )
}

export default PredictionTable
