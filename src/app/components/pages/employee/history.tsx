'use client';

import React, { useState } from 'react';
import { Table, Button, Card, message, Pagination, Input, DatePicker, Spin, Tag, Modal, Descriptions, Divider, Empty } from 'antd';
import Form from '@/app/components/common/ValidatedForm';
import { SearchOutlined, ReloadOutlined, UserOutlined, ApiOutlined, ClockCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EmployeeOperationLog, EmployeeOperationLogRequest } from '@/lib/types';
import { employeeOperationLog } from '@/lib/api';
import moment from 'moment';
import { useInitialListRefresh } from '@/lib/useListRefresh';

export default function EmployeeHistory() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data, setData] = useState<EmployeeOperationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EmployeeOperationLog | null>(null);
  const [loading, setLoading] = useState(false);
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
      const params: EmployeeOperationLogRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'create_date'
        },
        ...formValues,
        ...searchParams
      };

      // 处理日期范围
      if (formValues.operateDate && formValues.operateDate.length === 2) {
        params.startDate = formValues.operateDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = formValues.operateDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete (params as any).operateDate;
      }

      const response = await employeeOperationLog.getList(params);
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
      console.error('Failed to get employee history:', error);
      message.error(t('fetchEmployeeHistoryFailed'));
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

  useInitialListRefresh(() => fetchData(1));

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

  const logFieldLabels: Record<string, string> = {
    result: 'logFieldResult', status: 'status', paymentFlag: 'paymentStatus', paymentStatus: 'paymentStatus',
    amount: 'quantityLabel', number: 'quantityLabel', salePrice: 'salePrice', price: 'salePrice', quotedPrice: 'quotedPrice',
    purchasePrice: 'purchasePrice', sum: 'totalAmount', balance: 'memberBalance',
    memberRemainingAmount: 'remainingBalance', customerContact: 'customerContact', customerName: 'customerName',
    orderedBy: 'orderedBy', design: 'product', designCode: 'designCode', color: 'color', size: 'size',
    warehouseName: 'warehouse', remark: 'remark', type: 'orderType', purchaseDate: 'purchaseDate',
    saler: 'salesperson', seller: 'salesperson', salesperson: 'salesperson', designs: 'productDetails',
    stockType: 'stockType', inStoreStock: 'inStoreStock', tempStoreStock: 'tempStoreStock',
    newInStoreStock: 'inStoreStock', newTempStoreStock: 'tempStoreStock', damagedStock: 'damagedStock',
    newDamagedStock: 'damagedStock', unpaidStock: 'unpaidStock', newUnpaidStock: 'unpaidStock',
    sourceNo: 'sourceNo', eventType: 'inventoryChangeType', phone: 'phone',
  };

  const hiddenLogFields = /(^id$|ids$|userid$|itemid$|memberid$|designid$|orderid$|token|password|secret)/i;

  const getLogAction = (uri: string) => {
    const path = (uri || '').split('?')[0].toLowerCase();
    const exactActions: Record<string, string> = {
      '/auth/login': 'logActionLogin',
      '/order/create': 'logActionOrderCreate',
      '/order/modify': 'logActionOrderModify',
      '/order/delete': 'logActionOrderDelete',
      '/member/top-up': 'logActionMemberTopUp',
      '/memberpurchasehistory/create': 'logActionMemberPurchase',
      '/memberpurchasehistory/modify': 'logActionMemberPurchaseModify',
      '/item/modify-stock/business': 'logActionStockModify',
      '/item/modify-stock': 'logActionStockModify',
      '/design/create': 'logActionProductCreate',
      '/design/modify': 'logActionProductModify',
      '/design/delete': 'logActionProductDelete',
      '/item/create': 'logActionProductCreate',
      '/item/modify': 'logActionProductModify',
      '/item/delete': 'logActionProductDelete',
      '/member/create': 'logActionMemberCreate',
      '/member/modify': 'logActionMemberModify',
      '/member/delete': 'logActionMemberDelete',
    };
    const exact = exactActions[path];
    if (exact) return t(exact);
    if (path.includes('modify') || path.includes('update')) return t('logActionUpdate');
    if (path.includes('create') || path.includes('add')) return t('logActionCreate');
    if (path.includes('delete') || path.includes('remove')) return t('logActionDelete');
    if (path.includes('login') || path.includes('auth')) return t('logActionLogin');
    return t('operationText');
  };

  const parseLogDetail = (record: EmployeeOperationLog): unknown => {
    const detail = record.body || record.args;
    if (!detail) return null;
    if (typeof detail !== 'string') return detail;
    try {
      return JSON.parse(detail);
    } catch {
      if (record.args && detail === record.args) {
        const params = new URLSearchParams(detail);
        const query: Record<string, string> = {};
        params.forEach((value, key) => { query[key] = value; });
        return Object.keys(query).length ? query : null;
      }
      return null;
    }
  };

  const formatLogValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) {
      return value.map((entry) => {
        if (entry && typeof entry === 'object') {
          return Object.entries(entry as Record<string, unknown>)
            .filter(([nestedKey, nestedValue]) => !hiddenLogFields.test(nestedKey) && nestedValue !== null && nestedValue !== undefined && logFieldLabels[nestedKey])
            .map(([nestedKey, nestedValue]) => `${t(logFieldLabels[nestedKey])}: ${formatLogValue(nestedKey, nestedValue)}`)
            .join(' · ');
        }
        return String(entry);
      }).filter(Boolean).join('\n');
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .filter(([nestedKey, nestedValue]) => !hiddenLogFields.test(nestedKey) && nestedValue !== null && nestedValue !== undefined && logFieldLabels[nestedKey])
        .map(([nestedKey, nestedValue]) => `${t(logFieldLabels[nestedKey])}: ${formatLogValue(nestedKey, nestedValue)}`)
        .join('\n');
    }
    const text = String(value);
    if (key === 'status' && /^\d+$/.test(text)) {
      const statusLabels: Record<string, string> = {
        '0': 'pending', '1': 'shipped', '2': 'completed', '3': 'outOfStock', '4': 'damaged',
        '5': 'void', '6': 'arrivedNotPickedUp', '7': 'arrivedPickedUp', '8': 'arrived',
      };
      if (statusLabels[text]) return t(statusLabels[text]);
    }
    if (key === 'paymentFlag') {
      if (text.toUpperCase() === 'PAID') return t('paid');
      if (text.toUpperCase() === 'UNPAID') return t('unpaid');
    }
    if (key === 'result') {
      if (text.toLowerCase() === 'success') return t('success');
      if (text.toLowerCase() === 'failed') return t('failed');
    }
    if (key === 'type' && (text === '0' || text === '1')) return t(text === '0' ? 'storeSupply' : 'customerOrder');
    if (/date|time/i.test(key) && moment(text).isValid()) return moment(text).format('YYYY-MM-DD HH:mm:ss');
    if (typeof value === 'boolean') return t(value ? 'yes' : 'no');
    return text;
  };

  const getReadableLogDetails = (record: EmployeeOperationLog) => {
    const parsed = parseLogDetail(record);
    if (!parsed || typeof parsed !== 'object') return [];
    return Object.entries(parsed as Record<string, unknown>)
      .filter(([key, value]) => !hiddenLogFields.test(key) && value !== null && value !== undefined && value !== '' && logFieldLabels[key])
      .map(([key, value]) => ({ key, label: t(logFieldLabels[key]), value: formatLogValue(key, value) }))
      .filter((entry) => entry.value !== '');
  };

  // 获取API类型标签颜色
  const getApiTypeColor = (uri: string) => {
    if (uri.includes('create') || uri.includes('add')) return 'green';
    if (uri.includes('update') || uri.includes('modify') || uri.includes('edit')) return 'blue';
    if (uri.includes('delete') || uri.includes('remove')) return 'red';
    if (uri.includes('login') || uri.includes('auth')) return 'purple';
    return 'default';
  };

  // 获取API类型标签文本
  const getApiTypeText = (uri: string) => {
    if (uri.includes('create') || uri.includes('add')) return t('createText');
    if (uri.includes('update') || uri.includes('modify') || uri.includes('edit')) return t('modifyText');
    if (uri.includes('delete') || uri.includes('remove')) return t('deleteText');
    if (uri.includes('login') || uri.includes('auth')) return t('loginText');
    if (uri.includes('get') || uri.includes('list')) return t('queryText');
    return t('operationText');
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left' as const,
      width: 80,
      render: (id: number) => <span style={{ fontSize: 12, color: '#8c8c8c' }}>{id}</span>,
    },
    {
      title: t('operator'),
      dataIndex: 'userName',
      key: 'userName',
      fixed: 'left' as const,
      width: 100,
    },
    {
      title: t('ipAddress'),
      dataIndex: 'clientIp',
      key: 'clientIp',
      width: 150,
      render: (ip?: string | null) => ip ? <span title={ip} style={{ whiteSpace: 'nowrap' }}>{ip}</span> : '-',
    },
    {
      title: t('operationText'),
      dataIndex: 'uri',
      key: 'uri',
      fixed: 'left' as const,
      width: 200,
      render: (uri: string) => uri ? getLogAction(uri) : '-',
    },
    {
      title: t('logDetailsColumn'),
      key: 'details',
      render: (_: any, record: EmployeeOperationLog) => {
        if (!record.body && !record.args) return '-';
        return (
          <Button type="link" size="small" onClick={() => setSelectedLog(record)}>
            {t('viewLogDetails')}
          </Button>
        );
      },
    },
    {
      title: t('operationTime'),
      dataIndex: 'createDate',
      key: 'createDate',
      width: 200,
      render: (value: string) => moment(value).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  // 渲染操作记录卡片（移动端）
  const renderOperationCard = (item: EmployeeOperationLog, index: number) => (
    <Card
      key={item.id}
      className="mb-3 hover:shadow-md transition-shadow duration-200"
      style={{ borderRadius: 12 }}
    >
      <div className="flex items-start space-x-3">
        {/* 操作员头像 */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <UserOutlined className="text-gray-600 text-lg" />
          </div>
        </div>
        
        {/* 操作信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="font-bold text-gray-900 text-lg">
              {item.userName}
            </div>
            <div className="text-sm text-gray-500">
              #{index + 1}
            </div>
          </div>
          
          {/* API路径和类型 */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <ApiOutlined className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-700 font-medium">{getLogAction(item.uri)}</span>
            </div>
            <Tag color={getApiTypeColor(item.uri)} className="text-xs">
              {getApiTypeText(item.uri)}
            </Tag>
          </div>
          
          {/* 操作详情 */}
          {(item.body || item.args) && (
            <div className="mb-3">
              <Button type="link" size="small" className="!px-0" onClick={() => setSelectedLog(item)}>
                {t('viewLogDetails')}
              </Button>
            </div>
          )}
          
          {/* 操作时间和来源 IP */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center">
              <ClockCircleOutlined className="mr-1" />
              {moment(item.createDate).format('YYYY-MM-DD HH:mm:ss')}
            </span>
            <span className="flex items-center break-all">
              <GlobalOutlined className="mr-1 shrink-0" />
              {t('ipAddress')}: {item.clientIp || '-'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-3 md:p-4">
      {/* 搜索表单 */}
      <Card className="mb-4" style={{ borderRadius: 12 }}>
        <Form
          form={form}
          layout="vertical"
          className="md:!flex md:!flex-wrap md:!items-end md:!gap-4"
          onFinish={handleSearch}
        >
          <Form.Item 
            name="userName" 
            label={t('operator')}
            className="!mb-3 md:!mb-0 md:!flex-1 md:!min-w-[200px]"
          >
            <Input placeholder={t('pleaseEnterOperatorName')} />
          </Form.Item>
          <Form.Item 
            name="uri" 
            label={t('uri')}
            className="!mb-3 md:!mb-0 md:!flex-1 md:!min-w-[200px]"
          >
            <Input placeholder={t('pleaseEnterApiPath')} />
          </Form.Item>
          <Form.Item 
            name="operateDate" 
            label={t('operationTime')}
            className="!mb-3 md:!mb-0 md:!flex-1 md:!min-w-[300px]"
          >
            <DatePicker.RangePicker 
              placeholder={[t('startTime'), t('endTime')]}
              className="w-full"
            />
          </Form.Item>
          <Form.Item className="!mb-0 md:!flex-none">
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} className="flex-1 md:flex-none">
                {t('search')}
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />} className="flex-1 md:flex-none">
                {t('reset')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      {/* 数据展示 */}
      <Card style={{ borderRadius: 12, overflow: 'auto' }}>
        {/* 桌面端表格 */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={false}
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
        </div>

        {/* 移动端卡片列表 */}
        <div className="md:hidden">
          {loading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <div className="mt-4 text-gray-500">{t('loading')}</div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 text-gray-300">📋</div>
              <div className="text-gray-500 text-lg">{t('noData')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, index) => renderOperationCard(item, index))}
            </div>
          )}
          
          {/* 分页 */}
          {data.length > 0 && (
            <div className="mt-6 text-center">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handleTableChange}
                showSizeChanger={false}
                showQuickJumper
                className="mobile-pagination"
              />
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={selectedLog !== null}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        centered
        width="min(720px, calc(100vw - 24px))"
        title={selectedLog ? (
          <div>
            <div>{t('operationDetails')}</div>
            <div className="mt-1 text-sm font-normal text-gray-500">{getLogAction(selectedLog.uri)}</div>
          </div>
        ) : null}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">{t('operator')}</div>
                <div className="mt-1 font-medium text-gray-900">{selectedLog.userName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t('operationTime')}</div>
                <div className="mt-1 font-medium text-gray-900">{moment(selectedLog.createDate).format('YYYY-MM-DD HH:mm:ss')}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">{t('ipAddress')}</div>
                <div className="mt-1 font-medium text-gray-900">{selectedLog.clientIp || '-'}</div>
              </div>
            </div>

            <Divider className="!my-3" />
            <section>
              <h3 className="mb-3 text-base font-semibold text-gray-900">{t('changedInformation')}</h3>
              {getReadableLogDetails(selectedLog).length ? (
                <Descriptions bordered size="small" column={1}>
                  {getReadableLogDetails(selectedLog).map(({ key, label, value }) => (
                    <Descriptions.Item key={key} label={label}>
                      <span className="whitespace-pre-wrap break-words">{value}</span>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noReadableLogDetails')} />
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
