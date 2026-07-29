'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Pagination, Input } from 'antd';
import Form from '@/app/components/common/ValidatedForm';
import { ArrowLeftOutlined, SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MemberPurchaseRecord, MemberPurchaseHistoryRequest } from '@/lib/types';
import { member } from '@/lib/api';
import { useInitialListRefresh } from '@/lib/useListRefresh';

interface MemberTopUpHistoryProps {
  onBackToList: () => void;
}

export default function MemberTopUpHistory({ onBackToList }: MemberTopUpHistoryProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data, setData] = useState<MemberPurchaseRecord[]>([]);
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
      const params: MemberPurchaseHistoryRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'purchase_date'
        },
        types: [1],
        ...formValues,
        ...searchParams
      };

      const response = await member.getPurchaseHistoryList(params);
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
      console.error('获取充值记录失败:', error);
      message.error(t('fetchTopUpRecordsFailed'));
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

  // {t('search')}
  const handleSearch = () => {
    fetchData(1);
  };

  // {t('reset')}
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
      title: t('topUpDate'),
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
    },
    {
      title: t('memberName'),
      dataIndex: 'memberName',
      key: 'memberName',
      width: 150,
    },
    {
      title: t('voucherNumber'),
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      width: 100,
    },
    {
      title: t('topUpAmount'),
      dataIndex: 'sum',
      key: 'sum',
      width: 120,
      render: (sum: number) => (
        <div style={{ fontWeight: 'bold', color: '#262626' }}>
          ${sum}
        </div>
      ),
    },
    {
      title: t('memberBalance'),
      dataIndex: 'memberRemainingAmount',
      key: 'memberRemainingAmount',
      width: 120,
      render: (amount: number) => (
        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
          ${amount}
        </div>
      ),
    },
    {
      title: t('paymentDetailOrRefundReason'),
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBackToList}
            style={{ marginRight: 16 }}
          >
            返回列表
          </Button>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('memberTopUpHistory')}</h2>
        </div>
      </div>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="memberName" label={t('memberName')}>
            <Input placeholder={t('pleaseEnter') + t('memberName')} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="voucherNumber" label={t('voucherNumber')}>
            <Input placeholder={t('pleaseEnter') + t('voucherNumber')} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t('search')}
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              {t('reset')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 数据表格 */}
      <Card>
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
      </Card>
    </div>
  );
}
