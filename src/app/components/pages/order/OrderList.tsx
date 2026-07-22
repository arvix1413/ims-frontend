'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Table, Button, Modal, Drawer, Form, Input, InputNumber, Select, message, App, Dropdown, Space, DatePicker, Card, Pagination, Image, Spin } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, SendOutlined, CheckOutlined, ExclamationCircleOutlined, ReloadOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { OrderData, ModifyOrderRequest, colorList, sizeList, WAREHOUSE, OrderStatusHistory } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { order } from '@/lib/api';
import { API_CONFIG, STAFF_LIST, PAYMENT_STATUS } from '@/config/constants';
import StatusRenderer from '@/app/components/shared/StatusRenderer';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useNotification } from '@/lib/notificationManager';

// 设置 dayjs 的 locale
dayjs.locale('zh-cn');

interface OrderListProps {
  warehouseName: string;
  onRefresh: () => void;
  onViewDesignDetail?: (designId: number) => void;
}

const OrderList = forwardRef<any, OrderListProps>(({ warehouseName, onRefresh, onViewDesignDetail }, ref) => {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { isLogistics, isKoreanLogistics, userInfo } = usePermissions();
  const [form] = Form.useForm();
  const [sentForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // 判断是否为物流用户（包括普通物流和韩国物流）
  const isLogisticsUser = isLogistics() || isKoreanLogistics();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [data, setData] = useState<OrderData[]>([]);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [sentDrawerVisible, setSentDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [drawerKey, setDrawerKey] = useState(0); // 用于强制重新渲染 DatePicker
  const [selectedDateTime, setSelectedDateTime] = useState<Dayjs | null>(null); // DatePicker 的值
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const notification = useNotification();
  
  // 颜色翻译映射 - 支持中英文切换
  const getColorTranslation = (color: string) => {
    const colorMap: Record<string, string> = {
      'Black': t('colorBlack'),
      'White': t('colorWhite'),
      'Grey': t('colorGrey'),
      'Red': t('colorRed'),
      'Orange': t('colorOrange'),
      'Yellow': t('colorYellow'),
      'Green': t('colorGreen'),
      'Blue': t('colorBlue'),
      'Purple': t('colorPurple'),
      'Pink': t('colorPink'),
      'Brown': t('colorBrown'),
      'Beige': t('colorBeige'),
      'Khaki': t('colorKhaki'),
      'Stripes': t('colorStripes'),
      'Grid': t('colorGrid'),
      'Champagne': t('colorChampagne'),
      'Navy': t('colorNavy'),
      'Sky': t('colorSky'),
      'Mustard': t('colorMustard'),
      'Mint': t('colorMint'),
      'Peach': t('colorPeach'),
      'Cream': t('colorCream'),
      'Charcoal': t('colorCharcoal'),
      'Silver': t('colorSilver'),
      'Gold': t('colorGold'),
    };
    return colorMap[color] || color;
  };
  
  // 状态选项
  const statusOptions = [
    { value: "0", label: t('pending') },
    { value: "1", label: t('shipped') },
    { value: "2", label: t('completed') },
    { value: "3", label: t('outOfStock') },
    { value: "4", label: t('damaged') },
    { value: "5", label: t('void') },
    { value: "6", label: t('arrivedNotPickedUp') },
    { value: "7", label: t('unpaidTry') },
    { value: "8", label: t('arrived') },
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
      
      // 处理状态：如果为空则使用默认值（显示除了作废状态外的所有订单）
      if (!formValues.status || formValues.status.length === 0) {
        params.status = ['0', '1', '2', '3', '4', '6', '7', '8'];
      }
      
      // 处理日期范围
      if (formValues.dateRange && formValues.dateRange.length === 2) {
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
      console.error(t('fetchOrderDataFailed'), error);
      message.error(t('fetchOrderDataFailed'));
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
    if (printLoading) return;
    
    setPrintLoading(true);
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
      
      // 处理状态：如果为空则使用默认值（显示除了作废状态外的所有订单）
      if (!formValues.status || formValues.status.length === 0) {
        params.status = ['0', '1', '2', '3', '4', '6', '7', '8'];
      }
      
      // 处理日期范围
      if (formValues.dateRange && formValues.dateRange.length === 2) {
        params.startDate = formValues.dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = formValues.dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete params.dateRange;
        const res = await order.export(params);
        if (res.code === 200) {
          window.open(API_CONFIG.BASE_URL + res.data);
          message.success(t('exportSuccess'));
        } else {
          message.error(res.msg);
        }
      } else {
        message.error(t('pleaseEnterDate'));
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error(t('exportFailed'));
    } finally {
      setPrintLoading(false);
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
      '5': { text: t('void'), color: '#8c8c8c' },
      '8': { text: t('arrived'), color: '#13c2c2' },
    };
    
    const statusInfo = statusMap[status] || { text: '未知', color: '#d9d9d9' };
    return <span style={{ color: statusInfo.color, fontWeight: 'bold' }}>{statusInfo.text}</span>;
  };

  // 渲染状态历史日志
  const renderStatusHistory = (statusHistory: string | undefined) => {
    if (!statusHistory) return null;
    
    try {
      const history: OrderStatusHistory[] = JSON.parse(statusHistory);
      if (!history || history.length === 0) return null;
      
      return (
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          {history.map((item, index) => {
            const statusMap: Record<string, string> = {
              '0': t('pending'),
              '1': t('shipped'),
              '2': t('completed'),
              '3': t('outOfStock'),
              '4': t('damaged'),
              '5': t('void'),
              '8': t('arrived'),
            };
            
            const fromStatusText = item.fromStatus ? statusMap[item.fromStatus] || item.fromStatus : '';
            const toStatusText = statusMap[item.toStatus] || item.toStatus;
            const arrow = item.fromStatus ? ' → ' : '';
            
            return (
              <div key={index} style={{ marginBottom: index < history.length - 1 ? '4px' : 0 }}>
                <span style={{ color: '#666' }}>{item.time}</span>
                <br />
                <span style={{ color: '#1890ff' }}>{item.userName}</span>
                {': '}
                {fromStatusText && <span>{fromStatusText}</span>}
                {arrow}
                <span style={{ fontWeight: 'bold' }}>{toStatusText}</span>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('解析状态历史失败:', error);
      return null;
    }
  };

  // 修改订单
  const handleEdit = (orderData: OrderData) => {
    setSelectedOrder(orderData);
    form.setFieldsValue({
      size: orderData.size,
      color: orderData.color,
      remark: orderData.remark,
      amount: orderData.amount,
      customerContact: orderData.customerContact || '',
      paymentFlag: orderData.paymentFlag || 'UNPAID',
      orderedBy: orderData.orderedBy || '',
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
          customerContact: values.customerContact,
          paymentFlag: values.paymentFlag,
          orderedBy: values.orderedBy,
        };
        
        await order.modify(modifyData);
        message.success(t('modifySuccess'));
        setEditDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('修改订单失败:', error);
      message.error(t('modifyOrderFailed'));
    }
  };

  // Void订单（软删除）
  const handleVoid = (orderData: OrderData) => {
    modal.confirm({
      title: t('confirmVoid'),
      content: `${t('confirmVoid')}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await order.modify({
            id: orderData.id,
            status: '5',
            statusChangeUserId: userInfo?.id || 0,
            statusChangeUserName: userInfo?.name || t('unknown'),
            statusChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          });
          message.success(t('voidSuccess'));
          onRefresh();
        } catch (error) {
          console.error('作废订单失败:', error);
          message.error(t('voidFailed'));
        }
      },
    });
  };

  // 发货（需要填写日期和操作人）
  const handleSent = (orderData: OrderData) => {
    setSelectedOrder(orderData);
    setDrawerKey(Date.now()); // 更新 key 强制重新渲染
    setSelectedDateTime(dayjs()); // 设置当前时间
    
    // 清空表单
    sentForm.resetFields();
    
    // 设置默认值
    sentForm.setFieldsValue({
      targetStatus: '1', // 发货状态
      statusText: t('shipped'),
      statusChangeUserName: userInfo?.name || '',
    });
    
    setSentDrawerVisible(true);
  };

  // 提交发货或状态变更（带日期和操作人）
  const handleSentSubmit = async () => {
    try {
      const values = await sentForm.validateFields();
      if (selectedOrder && selectedDateTime) {
        const targetStatus = values.targetStatus || '1'; // 默认为发货状态
        
        // 格式化时间为 YYYY-MM-DD HH:mm:ss
        const formattedTime = selectedDateTime.format('YYYY-MM-DD HH:mm:ss');
        
        await order.modify({
          id: selectedOrder.id,
          status: targetStatus,
          statusChangeUserId: userInfo?.id || 0,
          statusChangeUserName: values.statusChangeUserName,
          statusChangeTime: formattedTime,
        });
        
        const statusTextMap: Record<string, string> = {
          '1': t('shippedSuccess'),
          '2': t('completedSuccess'),
          '8': t('arrivedSuccess'),
        };
        
        message.success(statusTextMap[targetStatus] || t('operationSuccess'));
        setSentDrawerVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error(t('statusUpdateFailed'));
    }
  };

  // 状态变更（需要填写日期和操作人的状态：1、2、6、7）
  const handleStatusChangeWithDate = (orderData: OrderData, status: string, statusText: string) => {
    setSelectedOrder(orderData);
    setDrawerKey(Date.now()); // 更新 key 强制重新渲染
    
    const currentDayjs = dayjs();
    setSelectedDateTime(currentDayjs);
    
    // 清空表单
    sentForm.resetFields();
    
    // 设置默认值
    sentForm.setFieldsValue({ 
      targetStatus: status, 
      statusText,
      statusChangeUserName: userInfo?.name || '',
    });
    
    setSentDrawerVisible(true);
  };

  // 状态变更（不需要填写日期和操作人的状态：0、3、4、5）
  const handleStatusChange = (orderData: OrderData, status: string, statusText: string) => {
    modal.confirm({
      title: statusText,
      content: `${t('confirmChange')}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await order.modify({
            id: orderData.id,
            status,
            statusChangeUserId: userInfo?.id || 0,
            statusChangeUserName: userInfo?.name || t('unknown'),
            statusChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          });
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
      title: t('resetStatus'),
      content: `${t('confirmResetStatus')}: ${orderData.design} ？`,
      icon: <ExclamationCircleOutlined />,
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          await order.reset([orderData.id]);
          message.success(t('resetStatusSuccess'));
          onRefresh();
        } catch (error) {
          console.error('重置状态失败:', error);
          message.error(t('resetStatusFailed'));
        }
      },
    });
  };
    });
  };

  // 操作菜单
  const getActionMenu = (orderData: OrderData) => {
    const s = orderData.status;
    // 作废(5)只能重置，缺货(3)不能转2/8
    const isVoided = s === '5';
    const isOutOfStock = s === '3';

    return {
      items: [
        {
          key: 'edit',
          label: t('modifyOrder'),
          icon: <EditOutlined />,
          onClick: () => handleEdit(orderData),
        },
        {
          key: 'void',
          label: t('void') || 'Void',
          icon: <CloseOutlined />,
          danger: true,
          disabled: isVoided,
          onClick: () => handleVoid(orderData),
        },
        {
          key: 'sent',
          label: t('shipped'),
          icon: <SendOutlined />,
          disabled: isVoided,
          onClick: () => handleSent(orderData),
        },
        {
          key: 'arrived',
          label: t('arrived'),
          icon: <CheckOutlined />,
          disabled: isVoided || isOutOfStock,
          onClick: () => handleStatusChangeWithDate(orderData, '8', t('arrived')),
        },
        {
          key: 'ok',
          label: t('completed'),
          icon: <CheckOutlined />,
          disabled: isVoided || isOutOfStock,
          onClick: () => handleStatusChangeWithDate(orderData, '2', t('completed')),
        },
        {
          key: 'out_of_stock',
          label: t('outOfStock'),
          icon: <ExclamationCircleOutlined />,
          disabled: isVoided,
          onClick: () => handleStatusChange(orderData, '3', t('outOfStock')),
        },
        {
          key: 'damaged',
          label: t('damaged'),
          icon: <CloseOutlined />,
          disabled: isVoided,
          onClick: () => handleStatusChange(orderData, '4', t('damaged')),
        },
        {
          key: 'reset',
          label: t('resetStatus'),
          icon: <ReloadOutlined />,
          onClick: () => handleResetStatus(orderData),
        },
      ],
    };
  };

  // 桌面端表格列定义
  const columns = [
    {
      title: t('photo'),
      dataIndex: 'previewPhoto',
      width: 120,
      fixed: 'left' as const,
      render: (item: string, record: OrderData) => (
        <img 
          style={{ height: 80, width: 64, objectFit: 'cover', cursor: 'pointer' }} 
          alt="" 
          src={API_CONFIG.BASE_URL + item}
          onClick={() => {
            if (onViewDesignDetail) {
              const designId = (record as any).designId;
              onViewDesignDetail(designId);
            }
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.src.includes('placeholder-image.jpg') && !img.src.includes('data:image')) {
              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
            }
          }}
        />
      ),
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderCode')}</div>,
      dataIndex: 'design',
      key: 'design',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderPrice')}</div>,
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 100,
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderColor')}</div>,
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string) => {
        const colorValue = Array.isArray(color) ? color[0] : color;
        return getColorTranslation(colorValue);
      },
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderSize')}</div>,
      dataIndex: 'size',
      key: 'size',
      width: 80,
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderAmount')}</div>,
      dataIndex: 'amount',
      key: 'amount',
      width: 80,
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('time')}</div>,
      dataIndex: 'date',
      width: 120,
      render: (data: string) => dayjs(data).format('YYYY-MM-DD'),
    },
    ...(!isLogisticsUser ? [{
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('customerContact')}</div>,
      dataIndex: 'customerContact',
      key: 'customerContact',
      width: 150,
    }, {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderType')}</div>,
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: number) => (
        <span style={{ color: type === 0 ? '#52c41a' : '#1890ff', fontWeight: 'bold', fontSize: 12 }}>
          {type === 0 ? t('storeSupply') : type === 1 ? t('customerOrder') : '-'}
        </span>
      ),
    }, {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('paymentStatus')}</div>,
      dataIndex: 'paymentFlag',
      key: 'paymentFlag',
      width: 90,
      render: (flag: string, record: OrderData) => {
        if (record.type === 0) {
          return <span style={{ color: '#8c8c8c', fontSize: 12 }}>-</span>;
        }
        return (
          <span style={{ color: flag === 'PAID' ? '#52c41a' : '#fa8c16', fontWeight: 'bold', fontSize: 12 }}>
            {flag || 'UNPAID'}
          </span>
        );
      },
    }, {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderedBy')}</div>,
      dataIndex: 'orderedBy',
      key: 'orderedBy',
      width: 100,
    }, {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('orderRemark')}</div>,
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      render: (text: string) => (
        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</span>
      ),
    }] : []),
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('status')}</div>,
      dataIndex: 'status',
      width: 100,
      render: (value: string) => renderStatus(value),
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('statusLog')}</div>,
      dataIndex: 'statusHistory',
      width: 250,
      render: (value: string) => renderStatusHistory(value),
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>{t('operation')}</div>,
      key: 'action',
      width: 80,
      render: (_: any, record: OrderData) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // 移动端卡片渲染
  const renderOrderCard = (order: OrderData) => (
    <Card key={order.id} size="small" className="mb-3">
      <div className="space-y-3">
        {/* 订单基本信息 */}
        <div className="flex gap-3">
          {/* 商品图片 */}
          <div className="flex-shrink-0">
            <Image
              src={API_CONFIG.BASE_URL + order.previewPhoto}
              alt={order.design}
              width={60}
              height={60}
              className="rounded object-cover"
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          </div>

          {/* 订单信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-800 truncate">
                {order.design}
              </h3>
              <div className="text-right">
                {renderStatus(order.status)}
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>{t('orderPrice')}: ${order.salePrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('orderColor')}: {getColorTranslation(order.color)}</span>
                <span>{t('orderSize')}: {order.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('orderAmount')}: {order.amount}</span>
                <span>{t('time')}: {dayjs(order.date).format('MM-DD HH:mm')}</span>
              </div>
              {order.statusHistory && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="font-semibold mb-1">{t('statusLog')}:</div>
                  {renderStatusHistory(order.statusHistory)}
                </div>
              )}
              {order.remark && (
                <div className="text-gray-500">
                  {t('orderRemark')}: {order.remark}
                </div>
              )}
              {order.customerContact && (
                <div className="text-gray-600">
                  {t('customerContact')}: {order.customerContact}
                </div>
              )}
              {typeof order.type !== 'undefined' && (
                <div>
                  <span style={{ color: order.type === 0 ? '#52c41a' : '#1890ff', fontWeight: 'bold' }}>
                    {order.type === 0 ? t('storeSupply') : t('customerOrder')}
                  </span>
                </div>
              )}
              {order.type !== 0 && order.paymentFlag && (
                <div>
                  <span style={{ color: order.paymentFlag === 'PAID' ? '#52c41a' : '#fa8c16', fontWeight: 'bold' }}>
                    {order.paymentFlag}
                  </span>
                  {order.orderedBy && <span className="text-gray-500 ml-2">{t('orderedBy')}: {order.orderedBy}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="small"
            type="primary"
            onClick={() => handleEdit(order)}
            className="flex-1"
            style={{ minHeight: '32px' }}
          >
            {t('modifyOrder')}
          </Button>
          <Button
            size="small"
            onClick={() => handleSent(order)}
            className="flex-1"
            style={{ minHeight: '32px' }}
          >
            {t('shipped')}
          </Button>
          <Button
            size="small"
            onClick={() => handleStatusChangeWithDate(order, '8', t('arrived'))}
            className="flex-1"
            style={{ minHeight: '32px', backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }}
            disabled={order.status === '3' || order.status === '5'}
          >
            {t('arrived')}
          </Button>
          <Button
            size="small"
            onClick={() => handleStatusChangeWithDate(order, '2', t('completed'))}
            className="flex-1"
            style={{ minHeight: '32px' }}
            disabled={order.status === '3' || order.status === '5'}
          >
            {t('completed')}
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleVoid(order)}
            className="flex-1"
            style={{ minHeight: '32px' }}
          >
            {t('void')}
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-3 md:p-6 pt-0 md:pt-0 overflow-hidden">
      {/* 搜索表单 */}
      <Card className="mb-4">
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
          className="md:flex md:flex-wrap md:gap-4"
        >
          <Form.Item name="design" label={t('orderCode')} className="md:w-48 mb-4">
            <Input placeholder={t('pleaseEnterDesignCode')} />
          </Form.Item>
          
          {!isLogisticsUser && (
            <Form.Item name="customerContact" label={t('customerContact')} className="md:w-48 mb-4">
              <Input placeholder={t('pleaseEnterName') + '/' + t('pleaseEnterPhone')} />
            </Form.Item>
          )}
          
          {!isLogisticsUser && (
            <Form.Item name="remark" label={t('orderRemark')} className="md:w-48 mb-4">
              <Input placeholder={t('pleaseEnterRemark')} />
            </Form.Item>
          )}
          
          {!isLogisticsUser && (
            <Form.Item name="paymentFlag" label={t('paymentStatus')} className="md:w-48 mb-4">
              <Select placeholder={t('pleaseSelect') + t('paymentStatus')}>
                <Select.Option value="PAID">PAID（{t('paid')}）</Select.Option>
                <Select.Option value="UNPAID">UNPAID（{t('unpaid')}）</Select.Option>
              </Select>
            </Form.Item>
          )}
          
          <Form.Item name="status" label={t('status')} className="md:w-48 mb-4">
            <Select
              mode="multiple"
              placeholder={t('pleaseSelectStatus')}
              options={statusOptions}
            />
          </Form.Item>
          
          <Form.Item name="dateRange" label={t('dateRange')} className="md:w-72 mb-4">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item className="mb-4" style={{ alignSelf: 'flex-end' }}>
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
      </Card>

      {/* 桌面端表格 */}
      <div className="hidden md:block p-0">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={false}
          size="small"
          sticky={true}
        />
        
        {/* 分页 */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(page) => {
              fetchOrders(page);
            }}
          />
        </div>

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
            loading={printLoading}
            disabled={printLoading}
            size="large"
          >
            {printLoading ? '打印中...' : '打印'}
          </Button>
        </div>
      </div>

      {/* 移动端卡片列表 */}
      <div className="md:hidden space-y-4">
        {/* 导出按钮 */}
        <div className="flex gap-2">
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            loading={printLoading}
            disabled={printLoading}
            className="flex-1"
          >
            {printLoading ? t('exporting') : t('export')}
          </Button>
        </div>

        {/* 订单列表 */}
        <div className="space-y-2">
          {data.length > 0 ? (
            data.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center text-gray-500 py-8">
              {t('noOrderData')}
            </div>
          )}
        </div>

        {/* 分页 */}
        {data.length > 0 && (
          <div className="flex justify-center">
            <Spin spinning={loading}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page) => fetchOrders(page)}
                showSizeChanger={false}
                showQuickJumper={false}
              />
            </Spin>
          </div>
        )}
      </div>

      {/* 修改订单抽屉 - 响应式 */}
      <Drawer
        title={t('modifyOrder')}
        placement="right"
        open={editDrawerVisible}
        onClose={() => setEditDrawerVisible(false)}
        width={500}
        className="md:w-[500px] w-full"
        height="70%"
        footer={
          <div className="md:hidden flex gap-3">
            <Button block onClick={() => setEditDrawerVisible(false)}>
              {t('cancel')}
            </Button>
            <Button type="primary" block onClick={handleEditSubmit}>
              {t('confirm')}
            </Button>
          </div>
        }
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
            name="customerContact"
            label={t('customerContact')}
          >
            <Input placeholder={t('name') + ' / ' + t('phone')} />
          </Form.Item>
          
          <Form.Item
            name="paymentFlag"
            label={t('paymentStatus')}
          >
            <Select placeholder={t('pleaseSelect') + t('paymentStatus')}>
              <Select.Option value="PAID">PAID（{t('paid')}）</Select.Option>
              <Select.Option value="UNPAID">UNPAID（{t('unpaid')}）</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="orderedBy"
            label={t('orderedBy')}
          >
            <Select placeholder={t('pleaseSelect') + t('orderedBy')}>
              {STAFF_LIST.map(s => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
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
          
          <Form.Item className="hidden md:block">
            <Button type="primary" htmlType="submit" block>
              {t('confirm') + t('modify')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 发货/状态变更抽屉 - 响应式 */}
      <Drawer
        title={sentForm.getFieldValue('statusText') || t('sent')}
        placement="right"
        open={sentDrawerVisible}
        onClose={() => setSentDrawerVisible(false)}
        width={400}
        className="md:w-[400px] w-full"
        height="60%"
        footer={
          <div className="md:hidden flex gap-3">
            <Button block onClick={() => setSentDrawerVisible(false)}>
              {t('cancel')}
            </Button>
            <Button type="primary" block onClick={handleSentSubmit}>
              {t('confirm')}
            </Button>
          </div>
        }
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
          <Form.Item name="targetStatus" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="statusText" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item
            name="statusChangeUserName"
            label={t('operator')}
            rules={[{ required: true, message: t('pleaseSelect') + t('operator') }]}
          >
            <Select placeholder={t('pleaseSelect') + t('operator')}>
              {STAFF_LIST.map(s => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label={t('statusDate')}
            required
          >
            <DatePicker 
              key={drawerKey}
              showTime 
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder={t('pleaseSelectTime')}
              value={selectedDateTime}
              onChange={(date) => {
                setSelectedDateTime(date);
              }}
            />
          </Form.Item>
          
          <Form.Item className="hidden md:block">
            <Button type="primary" htmlType="submit" block>
              {t('confirm')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
});

export default OrderList;
