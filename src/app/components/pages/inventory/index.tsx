'use client';

import React, { useState, useEffect } from 'react';
import { Table, Form, Input, DatePicker, Button, Card, message, Pagination, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { InventoryRecordItem, InventoryRecordRequest } from '@/lib/types';
import { inventoryRecord } from '@/lib/api';
import moment from 'moment';
import { useInitialListRefresh } from '@/lib/useListRefresh';

const dev_url = 'http://119.28.104.20';

export default function InventoryRecords() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data, setData] = useState<InventoryRecordItem[]>([]);
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
      const params: InventoryRecordRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'create_date'
        },
        uri: '/item/modify-stock',
        ...formValues,
        ...searchParams
      };

      // 处理日期范围
      if (formValues.operateDate && formValues.operateDate.length === 2) {
        params.startDate = formValues.operateDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = formValues.operateDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete (params as any).operateDate;
      }

      console.log('发送请求参数:', params);

      const response = await inventoryRecord.getList(params);
      if (response.code === 200) {
        console.log('接收到的数据:', response.data);
        
        // 解析 body 字段中的 JSON 数据
        const processedData = response.data.content.map(item => {
          try {
            const bodyData = JSON.parse(item.body);
            return {
              ...bodyData,
              ...item,
            };
          } catch (error) {
            console.error('解析 body 数据失败:', error);
            return item;
          }
        });
        
        console.log('处理后的数据:', processedData);
        
        setData(processedData);
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
      console.error('获取库存修改记录失败:', error);
      message.error(t('fetchInventoryRecordsFailed'));
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

  // 初始化数据
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

  // 表格列定义
  const columns = [
    {
      title: t('productImage'),
      dataIndex: 'previewPhoto',
      key: 'previewPhoto',
      width: 120,
      fixed: 'left' as const,
      render: (photo: string) => (
        <img
          style={{ height: 100, width: 80, objectFit: 'cover' }}
          alt={t('productImage')}
          src={dev_url + photo}
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
      title: t('designCode'),
      dataIndex: 'design',
      key: 'design',
      width: 150,
      fixed: 'left' as const,
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
      title: t('warehouse'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 120,
    },
    {
      title: t('originalStock'),
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number) => (
        <div style={{ fontWeight: 'bold', color: '#262626' }}>
          {stock}
        </div>
      ),
    },
    {
      title: t('newStock'),
      dataIndex: 'newStock',
      key: 'newStock',
      width: 100,
      render: (newStock: number) => (
        <div style={{ 
          fontWeight: 'bold',
          color: newStock > 0 ? '#52c41a' : '#ff4d4f'
        }}>
          {newStock}
        </div>
      ),
    },
    {
      title: t('operator'),
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: t('operationTime'),
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
    },
  ];

  // 渲染移动端卡片
  const renderInventoryCard = (item: any, index: number) => (
    <Card
      key={item.id}
      className="mb-3 hover:shadow-md transition-shadow duration-200"
      style={{ borderRadius: 12 }}
    >
      <div className="flex items-start space-x-3">
        {/* 商品图片 */}
        <div className="flex-shrink-0">
          <img
            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            alt={t('productImage')}
            src={dev_url + item.previewPhoto}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('placeholder-image.jpg') && !img.src.includes('data:image')) {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
              }
            }}
          />
        </div>
        
        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="font-bold text-gray-900 text-lg truncate">
              {item.design}
            </div>
            <div className="text-sm text-gray-500">
              #{index + 1}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">{t('color')}:</span>
              <span className="font-medium">{item.color}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">{t('size')}:</span>
              <span className="font-medium">{item.size}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">{t('warehouse')}:</span>
              <span className="font-medium">{item.warehouseName}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">{t('operator')}:</span>
              <span className="font-medium">{item.userName}</span>
            </div>
          </div>
          
          {/* 库存变化信息 */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('originalStock')}:</span>
              <span className="font-bold text-gray-900">{item.stock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('newStock')}:</span>
              <span className={`font-bold ${
                item.newStock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.newStock}
              </span>
            </div>
          </div>
          
          {/* 操作时间 */}
          <div className="text-xs text-gray-500">
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
            name="body" 
            label={t('designCode')}
            className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[200px]"
          >
            <Input placeholder={t('pleaseEnterDesignCode')} />
          </Form.Item>
          <Form.Item 
            name="userName" 
            label={t('operator')}
            className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[200px]"
          >
            <Input placeholder={t('pleaseEnterOperator')} />
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
          <div className="flex gap-2 md:!mb-0">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} className="flex-1 md:flex-none">
              {t('search')}
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />} className="flex-1 md:flex-none">
              {t('reset')}
            </Button>
          </div>
        </Form>
      </Card>

      {/* 数据展示 - 桌面端表格，移动端卡片 */}
      <Card style={{ borderRadius: 12 }}>
        {/* 桌面端表格 */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1000 }}
          />
          
          {/* 桌面端分页 */}
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
        <div className="block md:hidden">
          {loading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <div className="mt-4 text-gray-500">{t('loading')}</div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 text-gray-300">📦</div>
              <div className="text-gray-500 text-lg">{t('noData')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, index) => renderInventoryCard(item, index))}
            </div>
          )}
          
          {/* 移动端分页 */}
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
