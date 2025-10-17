import React, { useEffect, useState } from 'react'
import type { FormInstance } from 'antd'
import { Button, Flex, notification, Select, Modal, Input } from 'antd'
import { FormFieldConfig } from '@renderer/pages/formd'

interface BrandSelectPanelProps {
  type: string
  formRef: FormInstance
  FormFields: FormFieldConfig[]
  width: number
}

// 定义品牌烟数据的类型
interface BrandSmokeData {
  mark: string
  [key: string]: any // 其他字段可以是任意类型
}

const BrandSelectPanel: React.FC<BrandSelectPanelProps> = ({
  type,
  formRef,
  FormFields,
  width
}) => {
  const [notificationApi, contextHolder] = notification.useNotification()
  const [brandNameOption, setBrandNameOption] = useState<{ label: string; value: string }[]>([])
  const [brandNameSmokeData, setBrandNameSmokeData] = useState<BrandSmokeData[]>([]) // 使用明确的类型

  // Modal相关状态
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [paramName, setParamName] = useState('')

  // 校验表单是否完整
  const checkFormValues = (fields: FormFieldConfig[], formValues: { [key: string]: any }) => {
    return fields.every((field) => formValues[field.name] != null && formValues[field.name] !== '')
  }

  // 获取参数列表
  const handleBrandName = async (): Promise<void> => {
    try {
      const optionData =
        type === 'fucai'
          ? await window.electronAPI.ramMark.query('')
          : await window.electronAPI.rfgMark.query('')
      setBrandNameOption(
        optionData.data.map((item: { mark: string }) => ({ label: item.mark, value: item.mark })) ||
          []
      )
      // 保存详细数据
      setBrandNameSmokeData(optionData.data)
    } catch {
      notificationApi.error({
        message: '网络错误！'
      })
    }
  }

  useEffect(() => {
    handleBrandName()
  }, [type]) // 依赖 type 确保在 type 改变时重新加载

  // 动态生成表单字段并赋值
  const setFormValues = (selectedItem: BrandSmokeData) => {
    const formValues = FormFields.reduce(
      (acc, field) => {
        if (selectedItem[field.name] !== undefined) {
          acc[field.name] = selectedItem[field.name] // 将每个字段的值赋给对应的 key
        }
        return acc
      },
      {} as { [key: string]: any }
    ) // 初始化为空对象并明确类型

    formRef.setFieldsValue(formValues)
  }

  // 选择
  const onChange = (value: string) => {
    const selectedItem = brandNameSmokeData.find((item) => item.mark === value)
    if (selectedItem) {
      setFormValues(selectedItem)
    }
  }

  // 校验输入
  const onClick = async (): Promise<void> => {
    const formValues = await formRef.getFieldsValue()
    if (checkFormValues(FormFields, formValues)) {
      setIsModalVisible(true) // 打开弹窗
    } else {
      notificationApi.error({
        message: `请输入完整的基准卷烟${type === 'fucai' ? '辅材参数' : '主流烟气'}！`
      })
    }
  }

  // 保存参数
  const handleOk = async (): Promise<void> => {
    console.log('输入的名字:', paramName)
    const formValues = formRef.getFieldsValue()
    // 检查每个字段的值是否存在
    const missingField = FormFields.find((field) => formValues[field.name] === undefined)
    if (missingField) {
      return false // 如果有字段未填写，返回 false
    }

    // 动态构建请求参数
    const params = FormFields.reduce(
      (acc, field) => {
        acc[field.name] = formValues[field.name] // 将表单值按 name 构建对象
        return acc
      },
      {} as { [key: string]: any }
    ) // 初始化为空对象并明确类型

    params.mark = paramName // 在这里添加 mark

    // 调用接口
    const res =
      type === 'fucai'
        ? await window.electronAPI.ramMark.createRamMark(params)
        : await window.electronAPI.rfgMark.createRfgMark(params)

    if (!res.success) {
      notificationApi.error({
        message: res.error
      })
      return false
    }

    // 弹出提醒
    notificationApi.success({
      message: '参数保存成功！'
    })
    handleBrandName()
    setIsModalVisible(false)
    setParamName('')
  }

  return (
    <Flex align="center" gap={12} wrap="wrap" data-panel-type={type}>
      {contextHolder}
      <Flex vertical>
        <Select
          data-el="brand-select"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="请选择调入参数"
          options={brandNameOption}
          onChange={onChange}
          style={{
            width: width,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        />
      </Flex>

      <Button type="primary" onClick={onClick}>
        保存参数
      </Button>

      {/* 输入参数名字的 Modal */}
      <Modal
        title={`请输入基准卷烟${type === 'fucai' ? '辅材参数' : '主流烟气'}调入参数的名字`}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false)
          setParamName('')
        }}
        okText="保存"
        cancelText="取消"
      >
        <Input
          value={paramName}
          onChange={(e) => setParamName(e.target.value)}
          placeholder="请输入参数名"
        />
      </Modal>
    </Flex>
  )
}

export default BrandSelectPanel
