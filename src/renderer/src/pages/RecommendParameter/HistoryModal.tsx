import React, { useRef } from 'react'
import { Button, message, Modal, Popconfirm } from 'antd'
import {  ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'

export type CalculationModalProps = {
  modalOpen: boolean
  onCancel: () => void
  type: number
  historyData: any
}

const HistoryModal: React.FC<CalculationModalProps> = ({
  type,
  historyData,
  modalOpen,
  onCancel
}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const actionRef = useRef<ActionType>()

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
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => {
        return (
          <>
            <Button
              type="link"
              onClick={async () => {
                try {
                  if (type) {
                    const res = await window.electronAPI.simulationPredictionSaveAPI.exportId(
                      record.id
                    )
                  } else {
                    const res = await window.electronAPI.recAuxMaterialsSaveAPI.exportId(record.id)
                  }
                  // console.log(res, 'resresres')

                  info('success', '导出成功！')
                  // if (actionRef.current) {
                  //   actionRef.current.reload()
                  // }
                  return true
                } catch {
                  info('error', '导出失败，请重试！')
                  return false
                }
              }}
            >
              导出
            </Button>
            <Popconfirm
              key="remove"
              title="确认要删除吗？"
              okText="是"
              cancelText="否"
              onConfirm={async () => {
                try {
                  if (type) {
                    await window.electronAPI.simulationPredictionSaveAPI.delete(record.id)
                  } else {
                    await window.electronAPI.recAuxMaterialsSaveAPI.delete(record.id)
                  }
                  info('success', '删除成功！')
                  if (actionRef.current) {
                    actionRef.current.reload()
                  }
                  return true
                } catch {
                  info('error', '删除失败，请重试！')
                  return false
                }
              }}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </>
        )
      }
    }
  ]

  const expandedRowRender = (record) => {
    return (
      <ProTable
        rowKey="key"
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
        dataSource={record.profile}
        // pagination={false}
      />
    )
  }

  return (
    <>
      {contextHolder}
      <Modal
        width="80%"
        title={type ? '历史数据信息' : '历史数据信息'}
        open={modalOpen}
        footer={
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        }
        onCancel={onCancel}
      >
        <ProTable
          headerTitle="基准数据表格"
          columns={columns}
          actionRef={actionRef}
          dataSource={historyData}
          request={async (params, sorter, filter) => {
            // console.log(params, sorter, filter)
            if (type) {
              return await window.electronAPI.simulationPredictionSaveAPI.query()
            } else {
              return await window.electronAPI.recAuxMaterialsSaveAPI.query()
            }
          }}
          rowKey="id"
          pagination={{
            showQuickJumper: true
          }}
          expandable={{ expandedRowRender }}
          search={false}
          dateFormatter="string"
          options={false}
        />
      </Modal>
    </>
  )
}

export default HistoryModal
