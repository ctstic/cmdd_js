import { Button, message } from 'antd'
import React from 'react'

const Home = () => {
  // 1. 使用 useMessage Hook
  const [messageApi, contextHolder] = message.useMessage()

  const handleSuccess = () => {
    // 2. 通过 messageApi 调用，而不是直接的 message
    messageApi.open({
      type: 'success',
      content: '操作成功！'
    })
  }

  return (
    <div>
      {/* 3. 必须在组件渲染的某个地方放置 contextHolder */}
      {contextHolder}
      {/* 4. 现在可以正常触发消息了 */}
      <Button type="primary" onClick={handleSuccess}>
        触发成功消息
      </Button>
    </div>
  )
}

export default Home
