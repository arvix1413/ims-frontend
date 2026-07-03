'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Input, InputNumber, Select, DatePicker, Table, Drawer, Tabs, Modal, message, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CashData, CashListRequest, CreateCashRequest } from '@/lib/types';
import { cashService } from '@/lib/api';
import moment from 'moment';

interface CashInOutDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function CashInOutDrawer({ visible, onClose }: CashInOutDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [data, setData] = useState<CashData[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('2'); // 默认二店
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 获取数据
  const fetchData = async (page = 1, searchParams: any = {}) => {
    setLoading(true);
    setData([]);
    
    try {
      const formValues = form.getFieldsValue();
      const params: CashListRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'create_date'
        },
        store: parseInt(activeTab),
        ...formValues,
        ...searchParams
      };

      // 处理日期范围
      if (formValues.operateDate && formValues.operateDate.length === 2) {
        params.startDateTime = formValues.operateDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDateTime = formValues.operateDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete (params as any).operateDate;
      }

      const response = await cashService.getList(params);
      if (response.code === 200) {
        setData(response.data.content);
        setPagination({
          current: response.data.number + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
        });
      } else {
        setData([]);
        setPagination({
          current: 1,
          pageSize: 20,
          total: 0,
        });
      }
    } catch (error) {
      console.error('获取现金数据失败:', error);
      message.error(t('获取现金数据失败'));
      setData([]);
      setPagination({
        current: 1,
        pageSize: 20,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, activeTab]);

  // Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination({
      current: 1,
      pageSize: 20,
      total: 0,
    });
  };

  // 搜索
  const handleSearch = () => {
    fetchData(1);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    fetchData(1);
  };

  // 分页变化
  const handleTableChange = (page: number) => {
    fetchData(page);
  };

  // 创建现金进出记录
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      
      const params: CreateCashRequest = {
        type: values.type,
        amount: values.amount,
        remark: values.remark,
        store: parseInt(activeTab)
      };
      
      await cashService.create(params);
      message.success(t('创建成功'));
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData(pagination.current);
    } catch (error: any) {
      if (error.errorFields) {
        message.error(t('请填写完整'));
      } else {
        console.error('创建失败:', error);
        message.error(t('创建失败'));
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // 删除现金进出记录
  const handleDelete = async (record: CashData) => {
    try {
      await cashService.delete(record.id);
      message.success(t('删除成功'));
      fetchData(pagination.current);
    } catch (error) {
      console.error('删除失败:', error);
      message.error(t('删除失败'));
    }
  };

  // 表格列定义
  const columns: any = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left' as const,
      width: 100,
    },
    {
      title: 'Cash In/Out',
      dataIndex: 'type',
      key: 'type',
      fixed: 'left' as const,
      width: 100,
      render: (type: number) =>type==1? <Tag color='green'>Cash In</Tag>:<Tag color='red'>Cash Out</Tag>,
    },
    {
      title: 'AMOUNT',
      dataIndex: 'amount',
      key: 'amount',
      fixed: 'left' as const,
      width: 200,
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'OPERATION_TIME',
      dataIndex: 'createDate',
      key: 'createDate',
      fixed: 'right' as const,
      width: 200,
      render: (value: string) => moment(value).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: 'REMARK',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: 'DELETE',
      dataIndex: 'id',
      key: 'delete',
      width: 150,
      render: (id: number, record: CashData) => (
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => {
            handleDelete(record);
          }}
        >{t('delete')}</Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: '1',
      label: '一店',
      children: (
        <div>
          {/* 搜索表单 */}
          <Form
            form={form}
            layout="inline"
            onFinish={handleSearch}
          >
            <Form.Item name="operateDate" label={t('operationTime')}>
              <DatePicker.RangePicker 
                placeholder={[t('startTime'), t('endTime')]} 
                style={{ width: 300 }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t('search')}
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
              {t('reset')}
              </Button>
            </Form.Item>
          </Form>

          {/* 操作按钮 */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setCreateModalVisible(true)}
            >
              Cash In/Out
            </Button>
          </div>

          {/* 数据表格 */}
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handleTableChange,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
            scroll={{ x: "100%" }}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: '二店',
      children: (
        <div>
          {/* 搜索表单 */}
          <Form
            form={form}
            layout="inline"
            onFinish={handleSearch}
          >
            <Form.Item name="operateDate" label={t('operationTime')}>
              <DatePicker.RangePicker 
                placeholder={[t('startTime'), t('endTime')]} 
                style={{ width: 300 }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t('search')}
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
              {t('reset')}
              </Button>
            </Form.Item>
          </Form>

          {/* 操作按钮 */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setCreateModalVisible(true)}
            >
              Cash In/Out
            </Button>
          </div>

          {/* 数据表格 */}
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handleTableChange,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
            scroll={{ x: "100%" }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title="Cash In/Out"
        placement="right"
        onClose={onClose}
        open={visible}
        width={1000}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={onClose}>{t('close')}</Button>
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="large"
        />
      </Drawer>

      {/* 创建现金进出记录Modal */}
      <Modal
        title={t('create')}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText={t('save')}
        cancelText={t('cancel')}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ type: 1, amount: 0, remark: '' }}
        >
          <Form.Item
            name="type"
            label="Cash In/Out"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select style={{ width: 200 }}>
              <Select.Option value={1}>Cash In</Select.Option>
              <Select.Option value={2}>Cash Out</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="AMOUNT"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber 
              min={0} 
              placeholder={t('pleaseEnterAmount')} 
              style={{ width: 200 }} 
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="REMARK"
            rules={[{ required: true, message: '请输入备注' }]}
          >
            <Input 
              placeholder={t('pleaseEnterRemark')} 
              style={{ width: 200 }} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
