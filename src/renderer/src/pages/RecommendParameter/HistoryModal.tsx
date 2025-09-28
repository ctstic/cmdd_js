import React, { useRef } from 'react'
import { message } from 'antd'
import { ModalForm, ProFormText, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ProFormInstance } from '@ant-design/pro-components'

export type CalculationModalProps = {
  modalOpen: boolean
  onCancel: () => void
  title: string
}

const HistoryModal: React.FC<CalculationModalProps> = ({ title, modalOpen, onCancel }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const restFormRef = useRef<ProFormInstance>()

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  const columns: ProColumns<TableListItem>[] = [
    {
      title: '滤嘴通风率',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
    },
    {
      title: '滤棒压降 (Pa)',
      dataIndex: 'filterPressureDrop'
    },
    {
      title: '透气度 (CU)',
      dataIndex: 'permeability'
    },
    {
      title: '定量 (g/m²)',
      dataIndex: 'quantitative'
    },
    {
      title: '柠檬酸根 (含量)',
      dataIndex: 'citrate',
      render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
    },
    {
      title: '焦油',
      dataIndex: 'tar'
    },
    {
      title: '烟碱',
      dataIndex: 'nicotine'
    },
    {
      title: 'CO',
      dataIndex: 'co'
    }
  ]

  const expandedRowRender = () => {
    return (
      <ProTable
        columns={[
          {
            title: '滤嘴通风率',
            dataIndex: 'filterVentilation',
            render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
          },
          {
            title: '滤棒压降 (Pa)',
            dataIndex: 'filterPressureDrop'
          },
          {
            title: '透气度 (CU)',
            dataIndex: 'permeability'
          },
          {
            title: '定量 (g/m²)',
            dataIndex: 'quantitative'
          },
          {
            title: '柠檬酸根 (含量)',
            dataIndex: 'citrate',
            render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
          },
          {
            title: '焦油',
            dataIndex: 'tar'
          },
          {
            title: '烟碱',
            dataIndex: 'nicotine'
          },
          {
            title: 'CO',
            dataIndex: 'co'
          }
        ]}
        headerTitle="预测数据表格"
        search={false}
        options={false}
        dataSource={data}
        pagination={false}
      />
    )
  }

  return (
    <>
      {contextHolder}
      <ModalForm
        title={`${title} -- 保存此牌号数据`}
        formRef={restFormRef}
        open={modalOpen}
        onFinish={async (values) => {
          console.log(values, 'values')
          onCancel()
          info('success', '保存成功！')
        }}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => onCancel()
        }}
      >
        <ProTable<TableListItem>
          headerTitle="基准数据表格"
          columns={columns}
          request={(params, sorter, filter) => {
            // 表单搜索项会从 params 传入，传递给后端接口。
            console.log(params, sorter, filter)
            return Promise.resolve({
              data: tableListDataSource,
              success: true
            })
          }}
          rowKey="key"
          pagination={{
            showQuickJumper: true
          }}
          expandable={{ expandedRowRender }}
          search={false}
          dateFormatter="string"
          options={false}
        />
      </ModalForm>
    </>
  )
}

export default HistoryModal
