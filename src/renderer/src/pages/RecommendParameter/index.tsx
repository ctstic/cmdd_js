import { ExperimentOutlined } from '@ant-design/icons'
import { HeaderTitleCard, OptButton, Ranges, StyledCard } from '@renderer/components/base'
import ModelTypeSelect from '@renderer/components/ModelTypeSelect'
import { Affix, Card, Col, Flex, Form, InputNumber, notification, Row, Space, Spin } from 'antd'
import React, { useRef, useState } from 'react'
import {
  baseMaterialFields,
  harmfulFields,
  harmfulWeightFields,
  rangeFields,
  targetHarmfulFields
} from '../formd'
import PredictionTable from './PredictionTable'
import BrandSelectPanel from '@renderer/components/BrandSelectPanel'
import HistoryModal from './HistoryModal'
import { fnv1a } from '@renderer/utils/common'

const requiredRule = (label: string) => [{ required: true, message: `请输入${label}` }]

const RecommendParameter: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(false)
  const [notificationApi, contextHolder] = notification.useNotification()
  const [baseForm] = Form.useForm() //基准卷烟辅材参数
  const [targetForm] = Form.useForm() //目标主流烟气
  const [weightForm] = Form.useForm() //成分权重设置
  const [rangeForm] = Form.useForm() //辅材参数个性化设计范围
  const [tableData, setTableData] = useState<any[]>([])
  // 存储计算hash
  const hashValue = useRef('')
  // 历史数据弹窗
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false)

  // 计算
  const handleSubmit = async (): Promise<void> => {
    try {
      setLoading(true)

      // 获取每一步表单的所有值
      const baseValues = await baseForm.validateFields()
      const targetValues = await targetForm.validateFields()
      const weightValues = await weightForm.validateFields()
      const rangeValues = await rangeForm.validateFields()

      // 打印所有表单的值
      console.log('基准卷烟辅材参数:', baseValues)
      console.log('目标主流烟气:', targetValues)
      console.log('成分权重设置:', weightValues)
      console.log('辅材参数个性化设计范围:', rangeValues)

      const res = await window.electronAPI.rec.auxMaterials({
        count: rangeValues.size,
        specimenName: baseValues.modelType,
        standardParams: baseValues,
        targetParams: { ...targetValues, ...weightValues },
        standardDesignParams: rangeValues,
        recommendedValue: []
      })

      if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // 数据更新
        const transformedData = res.data.data.map((item, index) => ({
          id: index,
          filterVentilation: item.designParams.filterVentilation,
          filterPressureDrop: item.designParams.filterPressureDrop,
          permeability: item.designParams.permeability,
          quantitative: item.designParams.quantitative,
          citrate: item.designParams.citrate,
          tar: item.designParams.tar,
          nicotine: item.designParams.nicotine,
          co: item.designParams.co,
          prediction: item.prediction
        }))
        setTableData(transformedData)

        notificationApi.success({
          message: '参数推荐完成！'
        })

        // 存储计算hash
        hashValue.current = fnv1a(
          JSON.stringify({
            baseValues,
            targetValues,
            weightValues,
            rangeValues,
            tableData: transformedData
          })
        )

        setLoading(false)
      } else {
        setLoading(false)
        notificationApi.error({
          message: res.data.errors
        })
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
    baseForm.resetFields()
    targetForm.resetFields()
    weightForm.resetFields()
    rangeForm.resetFields()
    setTableData([])
    notificationApi.success({
      message: '重置成功',
      description: '数据已重置'
    })
  }

  // 保存和导出的校验
  const validateAndCompareData = async (): Promise<boolean> => {
    try {
      // 获取每一步表单的所有值
      const baseValues = await baseForm.validateFields()
      const targetValues = await targetForm.validateFields()
      const weightValues = await weightForm.validateFields()
      const rangeValues = await rangeForm.validateFields()

      const hash = fnv1a(
        JSON.stringify({
          baseValues,
          targetValues,
          weightValues,
          rangeValues,
          tableData
        })
      )

      // 返回校验
      return hash === hashValue.current
    } catch (error) {
      notificationApi.error({
        message: '请检查数据填写是否完整！'
      })
      return false // 如果捕获到异常，则返回 false
    }
  }

  // 保存
  const handleSave = async (): Promise<void> => {
    if (await validateAndCompareData()) {
      try {
        const baseValues = baseForm.getFieldsValue(true)
        const targetValues = targetForm.getFieldsValue(true)
        const weightValues = weightForm.getFieldsValue(true)
        const rangeValues = rangeForm.getFieldsValue(true)
        const params = {
          count: rangeValues.size,
          specimenName: baseValues.modelType,
          standardParams: baseValues,
          targetParams: { ...targetValues, ...weightValues },
          standardDesignParams: rangeValues,
          recommendedValue: tableData
        }
        await window.electronAPI.recAuxMaterialsSaveAPI.create(params)
        notificationApi.success({
          message: '保存成功！'
        })
      } catch (error) {
        notificationApi.error({
          message: '保存异常，请检查数据填写是否完整！'
        })
      }
    } else {
      notificationApi.error({
        message: '参数修改后必须重新提交并生成推荐数据才可以保存！'
      })
    }
  }

  // 导出
  const handleExport = async (): Promise<void> => {
    if (await validateAndCompareData()) {
      try {
        const baseValues = baseForm.getFieldsValue(true)
        const targetValues = targetForm.getFieldsValue(true)
        const weightValues = weightForm.getFieldsValue(true)
        const rangeValues = rangeForm.getFieldsValue(true)

        await window.electronAPI.rec.exportResult({
          count: rangeValues.size,
          specimenName: baseValues.modelType,
          standardParams: baseValues,
          targetParams: { ...targetValues, ...weightValues },
          standardDesignParams: rangeValues,
          recommendedValue: tableData
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
        message: '参数修改后必须重新提交并生成推荐数据才可以导出！'
      })
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 145px)' }}>
      <Spin tip="正常生成推荐数据！" size="large" delay={500} spinning={loading}>
        {contextHolder}
        <HeaderTitleCard
          color="#1890ff"
          title1="卷烟辅材参数推荐系统"
          title2="基于多维数据的智能化推荐辅材参数"
        />
        {/* 主流 */}
        <Form form={baseForm} layout="vertical">
          <ModelTypeSelect form={baseForm} />
          <Row gutter={10} style={{ marginBottom: 15 }}>
            <Col span={8}>
              <StyledCard
                title="基准卷烟主流烟气"
                icon={<ExperimentOutlined />}
                rightAction={
                  <BrandSelectPanel
                    type="jizhun"
                    formRef={baseForm}
                    FormFields={harmfulFields}
                    width={200}
                  />
                }
              >
                <Row gutter={10} justify="space-between">
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
            <Col span={16}>
              <StyledCard
                title="基准卷烟辅材参数"
                icon={<ExperimentOutlined />}
                rightAction={
                  <BrandSelectPanel
                    type="fucai"
                    formRef={baseForm}
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
          </Row>
        </Form>
        {/* 目标权重和间隔 */}
        <Row gutter={10} style={{ marginBottom: 15 }}>
          <Col span={8}>
            <StyledCard title="目标和权重主流烟气" icon={<ExperimentOutlined />} color="#fa8c16">
              <Form form={targetForm} layout="vertical">
                <Row gutter={10} justify="space-between">
                  {targetHarmfulFields.map((field) => (
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
              </Form>
              <Form form={weightForm} layout="vertical">
                <Row gutter={10} justify="space-between">
                  {harmfulWeightFields.map((field) => (
                    <Col span={8} key={field.name}>
                      <Form.Item
                        name={field.name}
                        label={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}
                        initialValue={0.33}
                        rules={[
                          { required: true, message: '请输入焦油权重' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const co = Number(getFieldValue('coWeight') || 0)
                              const ni = Number(getFieldValue('nicotineWeight') || 0)
                              const tar = Number(value || 0)
                              const sum = Number((co + ni + tar).toFixed(2))
                              if (sum > 1) {
                                return Promise.reject(new Error('三项权重之和不能大于 1'))
                              }
                              return Promise.resolve()
                            }
                          })
                        ]}
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
              </Form>
            </StyledCard>
          </Col>
          <Col span={16}>
            <StyledCard
              title="辅材参数个性化设计范围"
              icon={<ExperimentOutlined />}
              color="#52c41a"
            >
              <Form form={rangeForm} layout="vertical">
                <Flex gap={20} style={{ width: '100%' }}>
                  <Form.Item
                    name="size"
                    label="生成推荐数量"
                    rules={requiredRule('生成推荐数量')}
                    initialValue={10}
                    layout="horizontal"
                    style={{ marginBottom: 10 }}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={10} // ✅ 最小值
                      max={100} // ✅ 最大值
                      step={1}
                      precision={0}
                      placeholder="请输入生成推荐数量"
                    />
                  </Form.Item>
                </Flex>
                <Flex gap={20} style={{ width: '100%' }}>
                  {rangeFields.map((field) => (
                    <Ranges
                      formRef={rangeForm}
                      key={field.name}
                      name={field.name}
                      unit={field.unit}
                      label={field.label}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      defaultSection={field.defaultSection}
                    />
                  ))}
                </Flex>
              </Form>
            </StyledCard>
          </Col>
        </Row>
        {/* 表格 */}
        <PredictionTable tableData={tableData} />
        {/* 操作按钮 */}
        <Affix offsetBottom={10}>
          <Card
            style={{
              width: '100%',
              marginTop: 15,
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: 10, textAlign: 'center' }}>
              <Space>
                <OptButton title="提交并生成推荐" color="#2597ff" onClick={handleSubmit} />
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
          type={0}
          modalOpen={historyModalOpen}
          onCancel={() => {
            setHistoryModalOpen(false)
          }}
        />
      </Spin>
    </div>
  )
}

export default RecommendParameter
