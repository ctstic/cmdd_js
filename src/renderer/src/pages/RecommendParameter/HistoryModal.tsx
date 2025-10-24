import React, { useEffect, useState, useRef } from 'react'
import { Button, Divider, message, Modal, notification, Popconfirm, Space, Typography } from 'antd'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'

export type CalculationModalProps = {
  type: number
  modalOpen: boolean
  onCancel: () => void
}

const HistoryModal: React.FC<CalculationModalProps> = ({ type, modalOpen, onCancel }) => {
  const [notificationApi, contextHolder] = notification.useNotification()

  const actionRef = useRef<ActionType>()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { Text } = Typography

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    notificationApi[type]({
      message: msg
    })
  }

  const InfoItem = ({
    label,
    value,
    valueStyle
  }: {
    label: string
    value: string | number
    valueStyle?: React.CSSProperties
  }) => (
    <Text strong style={{ fontSize: '16px', color: '#595959', fontWeight: '600' }}>
      {label}：<Text style={{ fontSize: '16px', fontWeight: 600, ...valueStyle }}>{value}</Text>
    </Text>
  )

  const DividerItem = () => (
    <Divider type="vertical" style={{ height: '10px', margin: '0', borderColor: '#e8e8e8' }} />
  )

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
    if (modalOpen) fetchData()
    else setData([]) // 关闭时清空数据
  }, [modalOpen, type])

  // 基本字段columns，父级表格columns
  const baseColumns: ProColumns<any>[] = [
    {
      title: '序号',
      render: (text, record, index) => `${index + 1}`
    },

    {
      title: '基准 滤嘴通风率 (%)',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{Number(text).toFixed(2)}%</span>
    },
    { title: '基准 滤棒压降 (Pa)', dataIndex: 'filterPressureDrop' },
    { title: '基准 卷烟纸透气度 (CU)', dataIndex: 'permeability' },
    { title: '基准 卷烟纸定量 (g/m²)', dataIndex: 'quantitative' },
    {
      title: '基准 卷烟纸助燃剂含量 (%)',
      dataIndex: 'citrate',
      render: (text) => <span>{Number(text).toFixed(2)}%</span>
    },
    { title: '基准 焦油 (mg/支)', dataIndex: 'tar' },
    { title: '基准 烟碱 (mg/支)', dataIndex: 'nicotine' },
    { title: '基准 CO (mg/支)', dataIndex: 'co' }
  ]

  // 操作列
  const actionColumn: ProColumns<any> = {
    title: '操作',
    valueType: 'option',
    render: (_, record) => (
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
              fetchData()
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

  // 子表格columns，包含预测结果等
  const expandedColumns: ProColumns<any>[] = [
    {
      title: '序号',
      render: (text, record, index) => `${index + 1}`
    },

    {
      title: '滤嘴通风率 (%)',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{Number(text).toFixed(2)}%</span>
    },
    { title: '滤棒压降 (Pa)', dataIndex: 'filterPressureDrop' },
    { title: '卷烟纸透气度 (CU)', dataIndex: 'permeability' },
    { title: '卷烟纸定量 (g/m²)', dataIndex: 'quantitative' },
    {
      title: '卷烟纸助燃剂含量 (%)',
      dataIndex: 'citrate',
      render: (text) => <span>{Number(text).toFixed(2)}%</span>
    },
    { title: '焦油 (mg/支)', dataIndex: 'tar' },
    { title: '烟碱 (mg/支)', dataIndex: 'nicotine' },
    { title: 'CO (mg/支)', dataIndex: 'co' }
  ]

  return (
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
      {contextHolder}
      <ProTable
        columns={[...baseColumns, actionColumn]}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ showQuickJumper: true }}
        expandable={{
          expandedRowRender: (record) => (
            <>
              {!type && (
                <Space
                  size="large"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(250, 140, 22, 0.1)', // 浅橙色背景
                    margin: '0px 20px',
                    padding: '10px 30px',
                    borderRadius: '15px', // 更圆滑的圆角
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)', // 更明显的阴影效果
                    flexWrap: 'wrap',
                    transition: 'all 0.3s ease' // 平滑的过渡动画
                  }}
                >
                  <InfoItem label="目标焦油(mg/支)" value={record.targetTar} />
                  <DividerItem />

                  <InfoItem label="目标烟碱(mg/支)" value={record.targetNicotine} />
                  <DividerItem />

                  <InfoItem label="目标CO(mg/支)" value={record.targetCo} />
                  <DividerItem />

                  <InfoItem
                    label="焦油权重"
                    value={record.tarWeight}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <DividerItem />

                  <InfoItem
                    label="烟碱权重"
                    value={record.nicotineWeight}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <DividerItem />

                  <InfoItem
                    label="CO权重"
                    value={record.coWeight}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Space>
              )}
              <ProTable
                rowKey="key"
                columns={expandedColumns}
                headerTitle={type ? '仿真预测预测结果' : '推荐辅材参数推荐结果'}
                search={false}
                options={false}
                dataSource={record.profile}
              />
            </>
          )
        }}
        search={false}
        dateFormatter="string"
        options={false}
        loading={loading}
        dataSource={data}
      />
    </Modal>
  )
}

export default HistoryModal
