'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, AutoComplete, Select, InputNumber, Input, Table, Drawer, Tabs, Modal, message, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { item as itemApi, designService, returnOrderService } from '@/lib/api';
import { ReturnOrderData } from '@/lib/types';
import { STAFF_LIST } from '@/config/constants';
import moment from 'moment';

interface ReturnOrderDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnOrderDrawer({ visible, onClose, onSuccess }: ReturnOrderDrawerProps) {
  const { t } = useTranslation();
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [data, setData] = useState<ReturnOrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('2');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // --- row cache for create modal autocomplete ---
  const [rowCache, setRowCache] = useState<Record<number, { codeOptions: any[]; warehouseItems: any[] }>>({});
  const codeTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // ---- List ----
  const fetchData = async (page = 1) => {
    setLoading(true);
    setData([]);
    try {
      const formValues = searchForm.getFieldsValue();
      const params: any = {
        searchPage: { desc: 1, page, pageSize: 20, sort: 'create_date' },
        store: parseInt(activeTab),
        operator: formValues.operator || undefined,
      };
      if (formValues.operateDate?.length === 2) {
        params.startDateTime = formValues.operateDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDateTime = formValues.operateDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
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

  const handleDelete = async (record: ReturnOrderData) => {
    try {
      await returnOrderService.delete(record.id);
      message.success(t('deleteSuccess'));
      fetchData(pagination.current);
    } catch (error) {
      message.error(t('deleteFailed'));
    }
  };

  // ---- Create modal autocomplete ----
  const handleCodeSearch = (name: number, val: string) => {
    if (codeTimers.current[name]) clearTimeout(codeTimers.current[name]);
    if (!val) {
      setRowCache(prev => ({ ...prev, [name]: { codeOptions: [], warehouseItems: prev[name]?.warehouseItems ?? [] } }));
      return;
    }
    codeTimers.current[name] = setTimeout(async () => {
      try {
        const res = await designService.getList({ design: val, typeList: [], searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' } });
        if (res?.code !== 200) return;
        let content: any[] = [];
        if (Array.isArray(res.data)) content = res.data;
        else if (res.data?.content && Array.isArray(res.data.content)) content = res.data.content;
        setRowCache(prev => ({ ...prev, [name]: { codeOptions: content, warehouseItems: prev[name]?.warehouseItems ?? [] } }));
      } catch (err) {
        console.error('Failed to search design code:', err);
      }
    }, 350);
  };

  const handleCodeSelect = async (name: number, val: string, option: any) => {
    try {
      if (!option?.designId) return;
      const res = await itemApi.getList({ designId: option.designId, warehouseName: activeTab === '1' ? 'Slady一店' : 'SL二店', searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
      const items: any[] = Array.isArray(res?.data) ? res.data : (res?.data as any)?.content ?? [];
      const firstColor = items[0]?.color ?? '';
      const firstSize = items.find((i: any) => i?.color === firstColor)?.size ?? '';
      const firstItemId = items.find((i: any) => i?.color === firstColor && i?.size === firstSize)?.id ?? null;
      setRowCache(prev => ({ ...prev, [name]: { codeOptions: prev[name]?.codeOptions ?? [], warehouseItems: items } }));
      const curItems = createForm.getFieldValue('items') || [];
      curItems[name] = { ...curItems[name], code: val, color: firstColor, size: firstSize, itemId: firstItemId };
      createForm.setFieldsValue({ items: [...curItems] });
    } catch (err) {
      message.error(t('fetchStockFailed'));
    }
  };

  const handleColorChange = (name: number, val: string) => {
    const warehouseItems = rowCache[name]?.warehouseItems ?? [];
    const firstSize = warehouseItems.find((i: any) => i?.color === val)?.size ?? '';
    const firstItemId = warehouseItems.find((i: any) => i?.color === val && i?.size === firstSize)?.id ?? null;
    const curItems = createForm.getFieldValue('items') || [];
    curItems[name] = { ...curItems[name], color: val, size: firstSize, itemId: firstItemId };
    createForm.setFieldsValue({ items: [...curItems] });
  };

  const handleSizeChange = (name: number, val: string) => {
    const warehouseItems = rowCache[name]?.warehouseItems ?? [];
    const cur = (createForm.getFieldValue('items') || [])[name] || {};
    const itemId = warehouseItems.find((i: any) => i?.color === cur.color && i?.size === val)?.id ?? null;
    const curItems = createForm.getFieldValue('items') || [];
    curItems[name] = { ...curItems[name], size: val, itemId };
    createForm.setFieldsValue({ items: [...curItems] });
  };

  // ---- Create submit — single request with all items ----
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);

      const itemsPayload = (values.items || [])
        .filter((it: any) => it?.code)
        .map((it: any) => ({
          itemCode: it.code,
          color: it.color ?? '',
          size: it.size ?? '',
          qty: it.qty ?? 1,
          itemId: it.itemId ?? null,
        }));

      if (itemsPayload.length === 0) {
        message.warning(t('pleaseAddProduct'));
        return;
      }

      await returnOrderService.create({
        store: parseInt(activeTab),
        items: itemsPayload,
        remark: values.remark ?? '',
        operator: values.operator,
      });

      message.success(t('returnOrderSuccess'));
      setCreateModalVisible(false);
      createForm.resetFields();
      setRowCache({});
      fetchData(1);
      onSuccess();
    } catch (err: any) {
      if (!err?.errorFields) {
        message.error(t('returnOrderFailed'));
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseModal = () => {
    setCreateModalVisible(false);
    createForm.resetFields();
    setRowCache({});
  };

  // ---- Table columns ----
  const columns: any[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: t('products'),
      key: 'itemList',
      render: (_: any, record: ReturnOrderData) => {
        const list: any[] = record.itemList ?? [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {list.map((it: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag color="blue">{it.itemCode}</Tag>
                <span>{it.color}</span>
                <span>{it.size}</span>
                <Tag>x{it.qty}</Tag>
              </div>
            ))}
          </div>
        );
      },
    },
    { title: t('operator'), dataIndex: 'operator', key: 'operator', width: 100 },
    {
      title: t('operationTime'), dataIndex: 'createDate', key: 'createDate', width: 180,
      render: (v: string) => v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { title: t('remark'), dataIndex: 'remark', key: 'remark' },
    {
      title: t('delete'), key: 'delete', width: 100,
      render: (_: any, record: ReturnOrderData) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>{t('delete')}</Button>
      ),
    },
  ];

  // ---- Tab content ----
  const renderTabContent = () => (
    <div>
      <Form form={searchForm} layout="inline" onFinish={() => fetchData(1)} style={{ marginBottom: 16 }}>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('search')}</Button>
        </Form.Item>
        <Form.Item>
          <Button onClick={() => { searchForm.resetFields(); fetchData(1); }} icon={<ReloadOutlined />}>{t('reset')}</Button>
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          {t('returnOrder')}
        </Button>
      </div>

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
          onChange: fetchData,
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
    <>
      <Drawer
        title={t('returnOrder')}
        placement="right"
        onClose={onClose}
        open={visible}
        width={1100}
        footer={<div style={{ textAlign: 'right' }}><Button onClick={onClose}>{t('close')}</Button></div>}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} size="large" />
      </Drawer>

      {/* 创建退货订单 Modal */}
      <Modal
        title={t('returnOrder')}
        open={createModalVisible}
        onCancel={handleCloseModal}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText={t('confirm')}
        cancelText={t('cancel')}
        width={860}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>{t('addProduct')}</Button>
                </Form.Item>
                {fields.map(({ key, name, ...restField }) => {
                  const cache = rowCache[name] || { codeOptions: [], warehouseItems: [] };
                  const cur = (createForm.getFieldValue('items') || [])[name] || {};
                  const colorOptions = [...new Set((cache.warehouseItems || []).map((i: any) => i?.color).filter(Boolean))];
                  const sizeOptions = [...new Set((cache.warehouseItems || []).filter((i: any) => !cur.color || i?.color === cur.color).map((i: any) => i?.size).filter(Boolean))];
                  return (
                    <div key={key} style={{ marginBottom: 12, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Form.Item {...restField} name={[name, 'code']} label={t('designCode')} rules={[{ required: true, message: t('pleaseEnterDesignCode') }]} style={{ marginBottom: 0, flex: '0 0 190px' }}>
                          <AutoComplete
                            style={{ width: '100%' }}
                            placeholder={t('pleaseEnterDesignCode')}
                            options={(cache.codeOptions || []).filter(d => d?.design).map((d: any) => ({ value: d.design, label: `${d.design}  $${d.salePrice ?? 0}`, designId: d.id, salePrice: d.salePrice }))}
                            onSearch={val => handleCodeSearch(name, val)}
                            onSelect={(val, opt) => handleCodeSelect(name, val, opt)}
                            filterOption={false}
                            allowClear
                          />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'color']} label={t('color')} style={{ marginBottom: 0, flex: '0 0 120px' }}>
                          <Select placeholder={t('color')} style={{ width: '100%' }} options={colorOptions.map(c => ({ value: c, label: c }))} onChange={val => handleColorChange(name, val)} allowClear />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'size']} label={t('size')} style={{ marginBottom: 0, flex: '0 0 100px' }}>
                          <Select placeholder={t('size')} style={{ width: '100%' }} options={sizeOptions.map(s => ({ value: s, label: s }))} onChange={val => handleSizeChange(name, val)} allowClear />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'qty']} label={t('qty')} initialValue={1} rules={[{ required: true, message: t('pleaseEnterAmount') }]} style={{ marginBottom: 0, flex: '0 0 80px' }}>
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <div style={{ paddingTop: 30 }}>
                          <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>
          <Form.Item name="remark" label={t('remark')} style={{ marginTop: 8 }}>
            <Input placeholder={t('remark')} />
          </Form.Item>
          <Form.Item name="operator" label={t('operator')} rules={[{ required: true, message: t('pleaseEnterOperator') }]}>
            <Select placeholder={t('pleaseEnterOperator')} style={{ width: 200 }}>
              {(STAFF_LIST || []).map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
