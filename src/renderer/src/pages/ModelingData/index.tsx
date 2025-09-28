import React, { useState, useEffect, useRef } from 'react'
import {
  Table,
  Popconfirm,
  Button,
  message,
  Space,
  Input,
  Flex,
  List,
  Card,
  Typography
} from 'antd'
import CalculationModal from './components/CalculationModal'
import TestResultModal from './components/TestResultModal'
import type { TableProps } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { ModalForm, ProFormText, ProFormUploadButton } from '@ant-design/pro-components'
import type { ProFormInstance } from '@ant-design/pro-components'

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
  // const [importing, setImporting] = useState(false)
  // const [fileList, setFileList] = useState<UploadFile[]>([])
  const [messageApi, contextHolder] = message.useMessage()
  const [typeData, setTypeData] = useState<DataType[]>([])
  const [uploadModal, setUploadModal] = useState<boolean>(false)
  const restFormRef = useRef<ProFormInstance>()

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  const loadTypes = async (): Promise<void> => {
    const result = await window.electronAPI.cigarettes.getcigarettesType('')
    console.log(result, 'resultresultresultresult')

    setTypeData(result.data || [])
  }

  // 加载所有
  const loadUsers = async (): Promise<void> => {
    const result = await window.electronAPI.cigarettes.query('')
    setTableData(result.data || [])
  }

  useEffect(() => {
    loadTypes()
    loadUsers()
  }, [])

  const handleDownload = async () => {
    // 1) 取出打包资源（Vite 的 import.meta.url 可生成正确路径）
    const url = new URL('../../assets/软件数据模板.xlsx', import.meta.url).href
    const res = await fetch(url)
    if (!res.ok) throw new Error('资源读取失败')
    const blob = await res.blob()

    // 2) 生成临时下载链接并触发保存（落到系统默认“下载”目录）
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = '模板文件.xlsx' // 你想要的文件名
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  }

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
      ),
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
        return record.code ? record.code.includes(value) : false
      }
    },
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
      title: '钾盐占比',
      dataIndex: 'potassiumRatio'
    },
    {
      title: '焦油（mg/支）',
      dataIndex: 'tar'
    },
    {
      title: '烟碱（mg/支）',
      dataIndex: 'nicotine'
    },
    {
      title: 'CO（mg/支）',
      dataIndex: 'co'
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
                    info('success', '删除成功')
                    setTableData((prevData) => prevData.filter((item) => item.id !== record.id))
                  } else {
                    info('error', '删除失败，请重试')
                  }
                } catch {
                  info('error', '删除失败，请重试')
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
      <Space style={{ marginBottom: '15px' }}>
        <Button
          type="primary"
          onClick={async () => {
            setCalculationModal(true)
            try {
              const res = await window.electronAPI.harmful.query('')
              setModalData(res.data)
              setCalculationModal(true)
              return true
            } catch {
              info('error', '网络错误')
              return false
            }
          }}
        >
          计算系数管理
        </Button>
        <Popconfirm
          key="remove"
          title="确认要删除此类型下所有数据吗？"
          okText="是"
          cancelText="否"
          onConfirm={async () => {
            try {
              // const res = await window.electronAPI.cigarettes.delete(record.id)
              info('success', '删除成功')
              // setTableData((prevData) => prevData.filter((item) => item.id !== record.id))
            } catch {
              info('error', '删除失败，请重试')
            }
          }}
        >
          <Button type="primary" danger>
            删除此类数据
          </Button>
        </Popconfirm>

        <Button
          type="primary"
          onClick={async () => {
            setUploadModal(true)
          }}
        >
          导入数据
        </Button>

        <Button type="link" onClick={handleDownload}>
          下载模板
        </Button>
      </Space>
      <Flex gap={30} align="flex-start">
        <Card
          title="类别信息"
          bordered={false}
          style={{
            width: '320px',
            minWidth: '320px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
          }}
          bodyStyle={{ padding: '8px 0' }}
        >
          <List
            dataSource={typeData}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <Typography.Text style={{ fontSize: '14px' }}>{item}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>

        <Card
          title="表格标题"
          bordered={false}
          style={{
            flex: 1,
            minWidth: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
          }}
        >
          <Table<DataType>
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 15
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Flex>
      <ModalForm
        title={'上传aaa'}
        formRef={restFormRef}
        open={uploadModal}
        onFinish={async (values) => {
          console.log(values, 'values')

          if (values.upload[0].size > 10 * 1024 * 1024) {
            info('error', '文件大小不能超过10MB')
            return
          }

          const arrayBuffer = await values.upload[0].originFileObj.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          const result = await window.electronAPI.cigarettes.importFromWebFile({
            type: values.brandName,
            name: values.upload[0].originFileObj,
            buffer: uint8Array
          })

          if (result.data.errors?.length === 0) {
            info('success', `导入成功`)
            loadUsers()
            setUploadModal(false)
          } else {
            info('error', `导入失败，${result.data.errors[0]}`)
            setUploadModal(false)
          }
        }}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setUploadModal(false)
        }}
      >
        <ProFormText width="md" name="brandName" label="牌号名称" placeholder="请输入牌号名称" />
        <ProFormUploadButton
          accept=".xlsx,.xls"
          name="upload"
          label="上传xlsx数据"
          max={1}
          rules={[
            {
              required: true,
              message: '请上传文件！'
            }
          ]}
          fieldProps={{
            name: 'file',
            showUploadList: {
              showRemoveIcon: true
            },
            beforeUpload(file) {
              restFormRef.current?.setFields('upload', file)
              return false
            }
          }}
        />
      </ModalForm>

      <CalculationModal
        modalData={modalData}
        setModalData={setModalData}
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
