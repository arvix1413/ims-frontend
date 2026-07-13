'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Card, message, Pagination, Form, Input, DatePicker, Tag, Tabs, Drawer, Spin, Divider, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined, PrinterOutlined, DeleteOutlined, ExclamationCircleOutlined, CloseCircleOutlined, FileTextOutlined, DollarOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ReceiptData, ReceiptListRequest } from '@/lib/types';
import { receipt, cashDrawerService } from '@/lib/api';
import moment from 'moment';
import { usePermissions } from '@/lib/usePermissions';
import { useIsMobile } from '@/lib/useIsMobile';
import PrintReceipt from './PrintReceipt';
import PrintLabelDrawer from './PrintLabelDrawer';
import PrintDailyReportDrawer from './PrintDailyReportDrawer';
import DailySaleDrawer from './DailySaleDrawer';
import PaymentMethodSaleDrawer from './PaymentMethodSaleDrawer';
import CashInOutDrawer from './CashInOutDrawer';
import OpeningClosingBalanceDrawer from './OpeningClosingBalanceDrawer';
import { shops } from './PrintReceipt';
import { ProductItemTag } from '@/app/components/common/ProductItemTag';
import SearchFormCard from '@/app/components/common/SearchFormCard';

export default function BillManagement() {
  const { t } = useTranslation();
  const { canUseFeature, getFinanceStoreAccess, isFinance } = usePermissions();
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const [data, setData] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  // 获取财务用户的店铺限制
  const financeStoreAccess = getFinanceStoreAccess();
  // 根据财务用户限制设置默认 tab
  const defaultTab = financeStoreAccess ? financeStoreAccess.toString() : '2';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [currentView, setCurrentView] = useState<'list' | 'print'>('list');
  const [printLabelVisible, setPrintLabelVisible] = useState(false);
  const [printDailyReportVisible, setPrintDailyReportVisible] = useState(false);
  const [dailySaleVisible, setDailySaleVisible] = useState(false);
  const [paymentMethodSaleVisible, setPaymentMethodSaleVisible] = useState(false);
  const [cashInOutVisible, setCashInOutVisible] = useState(false);
  const [openingClosingBalanceVisible, setOpeningClosingBalanceVisible] = useState(false);
  const [deleteDrawerVisible, setDeleteDrawerVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteReceiptId, setDeleteReceiptId] = useState<number | null>(null);
  const [voidDrawerVisible, setVoidDrawerVisible] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidReceiptId, setVoidReceiptId] = useState<number | null>(null);
  const [openCashDrawerVisible, setOpenCashDrawerVisible] = useState(false);
  const [openCashDrawerLoading, setOpenCashDrawerLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取数据
  const fetchData = async (page = 1, searchParams: any = {}) => {
    // 取消上一次请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setData([]);
    
    try {
      const formValues = form.getFieldsValue();
      const params: ReceiptListRequest = {
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
      if (formValues.createDate && formValues.createDate.length === 2) {
        params.startDateTime = formValues.createDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDateTime = formValues.createDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete (params as any).createDate;
      }

      const response = await receipt.getList(params);

      if (controller.signal.aborted) return;

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
    } catch (error: any) {
      if (controller.signal.aborted) return;
      console.error('获取账单数据失败:', error);
      message.error(t('获取账单数据失败'));
      setData([]);
      setPagination({
        current: 1,
        pageSize: 20,
        total: 0,
      });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [activeTab]);

  // 确保财务用户的 activeTab 符合限制
  useEffect(() => {
    if (financeStoreAccess && activeTab !== financeStoreAccess.toString()) {
      setActiveTab(financeStoreAccess.toString());
    }
  }, [financeStoreAccess, activeTab]);

  // Tab切换
  const handleTabChange = (key: string) => {
    if (financeStoreAccess && key !== financeStoreAccess.toString()) {
      return;
    }
    setActiveTab(key);
    setPagination({
      current: 1,
      pageSize: 20,
      total: 0,
    });
    // 不再直接调用 fetchData，由 useEffect([activeTab]) 统一触发
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

  // 重新打印
  const handleReprint = async (id: number) => {
    try {
      await receipt.reprint(id);
      message.success(t('重新打印成功'));
    } catch (error) {
      console.error('重新打印失败:', error);
      message.error(t('重新打印失败'));
    }
  };

  // 打开删除确认抽屉
  const handleDelete = (id: number) => {
    setDeleteReceiptId(id);
    setDeleteDrawerVisible(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteReceiptId) return;
    
    setDeleteLoading(true);
    try {
      await receipt.delete(deleteReceiptId);
      message.success(t('deleteSuccess'));
      setDeleteDrawerVisible(false);
      setDeleteReceiptId(null);
      // 刷新列表
      fetchData(pagination.current);
    } catch (error) {
      console.error('删除失败:', error);
      message.error(t('deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // 关闭删除确认抽屉
  const handleCloseDeleteDrawer = () => {
    setDeleteDrawerVisible(false);
    setDeleteReceiptId(null);
  };

  // 打开 void 确认抽屉
  const handleVoid = (id: number) => {
    setVoidReceiptId(id);
    setVoidDrawerVisible(true);
  };

  // 确认 void
  const handleConfirmVoid = async () => {
    if (!voidReceiptId) return;
    
    setVoidLoading(true);
    try {
      await receipt.modifyVoided(voidReceiptId, 1);
      message.success(t('voidSuccess') || 'Void成功');
      setVoidDrawerVisible(false);
      setVoidReceiptId(null);
      // 刷新列表
      fetchData(pagination.current);
    } catch (error) {
      console.error('Void失败:', error);
      message.error(t('voidFailed') || 'Void失败');
    } finally {
      setVoidLoading(false);
    }
  };

  // 关闭 void 确认抽屉
  const handleCloseVoidDrawer = () => {
    setVoidDrawerVisible(false);
    setVoidReceiptId(null);
  };

  // 打开钱箱确认
  const handleOpenCashDrawer = async () => {
    setOpenCashDrawerLoading(true);
    try {
      await cashDrawerService.open(selectedStore);
      message.success(t('openCashDrawerSuccess') || '打开钱箱成功');
      setOpenCashDrawerVisible(false);
    } catch (error) {
      console.error('打开钱箱失败:', error);
      message.error(t('openCashDrawerFailed') || '打开钱箱失败');
    } finally {
      setOpenCashDrawerLoading(false);
    }
  };

  // 关闭打开钱箱抽屉
  const handleCloseOpenCashDrawer = () => {
    setOpenCashDrawerVisible(false);
    setSelectedStore(1);
  };

  // 进入打印账单页面
  const handlePrintReceipt = () => {
    setCurrentView('print');
  };

  // 返回列表
  const handleBackToList = () => {
    setCurrentView('list');
    fetchData(pagination.current);
  };

  // 新建账单打印成功后回到列表并刷新
  const handlePrintSuccess = () => {
    setCurrentView('list');
    fetchData(1);
  };

  // 解析商品列表
  const parseItemList = (value: any) => {
    try {
      if (value === undefined || value === null) {
        return [];
      }
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // 解析支付列表
  const parsePaymentList = (value: any) => {
    try {
      if (value === undefined || value === null) {
        return [];
      }
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // 渲染移动端账单卡片
  const renderBillCard = (item: ReceiptData, index: number) => {
    const itemList = parseItemList(item.itemList);
    const paymentList = parsePaymentList(item.paymentList);
    const totalAmount = (itemList || []).reduce((sum: number, it: any) => sum + (Number(it.finalPrice ?? it.price) * (it.qty || 0)), 0);

    return (
      <Card
        key={item.id}
        className="mb-3 hover:shadow-md transition-shadow duration-200"
        style={{ borderRadius: 12 }}
      >
        <div className="space-y-3">
          {/* 账单头部信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileTextOutlined className="text-gray-500" />
              <span className="font-bold text-gray-900">#{item.id}</span>
            </div>
            {/* Void 状态 */}
            <Tag color={(item.voided ?? 0) === 0 ? 'green' : 'red'}>
              {(item.voided ?? 0) === 0 ? 'normal' : 'void'}
            </Tag>
          </div>

          {/* REFNO */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">订单编号:</span>
            <span className="font-medium text-gray-900">{item.refNo}</span>
          </div>

          {/* 商品列表 */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">{t('item')}:</div>
            <div className="space-y-1">
              {itemList.map((it: any, idx: number) => (
                <div key={`${it.code}-${idx}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <ProductItemTag item={it} />
                </div>
              ))}
            </div>
          </div>

          <Divider className="my-3" />

          {/* 支付方式列表 */}
          {paymentList && paymentList.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{t('payment')}:</div>
              <div className="space-y-1">
                {paymentList.map((payment: any, idx: number) => (
                  <div key={`${payment.payment}-${idx}`} className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                    <span className="font-medium text-gray-900">{payment.payment}</span>
                    <span className="font-bold text-green-600">
                      ${Number(payment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Divider className="my-3" />

          {/* 账单底部信息 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CalendarOutlined className="text-gray-500" />
              <span className="font-medium">{moment(item.receiptDate).format('YYYY-MM-DD')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserOutlined className="text-gray-500" />
              <span className="text-gray-600">{t('cashier')}:</span>
              <span className="font-medium">{item.cashier}</span>
            </div>
            {(item.customerName || item.customerPhone) && (
              <>
                {item.customerName && (
                  <div className="col-span-2 text-gray-600">
                    {t('customerName')}: <span className="font-medium text-gray-900">{item.customerName}</span>
                  </div>
                )}
                {item.customerPhone && (
                  <div className="col-span-2 text-gray-600">
                    {t('customerPhone')}: <span className="font-medium text-gray-900">{item.customerPhone}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 总金额 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">{t('totalAmount') || '总金额'}:</span>
              <span className="text-xl font-bold text-blue-600">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 操作按钮 - 财务用户不显示 */}
          {!isFinance() && (
            <div className="flex justify-end gap-2">
              <Button 
                type="primary" 
                size="small"
                onClick={() => handleReprint(item.id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('reprint')}
              </Button>
              <Button 
                type="primary" 
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleVoid(item.id)}
              >
                void
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // 表格列定义
  const baseColumns = [
    {
      title: t('receiptId'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as 'left',
    },
    {
      title: '订单编号',
      dataIndex: 'refNo',
      key: 'refNo',
      width: 130,
      fixed: 'left' as 'left',
    },
    {
      title: t('item'),
      dataIndex: 'itemList',
      key: 'itemList',
      width: 300,
      render: (value: any) => {
        // value 可能是 JSON 字符串，也可能已经是数组
        let arr: Array<{
          qty: number;
          code: string;
          price: number;
          discount: number;
          finalPrice: number;
          discountPercent: number;
          color?: string;
          size?: string;
          stockType?: string;
        }> = [];
    
        try {
          arr = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return <span>-</span>;
        }
        if (!Array.isArray(arr)) return <span>-</span>;
    
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {arr.map((it, idx) => (
              <ProductItemTag key={`${it.code}-${idx}`} item={it} />
            ))}
          </div>
        );
      }
    },
    {
      title: t('date'),
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      width: 150,
    },
    {
      title: t('cashier'),
      dataIndex: 'cashier',
      key: 'cashier',
      width: 120,
    },
    {
      title: t('customerName'),
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
      render: (v: string | undefined) => v || '-',
    },
    {
      title: t('customerPhone'),
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: 130,
      render: (v: string | undefined) => v || '-',
    },
    {
      title: t('payment'),
      dataIndex: 'paymentList',
      key: 'paymentList',
      width: 250,
      render: (value: any) => {
        // value 可能是 JSON 字符串，也可能已经是数组
        let arr: Array<{
          payment: string;
          amount: number;
        }> = [];
    
        try {
          arr = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return <span>-</span>;
        }
        if (!Array.isArray(arr) || arr.length === 0) return <span>-</span>;
    
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {arr.map((it, idx) => (
              <Tag key={`${it.payment}-${idx}`} color="blue">
                {it.payment}: ${Number(it.amount).toFixed(2)}
              </Tag>
            ))}
          </div>
        );
      }
    },
    {
      title: t('void'),
      dataIndex: 'voided',
      key: 'voided',
      width: 100,
      render: (value: number | undefined) => {
        const voidValue = value ?? 0;
        return voidValue === 0 ? (
          <Tag color="green">normal</Tag>
        ) : (
          <Tag color="red">void</Tag>
        );
      },
    },
  ];

  // 如果不是财务用户，添加 REPRINT 和操作列
  const columns = isFinance() 
    ? baseColumns 
    : [
        ...baseColumns,
        {
          title: t('reprint'),
          dataIndex: 'id',
          key: 'reprint',
          width: 100,
          render: (id: number) => (
            <Button onClick={() => handleReprint(id)}>
              reprint
            </Button>
          ),
        },
        {
          title: t('operation'),
          key: 'action',
          width: 150,
          render: (_: any, record: ReceiptData) => (
            <Button 
              type="primary" 
              danger 
              icon={<CloseCircleOutlined />}
              onClick={() => handleVoid(record.id)}
            >
              void
            </Button>
          ),
        },
      ];

  if (currentView === 'print') {
    return (
      <PrintReceipt onBackToList={handleBackToList} onPrintSuccess={handlePrintSuccess} />
    );
  }

  // 根据财务用户限制过滤 tab 项
  const allTabItems = [
    {
      key: '2',
      label: '二店',
      children: (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      ),
    },
    {
      key: '1',
      label: '一店',
      children: (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      ),
    },
  ];

  // 如果财务用户有限制，只显示对应的 tab
  const tabItems = financeStoreAccess 
    ? allTabItems.filter(item => item.key === financeStoreAccess.toString())
    : allTabItems;

  return (
    <div className="p-4 md:p-6">
      {/* 桌面端视图 */}
      <div className="hidden md:block">
        <div style={{ 
          marginBottom: 24, 
          display: 'flex', 
          flexDirection:"column",
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canUseFeature('printReceipt') && (
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt}>{t('printReceipt')}</Button>
            )}
            {canUseFeature('printLabel') && (
              <Button onClick={() => setPrintLabelVisible(true)}>
                {t('printLabel')}
              </Button>
            )}
            {canUseFeature('printDailyReport') && (
              <Button onClick={() => setPrintDailyReportVisible(true)}>
                {t('printDailyReport')}
              </Button>
            )}
            {canUseFeature('dailySales') && (
              <Button onClick={() => setDailySaleVisible(true)}>
                {t('dailySales') || '每日销售统计'}
              </Button>
            )}
            {canUseFeature('dailySales') && (
              <Button onClick={() => setPaymentMethodSaleVisible(true)}>
                {t('paymentMethodSales') || '支付方式销售统计'}
              </Button>
            )}
            {canUseFeature('cashInOut') && (
              <Button onClick={() => setCashInOutVisible(true)}>
                {t('cashInOut') || '收支记录'}
              </Button>
            )}
            {canUseFeature('openingClosingBalance') && (
              <Button onClick={() => setOpeningClosingBalanceVisible(true)}>
                {t('openingClosingBalance') || '开/闭店结余'}
              </Button>
            )}
            {!isFinance() && (
              <Button onClick={() => setOpenCashDrawerVisible(true)}>
                {t('openCashDrawer') || '打开钱箱'}
              </Button>
            )}
          </div>
        </div>
        
        {/* 搜索表单 */}
        <SearchFormCard form={form} onSearch={handleSearch} onReset={handleReset}>
          <Form.Item name="item" label="搜索产品" style={{ minWidth: 192, marginBottom: 24 }}>
            <Input placeholder={t('itemCode')} />
          </Form.Item>
          <Form.Item name="refNo" label="订单编号" style={{ minWidth: 192, marginBottom: 24 }}>
            <Input placeholder="订单编号 (如: OR260707)" />
          </Form.Item>
          <Form.Item name="customerPhone" label="电话" style={{ minWidth: 192, marginBottom: 24 }}>
            <Input placeholder="客户电话" />
          </Form.Item>
          <Form.Item name="color" label="颜色" style={{ minWidth: 128, marginBottom: 24 }}>
            <Input placeholder="颜色" />
          </Form.Item>
          <Form.Item name="size" label="尺码" style={{ minWidth: 128, marginBottom: 24 }}>
            <Input placeholder="尺码" />
          </Form.Item>
          <Form.Item name="stockType" label="类型" style={{ minWidth: 160, marginBottom: 24 }}>
            <Select placeholder="Order/In Stock" allowClear>
              <Select.Option value="order">Order</Select.Option>
              <Select.Option value="inStock">In Stock</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="createDate" label={t('createTime')} style={{ minWidth: 280, marginBottom: 24 }}>
            <DatePicker.RangePicker
              placeholder={[t('startTime'), t('endTime')]}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </SearchFormCard>

        {/* 数据表格 */}
        <Card style={{ width: '100%', overflow: 'auto' }}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            size="large"
            items={tabItems.map(tab => ({
              ...tab,
              children: (
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 1400 }}
                  size="small"
                  sticky={true}
                />
              ),
            }))}
          />
          
          {/* 分页 */}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handleTableChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
              }
            />
          </div>
        </Card>
      </div>

      {/* 移动端视图 */}
      <div className="md:hidden pb-20">
        {/* 操作按钮 */}
        <div className="mb-4 space-y-2">
          {canUseFeature('printReceipt') && (
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt} block size="large">
              {t('printReceipt')}
            </Button>
          )}
          {canUseFeature('printLabel') && (
            <Button onClick={() => setPrintLabelVisible(true)} block size="large">
              {t('printLabel')}
            </Button>
          )}
          {canUseFeature('printDailyReport') && (
            <Button onClick={() => setPrintDailyReportVisible(true)} block size="large">
              {t('printDailyReport')}
            </Button>
          )}
        </div>

        {/* 搜索表单 */}
        <Card className="mb-4">
          <Form form={form} layout="vertical" onFinish={handleSearch}>
            <Form.Item name="item" label={t('searchProduct')}>
              <Input placeholder={t('itemCode')} size="large" />
            </Form.Item>
            <Form.Item name="refNo" label="订单编号">
              <Input placeholder="订单编号 (如: OR260707)" size="large" />
            </Form.Item>
            <Form.Item name="customerPhone" label="电话">
              <Input placeholder="客户电话" size="large" />
            </Form.Item>
            <Form.Item name="color" label="颜色">
              <Input placeholder="颜色" size="large" />
            </Form.Item>
            <Form.Item name="size" label="尺码">
              <Input placeholder="尺码" size="large" />
            </Form.Item>
            <Form.Item name="stockType" label="类型">
              <Select placeholder="Order/In Stock" size="large" allowClear>
                <Select.Option value="order">Order</Select.Option>
                <Select.Option value="inStock">In Stock</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="createDate" label={t('createTime')}>
              <DatePicker.RangePicker 
                placeholder={[t('startTime'), t('endTime')]} 
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} className="flex-1" size="large">
                {t('search')}
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />} className="flex-1" size="large">
                {t('reset')}
              </Button>
            </div>
          </Form>
        </Card>

        {/* 店铺标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems.map(tab => ({
            ...tab,
            children: (
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <Spin size="large" />
                  </div>
                ) : data.length > 0 ? (
                  data.map((item, index) => renderBillCard(item, index))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t('noData')}
                  </div>
                )}
              </div>
            )
          }))}
          size="large"
        />

        {/* 分页 */}
        {data.length > 0 && (
          <div className="mt-6 text-center">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handleTableChange}
              showSizeChanger={false}
              simple
            />
          </div>
        )}
      </div>

      {/* Drawer组件 */}
      <PrintLabelDrawer 
        visible={printLabelVisible} 
        onClose={() => setPrintLabelVisible(false)} 
      />
      <PrintDailyReportDrawer 
        visible={printDailyReportVisible} 
        onClose={() => setPrintDailyReportVisible(false)} 
      />
      <DailySaleDrawer 
        visible={dailySaleVisible} 
        onClose={() => setDailySaleVisible(false)} 
      />
      <PaymentMethodSaleDrawer 
        visible={paymentMethodSaleVisible} 
        onClose={() => setPaymentMethodSaleVisible(false)} 
      />
      <CashInOutDrawer 
        visible={cashInOutVisible} 
        onClose={() => setCashInOutVisible(false)} 
      />
      <OpeningClosingBalanceDrawer 
        visible={openingClosingBalanceVisible} 
        onClose={() => setOpeningClosingBalanceVisible(false)} 
      />

      {/* 删除确认抽屉 - 桌面端 */}
      {!isMobile && (
        <Drawer
          title={t('confirmDelete')}
          placement="right"
          onClose={handleCloseDeleteDrawer}
          open={deleteDrawerVisible}
          width={400}
          footer={
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseDeleteDrawer} style={{ marginRight: 8 }}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                danger 
                loading={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {t('confirmDelete')}
              </Button>
            </div>
          }
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f', marginRight: 12 }} />
              <span style={{ fontSize: 16, fontWeight: 500 }}>{t('confirmDeleteReceipt')}</span>
            </div>
            <div style={{ color: '#666', lineHeight: 1.8 }}>
              <p>{t('deleteReceiptWarning')}</p>
              {deleteReceiptId && (
                <p style={{ marginTop: 8 }}>
                  <strong>{t('receiptId')}：</strong>{deleteReceiptId}
                </p>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* 删除确认抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={t('confirmDelete')}
          placement="bottom"
          onClose={handleCloseDeleteDrawer}
          open={deleteDrawerVisible}
          height="40%"
          footer={
            <div className="flex gap-3">
              <Button block onClick={handleCloseDeleteDrawer}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                danger 
                block
                loading={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {t('confirmDelete')}
              </Button>
            </div>
          }
        >
          <div className="text-center py-4">
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
            <h3 className="text-lg font-semibold mb-2">{t('confirmDeleteReceipt')}</h3>
            <p className="text-gray-600">{t('deleteReceiptWarning')}</p>
            {deleteReceiptId && (
              <p className="mt-4 text-gray-800">
                <strong>{t('receiptId')}：</strong>{deleteReceiptId}
              </p>
            )}
          </div>
        </Drawer>
      )}

      {/* Void 确认抽屉 - 桌面端 */}
      {!isMobile && (
        <Drawer
          title="Confirm Void"
          placement="right"
          onClose={handleCloseVoidDrawer}
          open={voidDrawerVisible}
          width={400}
          footer={
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseVoidDrawer} style={{ marginRight: 8 }}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                danger 
                loading={voidLoading}
                onClick={handleConfirmVoid}
              >
                Confirm Void
              </Button>
            </div>
          }
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f', marginRight: 12 }} />
              <span style={{ fontSize: 16, fontWeight: 500 }}>Confirm Void Receipt</span>
            </div>
            <div style={{ color: '#666', lineHeight: 1.8 }}>
              <p>Are you sure you want to void this receipt? This action cannot be undone.</p>
              {voidReceiptId && (
                <p style={{ marginTop: 8 }}>
                  <strong>Receipt ID：</strong>{voidReceiptId}
                </p>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* Void 确认抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title="Confirm Void"
          placement="bottom"
          onClose={handleCloseVoidDrawer}
          open={voidDrawerVisible}
          height="40%"
          footer={
            <div className="flex gap-3">
              <Button block onClick={handleCloseVoidDrawer}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                danger 
                block
                loading={voidLoading}
                onClick={handleConfirmVoid}
              >
                Confirm Void
              </Button>
            </div>
          }
        >
          <div className="text-center py-4">
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
            <h3 className="text-lg font-semibold mb-2">Confirm Void Receipt</h3>
            <p className="text-gray-600">Are you sure you want to void this receipt? This action cannot be undone.</p>
            {voidReceiptId && (
              <p className="mt-4 text-gray-800">
                <strong>Receipt ID：</strong>{voidReceiptId}
              </p>
            )}
          </div>
        </Drawer>
      )}

      {/* 打开钱箱抽屉 - 桌面端 */}
      {!isMobile && (
        <Drawer
          title={t('openCashDrawer') || '打开钱箱'}
          placement="right"
          onClose={handleCloseOpenCashDrawer}
          open={openCashDrawerVisible}
          width={400}
          footer={
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCloseOpenCashDrawer} style={{ marginRight: 8 }}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                loading={openCashDrawerLoading}
                onClick={handleOpenCashDrawer}
              >
                {t('confirm') || '确认'}
              </Button>
            </div>
          }
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('selectStore') || '选择店铺'}:</div>
              <section style={{ marginBottom: 10, marginTop: 10 }}>
                {shops.map((item, index) => (
                  index > 0 ? (
                    <Button 
                      key={index}
                      type={selectedStore === index ? 'primary' : 'default'} 
                      style={{ borderRadius: 20, marginRight: 5, marginBottom: 5 }} 
                      onClick={() => setSelectedStore(index)}
                    >
                      {item}
                    </Button>
                  ) : null
                ))}
              </section>
            </div>
          </div>
        </Drawer>
      )}

      {/* 打开钱箱抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={t('openCashDrawer') || '打开钱箱'}
          placement="bottom"
          onClose={handleCloseOpenCashDrawer}
          open={openCashDrawerVisible}
          height="50%"
          footer={
            <div className="flex gap-3">
              <Button block onClick={handleCloseOpenCashDrawer}>
                {t('cancel')}
              </Button>
              <Button 
                type="primary" 
                block
                loading={openCashDrawerLoading}
                onClick={handleOpenCashDrawer}
              >
                {t('confirm') || '确认'}
              </Button>
            </div>
          }
        >
          <div className="py-4">
            <div className="mb-4">
              <div className="mb-3 font-medium text-lg">{t('selectStore') || '选择店铺'}:</div>
              <div className="flex flex-wrap gap-2">
                {shops.map((item, index) => (
                  index > 0 ? (
                    <Button 
                      key={index}
                      type={selectedStore === index ? 'primary' : 'default'} 
                      size="large"
                      style={{ borderRadius: 20 }} 
                      onClick={() => setSelectedStore(index)}
                    >
                      {item}
                    </Button>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}