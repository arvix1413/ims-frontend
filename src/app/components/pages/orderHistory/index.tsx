'use client';

import React, { useState, useRef } from 'react';
import { Tabs, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import OrderList from './OrderList';
import { WAREHOUSE } from '@/lib/types';

export default function OrderHistory() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState('slady');
  const sladyRef = useRef<any>(null);
  const sl2Ref = useRef<any>(null);
  const liveRef = useRef<any>(null);

  // 刷新当前选中的订单列表
  const handleRefresh = () => {
    const currentRef = activeKey === 'slady' ? sladyRef : activeKey === 'sl2' ? sl2Ref : liveRef;
    if (currentRef.current) {
      currentRef.current.refresh();
    }
  };

  // 切换标签页
  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  const tabItems = [
    {
      key: 'slady',
      label: WAREHOUSE.SLADY,
      children: (
        <OrderList
          ref={sladyRef}
          warehouseName={WAREHOUSE.SLADY}
          onRefresh={() => handleRefresh()}
        />
      ),
    },
    {
      key: 'sl2',
      label: WAREHOUSE.SL,
      children: (
        <OrderList
          ref={sl2Ref}
          warehouseName={WAREHOUSE.SL}
          onRefresh={() => handleRefresh()}
        />
      ),
    },
    {
      key: 'live',
      label: WAREHOUSE.LIVE,
      children: (
        <OrderList
          ref={liveRef}
          warehouseName={WAREHOUSE.LIVE}
          onRefresh={() => handleRefresh()}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        marginBottom: 16,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
          >
            刷新全部
          </Button>
        </Space>
      </div>

        <Tabs
          activeKey={activeKey}
          onChange={handleTabChange}
          items={tabItems}
          size="large"
        />
    </div>
  );
}
