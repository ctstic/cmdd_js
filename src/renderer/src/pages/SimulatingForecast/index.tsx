import { ExperimentOutlined } from '@ant-design/icons'
import { HeaderTitleCard, OptButton, StyledCard } from '@renderer/components/base'
import { Affix, Card, Col, Form, InputNumber, notification, Row, Space } from 'antd'
import React, { useRef, useState } from 'react'
import { baseMaterialFields, harmfulFields } from '../formd'
import PredictionTable from './PredictionTable'
import ModelTypeSelect from '@renderer/components/ModelTypeSelect'
import BrandSelectPanel from '@renderer/components/BrandSelectPanel'
import HistoryModal from '../RecommendParameter/HistoryModal'

const requiredRule = (label: string) => [{ required: true, message: `请输入${label}` }]

const SimulatingForecast: React.FC = () => {
  const [notificationApi, contextHolder] = notification.useNotification()
  const [formRef] = Form.useForm()
  const tableRef = useRef<any>(null)
  // 当前计算的结果数据
  const [previousData, setPreviousData] = useState<any>(null)
  // 历史数据弹窗
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false)

  // 计算
  const handleSubmit = async (): Promise<void> => {
    try {
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

          console.log(
            '🚀 ~ handleSubmit ~ formValues.modelType:',
            formValues.modelType,
            formValues,
            inputParams,
            res
          )

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
          } else {
            notificationApi.error({
              message: res.data.errors
            })
          }
        }
      }
    } catch (error) {
      notificationApi.error({
        message: '计算异常，请检查表单填写'
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
      description: '表单和表格数据已重置'
    })
  }

  // 合并并优化后的方法
  const validateAndCompareData = async (): Promise<boolean> => {
    try {
      // 获取表单和表格数据
      const formValues = await formRef.validateFields()
      const dataSource = tableRef.current.getData()
      console.log('🚀 ~ validateAndCompareData ~ formValues:', formValues, dataSource)

      let isValid = true // 用于标识校验是否通过

      // 校验表格数据
      if (dataSource.length === 0) {
        notificationApi.error({
          message: '基础数据为空，请填写基础数据内容'
        })
        isValid = false
      } else {
        dataSource.forEach((data: any, index: number) => {
          // 校验每个字段是否为空
          for (const key in data) {
            if (data[key] === null || data[key] === '' || data[key] === undefined) {
              notificationApi.error({
                message: '基础数据需要完整！'
              })
              isValid = false
              return isValid // 一旦发现问题就停止循环并返回校验结果
            }
          }

          // 检查是否与上次提交的数据完全一致
          if (previousData && JSON.stringify(previousData) === JSON.stringify(data)) {
            notificationApi.error({
              message: '本次数据和上次保存数据一直，请修改后再次保存！'
            })
            isValid = false
          }

          // 更新上次的数据
          setPreviousData(data)
        })
      }

      // 返回最终校验结果
      return isValid
    } catch (error) {
      notificationApi.error({
        message: '请先进行一次计算！'
      })
      return false // 如果捕获到异常，则返回 false
    }
  }

  // 保存
  const handleSave = async (): Promise<void> => {
    validateAndCompareData()
    // if () {
    //   try {
    //     const formValues = await formRef.validateFields()
    //     const dataSource = tableRef.current.getData()
    //     await window.electronAPI.simulationPredictionSaveAPI.create({
    //       specimenName: formValues.modelType,
    //       standardParams: formValues,
    //       predictionParams: dataSource
    //     })
    //     notificationApi.success({
    //       message: '保存成功！'
    //     })
    //   } catch (error) {
    //     notificationApi.error({
    //       message: '请先进行一次计算！'
    //     })
    //   }
    // }
  }

  // 导出
  const handleExport = async (): Promise<void> => {
    if (validateAndCompareData) {
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
          message: '请先进行一次计算！'
        })
      }
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 145px)' }}>
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
              color="#fa8c16"
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
      <PredictionTable actionRef={tableRef} />
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
          <div style={{ padding: 15, textAlign: 'center' }}>
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
    </div>
  )
}

export default SimulatingForecast
