import React, { useState } from 'react'
import { Breadcrumb, Layout, Menu, theme } from 'antd'
import type { MenuProps } from 'antd'
const { Header, Content, Footer } = Layout
import { Link, Outlet } from 'react-router-dom'

// const items = Array.from({ length: 3 }).map((_, index) => ({
//   key: String(index + 1),
//   label: `nav ${index + 1}`,
// }));

const BasicLayout: React.FC = () => {
  const [current, setCurrent] = useState('home')

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e)
    setCurrent(e.key)
  }

  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  return (
    <Layout>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Menu
          theme="dark"
          mode="horizontal"
          // defaultSelectedKeys={['2']}
          items={[
            {
              key: 'home',
              label: <Link to="/home">主页</Link>
            },
            {
              key: 'ModelingData',
              label: <Link to="/modelingData">科研建模数据</Link>
            },
             {
              key: 'simulatingForecast',
              label: <Link to="/simulatingForecast">仿真预测</Link>
            },
               {
              key: 'simulatingForecast',
              label: <Link to="/recommendParameter">推荐辅材参数</Link>
            }
          ]}
          // items={[
          //   {
          //     label: '主页',
          //     key: 'home'
          //   },
          //   {
          //     label: '科研建模数据',
          //     key: 'ModelingData'
          //   }
          // ]}
          onClick={onClick}
          selectedKeys={[current]}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: '30px' }}>
        {/* <Breadcrumb
          style={{ margin: '16px 0' }}
          items={[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]}
        /> */}
        <div
          style={{
            padding: 24,
            // minHeight: '100%',
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
