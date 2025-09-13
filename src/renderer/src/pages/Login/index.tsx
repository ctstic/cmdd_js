import { LockOutlined, UserOutlined } from '@ant-design/icons'
import {
  LoginFormPage,
  ProConfigProvider,
  ProFormCheckbox,
  ProFormText
} from '@ant-design/pro-components'
import { message, theme } from 'antd'
import { useNavigate } from 'react-router-dom'

const Page = () => {
  // const [loginType, setLoginType] = useState<LoginType>('phone')
  const { token } = theme.useToken()
  const navigate = useNavigate()

  return (
    <div
      style={{
        backgroundColor: 'white',
        height: '100vh'
      }}
    >
      <LoginFormPage
        backgroundImageUrl="../../../public/login-img.png"
        // logo="https://github.githubassets.com/favicons/favicon.png"
        // backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
        title="材料设计"
        onFinish={() => {
          navigate('/modelingData')
          message.success('登录成功！')
        }}
        containerStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.154)',
          backdropFilter: 'blur(4px)'
        }}
        subTitle="用户登录"
        actions={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          ></div>
        }
      >
        <>
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: (
                <UserOutlined
                  style={{
                    color: token.colorText
                  }}
                  className={'prefixIcon'}
                />
              )
            }}
            placeholder={'用户名'}
            rules={[
              {
                required: true,
                message: '请输入用户名!'
              }
            ]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: (
                <LockOutlined
                  style={{
                    color: token.colorText
                  }}
                  className={'prefixIcon'}
                />
              )
            }}
            placeholder={'密码'}
            rules={[
              {
                required: true,
                message: '请输入密码！'
              }
            ]}
          />
        </>
        <div
          style={{
            marginBlockEnd: 24
          }}
        >
          <ProFormCheckbox noStyle name="autoLogin">
            自动登录
          </ProFormCheckbox>
        </div>
      </LoginFormPage>
    </div>
  )
}

const Login: React.FC = () => {
  return (
    <ProConfigProvider dark={false}>
      <Page />
    </ProConfigProvider>
  )
}

export default Login
