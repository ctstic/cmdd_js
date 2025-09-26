import React, { useRef } from 'react'
import { message } from 'antd'
import { ModalForm, ProFormText } from '@ant-design/pro-components'
import type { ProFormInstance } from '@ant-design/pro-components'

export type CalculationModalProps = {
  modalOpen: boolean
  onCancel: () => void
  title: string
}

const BrandNameModal: React.FC<CalculationModalProps> = ({ title, modalOpen, onCancel }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const restFormRef = useRef<ProFormInstance>()

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
          console.log(values, 'values')
          onCancel()
          info('success', '保存成功！')
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
