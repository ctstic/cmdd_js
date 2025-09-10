import React, { useState, useEffect } from 'react'
import { Table, Popconfirm, Button, message } from 'antd'
import type { TableProps } from 'antd'
import CalculationModal from './components/CalculationModal'
import TestResultModal from './components/TestResultModal'

interface DataType {
  id: number
  code: string
  filterVentilation: string
  filterPressureDrop: number
  permeability: string
  quantitative: string
  citrate: string
  potassiumRatio: string
  co: string
  nicotine: string
  tar: string
}

const ModelingData: React.FC = () => {
  const [tableData, setTableData] = useState<DataType[]>([])
  const [calculationModal, setCalculationModal] = useState<boolean>(false)
  const [modalData, setModalData] = useState<DataType[]>([])
  const [testResultModal, setTestResultModal] = useState<boolean>(false)
  const [currentRow, setCurrentRow] = useState<Partial<DataType[]> | undefined>(undefined)

  // 加载所有
  const loadUsers = async (): Promise<void> => {
    const result = await window.electronAPI.cigarettes.query('')
    setTableData(result.data || [])
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '编号',
      dataIndex: 'code',
      render: (text, record) => (
        <a
          onClick={() => {
            setCurrentRow(record)
            setTestResultModal(true)
          }}
        >
          {text}
        </a>
      )
    },
    {
      title: '滤嘴通风率',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{Number(text) * 100}%</span>
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
      title: '柠檬酸根 (设计值)',
      dataIndex: 'citrate',
      render: (text) => <span>{Number(text) * 100}%</span>
    },
    {
      title: '钾盐占比',
      dataIndex: 'potassiumRatio'
    },
    {
      title: '操作',
      key: 'option',
      render: (_, record) => {
        return (
          <>
            <Popconfirm
              key="remove"
              title={`确认要删除 ${record?.code} 吗?`}
              okText="是"
              cancelText="否"
              onConfirm={async () => {
                try {
                  const res = await window.electronAPI.cigarettes.delete(record.id)
                  if (res.success) {
                    message.success('删除成功')
                    setTableData((prevData) => prevData.filter((item) => item.id !== record.id))
                  } else {
                    message.error('删除失败，请重试')
                  }
                } catch (error) {
                  message.error('删除文献失败，请重试')
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
      <Button
        type="primary"
        onClick={async () => {
          setCalculationModal(true)
          try {
            console.log('1111111111111111111111111')

            const res = await window.electronAPI.harmful.query('')
            message.success('删除文献成功')
            // if (actionRef.current) {
            //   actionRef.current.reload();
            // }
            setModalData(res.data)
            setCalculationModal(true)
            return true
          } catch (error) {
            message.error('删除文献失败，请重试')
            return false
          }
        }}
      >
        计算系数管理
      </Button>
      <Table<DataType> rowKey="id" columns={columns} dataSource={tableData} />
      <CalculationModal
        modalData={modalData}
        modalOpen={calculationModal}
        onCancel={() => {
          setCalculationModal(false)
        }}
      />
      <TestResultModal
        data={currentRow}
        modalOpen={testResultModal}
        onCancel={() => {
          setTestResultModal(false)
        }}
      />
    </>
  )
}

export default ModelingData
