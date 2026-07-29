'use client';

import React, { useState } from 'react';
import { Table, Button, Drawer, InputNumber, Input, message, App, Select } from 'antd';
import Form from '@/app/components/common/ValidatedForm';
import { DeleteOutlined, EditOutlined, PlusOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ItemData, CreateOrderRequest } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { item, order } from '@/lib/api';
import OrderForm from '@/app/components/shared/OrderForm';

interface ItemTableProps {
  data: ItemData[];
  loading: boolean;
  warehouseName: string;
  designId: number;
  onRefresh: () => void;
}

export default function ItemTable({ data, loading, warehouseName, designId, onRefresh }: ItemTableProps) {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { canUseFeature, isSaler, userInfo } = usePermissions();
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [orderForm] = Form.useForm();
  
  const [stockDrawerVisible, setStockDrawerVisible] = useState(false);
  const [orderDrawerVisible, setOrderDrawerVisible] = useState(false);
  const [orderType, setOrderType] = useState<'store' | 'customer'>('store');
  const [currentItem, setCurrentItem] = useState<ItemData | null>(null);

  const handleDelete = (itemData: ItemData) => {
    modal.confirm({
      title: t('confirmDelete'),
      content: t('confirmDeleteItem', { color: itemData.color, size: itemData.size }),
      icon: <DeleteOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await item.delete(itemData.id);
          message.success(t('deleteSuccess'));
          onRefresh();
        } catch (error) {
          console.error('删除失败:', error);
          message.error(t('deleteFailedRetry'));
        }
      },
    });
  };

  const handleModifyStock = (itemData: ItemData) => {
    setCurrentItem(itemData);
    stockForm.setFieldsValue({
      inStoreStock: itemData.inStoreStock ?? 0,
      tempStoreStock: itemData.tempStoreStock ?? 0,
    });
    setStockDrawerVisible(true);
  };

  const handleStockSubmit = async () => {
    try {
      const values = await stockForm.validateFields();
      if (currentItem) {
        await item.modifyWarehouseStock(
          currentItem.id,
          values.inStoreStock ?? 0,
          values.tempStoreStock ?? 0
        );
        message.success(t('stockModifySuccess'));
        setStockDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('修改库存失败:', error);
      message.error(t('modifyStockFailedRetry'));
    }
  };

  const handleOrder = (itemData: ItemData, type: 'store' | 'customer') => {
    setCurrentItem(itemData);
    setOrderType(type);
    orderForm.resetFields();
    if (type === 'store') {
      orderForm.setFieldsValue({ remark: t('storeAdjustment') });
    }
    setOrderDrawerVisible(true);
  };

  const handleOrderSubmit = async () => {
    try {
      const values = await orderForm.validateFields();
      if (currentItem) {
        const orderData: CreateOrderRequest = {
          itemId: currentItem.id,
          amount: values.amount,
          type: orderType === 'store' ? 0 : 1, // 0 店补， 1 客定
          remark: values.remark || '',
          paymentStatus: -1,
          status: '0',
          customerContact: values.customerContact || '',
          paymentFlag: values.paymentFlag || 'UNPAID',
          orderedBy: values.orderedBy || '',
          statusChangeUserId: userInfo?.id || 0,
          statusChangeUserName: userInfo?.name || t('unknown'),
          statusChangeTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        
        await order.create(orderData);
        message.success(orderType === 'store' ? t('storeAdjustmentSuccess') : t('customerOrderSuccess'));
        setOrderDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      message.error(t('createOrderFailedRetry'));
    }
  };

  const columns = [
    {
      title: t('color'),
      dataIndex: 'color',
      key: 'color',
    },
    {
      title: t('size'),
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: t('inStoreStock'),
      dataIndex: 'inStoreStock',
      key: 'inStoreStock',
      render: (stock: number) => (
        <span style={{ color: stock > 0 ? '#52c41a' : '#ff4d4f' }}>
          {stock || 0}
        </span>
      ),
    },
    {
      title: t('tempStoreStock'),
      dataIndex: 'tempStoreStock',
      key: 'tempStoreStock',
      render: (stock: number) => (
        <span style={{ color: stock > 0 ? '#52c41a' : '#ff4d4f' }}>
          {stock || 0}
        </span>
      ),
    },
    {
      title: t('operation'),
      key: 'action',
      render: (_: any, record: ItemData) => (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {canUseFeature('modifyStock') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleModifyStock(record)}
              size="small"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '4px 8px',
                height: 'auto',
                minWidth: '80px'
              }}
            >
              {t('modifyStock')}
            </Button>
          )}
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => handleOrder(record, 'store')}
            size="small"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              padding: '4px 8px',
              height: 'auto',
              minWidth: '80px'
            }}
          >
            {t('storeAdjustment')}
          </Button>
          <Button
            type="link"
            icon={<ShoppingOutlined />}
            onClick={() => handleOrder(record, 'customer')}
            size="small"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              padding: '4px 8px',
              height: 'auto',
              minWidth: '80px'
            }}
          >
            {t('customerOrder')}
          </Button>
          {canUseFeature('deleteItem') && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #ff4d4f',
                borderRadius: '4px',
                padding: '4px 8px',
                height: 'auto',
                minWidth: '80px',
                color: '#ff4d4f'
              }}
            >
              {t('delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>{warehouseName} {t('stock')}</h4>
      </div>
      
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={false}
        size="small"
      />

      <Drawer
        title={t('modifyStock')}
        open={stockDrawerVisible}
        onClose={() => setStockDrawerVisible(false)}
        width={400}
      >
        <Form form={stockForm} layout="vertical" onFinish={handleStockSubmit}>
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6, fontSize: 13, color: '#666' }}>
            {currentItem?.color} / {currentItem?.size}
          </div>
          <Form.Item
            label={t('inStoreStock')}
            name="inStoreStock"
            rules={[{ type: 'number', min: 0, message: t('cannotBeLessThanZero') }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>
          <Form.Item
            label={t('tempStoreStock')}
            name="tempStoreStock"
            rules={[{ type: 'number', min: 0, message: t('cannotBeLessThanZero') }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('confirmModify')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={orderType === 'store' ? t('storeAdjustment') : t('customerOrder')}
        open={orderDrawerVisible}
        onClose={() => setOrderDrawerVisible(false)}
        width={400}
      >
        <Form
          form={orderForm}
          layout="vertical"
          onFinish={handleOrderSubmit}
        >
          <OrderForm />
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {orderType === 'store' ? t('confirmStoreAdjustment') : t('confirmCustomerOrder')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
