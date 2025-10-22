import React, { useEffect, useState } from 'react'
import { Form, Select, Flex, notification } from 'antd'

const { useNotification } = notification

interface ModelTypeSelectProps {
  name?: string // 表单字段名
  label?: string // 显示标签
  required?: boolean // 是否必填
  form?: any // 传入父表单实例
}

const ModelTypeSelect: React.FC<ModelTypeSelectProps> = ({
  name = 'modelType',
  label = '请选择模型类别：',
  required = true,
  form
}) => {
  const [typeData, setTypeData] = useState<{ label: string; value: string }[]>([])
  const [api, contextHolder] = useNotification()

  // ✅ 监听该字段的当前值（会在 resetFields() 后变为 undefined）
  const currentValue = Form.useWatch(name, form)

  // 获取模型类别
  const handleTypeData = async (): Promise<void> => {
    try {
      const typeData = await window.electronAPI.cigarettes.getCigarettesType('')
      const formatted = typeData.data.map((item: string) => ({ label: item, value: item })) || []
      setTypeData(formatted)

      // 首次加载时，如果没值，默认选中第一项
      if (formatted.length > 0) {
        const v = form?.getFieldValue(name)
        if (v == null || v === '') {
          form?.setFieldValue(name, formatted[0].value)
        }
      }
    } catch {
      api.error({ message: '网络错误！' })
    }
  }

  useEffect(() => {
    handleTypeData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ 核心：当表单被 reset 后，currentValue 会变成 undefined，
  // 这里自动把它恢复为默认值（例如列表第一项）
  useEffect(() => {
    if ((currentValue == null || currentValue === '') && typeData.length > 0) {
      form?.setFieldValue(name, typeData[0].value)
    }
  }, [currentValue, typeData, form, name])

  return (
    <>
      {contextHolder}
      <Flex align="center" justify="start" gap={2}>
        <Form.Item
          name={name}
          label={label}
          layout="horizontal"
          style={{ marginBottom: 5 }}
          rules={required ? [{ required: true, message: '请选择模型类别！' }] : undefined}
        >
          <Select
            style={{
              marginBottom: '10px',
              minWidth: '200px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            showSearch
            placeholder="请选择模型"
            optionFilterProp="label"
            allowClear
            options={typeData}
          />
        </Form.Item>
      </Flex>
    </>
  )
}

export default ModelTypeSelect
