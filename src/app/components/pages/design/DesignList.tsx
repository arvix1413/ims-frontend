'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Input, Spin, Card, Row, Col, Button } from 'antd';
import { SearchOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DesignItem } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { API_CONFIG } from '@/config/constants';
import TypeMultiSelect from '../../TypeMultiSelect';
import TypeQuickSelect from '../../TypeQuickSelect';

interface DesignListProps {
  displayData: DesignItem[];
  loading: boolean;
  pagination: {
    total: number;
  };
  designSearch: string;
  setDesignSearch: (value: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (value: string[]) => void;
  quickSelectType: string | null;
  setQuickSelectType: (value: string | null) => void;
  hasStockActive: boolean;
  onSearchClick: () => void;
  onHasStockFilter: () => void;
  onOpenCreate: () => void;
  onViewDetail: (item: DesignItem) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  hasMore: boolean;
}

export default function DesignList({
  displayData,
  loading,
  pagination,
  designSearch,
  setDesignSearch,
  selectedTypes,
  setSelectedTypes,
  quickSelectType,
  setQuickSelectType,
  hasStockActive,
  onSearchClick,
  onHasStockFilter,
  onOpenCreate,
  onViewDetail,
  onScroll,
  hasMore
}: DesignListProps) {
  const { t } = useTranslation();
  const { canUseFeature } = usePermissions();
  const scrollListRef = useRef<HTMLDivElement>(null);

  // 多选类型变化处理
  const handleTypeChange = (value: string[]) => {
    setSelectedTypes(value);
    setQuickSelectType(null);
  };

  // 快速选择类型变化处理
  const handleQuickSelectChange = (value: string) => {
    setQuickSelectType(value);
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        {/* 搜索和筛选区域 */}
        <Card className="mb-2">
          <Row gutter={[10, 10]}>
            <Col xs={24} sm={12} md={8}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('designCodeSearch')}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    placeholder={t('designCode')}
                    value={designSearch}
                    onChange={(e) => setDesignSearch(e.target.value)}
                    onPressEnter={onSearchClick}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('typeFilter')}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <TypeMultiSelect
                    value={selectedTypes}
                    onChange={handleTypeChange}
                    placeholder={t('type')}
                    style={{ flex: 1 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />}
                    onClick={onSearchClick}
                  >
                    {t('search')}
                  </Button>
                  <Button 
                    type={hasStockActive ? "primary" : "default"}
                    onClick={onHasStockFilter}
                  >
                    {t('inStock')}
                  </Button>
                  {canUseFeature('createDesign') && (
                    <Button 
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={onOpenCreate}
                    >
                      {t('create')}
                    </Button>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* 快速选择区域 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('quickSelectType')}
            </label>
            <TypeQuickSelect
              value={quickSelectType}
              onChange={handleQuickSelectChange}
            />
          </div>
        </Card>

        {/* 统计信息 */}
        {/* <div className="mb-4 text-gray-600">
          {t('foundItems', { count: pagination.total })} {displayData.length} {t('items')}
        </div> */}
      </div>

      {/* 商品列表 */}
      <div 
        style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          height: 800, 
          overflowY: "scroll",
          gap: '20px',
          padding:"10px",
        }} 
        onScroll={onScroll} 
        ref={scrollListRef}
      >
        {displayData.length > 0 ? (
          displayData.map((item: DesignItem, index: number) => (
            <div 
              key={`${item.id}-${index}`} 
              style={{ 
                backgroundColor: "#fff", 
                flex:"40%",
                height: 150, 
                display: "flex", 
                borderRadius: 10, 
                boxShadow: "0 0 15px 0 #ddd", 
                overflow: "hidden",
                flexShrink: 0
              }}
            >
              <img 
                alt={item.design} 
                style={{ height: 150, width: 150, objectFit: 'cover' }} 
                src={API_CONFIG.BASE_URL + item.previewPhoto}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  // 防止无限循环：如果已经是 placeholder 就不再设置
                  if (!img.src.includes('placeholder-image.jpg') && !img.src.includes('data:image')) {
                    // 使用 data URI 作为占位符（透明 1x1 像素图片）
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
                  }
                }}
              />
              <div style={{ width: "100%", display: "flex", padding: 15, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#6b21a8' }}>
                    {item.design}
                  </h3>
                  <div style={{ marginBottom: 5, fontSize: '14px', color: '#666' }}>
                    {t('type')}：{item.type}
                  </div>
                  <div style={{ marginBottom: 5, fontSize: '14px', color: '#666' }}>
                    {t('stock')}：{item.stock || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {t('price')}：<span style={{ color: "#fa9829", fontWeight: 'bold' }}>
                      ${item.salePrice || 0}
                    </span>
                  </div>
                </div>
                <div 
                  style={{ 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    color: "#b67c39", 
                    fontSize: 15, 
                    fontWeight: 600,
                  }}
                  onClick={() => onViewDetail(item)}
                >
                  {t('viewDetail')}
                  <RightOutlined style={{ marginLeft: 4 }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <Spin size="large" />
          </div>
        )}
        
        {/* 加载更多提示 */}
        {loading && displayData.length > 0 && (
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '20px' 
          }}>
            <Spin />
          </div>
        )}
        
        {/* 没有更多数据提示 */}
        {!hasMore && displayData.length > 0 && (
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '20px',
            color: '#999',
            fontSize: '14px'
          }}>
            已加载全部数据
          </div>
        )}
      </div>
    </div>
  );
}
