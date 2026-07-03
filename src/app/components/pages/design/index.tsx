'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Drawer, Form, InputNumber, Select, Space, Divider, App, notification, message, Input, Card, Row, Col, Spin, Image, Tag, Upload } from 'antd';
import { PlusOutlined, MinusCircleOutlined, ExclamationCircleOutlined, SearchOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';
import ColorSelect from '../../ColorSelect';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { DesignItem, DesignListRequest, SearchPageParams, DesignDetail as DesignDetailType, ModifyDesignRequest, typeList, colorList, fabricList, sizeList, WAREHOUSE, CreateDesignRequest } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { useIsMobile } from '@/lib/useIsMobile';
import ImageUpload from '../../ImageUpload';
import DesignDetail from './DesignDetail';
import ImageGallery from './ImageGallery';
import TypeMultiSelect from '../../TypeMultiSelect';
import TypeQuickSelect from '../../TypeQuickSelect';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

export default function Design() {
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { canUseFeature } = usePermissions();
  
  // 视图状态：'list'、'detail' 或 'images'
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'images'>('list');
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<DesignDetailType | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 列表相关状态
  const [loading, setLoading] = useState(false);
  const [displayData, setDisplayData] = useState<DesignItem[]>([]);
  const [allData, setAllData] = useState<DesignItem[]>([]);
  const [designSearch, setDesignSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [quickSelectType, setQuickSelectType] = useState<string | null>(null);
  const [hasStockActive, setHasStockActive] = useState(false);
  
  // 用于实际查询的状态（点击搜索按钮后才更新）
  const [searchQuery, setSearchQuery] = useState({
    design: '',
    typeList: [] as string[],
    hasStock: undefined as number | undefined
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMore, setHasMore] = useState(true);
  
  // 编辑相关状态
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  
  // 创建商品相关状态
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [createForm] = Form.useForm();
  
  const [imgCover, setImgCover] = useState<UploadFile[]>([]);
  const [createImgList, setCreateImgList] = useState<UploadFile[]>([]);
  const [newFabric, setNewFabric] = useState<string[]>([...fabricList]);
  const [fabric, setFabric] = useState('');
  const fabricInputRef = useRef<any>(null);
  let fabricIndex = 0;
  
  // 图片浏览相关状态
  const [currentFolderPath, setCurrentFolderPath] = useState('');
  const [coverPath, setCoverPath] = useState('');
  
  const scrollListRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);

  // 获取商品列表数据
  const fetchDesignList = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      
      const searchPage: SearchPageParams = {
        desc: 1,
        page: page,
        pageSize: 20,
        sort: 'id'
      };

      const requestParams: DesignListRequest = {
        typeList: searchQuery.typeList,
        design: searchQuery.design,
        searchPage: searchPage,
        ...(searchQuery.hasStock !== undefined && { hasStock: searchQuery.hasStock })
      };

      const response = await api.design.getList(requestParams);
      
      if (response.code === 200) {
        const newData = response.data.content;
        
        if (reset) {
          setDisplayData(newData);
          setAllData(newData);
        } else {
          setDisplayData((prev: DesignItem[]) => [...prev, ...newData]);
          setAllData((prev: DesignItem[]) => [...prev, ...newData]);
        }
        
        setPagination((prev: { page: number; pageSize: number; total: number; totalPages: number }) => ({
          page: reset ? 1 : prev.page + 1,
          pageSize: response.data.size,
          total: response.data.totalElements,
          totalPages: response.data.totalPages
        }));
        
        setHasMore(response.data.number < response.data.totalPages - 1);
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery.typeList, searchQuery.design, searchQuery.hasStock]);

  // 初始加载数据
  useEffect(() => {
    // 首次加载数据
    fetchDesignList(1, true);
  }, []);

  // 搜索查询变化时重新加载数据
  useEffect(() => {
    fetchDesignList(1, true);
  }, [searchQuery]);

  // 快速选择类型变化时更新多选并立即搜索
  useEffect(() => {
    if (quickSelectType !== null) {
      const newTypeList = quickSelectType ? [quickSelectType] : [];
      setSelectedTypes(newTypeList);
      setSearchQuery({
        design: designSearch,
        typeList: newTypeList,
        hasStock: undefined
      });
    }
  }, [quickSelectType, designSearch]);

  // 滚动加载更多
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      fetchDesignList(pagination.page + 1, false);
    }
  }, [hasMore, loading, pagination.page, fetchDesignList]);

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
      message.error(t('fetchDesignDetailFailed'));
    } finally {
      setDetailLoading(false);
    }
  };

  // 跳转到详情页面
  const toDetail = (item: DesignItem) => {
    // 保存当前滚动位置
    if (scrollListRef.current) {
      savedScrollPosition.current = scrollListRef.current.scrollTop;
    }
    
    setSelectedDesignId(item.id);
    setCurrentView('detail');
    fetchDesignDetail(item.id);
  };

  // 返回列表页面
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedDesignId(null);
    setDetailData(null);
    fetchDesignList(1, true);

    // 恢复滚动位置
    setTimeout(() => {
      if (scrollListRef.current && savedScrollPosition.current > 0) {
        scrollListRef.current.scrollTop = savedScrollPosition.current;
      }
    }, 0);
  };

  // 跳转到图片浏览页面
  const handleViewImages = (images: string, coverPath: string) => {
    setCurrentFolderPath(images);
    setCoverPath(coverPath);
    setCurrentView('images');
  };

  // 返回详情页面
  const handleBackToDetail = () => {
    setCurrentView('detail');
  };

  // 打开编辑抽屉
  const handleEdit = () => {
    if (detailData) {
      form.setFieldsValue({
        design: detailData.design,
        type: detailData.type.split(','),
        purchasePrice: detailData.purchasePrice,
        salePrice: detailData.salePrice,
        remark: detailData.remark
      });
      setEditDrawerVisible(true);
    }
  };

  // 提交修改
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const requestData: ModifyDesignRequest = {
        id: selectedDesignId!,
        design: values.design,
        type: Array.isArray(values.type) ? values.type.join(',') : values.type,
        purchasePrice: values.purchasePrice?.toString() || '',
        salePrice: values.salePrice || '',
        remark: values.remark
      };

      const response = await api.design.modify(requestData);
      if (response.code === 200) {
        message.success(t('modifySuccess'));
        setEditDrawerVisible(false);
        fetchDesignDetail(selectedDesignId!);
      } else {
        message.error(response.msg || t('modifyFailed'));
      }
    } catch (error: any) {
      console.error('修改商品失败:', error);
      
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        notification.error({
          message: t('formValidationFailed'),
          description: firstError.errors[0] || t('pleaseCheckRequiredFields'),
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: t('modifyFailed'),
          description: error.message || t('modifyDesignFailedRetry'),
          placement: 'topRight',
        });
      }
    }
  };

  // 删除商品
  const handleDelete = () => {
    modal.confirm({
      title: t('confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      content: t('confirmDeleteDesign', { design: detailData?.design }),
      okText: t('confirmDelete'),
      okType: 'danger',
      cancelText: t('cancel'),
      onOk: async () => {
        try {
          const response = await api.design.delete([selectedDesignId!]);
          if (response.code === 200) {
            message.success(t('deleteSuccess'));
            handleBackToList();
          } else {
            message.error(response.msg || t('deleteFailed'));
          }
        } catch (error) {
          console.error('删除商品失败:', error);
          message.error(t('deleteDesignFailed'));
        }
      }
    });
  };

  // 点击搜索按钮处理
  const handleSearchClick = () => {
    setHasStockActive(false);
    setSearchQuery({
      design: designSearch,
      typeList: selectedTypes,
      hasStock: undefined
    });
  };

  // 有库存商品筛选
  const handleHasStockFilter = () => {
    const newHasStockActive = !hasStockActive;
    setHasStockActive(newHasStockActive);
    setSearchQuery({
      design: designSearch,
      typeList: selectedTypes,
      hasStock: newHasStockActive ? 1 : 0
    });
  };

  // 多选类型变化处理
  const handleTypeChange = (value: string[]) => {
    setSelectedTypes(value);
    setQuickSelectType(null);
  };

  // 快速选择类型变化处理
  const handleQuickSelectChange = (value: string) => {
    setQuickSelectType(value);
  };

  // 添加面料
  const addFabric = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    setNewFabric([...newFabric, fabric || `New item ${fabricIndex++}`]);
    setFabric('');
    setTimeout(() => {
      fabricInputRef.current?.focus();
    }, 0);
  };

  // 打开创建商品抽屉
  const handleOpenCreate = () => {
    createForm.resetFields();
    setImgCover([]);
    setCreateImgList([]);
    setNewFabric([...fabricList]);
    setCreateDrawerVisible(true);
  };

  // 提交创建商品
  const handleCreateSubmit = async () => {
    try {
      const itemForm: any = await createForm.validateFields();
      
      if (!imgCover.length) {
        notification.error({
          message: t('formValidationFailed'),
          description: t('pleaseUploadCoverImage'),
          placement: 'topRight',
        });
        return;
      }
      
      if (!createImgList.length) {
        notification.error({
          message: t('formValidationFailed'),
          description: t('pleaseUploadProductImages'),
          placement: 'topRight',
        });
        return;
      }
      
      const fabricStr = itemForm.fabricList?.reduce((total: any, current: any) => 
        total + current.fabric + (current.percent ? ': ' + current.percent + '%\n' : '\n'), ''
      );

      const { design, type, color, size } = itemForm;

      const coverFormData = new FormData();
      imgCover.forEach(img => {
        coverFormData.append('files', img.originFileObj as RcFile);
      });
      const uploadCoverResult = await api.file.upload(coverFormData);

      if (uploadCoverResult.code !== 200) {
        notification.error({
          message: t('uploadFailed'),
          description: t('coverImageUploadFailed'),
          placement: 'topRight',
        });
        return;
      }

      const imgFormData = new FormData();
      createImgList.forEach(img => {
        imgFormData.append('files', img.originFileObj as RcFile);
      });
      const uploadImgResult = await api.file.upload(imgFormData);

      if (uploadImgResult.code !== 200) {
        notification.error({
          message: t('uploadFailed'),
          description: t('productImagesUploadFailed'),
          placement: 'topRight',
        });
        return;
      }

      const createDesignData: CreateDesignRequest = {
        ...itemForm,
        type: type.join(','),
        fabric: fabricStr,
        photos: uploadImgResult.data,
        previewPhoto: uploadCoverResult.data
      };

      const designResult = await api.design.create(createDesignData);

      if (designResult.code === 200 && designResult.data) {
        const createItemData = {
          ...itemForm,
          designId: designResult.data.id,
          warehouseName: [WAREHOUSE.SLADY, WAREHOUSE.SL, WAREHOUSE.LIVE]
        };

        const itemResult = await api.item.create(createItemData);

        if (itemResult.code === 200) {
          message.success(t('createSuccess'));
          setCreateDrawerVisible(false);
          fetchDesignList(1, true);
        } else {
          notification.error({
            message: t('createFailed'),
            description: itemResult.msg || t('createItemFailed'),
            placement: 'topRight',
          });
        }
      } else {
        notification.error({
          message: '创建失败',
          description: designResult.msg || t('createDesignFailed'),
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      console.error('创建商品失败:', error);
      
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        notification.error({
          message: t('formValidationFailed'),
          description: firstError.errors[0] || t('pleaseCheckRequiredFields'),
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: '创建失败',
          description: error.message || t('createDesignFailedRetry'),
          placement: 'topRight',
        });
      }
    }
  };

  // 图片修改处理
  const handleImageModify = async (formData: FormData) => {
    const response = await api.file.modify(formData);
    if (response.code === 200) {
      if (selectedDesignId) {
        fetchDesignDetail(selectedDesignId);
      }
    } else {
      throw new Error(response.msg || t('modifyImageFailed'));
    }
  };

  // 渲染移动端商品卡片
  const renderMobileCard = (item: DesignItem) => (
    <Card size="small" className="shadow-sm">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {item.previewPhoto ? (
            <Image
              src={dev_url + item.previewPhoto}
              alt={item.design}
              width={80}
              height={80}
              className="rounded object-cover"
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">{t('noImage')}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-600 space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 truncate">
                {item.design}
              </h3>
              <div>{t('type')}: {item.type}</div>
              <div className="text-gray-400">{t('stock')}: {item.stock || 0}</div>
              {item.salePrice && (
                <div className="text-orange-600 font-semibold">
                  ${item.salePrice}
                </div>
              )}
            </div>

            <Button
              type="primary"
              onClick={() => toDetail(item)}
            >
              {t('viewDetails')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  // 根据当前视图渲染对应内容
  return (
    <>
      {/* 详情视图 */}
      <div style={{ display: currentView === 'detail' && selectedDesignId ? 'block' : 'none' }}>
        {selectedDesignId && (
          <DesignDetail
            detailData={detailData}
            detailLoading={detailLoading}
            onBackToList={handleBackToList}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewImages={handleViewImages}
            editDrawerVisible={editDrawerVisible}
            onEditDrawerClose={() => setEditDrawerVisible(false)}
            onEditSubmit={handleEditSubmit}
            editForm={form}
          />
        )}
      </div>

      {/* 图片浏览视图 */}
      <div style={{ display: currentView === 'images' ? 'block' : 'none' }}>
        {selectedDesignId && (
          <ImageGallery
            currentFolderPath={currentFolderPath}
            coverPath={coverPath}
            designId={selectedDesignId || 0}
            onBackToDetail={handleBackToDetail}
            onImageModify={handleImageModify}
          />
        )}
      </div>

      {/* 列表视图 */}
      <div style={{ display: currentView === 'list' ? 'block' : 'none' }}>
      <div className="p-3 md:p-6">
        {/* 搜索和筛选区域 */}
        <Card className="mb-4">
          {/* 桌面端布局 */}
          <div className="hidden md:block">
            <Row gutter={[10, 10]}>
              <Col xs={24} sm={12} md={8}>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('designCodeSearch')}
                  </label>
                  <Input
                    placeholder={t('designCode')}
                    value={designSearch}
                    onChange={(e) => setDesignSearch(e.target.value)}
                    onPressEnter={handleSearchClick}
                  />
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
                      onClick={handleSearchClick}
                    >
                      {t('search')}
                    </Button>
                    <Button 
                      type={hasStockActive ? "primary" : "default"}
                      onClick={handleHasStockFilter}
                    >
                      {t('inStock')}
                    </Button>
                    {canUseFeature('createDesign') && (
                      <Button 
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreate}
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
          </div>

          {/* 移动端布局 */}
          <div className="md:hidden space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={t('searchDesignCode')}
                prefix={<SearchOutlined />}
                value={designSearch}
                onChange={(e) => setDesignSearch(e.target.value)}
                onPressEnter={handleSearchClick}
                size="large"
                allowClear
              />
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearchClick}
              >
                {t('search')}
              </Button>
            </div>

            <Select
              mode="multiple"
              placeholder={t('selectDesignType')}
              value={selectedTypes}
              onChange={setSelectedTypes}
              size="large"
              allowClear
              style={{ width: '100%' }}
              options={typeList}
            />

            <Button
              block
              size="large"
              type={hasStockActive ? 'primary' : 'default'}
              onClick={handleHasStockFilter}
            >
              {hasStockActive ? '✓ ' : ''}{t('productsWithStock')}
            </Button>

            {canUseFeature('createDesign') && (
              <Button
                type="primary"
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={handleOpenCreate}
              >
                {t('addItem')}
              </Button>
            )}
          </div>
        </Card>

        {/* 商品列表 - 桌面端网格布局 */}
        <div className="hidden md:block">
          <div 
            style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              height: 800, 
              overflowY: "scroll",
              gap: '20px',
              padding:"10px",
            }} 
            onScroll={handleScroll} 
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
                    src={dev_url + item.previewPhoto}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('placeholder-image.jpg') && !img.src.includes('data:image')) {
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
                      onClick={() => toDetail(item)}
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

        {/* 商品列表 - 移动端卡片布局 */}
        <div className="md:hidden">
          {loading && displayData.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : displayData.length > 0 ? (
            <div 
              style={{ 
                height: '70vh', 
                overflowY: 'scroll',
                padding: '0 4px'
              }}
              onScroll={handleScroll}
              ref={scrollListRef}
            >
              <div className="space-y-3">
                {displayData.map((item, index) => (
                  <div key={`${item.id}-${index}`}>
                    {renderMobileCard(item)}
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-center py-4">
                    <Spin />
                  </div>
                )}
                
                {!hasMore && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    已加载全部数据
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              {t('noItems')}
            </div>
          )}
        </div>
      </div>

      {/* 创建商品抽屉 - 桌面端 */}
      {!isMobile && (
        <Drawer
          title={t('createDesign')}
          placement="right"
          width={600}
          onClose={() => setCreateDrawerVisible(false)}
          open={createDrawerVisible}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setCreateDrawerVisible(false)} style={{ marginRight: 8 }}>
              {t('cancel')}
            </Button>
            <Button type="primary" onClick={handleCreateSubmit}>
              {t('submit')}
            </Button>
          </div>
        }
      >
        <Form form={createForm} layout="vertical">
          <Form.Item 
            label={t('designCode')} 
            name="design" 
            rules={[
              { required: true, message: t('pleaseEnter') + t('designCode') },
              { whitespace: true, message: t('designCode') + t('cannotBeEmpty') }
            ]}
          >
            <Input placeholder={t('designCode')} />
          </Form.Item>

          <Form.Item 
            label={t('type')} 
            name="type" 
            rules={[
              { required: true, message: t('pleaseSelect') + t('type') },
              { type: 'array', min: 1, message: t('pleaseSelectAtLeastOne') + t('type') }
            ]}
          >
            <Select mode="multiple" placeholder={t('type')} options={typeList} />
          </Form.Item>

          <Form.Item 
            label={t('color')} 
            name="color" 
            rules={[
              { required: true, message: t('pleaseSelect') + t('color') },
              { type: 'array', min: 1, message: t('pleaseSelectAtLeastOne') + t('color') }
            ]}
          >
            <ColorSelect 
              mode="multiple" 
              placeholder={t('color')} 
            />
          </Form.Item>

          <Form.Item 
            label={t('size')} 
            name="size" 
            rules={[
              { required: true, message: t('pleaseSelect') + t('size') },
              { type: 'array', min: 1, message: t('pleaseSelectAtLeastOne') + t('size') }
            ]}
          >
            <Select mode="multiple" placeholder={t('size')} options={sizeList.map(s => ({ label: s, value: s }))} />
          </Form.Item>

          <Form.List name="fabricList">
            {(fields, { add, remove }) => (
              <>
                <Form.Item>
                  {t('fabric')}：
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    {t('addFabric')}
                  </Button>
                </Form.Item>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'fabric']}
                      rules={[{ required: true, message: t('pleaseSelectFabric') }]}
                    >
                      <Select
                        style={{ width: 300 }}
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Space style={{ padding: '0 8px 4px' }}>
                              <Input
                                placeholder={t('fabric')}
                                ref={fabricInputRef}
                                value={fabric}
                                onChange={(e) => setFabric(e.target.value)}
                              />
                              <Button type="text" icon={<PlusOutlined />} onClick={addFabric}>
                                {t('addFabric')}
                              </Button>
                            </Space>
                          </>
                        )}
                        options={newFabric.map((item) => ({ label: item, value: item }))}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'percent']}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <InputNumber placeholder={t('percentage')} min={0} />%
                      </div>
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  </Space>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item 
            label={t('purchasePrice')} 
            name="purchasePrice" 
            rules={[
              { required: true, message: t('pleaseEnter') + t('purchasePrice') },
            ]}
          >
            <Input placeholder={t('purchasePrice')} style={{ width: '100%' }}  />
          </Form.Item>

          <Form.Item 
            label={t('salePrice')} 
            name="salePrice" 
            rules={[
              { required: true, message: t('pleaseEnter') + t('salePrice') },
              { type: 'number', min: 0, message: t('salePrice') + t('mustBeGreaterThanOrEqualToZero') }
            ]}
          >
            <InputNumber placeholder={t('salePrice')} style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Form.Item label={t('remark')} name="remark">
            <Input.TextArea placeholder={t('remark')} rows={3} />
          </Form.Item>

          <div style={{ display: 'flex', marginBottom: 16 }}>
            {t('coverImage')}：
            <ImageUpload changePic={setImgCover} maxCount={1} value={imgCover} />
          </div>

          <div style={{ display: 'flex' }}>
            {t('productImages')}：
            <ImageUpload changePic={setCreateImgList} value={createImgList} />
          </div>
        </Form>
      </Drawer>
      )}

      {/* 移动端创建商品抽屉 */}
      {isMobile && (
        <Drawer
          title={t('addItem')}
          placement="bottom"
          height="90%"
          onClose={() => setCreateDrawerVisible(false)}
          open={createDrawerVisible}
        footer={
          <div className="flex gap-4">
            <Button block size="large" onClick={() => setCreateDrawerVisible(false)}>
              {t('cancel')}
            </Button>
            <Button type="primary" block size="large" onClick={handleCreateSubmit}>
              {t('confirm')}
            </Button>
          </div>
        }
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="design"
            label={t('designCode')}
            rules={[{ required: true, message: t('pleaseEnterDesignCode') }]}
          >
            <Input size="large" placeholder={t('pleaseEnterDesignCode')} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('designType')}
            rules={[
              { required: true, message: t('pleaseSelectDesignType') },
              { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneType') }
            ]}
          >
            <Select size="large" placeholder={t('pleaseSelectDesignType')} mode="multiple" options={typeList} />
          </Form.Item>

          <Form.Item
            name="color"
            label={t('color')}
            rules={[
              { required: true, message: t('pleaseSelectColor') },
              { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneColor') }
            ]}
          >
            <ColorSelect mode="multiple" size="large" placeholder={t('pleaseSelectColor')} />
          </Form.Item>

          <Form.Item
            name="size"
            label={t('size')}
            rules={[
              { required: true, message: t('pleaseSelectSize') },
              { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneSize') }
            ]}
          >
            <Select
              mode="multiple"
              size="large"
              placeholder={t('pleaseSelectSize')}
              options={sizeList.map(size => ({ value: size, label: size }))}
            />
          </Form.Item>

          <Form.List name="fabricList">
            {(fields, { add, remove }) => (
              <>
                <Form.Item label={t('fabric')}>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    {t('addFabric')}
                  </Button>
                </Form.Item>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'fabric']}
                      rules={[{ required: true, message: t('pleaseSelectFabric') }]}
                    >
                      <Select
                        style={{ width: 150 }}
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Space style={{ padding: '0 8px 4px' }}>
                              <Input
                                placeholder={t('fabric')}
                                value={fabric}
                                onChange={(e) => setFabric(e.target.value)}
                              />
                              <Button type="text" icon={<PlusOutlined />} onClick={addFabric}>
                                {t('add')}
                              </Button>
                            </Space>
                          </>
                        )}
                        options={newFabric.map(f => ({ label: f, value: f }))}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'percent']}>
                      <InputNumber placeholder="%" min={0} max={100} style={{ width: 80 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  </Space>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item
            name="purchasePrice"
            label={t('purchasePrice')}
            rules={[{ required: true, message: t('pleaseEnterPurchasePrice') }]}
          >
            <Input size="large" placeholder={t('purchasePrice')} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="salePrice"
            label={t('salePrice')}
            rules={[
              { required: true, message: t('pleaseEnterSalePrice') },
              { type: 'number', min: 0, message: t('salePriceMustBePositive') }
            ]}
          >
            <InputNumber size="large" style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>

          <Form.Item name="remark" label={t('remark')}>
            <Input.TextArea size="large" placeholder={t('pleaseEnterRemark')} rows={3} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div className="mb-2 text-sm font-medium">{t('coverImage')}：</div>
            <Upload
              listType="picture-card"
              fileList={imgCover}
              onChange={({ fileList }) => setImgCover(fileList)}
              beforeUpload={() => false}
            >
              {imgCover.length >= 1 ? null : <div><UploadOutlined /><div>{t('uploadCover')}</div></div>}
            </Upload>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">{t('productImages')}：</div>
            <Upload
              listType="picture-card"
              fileList={createImgList}
              onChange={({ fileList }) => setCreateImgList(fileList)}
              beforeUpload={() => false}
              multiple
            >
              {createImgList.length >= 10 ? null : <div><UploadOutlined /><div>{t('uploadImages')}</div></div>}
            </Upload>
          </div>
        </Form>
      </Drawer>
      )}
      </div>
    </>
  );
}
