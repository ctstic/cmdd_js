import { ArrowDownOutlined, ArrowUpOutlined, LineChartOutlined } from '@ant-design/icons'
import { StyledCard } from '@renderer/components/base'
import { Empty, Table, TableProps } from 'antd'
import { createStyles } from 'antd-style'

interface DataType {
  id: number
  code: string
  filterVentilation: string
  filterPressureDrop: number
  permeability: string
  quantitative: string
  citrate: string
  potassiumRatio: string
  co: string
  nicotine: string
  tar: string
}

const useStyle = createStyles(({ css, token }) => {
  const { antCls } = token
  return {
    customTable: css`
      ${antCls}-table {
        ${antCls}-table-container {
          ${antCls}-table-body,
          ${antCls}-table-content {
            scrollbar-width: thin;
            scrollbar-color: #eaeaea transparent;
            scrollbar-gutter: stable;
          }
        }
      }
    `
  }
})

const PredictionTable: React.FC<{ tableData: DataType[] }> = ({ tableData }) => {
  const { styles } = useStyle()

  // 用来计算百分比变化的函数
  const calculatePercentageChange = (prediction: number, originalValue: number) => {
    const diff = ((prediction / originalValue - 1) * 100).toFixed(2)
    return parseFloat(diff)
  }

  // 渲染箭头和百分比
  const renderArrow = (percentageChange: number) => {
    if (isNaN(percentageChange)) return null
    return percentageChange > 0 ? (
      <span style={{ color: 'green' }}>
        <ArrowUpOutlined /> {Math.abs(percentageChange)}%
      </span>
    ) : (
      <span style={{ color: 'red' }}>
        <ArrowDownOutlined /> {Math.abs(percentageChange)}%
      </span>
    )
  }

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '滤嘴通风率 (%)',
      dataIndex: 'filterVentilation',
      render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
    },
    {
      title: '滤棒压降 (Pa)',
      dataIndex: 'filterPressureDrop'
    },
    {
      title: '卷烟纸透气度(CU)',
      dataIndex: 'permeability'
    },
    {
      title: '卷烟纸定量 (g/m²)',
      dataIndex: 'quantitative'
    },
    {
      title: '卷烟纸阻燃剂含量 (%)',
      dataIndex: 'citrate',
      render: (text) => <span>{(Number(text) * 100).toFixed(2)}%</span>
    },
    {
      title: '焦油（mg/支）',
      dataIndex: 'tar',
      render: (text) => <span style={{ color: '#52c41a' }}>{Number(text).toFixed(2)}</span>
    },
    {
      title: '烟碱（mg/支）',
      dataIndex: 'nicotine',
      render: (text) => <span style={{ color: '#52c41a' }}>{Number(text).toFixed(2)}</span>
    },
    {
      title: 'CO（mg/支）',
      dataIndex: 'co',
      render: (text) => <span style={{ color: '#52c41a' }}>{Number(text).toFixed(2)}</span>
    }
  ]
  return (
    <StyledCard title="推荐辅材参数表格" icon={<LineChartOutlined />} color="#52c41a">
      <Table
        className={styles.customTable}
        scroll={{ x: 960, y: 55 * 3 }}
        rowKey="id"
        locale={{
          emptyText: <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        }}
        bordered
        dataSource={tableData}
        columns={columns}
        pagination={false}
        style={{
          borderRadius: '8px'
        }}
      />
    </StyledCard>
  )
}

export default PredictionTable
