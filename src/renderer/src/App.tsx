import React, { useEffect } from 'react'
import {
  HashRouter as Router, // ✅ 用 HashRouter
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useNavigate
} from 'react-router-dom'
import { Layout, theme, Button, Tooltip } from 'antd'
import { PoweroffOutlined } from '@ant-design/icons'

import Home from './pages/Home'
import ModelingData from './pages/ModelingData'
import SimulatingForecast from './pages/SimulatingForecast'
import RecommendParameter from './pages/RecommendParameter'
import LoginPage from './pages/Login'

const { Content } = Layout

// ===== 布局组件 =====
const BasicLayout: React.FC = () => {
  const navigate = useNavigate()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const username = 'Admin'

  const menuItems: { key: string; label: string }[] = [
    { key: 'modelingData', label: '科研建模数据' },
    { key: 'simulatingForecast', label: '仿真预测' },
    { key: 'recommendParameter', label: '推荐辅材参数' }
  ]

  useEffect(() => {
    const authedLocal = localStorage.getItem('isAuthenticated') === 'true'
    const authedSession = sessionStorage.getItem('isAuthenticated') === 'true'
    if (!authedLocal && !authedSession) {
      // 没有登录信息才跳回 login
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleLogout = (): void => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    sessionStorage.removeItem('isAuthenticated')
    sessionStorage.removeItem('username')
    navigate('/login')
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'inline-block', // ✅ 让区域变成块状
    minWidth: 100, // ✅ 设定最小宽度
    textAlign: 'center',
    color: '#fff',
    backgroundColor: isActive ? '#1890ff' : 'transparent',
    padding: '10px 20px', // ✅ 内边距比原来大
    textDecoration: 'none',
    fontSize: 16,
    fontWeight: isActive ? 700 : 500,
    borderRadius: 6,
    transition: 'background-color 0.3s, color 0.3s'
  })

  return (
    <Layout>
      <div
        role="banner"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#001529',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #0b1e2e',
          pointerEvents: 'auto'
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 20,
              justifySelf: 'start'
            }}
          >
            江苏中烟卷烟辅材数字化设计平台
          </div>

          <nav aria-label="主导航" style={{ display: 'flex', gap: 24, justifySelf: 'center' }}>
            {menuItems.map((item) => (
              <NavLink key={item.key} to={item.key} style={navLinkStyle}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifySelf: 'end' }}>
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

// ===== 路由配置 =====
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<BasicLayout />}>
        <Route index element={<Navigate to="modelingData" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="modelingData" element={<ModelingData />} />
        <Route path="simulatingForecast" element={<SimulatingForecast />} />
        <Route path="recommendParameter" element={<RecommendParameter />} />
        <Route path="*" element={<Navigate to="modelingData" replace />} />
      </Route>
    </Routes>
  )
}

// ===== 根组件 =====
const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
