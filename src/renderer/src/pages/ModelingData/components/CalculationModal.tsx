import React, { useState } from 'react'
import { Button, Modal, Table, Popconfirm, message } from 'antd'
import type { TableProps } from 'antd'

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
  const columns: TableProps<DataType>['columns'] = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      render: (text) => <a>{text}</a>
    },
    {
      title: '有害成分类型',
      dataIndex: 'type'
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
      title: '柠檬酸根 (设计值) 系数',
      dataIndex: 'citrateCoef'
    },
    {
      title: '钾盐占比系数',
      dataIndex: 'potassiumCoef'
    },
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
                  message.success('删除文献成功')
                  setModalData(res.data)
                  return true
                } catch {
                  message.error('删除文献失败，请重试')
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
      <Modal
        width="80%"
        title="计算系数表格"
        open={modalOpen}
        // onOk={handleOk}
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
              const res = await window.electronAPI.harmful.generate()
              message.success('删除文献成功')
              console.log(res, 'aaaaaa')
              return true
            } catch {
              message.error('删除文献失败，请重试')
              return false
            }
          }}
        >
          生成系数管理
        </Button>
        <Table<DataType> rowKey="id" columns={columns} dataSource={modalData} />
      </Modal>
    </>
  )
}

export default CalculationModal
