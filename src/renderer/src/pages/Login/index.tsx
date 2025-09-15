import { LockOutlined, UserOutlined } from '@ant-design/icons'
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCheckbox,
  ProFormText
} from '@ant-design/pro-components'
import { message, theme } from 'antd'
import { useNavigate } from 'react-router-dom'

type FormValues = {
  username?: string
  password?: string
  autoLogin?: boolean
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const Page = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleFinish = async (values: FormValues) => {
    const username = (values.username ?? '').trim()
    const password = (values.password ?? '').trim()

    // 仅在校验时使用 admin/admin，不在表单中写死
    if (username === 'admin' && password === 'admin') {
      if (values.autoLogin) {
        // 自动登录 → 持久化到 localStorage
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('username', username)
      } else {
        // 普通登录 → 本会话
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
    <div style={{ backgroundColor: 'white', height: '100vh' }}>
      <LoginFormPage
        backgroundImageUrl="../../../public/login-img.png"
        title="材料设计"
        subTitle="用户登录"
        onFinish={handleFinish}
        containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.154)', backdropFilter: 'blur(4px)' }}
      >
        <>
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              autoFocus: true,
              prefix: <UserOutlined style={{ color: token.colorText }} className="prefixIcon" />
            }}
            placeholder="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined style={{ color: token.colorText }} className="prefixIcon" />
            }}
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码！' }]}
          />
        </>
        <div style={{ marginBlockEnd: 24 }}>
          <ProFormCheckbox noStyle name="autoLogin">
            自动登录
          </ProFormCheckbox>
        </div>
      </LoginFormPage>
    </div>
  )
}

const Login: React.FC = () => (
  <ProConfigProvider dark={false}>
    <Page />
  </ProConfigProvider>
)

export default Login
