'use client';

import React, { useState, useEffect } from 'react';
import { Card, message, Tabs } from 'antd';
import { FireOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { HotColdItem, HotColdListRequest } from '@/lib/types';
import { hotCold } from '@/lib/api';
import TopThreeItems from './TopThreeItems';
import HotColdTable from './HotColdTable';
import { useInitialListRefresh } from '@/lib/useListRefresh';

export default function HotColdItems() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('hot');
  const [hotData, setHotData] = useState<HotColdItem[]>([]);
  const [coldData, setColdData] = useState<HotColdItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取爆款数据
  const fetchHotData = async () => {
    try {
      const params: HotColdListRequest = {
        type: '',
        searchPage: {
          desc: 1,
          page: 1,
          pageSize: 20,
          sort: 'hot'
        }
      };
      const response = await hotCold.getList(params);
      if (response.code === 200) {
        setHotData(response.data.content);
      }
    } catch (error) {
      console.error('获取爆款数据失败:', error);
      message.error(t('fetchHotItemsFailed'));
    }
  };

  // 获取冷款数据
  const fetchColdData = async () => {
    try {
      const params: HotColdListRequest = {
        type: '',
        searchPage: {
          desc: 0,
          page: 1,
          pageSize: 20,
          sort: 'hot'
        }
      };
      const response = await hotCold.getList(params);
      if (response.code === 200) {
        setColdData(response.data.content);
      }
    } catch (error) {
      console.error('获取冷款数据失败:', error);
      message.error(t('fetchColdItemsFailed'));
    }
  };

  useInitialListRefresh(() => {
    setLoading(true);
    void Promise.all([fetchHotData(), fetchColdData()]).finally(() => setLoading(false));
  });

  // 移动端标签页配置
  const mobileTabItems = [
    {
      key: 'hot',
      label: (
        <span className="flex items-center">
          <FireOutlined className="text-red-500 mr-2" />
          {t('hotItems')}
        </span>
      ),
      children: (
        <div className="space-y-4">
          <TopThreeItems hotData={hotData} coldData={coldData} />
          <HotColdTable
            hotData={hotData}
            coldData={coldData}
            activeTab="hot"
            loading={loading}
            onTabChange={setActiveTab}
          />
        </div>
      ),
    },
    {
      key: 'cold',
      label: (
        <span className="flex items-center">
          <MinusCircleOutlined className="text-blue-500 mr-2" />
          {t('coldItems')}
        </span>
      ),
      children: (
        <div className="space-y-4">
          <TopThreeItems hotData={hotData} coldData={coldData} />
          <HotColdTable
            hotData={hotData}
            coldData={coldData}
            activeTab="cold"
            loading={loading}
            onTabChange={setActiveTab}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {/* 桌面版布局 */}
      <div className="hidden md:block p-6">
        <TopThreeItems hotData={hotData} coldData={coldData} />
        <Card 
          style={{ 
            borderRadius: 8, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }}
        >
          <HotColdTable
            hotData={hotData}
            coldData={coldData}
            activeTab={activeTab}
            loading={loading}
            onTabChange={setActiveTab}
          />
        </Card>
      </div>

      {/* 移动版布局 */}
      <div className="md:hidden p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={mobileTabItems}
          size="large"
          className="hot-cold-tabs"
        />
      </div>
    </>
  );
}
