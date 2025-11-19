import React, { useEffect, useState } from 'react'
import {
  HashRouter as Router,
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
  const [role, setRole] = useState<string | null>(
    localStorage.getItem('role') || sessionStorage.getItem('role') || 'user'
  )
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const username = localStorage.getItem('username') || sessionStorage.getItem('username') || '用户'

  const menuItems: { key: string; label: string; roles?: string[] }[] = [
    { key: 'modelingData', label: '科研建模数据', roles: ['admin'] },
    { key: 'simulatingForecast', label: '仿真预测', roles: ['admin', 'user'] },
    { key: 'recommendParameter', label: '推荐辅材参数', roles: ['admin', 'user'] }
  ]

  // 根据角色过滤菜单
  const visibleMenu = menuItems.filter((item) => !item.roles || item.roles.includes(role))

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
    localStorage.removeItem('role')
    sessionStorage.removeItem('isAuthenticated')
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'inline-block',
    minWidth: 100,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: isActive ? '#1890ff' : 'transparent',
    padding: '10px 20px',
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
            江苏中烟卷烟辅材数字化设计系统
          </div>

          <nav aria-label="主导航" style={{ display: 'flex', gap: 24, justifySelf: 'center' }}>
            {visibleMenu.map((item) => (
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
            padding: 10,
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
  const role = localStorage.getItem('role') || sessionStorage.getItem('role') || 'user'

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<BasicLayout />}>
        <Route
          index
          element={
            // 根据角色跳转
            role === 'user' ? (
              <Navigate to="simulatingForecast" replace />
            ) : (
              <Navigate to="modelingData" replace />
            )
          }
        />
        <Route path="home" element={<Home />} />
        <Route path="modelingData" element={<ModelingData />} />
        <Route path="simulatingForecast" element={<SimulatingForecast />} />
        <Route path="recommendParameter" element={<RecommendParameter />} />
        <Route
          path="*"
          element={
            <Navigate to={role === 'user' ? 'simulatingForecast' : 'modelingData'} replace />
          }
        />
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
