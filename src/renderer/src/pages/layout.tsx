import React, { useState, useEffect } from 'react'
import { Layout, Menu, theme, Button, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
const { Header, Content, Footer } = Layout
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { PoweroffOutlined, UserOutlined } from '@ant-design/icons'

const BasicLayout: React.FC = () => {
  const navigate = useNavigate()
  // const location = useLocation()
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['modelingData'])

  const {
    token: { colorBgContainer, borderRadiusLG, colorTextLightSolid }
  } = theme.useToken()

  // useEffect(() => {
  //   const path = location.pathname
  //   if (path.includes('modelingData')) {
  //     setSelectedKeys(['modelingData'])
  //   } else if (path.includes('simulatingForecast')) {
  //     setSelectedKeys(['simulatingForecast'])
  //   } else if (path.includes('recommendParameter')) {
  //     setSelectedKeys(['recommendParameter'])
  //   } else {
  //     setSelectedKeys([])
  //   }
  // }, [location.pathname])

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setSelectedKeys([e.key])
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    navigate('/login')
  }

  return (
    <Layout>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              color: colorTextLightSolid,
              fontWeight: 'bold',
              fontSize: '18px',
              marginRight: '32px'
            }}
          >
            科研数据分析平台
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            items={[
              {
                key: 'modelingData',
                label: <Link to="/modelingData">科研建模数据</Link>
              },
              {
                key: 'simulatingForecast',
                label: <Link to="/simulatingForecast">仿真预测</Link>
              },
              {
                key: 'recommendParameter',
                label: <Link to="/recommendParameter">推荐辅材参数</Link>
              }
            ]}
            onClick={handleMenuClick}
            selectedKeys={selectedKeys}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Tooltip title="退出登录">
            <Button
              type="primary"
              icon={<PoweroffOutlined />}
              onClick={handleLogout}
              style={{
                color: colorTextLightSolid,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
                height: '32px',
                minWidth: '32px'
              }}
            />
          </Tooltip>
        </div>
      </Header>
      <Content style={{ padding: '30px', minHeight: 'calc(100vh - 64px)' }}>
        <div
          style={{
            padding: 24,
            minHeight: '100%',
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          <Outlet />
        </div>
      </Content>
      {/* <Footer style={{ textAlign: 'center' }}>
        Ant Design ©{new Date().getFullYear()} Created by aaa
      </Footer> */}
    </Layout>
  )
}

export default BasicLayout
