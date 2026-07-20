'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Table, Button, Modal, Drawer, Form, Input, InputNumber, Select, message, App, Dropdown, Space, DatePicker, Card, Collapse } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, SendOutlined, CheckOutlined, ExclamationCircleOutlined, ReloadOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { OrderData, ModifyOrderRequest, colorList, sizeList, WAREHOUSE } from '@/lib/types';
import { order } from '@/lib/api';
import { API_CONFIG } from '@/config/constants';
import moment from 'moment';

interface OrderListProps {
  warehouseName: string;
  onRefresh: () => void;
}

const OrderList = forwardRef<any, OrderListProps>(({ warehouseName, onRefresh }, ref) => {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [sentForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderData[]>([]);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [sentDrawerVisible, setSentDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [searchCollapsed, setSearchCollapsed] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 状态选项
  const statusOptions = [
    { value: "0", label: t('pending') },
    { value: "1", label: t('shipped') },
    { value: "2", label: t('completed') },
    { value: "3", label: t('outOfStock') },
    { value: "4", label: t('damaged') },
    { value: "6", label: t('arrivedNotPickedUp') },
  ];

  // 获取订单数据
  const fetchOrders = async (page = 1, searchParams: any = {}) => {
    setLoading(true);
    try {
      const formValues = searchForm.getFieldsValue();
      
      const params = {
        areaType: 1,
        warehouseName,
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'create_date'
        },
        ...formValues,
        ...searchParams
      };
      
      // 处理状态：如果为空则使用默认值
      if (!formValues.status || formValues.status.length === 0) {
        params.status = ['5'];
      }
      
      // 处理日期范围
      if (formValues.dateRange && formValues.dateRange.length === 2) {
        // 直接使用 Moment 对象，不需要重新包装
        params.startDate = formValues.dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = formValues.dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete params.dateRange;
      }
      
      const response = await order.getPage(params);
      if (response.code === 200) {
        setData(response.data.content);
        setPagination({
          current: response.data.number + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      message.error(t('noOrderData'));
    } finally {
      setLoading(false);
    }
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchOrders(1);
    }
  }));

  // 初始化数据
  useEffect(() => {
    fetchOrders();
  }, [warehouseName]);

  // 搜索
  const handleSearch = () => {
    fetchOrders(1);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    fetchOrders(1);
  };

  // 打印/导出
  const handlePrint = async () => {
    try {
      const formValues = searchForm.getFieldsValue();
      
      const params = {
        areaType: 1,
        warehouseName,
        searchPage: {
          desc: 1,
          page: 1,
          pageSize: 20,
          sort: 'create_date'
        },
        ...formValues
      };
      
      // 处理状态：如果为空则使用默认值
      if (!formValues.status || formValues.status.length === 0) {
        params.status = ['0', '1', '2', '3', '4'];
      }
      
      // 处理日期范围
      if (formValues.dateRange && formValues.dateRange.length === 2) {
        // 直接使用 Moment 对象，不需要重新包装
        params.startDate = formValues.dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = formValues.dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete params.dateRange;
      }
      
      const blob = await order.export(params);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-list_${warehouseName}_${moment().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(t('exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      message.error(t('exportFailed'));
    }
  };

  // 状态渲染
  const renderStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      '0': { text: t('pending'), color: '#faad14' },
      '1': { text: t('shipped'), color: '#1890ff' },
      '2': { text: t('completed'), color: '#52c41a' },
      '3': { text: t('outOfStock'), color: '#ff4d4f' },
      '4': { text: t('damaged'), color: '#722ed1' },
      '5': { text: t('completed'), color: '#52c41a' },
      '6': { text: t('arrivedNotPickedUp'), color: '#fa8c16' },
    };
    
    const statusInfo = statusMap[status] || { text: t('unknown'), color: '#d9d9d9' };
    return <span style={{ color: statusInfo.color, fontWeight: 'bold' }}>{statusInfo.text}</span>;
  };

  // 修改订单
  const handleEdit = (orderData: OrderData) => {
    setSelectedOrder(orderData);
    form.setFieldsValue({
      size: orderData.size,
      color: orderData.color,
      remark: orderData.remark,
      amount: orderData.amount,
    });
    setEditDrawerVisible(true);
  };

  // 提交修改
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedOrder) {
        const modifyData: ModifyOrderRequest = {
          size: values.size,
          color: values.color,
          remark: values.remark,
          amount: values.amount,
          id: selectedOrder.id,
        };
        
        await order.modify(modifyData);
        message.success(t('modifyOrderSuccess'));
        setEditDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Modify order failed:', error);
      message.error(t('modifyOrderFailed'));
    }
  };

  // 删除订单
  const handleDelete = (orderData: OrderData) => {
    modal.confirm({
      title: t('confirmDeleteOrder'),
      content: `${t('sureDeleteOrder')}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await order.delete([orderData.id]);
          message.success(t('deleteOrderSuccess'));
          onRefresh();
        } catch (error) {
          console.error('Delete order failed:', error);
          message.error(t('deleteOrderFailed'));
        }
      },
    });
  };

  // 发货
  const handleSent = (orderData: OrderData) => {
    setSelectedOrder(orderData);
    sentForm.resetFields();
    setSentDrawerVisible(true);
  };

  // 提交发货
  const handleSentSubmit = async () => {
    try {
      const values = await sentForm.validateFields();
      if (selectedOrder) {
        await order.modify({
          id: selectedOrder.id,
          pendingDate: values.pendingDate,
          status: '1',
        });
        message.success(t('shipOrderSuccess'));
        setSentDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Ship failed:', error);
      message.error(t('shipOrderFailed'));
    }
  };

  // 状态变更
  const handleStatusChange = (orderData: OrderData, status: string, statusText: string) => {
    modal.confirm({
      title: statusText,
      content: `${t('confirm')}${statusText}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await order.modify({
            ...orderData,
            status,
            pendingDate: '',
          } as any);
          message.success(`${statusText} ${t('success')}`);
          onRefresh();
        } catch (error) {
          console.error(`${statusText} failed:`, error);
          message.error(t('statusUpdateFailed'));
        }
      },
    });
  };

  // 重置状态
  const handleResetStatus = (orderData: OrderData) => {
    modal.confirm({
      title: t('resetStatusText'),
      content: `${t('confirmResetStatus')}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await order.modify({
            ...orderData,
            status: '0',
            pendingDate: '',
          } as any);
          message.success(t('resetStatusSuccess'));
          onRefresh();
        } catch (error) {
          console.error('Reset status failed:', error);
          message.error(t('resetStatusFailed'));
        }
      },
    });
  };

  // 操作菜单
  const getActionMenu = (orderData: OrderData) => ({
    items: [
      {
        key: 'edit',
        label: t('modifyOrder'),
        icon: <EditOutlined />,
        onClick: () => handleEdit(orderData),
      },
      {
        key: 'delete',
        label: t('deleteOrder'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(orderData),
      },
      {
        key: 'sent',
        label: t('shipped'),
        icon: <SendOutlined />,
        onClick: () => handleSent(orderData),
      },
      {
        key: 'ok',
        label: t('completed'),
        icon: <CheckOutlined />,
        onClick: () => handleStatusChange(orderData, '2', t('completed')),
      },
      {
        key: 'out_of_stock',
        label: t('outOfStock'),
        icon: <ExclamationCircleOutlined />,
        onClick: () => handleStatusChange(orderData, '3', t('outOfStock')),
      },
      {
        key: 'damaged',
        label: t('damaged'),
        icon: <CloseOutlined />,
        onClick: () => handleStatusChange(orderData, '4', t('damaged')),
      },
      {
        key: 'reset',
        label: t('resetStatus'),
        icon: <ReloadOutlined />,
        onClick: () => handleResetStatus(orderData),
      },
    ],
  });

  const columns = [
    {
      title: t('photo'),
      dataIndex: 'previewPhoto',
      width: 120,
      fixed: 'left' as const,
      render: (item: string) => (
        <img 
          style={{ height: 150, width: 120, objectFit: 'cover' }} 
          alt="" 
          src={API_CONFIG.BASE_URL + item}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            // 防止无限循环：如果已经是 placeholder 就不再设置
            if (!img.src.includes('placeholder-image.jpg') && !img.src.includes('data:image')) {
              // 使用 data URI 作为占位符（透明 1x1 像素图片）
              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
            }
          }}
        />
      ),
    },
    {
      title: t('designCode'),
      dataIndex: 'design',
      key: 'design',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: t('price'),
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 100,
    },
    {
      title: t('color'),
      dataIndex: 'color',
      key: 'color',
      width: 100,
    },
    {
      title: t('size'),
      dataIndex: 'size',
      key: 'size',
      width: 80,
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 80,
    },
    {
      title: t('time'),
      dataIndex: 'date',
      width: 110,
      render: (data: string) => moment(data).format('YYYY-MM-DD'),
    },
    {
      title: t('remark'),
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
    },
    {
      title: t('status'),
      dataIndex: 'status',
      width: 130,
      render: (value: string) => renderStatus(value),
    },
    {
      title: t('shippingDate'),
      dataIndex: 'pendingDate',
      width: 110,
      render: (value: any) => value && <div>{value}</div>,
    },
    {
      title: t('operation'),
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: OrderData) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      {/* 高级搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Collapse
          activeKey={searchCollapsed ? [] : ['search']}
          onChange={(keys) => setSearchCollapsed(keys.length === 0)}
          items={[
            {
              key: 'search',
              label: t('advancedSearch'),
              children: (
                <Form
                  form={searchForm}
                  layout="inline"
                  onFinish={handleSearch}
                  style={{ marginBottom: 16 }}
                >
                  <Form.Item name="design" label={t('orderCode')}>
                    <Input placeholder={t('pleaseEnterDesignCode')} style={{ width: 200 }} />
                  </Form.Item>
                  
                  <Form.Item name="remark" label={t('orderRemark')}>
                    <Input placeholder={t('pleaseEnterRemark')} style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item name="dateRange" label={t('dateRange')}>
                    <DatePicker.RangePicker style={{ width: 300 }} />
                  </Form.Item>
                  
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                      {t('search')}
                      </Button>
                      <Button onClick={handleReset}>
                      {t('reset')}
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (page) => {
            fetchOrders(page);
          },
        }}
      />

      {/* 打印按钮 */}
      <div style={{ 
        marginTop: 16, 
        textAlign: 'center',
        padding: '16px 0',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Button 
          type="primary" 
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          size="large"
        >
          {t('print')}
        </Button>
      </div>

      {/* 修改订单抽屉 */}
      <Drawer
        title={t('modifyOrder')}
        open={editDrawerVisible}
        onClose={() => setEditDrawerVisible(false)}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="size"
            label={t('orderSize')}
            rules={[{ required: true, message: t('pleaseSelectSize') }]}
          >
            <Select
              placeholder={t('pleaseSelectSize')}
              options={sizeList.map(size => ({ label: size, value: size }))}
            />
          </Form.Item>
          
          <Form.Item
            name="color"
            label={t('orderColor')}
            rules={[{ required: true, message: t('pleaseSelectColor') }]}
          >
            <Select
              placeholder={t('pleaseSelectColor')}
              options={colorList.map(color => ({ label: color, value: color }))}
            />
          </Form.Item>
          
          <Form.Item
            name="remark"
            label={t('orderRemark')}
          >
            <Input placeholder={t('pleaseEnterRemark')} />
          </Form.Item>
          
          <Form.Item
            name="amount"
            label={t('orderAmount')}
            rules={[
              { required: true, message: t('pleaseEnterAmount') },
              { type: 'number', min: 1, message: t('mustBeGreaterThanZero') }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              precision={0}
              placeholder={t('pleaseEnterAmount')}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('confirmModify')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 发货抽屉 */}
      <Drawer
        title={t('sent')}
        open={sentDrawerVisible}
        onClose={() => setSentDrawerVisible(false)}
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <p>{t('orderCode')}: <strong>{selectedOrder?.design}</strong></p>
          <p>{t('orderColor')}: {selectedOrder?.color}</p>
          <p>{t('orderSize')}: {selectedOrder?.size}</p>
          <p>{t('orderAmount')}: {selectedOrder?.amount}</p>
        </div>
        
        <Form
          form={sentForm}
          layout="vertical"
          onFinish={handleSentSubmit}
        >
          <Form.Item
            name="pendingDate"
            label={t('shippingDate')}
            rules={[
              { required: true, message: t('pleaseEnterShippingDate') }
            ]}
          >
            <Input placeholder={t('pleaseEnterShippingDate')} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('confirmShipText')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
});

export default OrderList;
