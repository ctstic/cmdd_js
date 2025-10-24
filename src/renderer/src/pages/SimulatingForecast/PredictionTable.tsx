import { ArrowDownOutlined, ArrowUpOutlined, ProfileOutlined } from '@ant-design/icons'
import type { EditableFormInstance, FormInstance, ProColumns } from '@ant-design/pro-components'
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
  formRef: FormInstance
  actionRef?: React.Ref<any>
}

const PredictionTable: React.FC<PredictionTableProps> = ({ formRef, actionRef }) => {
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

  // 对比新旧值
  const renderValueDiff = (newValue?: number, oldValue?: number) => {
    // 如果都为空
    if (newValue == null && oldValue == null)
      return <span style={{ color: '#999' }}>请进行计算</span>

    const diff = Number(newValue) - Number(oldValue)
    let color = '#000000' // 默认绿色
    let icon = null

    if (!isNaN(diff)) {
      if (diff > 0) {
        color = '#ff4d4f' // 上升红
        icon = <ArrowUpOutlined style={{ marginLeft: 4 }} />
      } else if (diff < 0) {
        color = '#52c41a' // 下降绿
        icon = <ArrowDownOutlined style={{ marginLeft: 4 }} />
      }
    }

    return (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {newValue ?? '未计算'}
        {!isNaN(diff) && diff !== 0 && (
          <span style={{ marginLeft: 4, color }}>
            {icon}
            {diff > 0 ? '+' : ''}
            {diff.toFixed(2)}
          </span>
        )}
      </span>
    )
  }

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
          title: '卷烟纸助燃剂含量 (%)',
          dataIndex: 'citrate'
        }
      ]
    },
    {
      title: '预测数据',
      dataIndex: 'foreCast',
      children: [
        {
          title: '焦油 (mg/支)',
          dataIndex: 'tar',
          readonly: true,
          renderFormItem: (_, { record }) => {
            return renderValueDiff(record?.tar as number, formRef?.getFieldValue?.('tar'))
          }
        },
        {
          title: '烟碱 (mg/支)',
          dataIndex: 'nicotine',
          readonly: true,
          renderFormItem: (_, { record }) => {
            return renderValueDiff(record?.nicotine as number, formRef?.getFieldValue?.('nicotine'))
          }
        },
        {
          title: 'CO (mg/支)',
          dataIndex: 'co',
          readonly: true,
          renderFormItem: (_, { record }) => {
            return renderValueDiff(record?.co as number, formRef?.getFieldValue?.('co'))
          }
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
    <StyledCard title="仿真预测结果" icon={<ProfileOutlined />} color="#52c41a">
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
