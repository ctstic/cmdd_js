import { ExperimentOutlined } from '@ant-design/icons'
import { HeaderTitleCard, OptButton, StyledCard } from '@renderer/components/base'
import { Affix, Card, Col, Form, InputNumber, notification, Row, Space, Spin } from 'antd'
import React, { useRef, useState } from 'react'
import { baseMaterialFields, harmfulFields } from '../formd'
import PredictionTable from './PredictionTable'
import ModelTypeSelect from '@renderer/components/ModelTypeSelect'
import BrandSelectPanel from '@renderer/components/BrandSelectPanel'
import HistoryModal from '../RecommendParameter/HistoryModal'
import { fnv1a } from '@renderer/utils/common'

const requiredRule = (label: string) => [{ required: true, message: `请输入${label}` }]

const SimulatingForecast: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(false)
  const [notificationApi, contextHolder] = notification.useNotification()
  const [formRef] = Form.useForm()
  const tableRef = useRef<any>(null)
  // 存储计算hash
  const hashValue = useRef('')
  const [isSaved, setIsSaved] = useState<boolean>(false)
  // 历史数据弹窗
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false)

  // 计算
  const handleSubmit = async (): Promise<void> => {
    try {
      setLoading(true)
      // 获取表单数据
      const formValues = await formRef.validateFields()
      // 获取表格数据
      if (tableRef.current) {
        const dataSource = tableRef.current.getData()
        // 过滤数据，只传递输入参数，不传递预测结果
        const inputParams = dataSource.map((item) => ({
          key: item.key,
          filterVentilation: Number(item.filterVentilation),
          filterPressureDrop: Number(item.filterPressureDrop),
          permeability: Number(item.permeability),
          quantitative: Number(item.quantitative),
          citrate: Number(item.citrate),
          tar: '',
          nicotine: '',
          co: ''
        }))
        const jsonString = JSON.stringify(inputParams)
        if (inputParams.length === 0 || jsonString.includes('null')) {
          setLoading(false)
          notificationApi.error({
            message: '请正确填写预测结果数据表格'
          })
        } else {
          // 调用接口
          const res = await window.electronAPI.simulation.prediction({
            specimenName: formValues.modelType,
            standardParams: formValues,
            predictionParams: inputParams
          })

          if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
            // 确保将返回的预测数据更新到表格中
            const predictionData = res.data.data.map((item: any, index: number) => {
              //? 之前table是展开格式时，根据kay取返回的数据，现在应该不需要了
              const params = inputParams.find((params) => params.key === item.key)
              tableRef.current.setRowsData(index, {
                tar: Number(item.tar) || 0,
                nicotine: Number(item.nicotine) || 0,
                co: Number(item.co) || 0
              })
              return {
                ...item,
                key: item.key.toString(),
                filterVentilation: Number(params?.filterVentilation) || 0,
                filterPressureDrop: Number(params?.filterPressureDrop) || 0,
                permeability: Number(params?.permeability) || 0,
                quantitative: Number(params?.quantitative) || 0,
                citrate: Number(params?.citrate) || 0,
                potassiumRatio: Number(params?.potassiumRatio) || 0,
                tar: Number(item.tar) || 0,
                nicotine: Number(item.nicotine) || 0,
                co: Number(item.co) || 0
              }
            })
            tableRef.current.setData(predictionData)
            notificationApi.success({
              message: '计算成功'
            })
            // 存储计算hash
            hashValue.current = fnv1a(JSON.stringify({ formValues, predictionData }))
            setIsSaved(true)
            setLoading(false)
          } else {
            setLoading(false)
            notificationApi.error({
              message: res.data.errors
            })
          }
        }
      }
    } catch (error) {
      setLoading(false)
      notificationApi.error({
        message: '计算异常，请检查数据填写是否完整！'
      })
    }
  }

  // 重置
  const handleReset = (): void => {
    formRef.resetFields()
    if (tableRef.current) {
      tableRef.current.setData([])
    }
    notificationApi.success({
      message: '重置成功',
      description: '数据已重置'
    })
  }

  // 保存和导出的校验
  const validateAndCompareData = async (): Promise<boolean> => {
    // 获取表单和表格数据
    const formValues = await formRef.validateFields()
    const predictionData = tableRef.current.getData()
    const hash = fnv1a(JSON.stringify({ formValues, predictionData }))

    // 返回校验
    return hash === hashValue.current
  }

  // 保存
  const handleSave = async (): Promise<void> => {
    if (await validateAndCompareData()) {
      if (isSaved) {
        try {
          const formValues = await formRef.validateFields()
          const dataSource = tableRef.current.getData()
          await window.electronAPI.simulationPredictionSaveAPI.create({
            specimenName: formValues.modelType,
            standardParams: formValues,
            predictionParams: dataSource
          })
          notificationApi.success({
            message: '保存成功！'
          })
          setIsSaved(false)
        } catch (error) {
          setIsSaved(false)
          notificationApi.error({
            message: '保存异常，请检查表单填写！'
          })
        }
      } else {
        notificationApi.error({
          message: '请勿重复保存数据！'
        })
      }
    } else {
      notificationApi.error({
        message: '保存异常，请检查数据填写是否完整！'
      })
    }
  }

  // 导出
  const handleExport = async (): Promise<void> => {
    if (await validateAndCompareData()) {
      try {
        const formValues = await formRef.validateFields()
        const dataSource = tableRef.current.getData()

        await window.electronAPI.simulation.exportResult({
          specimenName: formValues.modelType,
          standardParams: formValues,
          predictionParams: dataSource
        })
        notificationApi.success({
          message: '导出成功！'
        })
      } catch (error) {
        notificationApi.error({
          message: '导出异常，请检查数据填写是否完整！'
        })
      }
    } else {
      notificationApi.error({
        message: '参数修改后必须重新计算数据才可以导出！'
      })
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 145px)' }}>
      <Spin tip="正在生成推荐数据！" size="large" delay={500} spinning={loading}>
        {contextHolder}
        <HeaderTitleCard
          color="#1890ff"
          title1="卷烟主流烟气仿真预测系统"
          title2="基于多维数据的智能化预测分析"
        />
        {/* 表单 */}
        <Form form={formRef} layout="vertical">
          <ModelTypeSelect form={formRef} />

          <Row gutter={10} style={{ marginBottom: 15 }}>
            <Col span={16}>
              <StyledCard
                title="基准卷烟辅材参数"
                icon={<ExperimentOutlined />}
                rightAction={
                  <BrandSelectPanel
                    type="fucai"
                    formRef={formRef}
                    FormFields={baseMaterialFields}
                    width={200}
                  />
                }
              >
                <Row gutter={10} justify="space-between">
                  {baseMaterialFields.map((field) => (
                    <Col flex="20%" key={field.name}>
                      <Form.Item
                        name={field.name}
                        label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                        rules={requiredRule(field.label)}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                          precision={2}
                          placeholder={`请输入${field.label}`}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </StyledCard>
            </Col>
            <Col span={8}>
              <StyledCard
                title="基准卷烟主流烟气"
                icon={<ExperimentOutlined />}
                rightAction={
                  <BrandSelectPanel
                    type="jizhun"
                    formRef={formRef}
                    FormFields={harmfulFields}
                    width={150}
                  />
                }
              >
                <Row gutter={10}>
                  {harmfulFields.map((field) => (
                    <Col span={8} key={field.name}>
                      <Form.Item
                        name={field.name}
                        label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                        rules={requiredRule(field.label)}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                          precision={2}
                          placeholder={`请输入${field.label}`}
                        />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </StyledCard>
            </Col>
          </Row>
        </Form>
        {/* 预测 */}
        <PredictionTable formRef={formRef} actionRef={tableRef} />
        {/* 操作按钮 */}
        <Affix offsetBottom={10}>
          <Card
            style={{
              marginTop: 15,
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: 10, textAlign: 'center' }}>
              <Space>
                <OptButton title="计算" color="#2597ff" onClick={handleSubmit} />
                <OptButton title="重置" color="#ffdd8e" onClick={handleReset} />
                <OptButton title="保存" color="#92d96f" onClick={handleSave} />
                <OptButton title="导出当前数据" color="#a689cf" onClick={handleExport} />
                <OptButton
                  title="查看历史数据"
                  color="#ffdd8e"
                  onClick={() => {
                    setHistoryModalOpen(true)
                  }}
                />
              </Space>
            </div>
          </Card>
        </Affix>

        {/*历史数据 */}
        <HistoryModal
          type={1}
          modalOpen={historyModalOpen}
          onCancel={() => {
            setHistoryModalOpen(false)
          }}
        />
      </Spin>
    </div>
  )
}

export default SimulatingForecast
