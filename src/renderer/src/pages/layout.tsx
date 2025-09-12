import React, { useEffect } from 'react'
import { Layout, theme, Button, Tooltip } from 'antd'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { PoweroffOutlined } from '@ant-design/icons'

const { Content } = Layout

const BasicLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation() // 获取当前的路径
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const username = 'Admin'

  const menuItems: { key: string; label: string }[] = [
    { key: '/modelingData', label: '科研建模数据' },
    { key: '/simulatingForecast', label: '仿真预测' },
    { key: '/recommendParameter', label: '推荐辅材参数' },
    { key: '/home', label: 'Home' }
  ]

  const handleLogout = (): void => {
    localStorage.removeItem('isAuthenticated')
    navigate('/login')
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    color: '#fff',
    backgroundColor: isActive ? '#1890ff' : 'transparent',
    padding: '6px 12px',
    textDecoration: 'none',
    fontSize: 16,
    fontWeight: isActive ? 700 : 500,
    borderRadius: 6,
    transition: 'background-color 0.3s, color 0.3s'
  })

  useEffect(() => {
    // 默认跳转到 "/modelingData"，但只有当当前路径不是 "/modelingData" 时才跳转
    if (location.pathname === '/') {
      navigate('/modelingData')
    }
  }, [location.pathname, navigate])

  return (
    <Layout>
      <div
        role="banner"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#001529',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #0b1e2e'
        }}
      >
        {/* Left: title + nav */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 20,
              marginRight: 32
            }}
          >
            科研数据分析平台
          </div>

          <nav aria-label="主导航" style={{ display: 'flex', gap: 24 }}>
            {menuItems.map((item) => (
              <NavLink key={item.key} to={item.key} style={navLinkStyle}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: username + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#fff', fontWeight: 500, fontSize: 20 }}>{username}</div>
          <Tooltip title="退出登录">
            <Button
              type="text"
              icon={<PoweroffOutlined />}
              onClick={handleLogout}
              aria-label="退出登录"
              style={{
                color: '#fff',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                border: 'none',
                padding: 0,
                backgroundColor: 'transparent'
              }}
            />
          </Tooltip>
        </div>
      </div>

      <Content style={{ padding: 10, minHeight: 'calc(100vh - 80px)' }}>
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
    </Layout>
  )
}

export default BasicLayout
