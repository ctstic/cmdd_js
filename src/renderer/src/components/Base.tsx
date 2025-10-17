import React, { CSSProperties, ReactNode } from 'react'
import { Button, Card, Typography } from 'antd'
import { CalculatorOutlined, LineChartOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

// ===================== Types =====================
export interface StyledCardProps {
  title?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  color?: string
  rightAction?: ReactNode
}

export interface HeaderTitleCardProps {
  color?: string
  title1: ReactNode
  title2?: ReactNode
}

interface OptButtonProps {
  title?: string
  color?: string
  onClick?: () => void
}

// ===================== HeaderTitleCard =====================
// 输入参数：color（颜色），title1（主标题），title2（副标题）
export const HeaderTitleCard: React.FC<HeaderTitleCardProps> = ({
  color = '#1890ff',
  title1,
  title2
}) => {
  const headerGradient: CSSProperties = {
    background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`
  }

  return (
    <Card
      style={{
        marginBottom: 15,
        ...headerGradient,
        color: 'white',
        borderRadius: 16,
        boxShadow: `0 8px 15px ${color}50`,
        border: 'none'
      }}
      bodyStyle={{ padding: '28px 32px' }}
    >
      <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 700 }}>
        <CalculatorOutlined style={{ marginRight: 16, fontSize: 32 }} />
        {title1}
      </Title>
      {title2 && (
        <Text
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 18,
            display: 'block',
            marginTop: 8
          }}
        >
          <LineChartOutlined style={{ marginRight: 8 }} />
          {title2}
        </Text>
      )}
    </Card>
  )
}

// ===================== StyledCard（Antd 版） =====================
export const StyledCard: React.FC<StyledCardProps> = ({
  title,
  icon,
  children,
  color = '#1890ff',
  rightAction
}) => {
  const cardHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: `linear-gradient(90deg, ${color}20 0%, #ffffff 100%)`,
    padding: '16px 24px',
    borderRadius: '12px 12px 0 0',
    borderBottom: `2px solid ${color}40`
  }

  // 安全处理 icon：若是有效 ReactElement 则 clone 并注入样式；否则按普通节点渲染
  const iconNode: ReactNode = icon ? (
    React.isValidElement(icon) ? (
      React.cloneElement(icon as React.ReactElement<any>, {
        style: {
          marginRight: 12,
          color: color,
          fontSize: 18,
          // 合并外部传入的样式（若存在）
          ...(icon.props as any)?.style
        }
      })
    ) : (
      <span style={{ marginRight: 12, color, fontSize: 18 as number }}>{icon}</span>
    )
  ) : null

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: `1px solid ${color}30`,
        flex: 1,
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={cardHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {iconNode}
          <Text strong style={{ fontSize: 18, color }}>
            {title}
          </Text>
        </div>
        {rightAction && <div style={{ display: 'flex', alignItems: 'center' }}>{rightAction}</div>}
      </div>
      <div style={{ padding: '12px 16px 0px 16px' }}>{children}</div>
    </Card>
  )
}

// ===================== 简单的操作按钮 =====================
export const OptButton: React.FC<OptButtonProps> = ({
  title = '计算',
  color = '#1890ff',
  onClick
}) => {
  return (
    <Button
      size="large"
      type="primary"
      onClick={onClick}
      style={{
        background: color,
        borderColor: color,
        minWidth: 100
      }}
    >
      {title}
    </Button>
  )
}
// ===================== 可继续扩展更多小组件 =====================
