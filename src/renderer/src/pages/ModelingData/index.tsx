import React, { useState, useEffect } from 'react'
import { Table, Popconfirm, Button, message, Upload, Space, Input } from 'antd'
import CalculationModal from './components/CalculationModal'
import TestResultModal from './components/TestResultModal'
import type { TableProps, UploadProps, UploadFile } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
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
  const [importing, setImporting] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [messageApi, contextHolder] = message.useMessage()

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  // 加载所有
  const loadUsers = async (): Promise<void> => {
    const result = await window.electronAPI.cigarettes.query('')
    setTableData(result.data || [])
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // 处理文件上传
  const handleUpload = async (file: File): Promise<void> => {
    setImporting(true)

    try {
      // 验证文件类型
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/excel'
      ]

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        // message.error('请上传Excel文件(.xlsx或.xls格式)')
        info('error', '请上传Excel文件(.xlsx或.xls格式)')
        return
      }

      // 验证文件大小 (限制为10MB)
      if (file.size > 10 * 1024 * 1024) {
        info('error', '文件大小不能超过10MB')
        return
      }
      // console.log(file.size)
      info('warning', '正在导入数据，请稍候...')
      // 调用导入服务
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // 传给 Node (Electron Main)
      const result = await window.electronAPI.cigarettes.importFromWebFile({
        name: file.name,
        buffer: uint8Array
      })
      console.log(result)
      if (result.data.errors?.length === 0) {
        info('success', `导入成功`)
        loadUsers()
      } else {
        info('error', `导入失败，${result.data.errors[0]}`)
      }
    } catch (error) {
      info('error', '导入失败')
    } finally {
      setImporting(false)
    }
  }

  // Upload组件配置
  const uploadProps: UploadProps = {
    name: 'file',
    // type:'primary',
    multiple: false,
    fileList: fileList,
    beforeUpload: (file) => {
      handleUpload(file as BrowserFile)
      return false // 阻止自动上传
    },
    onChange: (info) => {
      setFileList(info.fileList.slice(-1)) // 只保留最后一个文件
    },
    onRemove: () => {
      setFileList([])
    },
    accept: '.xlsx,.xls',
    showUploadList: {
      showRemoveIcon: true,
      showPreviewIcon: false
    }
  }

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
      title: '柠檬酸根 (设计值)',
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
        <Upload {...uploadProps}>
          <Button disabled={importing} loading={importing}>
            {importing ? '导入中...' : '导入Excel数据'}
          </Button>
        </Upload>
         <Button type="link"onClick={handleDownload}>下载模板</Button>
      </Space>
      <Table<DataType> rowKey="id" columns={columns} dataSource={tableData} />
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
