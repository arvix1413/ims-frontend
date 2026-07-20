'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Pagination, Space, Tag, Tabs, Form, Input } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MemberPurchaseRecord, MemberPurchaseHistoryRequest } from '@/lib/types';
import { member } from '@/lib/api';
import { ProductItemTag } from '@/app/components/common/ProductItemTag';

interface AllMemberPurchaseHistoryProps {
  onBackToList: () => void;
}

export default function AllMemberPurchaseHistory({ onBackToList }: AllMemberPurchaseHistoryProps) {
  const { t } = useTranslation();
  const [searchForm] = Form.useForm();
  const [purchaseData, setPurchaseData] = useState<MemberPurchaseRecord[]>([]);
  const [refundData, setRefundData] = useState<MemberPurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('purchase');
  const [purchasePagination, setPurchasePagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [refundPagination, setRefundPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 获取购买记录数据
  const fetchPurchaseData = async (page: number = 1) => {
    setLoading(true);
    try {
      const formValues = searchForm.getFieldsValue();
      const params: MemberPurchaseHistoryRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'purchase_date'
        },
        refund: 2,
        ...(formValues.designCode && { designCode: formValues.designCode })
      };

      const response = await member.getPurchaseHistoryList(params);
      if (response.code === 200) {
        setPurchaseData(response.data.content);
        setPurchasePagination({
          current: response.data.number + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
        });
      } else {
        setPurchaseData([]);
        setPurchasePagination({
          current: 1,
          pageSize: 20,
          total: 0,
        });
      }
    } catch (error) {
      console.error('获取购买记录失败:', error);
      message.error(t('fetchPurchaseRecordsFailed'));
      setPurchaseData([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取退还记录数据
  const fetchRefundData = async (page: number = 1) => {
    setLoading(true);
    try {
      const formValues = searchForm.getFieldsValue();
      const params: MemberPurchaseHistoryRequest = {
        searchPage: {
          desc: 1,
          page,
          pageSize: 20,
          sort: 'purchase_date'
        },
        refund: 1,
        ...(formValues.designCode && { designCode: formValues.designCode })
      };

      const response = await member.getPurchaseHistoryList(params);
      if (response.code === 200) {
        setRefundData(response.data.content);
        setRefundPagination({
          current: response.data.number + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
        });
      } else {
        setRefundData([]);
        setRefundPagination({
          current: 1,
          pageSize: 20,
          total: 0,
        });
      }
    } catch (error) {
      console.error('Failed to get refund records:', error);
      message.error(t('getRefundRecordsFailed'));
      setRefundData([]);
      setRefundPagination({
        current: 1,
        pageSize: 20,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    Promise.all([fetchPurchaseData(1), fetchRefundData(1)]);
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'purchase') {
      fetchPurchaseData(1);
    } else {
      fetchRefundData(1);
    }
  };

  // 搜索
  const handleSearch = () => {
    if (activeTab === 'purchase') {
      fetchPurchaseData(1);
    } else {
      fetchRefundData(1);
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    if (activeTab === 'purchase') {
      fetchPurchaseData(1);
    } else {
      fetchRefundData(1);
    }
  };

  const currentPagination =
    activeTab === 'purchase' ? purchasePagination : refundPagination;

  // 表格列定义
  const columns = [
    {
      title: t('purchaseDate'),
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      fixed: 'left' as const,
      width: 150,
    },
    {
      title: t('saler'),
      dataIndex: 'saler',
      key: 'saler',
      width: 100,
    },
    {
      title: t('products'),
      dataIndex: 'designList',
      key: 'designList',
      width: 400,
      render: (value: any) => {
        if (!Array.isArray(value) || value.length === 0) return <span>-</span>;

        return (
          <Space wrap>
            {value.map((item, idx) => (
              <ProductItemTag
                key={idx}
                item={{
                  designCode: item?.designCode,
                  color: item?.color,
                  size: item?.size,
                  stockType: item?.stockType,
                  price: item?.price
                }}
              />
            ))}
          </Space>
        );
      }
    },
    {
      title: t('member'),
      dataIndex: 'member',
      key: 'member',
      width: 200,
      render: (value: any, item: any) => (
        <div>
          <div>{item.memberName}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{item.memberPhone}</div>
        </div>
      ),
    },
    {
      title: t('totalAmount'),
      dataIndex: 'sum',
      key: 'sum',
      width: 100,
      render: (sum: number) => (
        <div style={{ 
          fontWeight: 'bold', 
          color: sum < 0 ? '#ff4d4f' : '#262626' 
        }}>
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
      fixed: 'right' as const,
      width: 150,
    },
  ];

  const tabItems = [
    {
      key: 'purchase',
      label: t('memberPurchase'),
      children: (
        <Table
          columns={columns}
          dataSource={purchaseData}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      ),
    },
    {
      key: 'refund',
      label: t('memberRefund'),
      children: (
        <Table
          columns={columns}
          dataSource={refundData}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      ),
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
            {t('backToList3')}
          </Button>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('allMemberPurchaseHistory')}</h2>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="designCode" label={t('code')}>
            <Input placeholder={t('pleaseEnterDesignCode')} style={{ width: 200 }} />
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
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="large"
        />
        
        {/* 分页 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={currentPagination.current}
            pageSize={currentPagination.pageSize}
            total={currentPagination.total}
            onChange={(page) => {
              if (activeTab === 'purchase') {
                setPurchasePagination(prev => ({ ...prev, current: page }));
                fetchPurchaseData(page);
              } else {
                setRefundPagination(prev => ({ ...prev, current: page }));
                fetchRefundData(page);
              }
            }}
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
