'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Pagination, Form, Input, DatePicker, Spin, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined, UserOutlined, ApiOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EmployeeOperationLog, EmployeeOperationLogRequest } from '@/lib/types';
import { employeeOperationLog } from '@/lib/api';
import moment from 'moment';
import { useInitialListRefresh } from '@/lib/useListRefresh';

export default function EmployeeHistory() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data, setData] = useState<EmployeeOperationLog[]>([]);
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
      console.error('获取员工操作历史记录失败:', error);
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
    if (uri.includes('create') || uri.includes('add')) return '创建';
    if (uri.includes('update') || uri.includes('modify') || uri.includes('edit')) return '修改';
    if (uri.includes('delete') || uri.includes('remove')) return '删除';
    if (uri.includes('login') || uri.includes('auth')) return '登录';
    if (uri.includes('get') || uri.includes('list')) return '查询';
    return '操作';
  };

  // 表格列定义
  const columns = [
    {
      title: t('operator'),
      dataIndex: 'userName',
      key: 'userName',
      fixed: 'left' as const,
      width: 100,
    },
    {
      title: t('uri'),
      dataIndex: 'uri',
      key: 'uri',
      fixed: 'left' as const,
      width: 200,
      render: (res: any) => res,
    },
    {
      title: t('details'),
      dataIndex: 'body',
      key: 'body',
      render: (value: any) => value,
    },
    {
      title: t('operationTime'),
      dataIndex: 'createDate',
      key: 'createDate',
      fixed: 'right' as const,
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
              <span className="text-sm text-gray-600 mr-2">{t('api')}:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                {item.uri}
              </code>
            </div>
            <Tag color={getApiTypeColor(item.uri)} className="text-xs">
              {getApiTypeText(item.uri)}
            </Tag>
          </div>
          
          {/* 操作详情 */}
          {item.body && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-sm text-gray-600 mb-1">{t('details')}:</div>
              <div className="text-sm text-gray-800 break-words">
                {typeof item.body === 'string' ? item.body : JSON.stringify(item.body)}
              </div>
            </div>
          )}
          
          {/* 操作时间 */}
          <div className="flex items-center text-xs text-gray-500">
            <ClockCircleOutlined className="mr-1" />
            {moment(item.createDate).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-4 md:p-6">
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
            className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[200px]"
          >
            <Input placeholder={t('pleaseEnterOperatorName')} />
          </Form.Item>
          <Form.Item 
            name="uri" 
            label={t('uri')}
            className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[200px]"
          >
            <Input placeholder={t('pleaseEnterApiPath')} />
          </Form.Item>
          <Form.Item 
            name="operateDate" 
            label={t('operationTime')}
            className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[300px]"
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
      <Card style={{ borderRadius: 12 }}>
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
    </div>
  );
}