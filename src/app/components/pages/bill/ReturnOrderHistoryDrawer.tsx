'use client';

import React, { useState, useEffect } from 'react';
import { Button, Form, Input, DatePicker, Table, Drawer, Tabs, Tag, message } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { returnOrderService } from '@/lib/api';
import type { ReturnOrderData } from '@/lib/types';
import moment from 'moment';

interface ReturnOrderHistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReturnOrderHistoryDrawer({ visible, onClose }: ReturnOrderHistoryDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data, setData] = useState<ReturnOrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('2');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchData = async (page = 1, searchParams: any = {}) => {
    setLoading(true);
    setData([]);
    try {
      const formValues = form.getFieldsValue();
      const params: any = {
        searchPage: { desc: 1, page, pageSize: 20, sort: 'create_date' },
        store: parseInt(activeTab),
        ...formValues,
        ...searchParams,
      };
      if (formValues.operateDate?.length === 2) {
        params.startDateTime = formValues.operateDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDateTime = formValues.operateDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete params.operateDate;
      }
      const response = await returnOrderService.getList(params);
      if (response.code === 200) {
        setData(response.data.content);
        setPagination({
          current: response.data.number + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
        });
      } else {
        setData([]);
        setPagination({ current: 1, pageSize: 20, total: 0 });
      }
    } catch (error) {
      console.error('获取退货订单失败:', error);
      message.error(t('fetchFailed'));
      setData([]);
      setPagination({ current: 1, pageSize: 20, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchData();
  }, [visible, activeTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination({ current: 1, pageSize: 20, total: 0 });
  };

  const handleSearch = () => fetchData(1);
  const handleReset = () => { form.resetFields(); fetchData(1); };
  const handlePageChange = (page: number) => fetchData(page);

  const handleDelete = async (record: ReturnOrderData) => {
    try {
      await returnOrderService.delete(record.id);
      message.success(t('deleteSuccess'));
      fetchData(pagination.current);
    } catch (error) {
      console.error('删除退货订单失败:', error);
      message.error(t('deleteFailed'));
    }
  };

  const columns: any[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      fixed: 'left' as const,
    },
    {
      title: t('designCode'),
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 140,
    },
    {
      title: t('color'),
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (v: string) => v ? <Tag>{v}</Tag> : '-',
    },
    {
      title: t('size'),
      dataIndex: 'size',
      key: 'size',
      width: 80,
    },
    {
      title: t('qty'),
      dataIndex: 'qty',
      key: 'qty',
      width: 70,
    },
    {
      title: t('operator'),
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: t('operationTime'),
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      render: (v: string) => moment(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: t('remark'),
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: t('delete'),
      dataIndex: 'id',
      key: 'delete',
      width: 100,
      render: (_: any, record: ReturnOrderData) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
          {t('delete')}
        </Button>
      ),
    },
  ];

  const renderTabContent = () => (
    <div>
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="itemCode" label={t('designCode')}>
          <Input placeholder={t('pleaseEnterDesignCode')} style={{ width: 160 }} allowClear />
        </Form.Item>
        <Form.Item name="operateDate" label={t('operationTime')}>
          <DatePicker.RangePicker placeholder={[t('startTime'), t('endTime')]} style={{ width: 300 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('search')}</Button>
        </Form.Item>
        <Form.Item>
          <Button onClick={handleReset} icon={<ReloadOutlined />}>{t('reset')}</Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePageChange,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        }}
      />
    </div>
  );

  const tabItems = [
    { key: '1', label: '一店', children: renderTabContent() },
    { key: '2', label: '二店', children: renderTabContent() },
  ];

  return (
    <Drawer
      title={t('returnOrder')}
      placement="right"
      onClose={onClose}
      open={visible}
      width={1100}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose}>{t('close')}</Button>
        </div>
      }
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} size="large" />
    </Drawer>
  );
}
