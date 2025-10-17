import React, { useEffect, useState, useRef } from 'react'
import { Button, message, Modal, Popconfirm } from 'antd'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'

export type CalculationModalProps = {
  type: number
  modalOpen: boolean
  onCancel: () => void
}

const HistoryModal: React.FC<CalculationModalProps> = ({ type, modalOpen, onCancel }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const actionRef = useRef<ActionType>()
  const [data, setData] = useState<any[]>([]) // 存储请求的数据
  const [loading, setLoading] = useState(false)

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  const columns: ProColumns<any>[] = [
    {
      title: '滤嘴通风率 (%)',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{Number(text).toFixed(2)}%</span>
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
      dataIndex: 'citrate',
      render: (text) => <span>{Number(text).toFixed(2)}%</span>
    },
    {
      title: '焦油 (mg/支)',
      dataIndex: 'tar'
    },
    {
      title: '烟碱 (mg/支)',
      dataIndex: 'nicotine'
    },
    {
      title: 'CO (mg/支)',
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
                  // 根据 `type` 决定调用哪个 API 进行导出
                  if (type) {
                    await window.electronAPI.simulationPredictionSaveAPI.exportId(record.id)
                  } else {
                    await window.electronAPI.recAuxMaterialsSaveAPI.exportId(record.id)
                  }
                  info('success', '导出成功！')
                  return true
                } catch (error) {
                  console.error('导出失败，错误详情：', error)
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
            render: (text) => <span>{Number(text).toFixed(2)}%</span>
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
            dataIndex: 'citrate',
            render: (text) => <span>{Number(text).toFixed(2)}%</span>
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
        headerTitle="预测推荐辅材参数表格"
        search={false}
        options={false}
        dataSource={record.profile}
      />
    )
  }

  // 请求数据的函数
  const fetchData = async () => {
    setLoading(true)
    try {
      const fetchedData = type
        ? await window.electronAPI.simulationPredictionSaveAPI.query()
        : await window.electronAPI.recAuxMaterialsSaveAPI.query()
      setData(fetchedData.data || [])
    } catch (error) {
      info('error', '数据加载失败，请重试！')
    } finally {
      setLoading(false)
    }
  }

  // 在每次 `modalOpen` 状态变化时请求数据
  useEffect(() => {
    if (modalOpen) {
      fetchData() // 每次打开时请求数据
    } else {
      setData([]) // 关闭时清空数据
    }
  }, [modalOpen, type]) // 监听 `modalOpen` 和 `type` 的变化

  return (
    <>
      {contextHolder}
      <Modal
        width="80%"
        title={type ? '仿真预测历史数据信息' : '推荐辅材参数历史数据信息'}
        open={modalOpen}
        footer={
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        }
        onCancel={onCancel}
      >
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          pagination={{
            showQuickJumper: true
          }}
          expandable={{ expandedRowRender }}
          search={false}
          dateFormatter="string"
          options={false}
          loading={loading} // 显示加载状态
          dataSource={data} // 设置表格数据源
        />
      </Modal>
    </>
  )
}

export default HistoryModal
