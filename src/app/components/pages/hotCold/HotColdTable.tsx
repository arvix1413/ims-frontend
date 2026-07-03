'use client';

import React from 'react';
import { Table, Tabs } from 'antd';
import { FireOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { HotColdItem } from '@/lib/types';
import { API_CONFIG } from '@/config/constants';

interface HotColdTableProps {
  hotData: HotColdItem[];
  coldData: HotColdItem[];
  activeTab: string;
  loading: boolean;
  onTabChange: (key: string) => void;
}

export default function HotColdTable({ 
  hotData, 
  coldData, 
  activeTab, 
  loading, 
  onTabChange 
}: HotColdTableProps) {
  const { t } = useTranslation();
  // 表格列定义
  const columns = [
    {
      title: t('rank'),
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '16px',
          color: activeTab === 'hot' ? '#ff4d4f' : '#1890ff'
        }}>
          #{index + 1}
        </div>
      ),
    },
    {
      title: t('productImage'),
      dataIndex: 'previewPhoto',
      key: 'previewPhoto',
      width: 120,
      render: (photo: string) => (
        <img
          style={{ 
            height: 80, 
            width: 80, 
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}
          alt={t('productImage')}
          src={API_CONFIG.BASE_URL + photo}
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
      width: 150,
      render: (design: string) => (
        <div style={{ fontWeight: 'bold', color: '#262626' }}>
          {design}
        </div>
      ),
    },
    {
      title: t('hot') + '值',
      dataIndex: 'hot',
      key: 'hot',
      width: 100,
      render: (hot: number) => (
        <div style={{ 
          fontWeight: 'bold',
          color: activeTab === 'hot' ? '#ff4d4f' : '#1890ff',
          fontSize: '16px'
        }}>
          {hot || 0}
        </div>
      ),
    },
    {
      title: t('type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <div style={{ color: '#595959' }}>
          {type}
        </div>
      ),
    },
    {
      title: t('stock'),
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock: number) => (
        <div style={{ 
          color: stock > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {stock}
        </div>
      ),
    },
    {
      title: t('salePrice'),
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 100,
      render: (price: string) => (
        <div style={{ 
          fontWeight: 'bold',
          color: '#262626'
        }}>
          ${price}
        </div>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'hot',
      label: (
        <span>
          <FireOutlined style={{ color: '#ff4d4f',marginRight:5 }} />
          {t('hotItemsRanking')}
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={hotData}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="middle"
          style={{ marginTop: 16 }}
        />
      ),
    },
    {
      key: 'cold',
      label: (
        <span>
          <MinusCircleOutlined style={{ color: '#1890ff',marginRight:5 }} />
          {t('coldItemsRanking')}
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={coldData}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="middle"
          style={{ marginTop: 16 }}
        />
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange}
      items={tabItems}
      size="large"
      style={{ minHeight: 400 }}
    />
  );
}
