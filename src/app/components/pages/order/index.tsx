'use client';

import React, { useState, useRef } from 'react';
import { Tabs, message, Form, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import OrderList from './OrderList';
import { WAREHOUSE } from '@/lib/types';
import DesignDetail from '../design/DesignDetail';
import { api } from '@/lib/api';
import { DesignDetail as DesignDetailType } from '@/lib/types';

export default function Order() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState('slady');
  const sladyRef = useRef<any>(null);
  const sl2Ref = useRef<any>(null);
  const liveRef = useRef<any>(null);
  
  // 视图状态：'list' 或 'detail'
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<DesignDetailType | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // 获取商品详情
  const fetchDesignDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      const response = await api.design.getDetail(id);
      if (response.code === 200) {
        setDetailData(response.data);
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
      message.error('获取商品详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // 跳转到详情页面
  const handleViewDesignDetail = (designId: number) => {
    setSelectedDesignId(designId);
    setCurrentView('detail');
    fetchDesignDetail(designId);
  };

  // 返回列表页面
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedDesignId(null);
    setDetailData(null);
    handleRefresh();
  };

  // 编辑相关状态和函数（从 design/index.tsx 复制，但这里可能不需要编辑功能）
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editForm] = Form.useForm();
  const handleEdit = () => {
    // 订单页面可能不需要编辑功能
  };
  const handleDelete = () => {
    // 订单页面可能不需要删除功能
  };
  const handleViewImages = () => {
    // 订单页面可能不需要查看图片功能
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
          onViewDesignDetail={handleViewDesignDetail}
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
          onViewDesignDetail={handleViewDesignDetail}
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
          onViewDesignDetail={handleViewDesignDetail}
        />
      ),
    },
  ];

  // 根据当前视图渲染对应内容
  if (currentView === 'detail') {
    return (
      <DesignDetail
        detailData={detailData}
        detailLoading={detailLoading}
        onBackToList={handleBackToList}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewImages={handleViewImages}
        editDrawerVisible={editDrawerVisible}
        onEditDrawerClose={() => setEditDrawerVisible(false)}
        onEditSubmit={() => {}}
        editForm={editForm}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* 移动端顶部操作按钮 */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          size="large"
        >
          {t('refreshAll')}
        </Button>
      </div>

      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
        className="mobile-tabs"
      />
    </div>
  );
}
