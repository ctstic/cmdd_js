import React, { useRef } from 'react'
import { message } from 'antd'
import { ModalForm, ProFormText } from '@ant-design/pro-components'
import type { ProFormInstance } from '@ant-design/pro-components'

export type CalculationModalProps = {
  modalOpen: boolean
  onCancel: () => void
  title: string
  type: number
  form: any
}

const BrandNameModal: React.FC<CalculationModalProps> = ({
  title,
  modalOpen,
  form,
  onCancel,
  type
}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const restFormRef = useRef<ProFormInstance>()
  // console.log(form.getFieldsValue(), 'paramsparamsparamsparams')

  const info = (type: 'info' | 'success' | 'error' | 'warning' | 'loading', msg: string) => {
    messageApi.open({
      type,
      content: msg
    })
  }

  return (
    <>
      {contextHolder}
      <ModalForm
        title={`${title} -- 保存此牌号数据`}
        formRef={restFormRef}
        open={modalOpen}
        onFinish={async (values) => {
          // console.log(values, 'values')
          try {
            if (type) {
              const { co, nicotine, tar } = form.getFieldsValue()
              if (co === undefined || nicotine === undefined || tar === undefined) {
                return false
              }
              console.log(co, nicotine, tar,111);

              const res = await window.electronAPI.rfgMark.createRfgMark({
                mark: values.brandName,
                co,
                nicotine,
                tar
              })
              console.log(res, 'resresresres')
            } else {
              const { filterVentilation, filterPressureDrop, permeability, quantitative, citrate } =
                form.getFieldsValue()

              // 检查这些字段是否为 undefined
              if (
                filterVentilation === undefined ||
                filterPressureDrop === undefined ||
                permeability === undefined ||
                quantitative === undefined ||
                citrate === undefined
              ) {
                return false
              }
              // console.log(filterVentilation, filterPressureDrop, permeability, quantitative, citrate,111);

              const res = await window.electronAPI.ramMark.createRamMark({
                mark: values.brandName,
                filterVentilation,
                filterPressureDrop,
                permeability,
                quantitative,
                citrate
              })
            }
            info('success', '保存成功！')
          } catch {
            info('error', '网络错误！')
          }
          onCancel()
        }}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => onCancel()
        }}
      >
        <ProFormText width="md" name="brandName" label="牌号名称" placeholder="请输入牌号名称" />
      </ModalForm>
    </>
  )
}

export default BrandNameModal
