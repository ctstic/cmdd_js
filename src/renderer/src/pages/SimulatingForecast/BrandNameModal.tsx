import React, { useRef } from 'react'
import { message } from 'antd'
import { ModalForm, ProFormText } from '@ant-design/pro-components'
import type { ProFormInstance } from '@ant-design/pro-components'

export type CalculationModalProps = {
  modalOpen: boolean
  onCancel: () => void
  title: string
 onSubmit: (values:string) => void
}

const BrandNameModal: React.FC<CalculationModalProps> = ({
  title,
  modalOpen,
  onSubmit,
  onCancel,
  // type
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
          onSubmit(values.brandName)
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
