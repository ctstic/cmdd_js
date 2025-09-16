import { LockOutlined, UserOutlined } from '@ant-design/icons'
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCheckbox,
  ProFormText
} from '@ant-design/pro-components'
import { ConfigProvider, theme, message } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

type FormValues = {
  username?: string
  password?: string
  autoLogin?: boolean
}

const Page: React.FC = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleFinish = async (values: FormValues) => {
    const username = (values.username ?? '').trim()
    const password = (values.password ?? '').trim()

    if (username === 'admin' && password === 'admin') {
      if (values.autoLogin) {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('username', username)
      } else {
        sessionStorage.setItem('isAuthenticated', 'true')
        sessionStorage.setItem('username', username)
      }
      message.success('登录成功！')
      navigate('/modelingData')
    } else {
      message.error('用户名或密码错误')
    }
  }

  return (
    <div style={{ height: '98vh' }}>
      <LoginFormPage
        // ✅ 保留你的背景图（不用动）
        backgroundImageUrl={new URL('../../assets/login-img.jpg', import.meta.url).href}
        title={<span style={{ color: '#fff', fontSize: 32 }}>江苏中烟卷烟辅材数字化设计平台</span>}
        subTitle={<span style={{ color: 'rgba(255,255,255,0.85)' }}>用户登录</span>}
        onFinish={handleFinish}
        // 玻璃态卡片，增强可读性（不影响背景图）
        containerStyle={{
          borderRadius: 18,
          padding: '60px 28px',
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: token.colorText
        }}
        // ✅ 放大“登录”按钮：更高、更宽（block）
        submitter={{
          searchConfig: { submitText: '登录' },
          submitButtonProps: {
            size: 'large',
            block: true,
            style: {
              height: 52,
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 12,
              boxShadow: '0 10px 24px rgba(79,141,247,0.35)'
            }
          }
        }}
      >
        <>
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              autoFocus: true,
              prefix: <UserOutlined style={{ color: '#fff' }} className="prefixIcon" />,
              style: {
                color: '#fff',
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.28)',
                height: 44,
                borderRadius: 12
              }
            }}
            allowClear
            placeholder="用户名"
            rules={[{ required: true, message: '请输入用户名！' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined style={{ color: '#fff' }} className="prefixIcon" />,
              style: {
                color: '#fff',
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.28)',
                height: 44,
                borderRadius: 12
              }
            }}
            allowClear
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码！' }]}
          />
          <div style={{ marginBlockEnd: 8 }}>
            <ProFormCheckbox noStyle name="autoLogin">
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>自动登录</span>
            </ProFormCheckbox>
          </div>
        </>
      </LoginFormPage>
    </div>
  )
}

const Login: React.FC = () => (
  <ProConfigProvider dark={false}>
    <ConfigProvider
      theme={{
        token: {
          // ✅ 全局白字 + 深蓝主题主色
          colorPrimary: '#4F8DF7',
          colorText: '#ffffff',
          colorTextBase: '#ffffff',
          colorTextSecondary: 'rgba(255,255,255,0.85)',
          colorTextPlaceholder: 'rgba(255,255,255,0.65)',
          colorBorder: 'rgba(255,255,255,0.28)',
          colorBorderSecondary: 'rgba(255,255,255,0.2)',
          colorBgBase: '#0b1a33',
          colorLink: '#87b2ff',
          colorLinkHover: '#a9c6ff'
        },
        components: {
          Input: {
            activeBorderColor: '#4F8DF7',
            hoverBorderColor: 'rgba(255,255,255,0.6)'
          },
          Checkbox: {
            colorPrimary: '#4F8DF7',
            colorPrimaryHover: '#73a6fb'
          },
          Button: {
            colorPrimary: '#4F8DF7',
            colorPrimaryHover: '#73a6fb',
            colorPrimaryActive: '#2f74f4',
            borderRadius: 12
          },
          Form: {
            labelColor: '#ffffff'
          }
        }
      }}
    >
      <Page />
    </ConfigProvider>
  </ProConfigProvider>
)

export default Login
