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
    { value: "7", label: t('unpaidTry') },
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
      console.error('获取订单数据失败:', error);
      message.error('获取订单数据失败');
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
      link.download = `订单列表_${warehouseName}_${moment().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请稍后重试');
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
      '5': { text: '已结单', color: '#52c41a' },
      '6': { text: t('arrivedNotPickedUp'), color: '#fa8c16' },
      '7': { text: t('unpaidTry'), color: '#eb2f96' },
    };
    
    const statusInfo = statusMap[status] || { text: '未知', color: '#d9d9d9' };
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
        message.success('修改订单成功');
        setEditDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('修改订单失败:', error);
      message.error('修改订单失败，请稍后重试');
    }
  };

  // 删除订单
  const handleDelete = (orderData: OrderData) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除订单: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await order.delete([orderData.id]);
          message.success('删除订单成功');
          onRefresh();
        } catch (error) {
          console.error('删除订单失败:', error);
          message.error('删除订单失败，请稍后重试');
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
        message.success('订单已发货');
        setSentDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('发货失败:', error);
      message.error('发货失败，请稍后重试');
    }
  };

  // 状态变更
  const handleStatusChange = (orderData: OrderData, status: string, statusText: string) => {
    modal.confirm({
      title: statusText,
      content: `确认${statusText}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await order.modify({
            ...orderData,
            status,
            pendingDate: '',
          } as any);
          message.success(`${statusText}成功`);
          onRefresh();
        } catch (error) {
          console.error(`${statusText}失败:`, error);
          message.error(`${statusText}失败，请稍后重试`);
        }
      },
    });
  };

  // 重置状态
  const handleResetStatus = (orderData: OrderData) => {
    modal.confirm({
      title: '重置状态',
      content: `确认重置状态: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await order.modify({
            ...orderData,
            status: '0',
            pendingDate: '',
          } as any);
          message.success('重置状态成功');
          onRefresh();
        } catch (error) {
          console.error('重置状态失败:', error);
          message.error('重置状态失败，请稍后重试');
        }
      },
    });
  };

  // 操作菜单
  const getActionMenu = (orderData: OrderData) => ({
    items: [
      {
        key: 'edit',
        label: '修改订单',
        icon: <EditOutlined />,
        onClick: () => handleEdit(orderData),
      },
      {
        key: 'delete',
        label: '删除订单',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(orderData),
      },
      {
        key: 'sent',
        label: '发货',
        icon: <SendOutlined />,
        onClick: () => handleSent(orderData),
      },
      {
        key: 'ok',
        label: '完成',
        icon: <CheckOutlined />,
        onClick: () => handleStatusChange(orderData, '2', '完成'),
      },
      {
        key: 'out_of_stock',
        label: '缺货',
        icon: <ExclamationCircleOutlined />,
        onClick: () => handleStatusChange(orderData, '3', '缺货'),
      },
      {
        key: 'damaged',
        label: '损坏',
        icon: <CloseOutlined />,
        onClick: () => handleStatusChange(orderData, '4', '损坏'),
      },
      {
        key: 'reset',
        label: '重置状态',
        icon: <ReloadOutlined />,
        onClick: () => handleResetStatus(orderData),
      },
    ],
  });

  const columns = [
    {
      title: '图片',
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
        scroll={{ x: 1500 }}
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
          打印
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
            rules={[{ required: true, message: '请选择尺寸' }]}
          >
            <Select
              placeholder={t('pleaseSelectSize')}
              options={sizeList.map(size => ({ label: size, value: size }))}
            />
          </Form.Item>
          
          <Form.Item
            name="color"
            label={t('orderColor')}
            rules={[{ required: true, message: '请选择颜色' }]}
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
              { required: true, message: '请输入数量' },
              { type: 'number', min: 1, message: '数量必须大于0' }
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
              确认修改
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
          <p>订单: <strong>{selectedOrder?.design}</strong></p>
          <p>颜色: {selectedOrder?.color}</p>
          <p>尺寸: {selectedOrder?.size}</p>
          <p>数量: {selectedOrder?.amount}</p>
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
              确认发货
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
});

export default OrderList;
