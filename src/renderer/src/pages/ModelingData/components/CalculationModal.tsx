import React from 'react'
import { Button, Modal, Table, Popconfirm, message, Input, Space } from 'antd'
import type { TableProps } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface DataType {
  id: number
  batchNo: number
  type: string
  quantitativeCoef: string
  permeabilityCoef: string
  filterPressureCoef: string
  filterVentCoef: string
  citrateCoef: string
  potassiumCoef: string
}

export type CalculationModalProps = {
  modalOpen: boolean
  onCancel: () => void
  modalData: any
  setModalData: React.Dispatch<React.SetStateAction<DataType[]>>
}

const CalculationModal: React.FC<CalculationModalProps> = ({
  modalData,
  modalOpen,
  setModalData,
  onCancel
}) => {
  const [messageApi, contextHolder] = message.useMessage()

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  const getColumnSearchProps = () => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          // ref={searchInput}
          placeholder={`搜索批次号`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => {
              clearFilters()
              confirm()
            }}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      return record.batchNo ? record.batchNo.includes(value) : false
    }
  })

  const columns: TableProps<DataType> = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      ...getColumnSearchProps()
    },
    {
      title: '有害成分类型',
      dataIndex: 'type',
      filters: [
        { text: 'tar', value: 'tar' },
        { text: 'nicotine', value: 'nicotine' },
        { text: 'co', value: 'co' }
      ],
      onFilter: (value, record) => record.type === value
    },
    {
      title: '常量',
      dataIndex: 'changliang'
    },
    {
      title: '滤嘴通风率系数',
      dataIndex: 'filterVentCoef'
    },
    {
      title: '滤棒压降 (Pa) 系数',
      dataIndex: 'filterPressureCoef'
    },
    {
      title: '透气度 (CU) 系数',
      dataIndex: 'permeabilityCoef'
    },
    {
      title: '定量 (g/m²) 系数',
      dataIndex: 'quantitativeCoef'
    },
    {
      title: '柠檬酸根 (含量) 系数',
      dataIndex: 'citrateCoef'
    },
    // {
    //   title: '钾盐占比系数',
    //   dataIndex: 'potassiumCoef'
    // },
    {
      title: '操作',
      key: 'option',
      render: (_, record) => {
        return (
          <>
            <Popconfirm
              key="remove"
              title={`确认要删除 ${record.batchNo} 吗?`}
              okText="是"
              cancelText="否"
              onConfirm={async () => {
                try {
                  await window.electronAPI.harmful.delete(record.id)
                  const res = await window.electronAPI.harmful.query('')
                  info('success', '删除所有相同批次号成功')
                  setModalData(res.data)
                  return true
                } catch {
                  info('error', '删除所有相同批次号失败，请重试')
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

  return (
    <>
      {contextHolder}
      <Modal
        width="80%"
        title="计算系数表格"
        open={modalOpen}
        footer={
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        }
        onCancel={onCancel}
      >
        <Button
          type="primary"
          onClick={async () => {
            try {
              await window.electronAPI.harmful.generate()
              info('success', '生成计算系数成功')
              const res = await window.electronAPI.harmful.query('')
              setModalData(res.data)
              return true
            } catch {
              info('error', '生成计算系数失败，请重试')
              return false
            }
          }}
          style={{ marginBottom: 16 }}
        >
          生成计算系数
        </Button>
        <Table<DataType> scroll={{ x: 800 }} rowKey="id" columns={columns} dataSource={modalData} />
      </Modal>
    </>
  )
}

export default CalculationModal
