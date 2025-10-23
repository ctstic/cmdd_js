import React, { useEffect, useRef, useState } from 'react'
import type { FormInstance } from 'antd'
import { Button, Flex, notification, Select, Modal, Input, Form } from 'antd'
import { FormFieldConfig } from '@renderer/pages/formd'

interface BrandSelectPanelProps {
  type: string
  formRef: FormInstance
  FormFields: FormFieldConfig[]
  width: number
}

interface BrandSmokeData {
  mark: string
  [key: string]: any
}

const BrandSelectPanel: React.FC<BrandSelectPanelProps> = ({
  type,
  formRef,
  FormFields,
  width
}) => {
  const [notificationApi, contextHolder] = notification.useNotification()
  const [brandNameOption, setBrandNameOption] = useState<{ label: string; value: string }[]>([])
  const [brandNameSmokeData, setBrandNameSmokeData] = useState<BrandSmokeData[]>([])

  // 受控的 Select 值 + 回填保护
  const [selectedMark, setSelectedMark] = useState<string | undefined>(undefined)
  const applyingPresetRef = useRef(false)

  // —— 新增：记录“回填后”的表单快照（仅关心的字段子集）
  const snapshotRef = useRef<string>('') // JSON 字符串
  const mountedRef = useRef(false) // 跳过第一次 watch 触发

  // 监听整个表单（依赖 formRef）
  const allFormValues = Form.useWatch([], formRef)

  // Modal
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [paramName, setParamName] = useState('')

  // 仅抽取我们关心的字段，避免因为无关字段变动而误判
  const pickConcernValues = (all: Record<string, any>) => {
    const obj: Record<string, any> = {}
    for (const f of FormFields) obj[f.name] = all?.[f.name]
    return obj
  }
  const toKey = (v: any) => JSON.stringify(v ?? null)

  // 校验表单是否完整
  const checkFormValues = (fields: FormFieldConfig[], formValues: Record<string, any>) =>
    fields.every((field) => formValues[field.name] != null && formValues[field.name] !== '')

  // 拉取品牌参数列表
  const handleBrandName = async (): Promise<void> => {
    try {
      const optionData =
        type === 'fucai'
          ? await window.electronAPI.ramMark.query('')
          : await window.electronAPI.rfgMark.query('')

      setBrandNameOption(
        (optionData.data || []).map((item: { mark: string }) => ({
          label: item.mark,
          value: item.mark
        }))
      )
      setBrandNameSmokeData(optionData.data || [])
    } catch {
      notificationApi.error({ message: '网络错误！' })
    }
  }

  useEffect(() => {
    handleBrandName()
  }, [type])

  // 选择后回填
  const setFormValues = (selectedItem: BrandSmokeData) => {
    const formValues = FormFields.reduce(
      (acc, field) => {
        if (selectedItem[field.name] !== undefined) {
          acc[field.name] = selectedItem[field.name]
        }
        return acc
      },
      {} as Record<string, any>
    )

    // 开启回填保护
    applyingPresetRef.current = true
    formRef.setFieldsValue(formValues)
    setSelectedMark(selectedItem.mark)

    // 关闭保护 & 更新快照
    const finalize = () => {
      applyingPresetRef.current = false
      const currentAll = formRef.getFieldsValue()
      snapshotRef.current = toKey(pickConcernValues(currentAll))
    }
    if (typeof queueMicrotask === 'function') queueMicrotask(finalize)
    else setTimeout(finalize, 0)
  }

  // Select 变化（含清空）
  const onChange = (value?: string) => {
    setSelectedMark(value)
    if (!value) return // allowClear 或未选
    const selectedItem = brandNameSmokeData.find((item) => item.mark === value)
    if (selectedItem) setFormValues(selectedItem)
  }

  // 点击保存前校验
  const onClick = async (): Promise<void> => {
    const formValues = await formRef.getFieldsValue()
    if (checkFormValues(FormFields, formValues)) {
      setIsModalVisible(true)
    } else {
      notificationApi.error({
        message: `请输入完整的基准卷烟${type === 'fucai' ? '辅材参数' : '主流烟气'}！`
      })
    }
  }

  // 确认保存
  const handleOk = async (): Promise<void> => {
    const formValues = formRef.getFieldsValue()
    const missingField = FormFields.find((field) => formValues[field.name] === undefined)
    if (missingField) return

    const params = FormFields.reduce(
      (acc, field) => {
        acc[field.name] = formValues[field.name]
        return acc
      },
      {} as Record<string, any>
    )
    params.mark = paramName

    const res =
      type === 'fucai'
        ? await window.electronAPI.ramMark.createRamMark(params)
        : await window.electronAPI.rfgMark.createRfgMark(params)

    if (!res?.success) {
      notificationApi.error({ message: res?.error || '保存失败' })
      return
    }

    notificationApi.success({ message: '参数保存成功！' })
    handleBrandName()
    setIsModalVisible(false)
    setParamName('')
  }

  // 核心：用“快照对比”判定用户改动，从而清空 Select
  useEffect(() => {
    // 第一次渲染：建立初始快照，不清空
    if (!mountedRef.current) {
      mountedRef.current = true
      const currentAll = formRef.getFieldsValue()
      snapshotRef.current = toKey(pickConcernValues(currentAll))
      return
    }

    if (applyingPresetRef.current) return

    const currentAll = formRef.getFieldsValue()
    const currentKey = toKey(pickConcernValues(currentAll))

    if (currentKey !== snapshotRef.current) {
      // —— 说明用户动过表单（与上次回填/确认时不同）
      setSelectedMark(undefined)
      // 更新快照，避免重复清空
      snapshotRef.current = currentKey
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFormValues])

  return (
    <Flex align="center" gap={12} wrap="wrap" data-panel-type={type}>
      {contextHolder}

      <Flex vertical>
        <Select
          data-el="brand-select"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="请选择基准牌号"
          options={brandNameOption}
          value={selectedMark}
          onChange={onChange}
          style={{
            width,
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
          }}
        />
      </Flex>

      <Button type="primary" onClick={onClick}>
        保存参数
      </Button>

      <Modal
        title={`基准卷烟${type === 'fucai' ? '辅材参数' : '主流烟气'}牌号名称`}
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
          placeholder="请输入牌号名称"
        />
      </Modal>
    </Flex>
  )
}

export default BrandSelectPanel
