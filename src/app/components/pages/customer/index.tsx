'use client';

import React, { useState } from 'react';
import { Table, Form, Input, Button, Card, message, Pagination, Modal, Drawer, Space, Tag, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CustomerData, CustomerListRequest, CreateCustomerRequest, ModifyCustomerRequest, ReceiptData, ReceiptItem } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { customerApi, receipt } from '@/lib/api';
import { useInitialListRefresh } from '@/lib/useListRefresh';

export default function CustomerManagement() {
  const { t } = useTranslation();
  const { canUseFeature } = usePermissions();
  const [form] = Form.useForm();
  const [modifyForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modifyDrawerVisible, setModifyDrawerVisible] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData[]>([]);
  const [receiptCustomer, setReceiptCustomer] = useState<CustomerData | null>(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const formValues = form.getFieldsValue();
      const params: CustomerListRequest = {
        searchPage: { desc: 1, page, pageSize: 20, sort: 'id' },
        ...formValues,
      };
      const response = await customerApi.getPage(params);
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
      console.error('fetch customers failed:', error);
      message.error(t('fetchCustomerDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  useInitialListRefresh(() => fetchData(1));

  const handleViewReceipts = async (record: CustomerData) => {
    setReceiptCustomer(record);
    setReceiptModalVisible(true);
    setReceiptLoading(true);
    try {
      const response = await receipt.getList({
        searchPage: { desc: 1, page: 1, pageSize: 100, sort: 'id' },
        store: 0,
        customerId: record.id,
      });
      if (response.code === 200) {
        setReceiptData(response.data.content);
      } else {
        setReceiptData([]);
      }
    } catch (error) {
      console.error('fetch receipts failed:', error);
      setReceiptData([]);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleModify = (record: CustomerData) => {
    setSelectedCustomer(record);
    modifyForm.setFieldsValue({
      name: record.name,
      phone: record.phone,
      remark: record.remark,
    });
    setModifyDrawerVisible(true);
  };

  const handleModifySubmit = async () => {
    try {
      const values = await modifyForm.validateFields();
      if (!selectedCustomer) return;
      const params: ModifyCustomerRequest = {
        id: selectedCustomer.id,
        name: values.name,
        phone: values.phone,
        remark: values.remark || '',
      };
      const response = await customerApi.modify(params);
      if (response.code === 200) {
        message.success(t('modifySuccess'));
        setModifyDrawerVisible(false);
        fetchData(pagination.current);
      } else {
        message.error(response.msg || t('modifyFailed'));
      }
    } catch (error) {
      console.error('modify customer failed:', error);
    }
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const params: CreateCustomerRequest = {
        name: values.name,
        phone: values.phone,
        remark: values.remark || '',
      };
      const response = await customerApi.create(params);
      if (response.code === 200) {
        message.success(t('createSuccess'));
        setCreateDrawerVisible(false);
        createForm.resetFields();
        fetchData(1);
      } else {
        message.error(response.msg || t('createFailed'));
      }
    } catch (error) {
      console.error('create customer failed:', error);
    }
  };

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const response = await customerApi.delete(selectedRowKeys as number[]);
      if (response.code === 200) {
        message.success(t('deleteSuccess'));
        setDeleteModalVisible(false);
        setSelectedRowKeys([]);
        fetchData(pagination.current);
      } else {
        message.error(response.msg || t('deleteFailed'));
      }
    } catch (error) {
      console.error('delete customer failed:', error);
    }
  };

  const columns = [
    { title: t('customerName'), dataIndex: 'name', key: 'name' },
    { title: t('customerPhone'), dataIndex: 'phone', key: 'phone' },
    { title: t('remark'), dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: t('operation'),
      key: 'actions',
      render: (_: unknown, record: CustomerData) => (
        <Space>
          <Button type="link" icon={<FileTextOutlined />} onClick={() => handleViewReceipts(record)}>
            {t('viewReceipts')}
          </Button>
          {canUseFeature('editCustomer') && (
            <Button type="link" icon={<EditOutlined />} onClick={() => handleModify(record)}>
              {t('edit')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="name" label={t('customerName')}>
            <Input placeholder={t('customerName')} allowClear />
          </Form.Item>
          <Form.Item name="phone" label={t('customerPhone')}>
            <Input placeholder={t('customerPhone')} allowClear />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchData(1)}>
              {t('search')}
            </Button>
          </Form.Item>
          <Form.Item>
            <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); fetchData(1); }}>
              {t('reset')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 16 }}>
          {canUseFeature('createCustomer') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateDrawerVisible(true)} style={{ marginRight: 8 }}>
              {t('createCustomer')}
            </Button>
          )}
          {canUseFeature('deleteCustomer') && (
            <Button danger disabled={selectedRowKeys.length === 0} onClick={() => setDeleteModalVisible(true)}>
              {t('delete')}
            </Button>
          )}
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          pagination={false}
        />
        <Pagination
          style={{ marginTop: 16, textAlign: 'right' }}
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={(page) => fetchData(page)}
          showSizeChanger={false}
        />
      </Card>

      <Drawer title={t('modifyCustomer')} open={modifyDrawerVisible} onClose={() => setModifyDrawerVisible(false)} width={400}>
        <Form form={modifyForm} layout="vertical">
          <Form.Item name="name" label={t('customerName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('customerPhone')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label={t('remark')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" onClick={handleModifySubmit}>{t('confirm')}</Button>
        </Form>
      </Drawer>

      <Drawer title={t('createCustomer')} open={createDrawerVisible} onClose={() => setCreateDrawerVisible(false)} width={400}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label={t('customerName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('customerPhone')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label={t('remark')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" onClick={handleCreateSubmit}>{t('confirm')}</Button>
        </Form>
      </Drawer>

      <Modal
        title={t('confirmDelete')}
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      >
        {t('confirmDeleteCustomer')}
      </Modal>

      <Modal
        title={`${receiptCustomer?.name || ''} - ${t('receiptHistory')}`}
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        footer={null}
        width={900}
      >
        <Spin spinning={receiptLoading}>
          <Table
            rowKey="id"
            dataSource={receiptData}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: t('receiptId'), dataIndex: 'id', key: 'id', width: 80 },
              {
                title: t('date'),
                dataIndex: 'receiptDate',
                key: 'receiptDate',
                width: 160,
                render: (v: string) => v?.slice(0, 16) || '-',
              },
              {
                title: t('items'),
                dataIndex: 'itemList',
                key: 'itemList',
                ellipsis: true,
                render: (itemList: ReceiptItem[] | string) => {
                  const list: ReceiptItem[] = typeof itemList === 'string' ? JSON.parse(itemList || '[]') : (itemList || []);
                  return list.map((i) => `${i.code}×${i.qty}`).join(', ') || '-';
                },
              },
              {
                title: t('totalPrice'),
                dataIndex: 'totalPrice',
                key: 'totalPrice',
                width: 100,
                render: (v: number) => v != null ? `$${v.toFixed(2)}` : '-',
              },
              {
                title: t('store'),
                dataIndex: 'store',
                key: 'store',
                width: 80,
              },
              {
                title: t('void'),
                dataIndex: 'voided',
                key: 'voided',
                width: 80,
                render: (v: number) => v ? <Tag color="red">Void</Tag> : <Tag color="green">OK</Tag>,
              },
            ]}
          />
        </Spin>
      </Modal>
    </div>
  );
}
