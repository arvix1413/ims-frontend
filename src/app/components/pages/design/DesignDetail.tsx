'use client';

import React, { useState, useEffect } from 'react';
import { Button, Descriptions, Tag, Drawer, Form, InputNumber, Select, message, Input, Spin, Card, Image, Tabs } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DesignDetail as DesignDetailType, typeList, ItemData, CreateItemRequest, CreateOrderRequest, WAREHOUSE } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import { useIsMobile } from '@/lib/useIsMobile';
import { item, order } from '@/lib/api';
import { API_CONFIG } from '@/config/constants';
import ItemTable from './ItemTable';
import ColorSelect from '../../ColorSelect';
import OrderForm from '@/app/components/shared/OrderForm';
import { sizeList } from '@/lib/types';

interface DesignDetailProps {
  detailData: DesignDetailType | null;
  detailLoading: boolean;
  onBackToList: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewImages: (images: string, coverPath: string) => void;
  editDrawerVisible: boolean;
  onEditDrawerClose: () => void;
  onEditSubmit: () => void;
  editForm: any;
  hideEditDelete?: boolean; // 是否隐藏编辑删除按钮（进货订单详情页不需要）
}

export default function DesignDetail({
  detailData,
  detailLoading,
  onBackToList,
  onEdit,
  onDelete,
  onViewImages,
  editDrawerVisible,
  onEditDrawerClose,
  onEditSubmit,
  editForm,
  hideEditDelete = false
}: DesignDetailProps) {
  const { t } = useTranslation();
  const { isSaler, isAdmin, canUseFeature, userInfo } = usePermissions();
  const isMobile = useIsMobile();
  
  // 库存相关状态
  const [itemsLoading, setItemsLoading] = useState(false);
  const [sl2Items, setSl2Items] = useState<ItemData[]>([]);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [createForm] = Form.useForm();

  // 移动端库存操作相关状态
  const [stockDrawerVisible, setStockDrawerVisible] = useState(false);
  const [stockForm] = Form.useForm();
  const [currentItem, setCurrentItem] = useState<ItemData | null>(null);
  const [orderDrawerVisible, setOrderDrawerVisible] = useState(false);
  const [orderForm] = Form.useForm();
  const [orderType, setOrderType] = useState<'store' | 'customer'>('store');
  const [deleteItemDrawerVisible, setDeleteItemDrawerVisible] = useState(false);
  const [deleteItemData, setDeleteItemData] = useState<ItemData | null>(null);
  
  const warehouseOptions = [
    { label: WAREHOUSE.SL, value: WAREHOUSE.SL },
  ];

  // 获取库存数据
  const fetchItems = async (designId: number) => {
    if (!designId) return;
    
    setItemsLoading(true);
    try {
      const searchPage = { desc: 1, page: 1, pageSize: 99, sort: '' };
      
      // 查詢所有倉庫的庫存（現在只有 SL二店）
      const sl2Response = await item.getList({ designId, searchPage });

      if (sl2Response.code === 200) {
        setSl2Items(sl2Response.data);
      }
    } catch (error) {
      console.error('获取库存数据失败:', error);
      message.error(t('fetchStockDataFailed'));
    } finally {
      setItemsLoading(false);
    }
  };

  // 当详情数据变化时获取库存数据
  useEffect(() => {
    if (detailData?.id) {
      fetchItems(detailData.id);
    }
  }, [detailData?.id]);

  // 刷新库存数据
  const handleRefreshItems = () => {
    if (detailData?.id) {
      fetchItems(detailData.id);
    }
  };

  // 处理创建Item
  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      if (!detailData?.id) {
        message.error(t('productNotFound'));
        return;
      }
      
      const createData: CreateItemRequest = {
        designId: detailData.id,
        warehouseName: values.warehouseName,
        color: values.color,
        size: values.size,
        inStoreStock: values.stock,
      };
      
      await item.create(createData);
      message.success(t('addItemSuccess'));
      setCreateDrawerVisible(false);
      createForm.resetFields();
      handleRefreshItems();
    } catch (error) {
      console.error('新增商品失败:', error);
      message.error(t('addItemFailedRetry'));
    }
  };

  // 移动端库存操作
  const handleModifyStock = (itemData: ItemData) => {
    setCurrentItem(itemData);
    stockForm.setFieldsValue({
      inStoreStock: itemData.inStoreStock ?? 0,
      tempStoreStock: itemData.tempStoreStock ?? 0,
    });
    setStockDrawerVisible(true);
  };

  const handleStockSubmit = async () => {
    try {
      const values = await stockForm.validateFields();
      if (currentItem) {
        await item.modifyWarehouseStock(
          currentItem.id,
          values.inStoreStock ?? 0,
          values.tempStoreStock ?? 0
        );
        message.success(t('stockModifySuccess'));
        setStockDrawerVisible(false);
        handleRefreshItems();
      }
    } catch (error) {
      console.error('修改库存失败:', error);
      message.error(t('stockModifyFailed'));
    }
  };

  const handleOrder = (itemData: ItemData, type: 'store' | 'customer') => {
    setCurrentItem(itemData);
    setOrderType(type);
    orderForm.resetFields();
    if (type === 'store') {
      orderForm.setFieldsValue({ remark: t('storeAdjustment') });
    }
    setOrderDrawerVisible(true);
  };

  const handleOrderSubmit = async () => {
    try {
      const values = await orderForm.validateFields();
      if (currentItem) {
        const orderData: CreateOrderRequest = {
          itemId: currentItem.id,
          amount: values.amount,
          type: orderType === 'store' ? 0 : 1, // 0 店补， 1 客定
          remark: values.remark || '',
          paymentStatus: -1,
          status: '0',
          customerContact: values.customerContact || '',
          paymentFlag: values.paymentFlag || 'UNPAID',
          orderedBy: values.orderedBy || '',
          statusChangeUserId: userInfo?.id || 0,
          statusChangeUserName: userInfo?.name || t('unknown'),
          statusChangeTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        
        await order.create(orderData);
        message.success(orderType === 'store' ? t('storeAdjustmentSuccess') : t('customerOrderSuccess'));
        setOrderDrawerVisible(false);
        handleRefreshItems();
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      message.error(t('createOrderFailed'));
    }
  };

  const handleDeleteItem = (itemData: ItemData) => {
    setDeleteItemData(itemData);
    setDeleteItemDrawerVisible(true);
  };

  const handleConfirmDeleteItem = async () => {
    if (!deleteItemData) return;
    try {
      await item.delete(deleteItemData.id);
      message.success(t('deleteSuccess'));
      setDeleteItemDrawerVisible(false);
      setDeleteItemData(null);
      handleRefreshItems();
    } catch (error) {
      console.error('删除失败:', error);
      message.error(t('deleteFailedRetry'));
    }
  };

  // 渲染移动端库存卡片
  const renderMobileItemCard = (itemData: ItemData) => (
    <Card size="small" className="mb-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium">{itemData.color}</div>
            <div className="text-xs text-gray-500">{t('size')}: {itemData.size}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${itemData.inStoreStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {t('stock')}: {itemData.inStoreStock}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {canUseFeature('modifyStock') && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleModifyStock(itemData)}
              className="flex-1"
              style={{ minHeight: '32px' }}
            >
              {t('modifyStock')}
            </Button>
          )}
          <Button
            size="small"
            onClick={() => handleOrder(itemData, 'store')}
            className="flex-1"
            style={{ minHeight: '32px' }}
          >
            {t('storeAdjustment')}
          </Button>
          <Button
            size="small"
            onClick={() => handleOrder(itemData, 'customer')}
            className="flex-1"
            style={{ minHeight: '32px' }}
          >
            {t('customerOrder')}
          </Button>
          {canUseFeature('deleteItem') && (
            <Button
              size="small"
              danger
              onClick={() => handleDeleteItem(itemData)}
              className="flex-1"
              style={{ minHeight: '32px' }}
            >
              {t('delete')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (detailLoading && !detailData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="p-4 md:p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={onBackToList} className="mb-4">
          {t('backToList')}
        </Button>
        <div className="text-center text-gray-500">{t('designNotExist')}</div>
      </div>
    );
  }

  return (
    <>
      {/* 桌面端布局 */}
      <div className="hidden md:block p-6">
        <div style={{ marginBottom: 24, display: 'flex', gap: '12px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBackToList} 
            size="large"
          >
            {t('backToList')}
          </Button>

          {!isSaler() && !hideEditDelete && (
            <div>
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={onEdit}
                size="large"
                style={{marginRight:10}}
              >
                {t('edit')}
              </Button>
              
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={onDelete}
                size="large"
              >
                {t('deleteDesign')}
              </Button>
            </div>
          )}
        </div>

        {/* 商品详情 */}
        <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '40px', maxHeight: '400px' }}>
            <div style={{ flexShrink: 0 }}>
              <img 
                src={API_CONFIG.BASE_URL + detailData.previewPhoto}
                alt={detailData.design}
                style={{ 
                  width: 200, 
                  height: 200, 
                  objectFit: 'cover',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => onViewImages(detailData.photos, detailData.previewPhoto)}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes('data:image')) {
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
                  }
                }}
              />
            </div>

            <div style={{ flex: 1, maxWidth: '600px', overflowY: 'auto' }}>
              <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                {detailData.design}
              </h1>

              <Descriptions 
                column={2} 
                labelStyle={{ fontWeight: 600, width: 100 }}
                size="small"
              >
                <Descriptions.Item label={t('designId')}>
                  {detailData.id}
                </Descriptions.Item>
                
                <Descriptions.Item label={t('type')}>
                  {detailData.type.split(',').map((type, index) => (
                    <Tag color="blue" key={index} style={{ marginRight: 4, marginBottom: 4 }}>
                      {typeList.find(t => t.value === type.trim())?.label || type}
                    </Tag>
                  ))}
                </Descriptions.Item>

                <Descriptions.Item label={t('salePrice')}>
                  <span style={{ fontSize: 20, color: '#fa9829', fontWeight: 'bold' }}>
                    ${detailData.salePrice}
                  </span>
                </Descriptions.Item>

                {isAdmin() && (
                  <Descriptions.Item label={t('purchasePrice')}>
                    <span style={{ fontSize: 16, color: '#666' }}>
                      ${detailData.purchasePrice}
                    </span>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label={t('inStoreStock')}>
                  <span style={{ fontSize: 15, color: sl2Items.reduce((s, i) => s + (i.inStoreStock || 0), 0) > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                    {sl2Items.reduce((s, i) => s + (i.inStoreStock || 0), 0)}
                  </span>
                </Descriptions.Item>

                <Descriptions.Item label={t('tempStoreStock')}>
                  <span style={{ fontSize: 15, color: sl2Items.reduce((s, i) => s + (i.tempStoreStock || 0), 0) > 0 ? '#1890ff' : '#aaa', fontWeight: 'bold' }}>
                    {sl2Items.reduce((s, i) => s + (i.tempStoreStock || 0), 0)}
                  </span>
                </Descriptions.Item>

                <Descriptions.Item label={t('hot')}>
                  {detailData.hot || 0}
                </Descriptions.Item>

                <Descriptions.Item label={t('fabric')}>
                  {detailData.fabric}
                </Descriptions.Item>

                <Descriptions.Item label={t('color')}>
                  <div style={{ maxWidth: '200px' }}>
                    {detailData.color.map((color, index) => (
                      <Tag key={index} style={{ marginRight: 4, marginBottom: 4 }}>
                        {color}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label={t('size')}>
                  <div style={{ maxWidth: '200px' }}>
                    {detailData.size.map((size, index) => (
                      <Tag key={index} style={{ marginRight: 4, marginBottom: 4 }}>
                        {size}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label={t('createTime')}>
                  {detailData.createDate}
                </Descriptions.Item>

                <Descriptions.Item label={t('remark')}>
                  {detailData.remark}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </div>

        {/* 库存管理 - 桌面端 */}
        <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t('stockManagement')}</h3>
            {canUseFeature('createItem') && (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => {
                  createForm.resetFields();
                  setCreateDrawerVisible(true);
                }}
              >
                {t('addItem')}
              </Button>
            )}
          </div>
          <Spin spinning={itemsLoading}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#333' }}>SL二店</h4>
                <ItemTable
                  data={sl2Items}
                  loading={itemsLoading}
                  warehouseName="SL二店"
                  designId={detailData?.id || 0}
                  onRefresh={handleRefreshItems}
                />
              </div>
            </div>
          </Spin>
        </div>
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden p-4 pb-20">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={onBackToList} 
          className="mb-4"
          block
        >
          {t('backToList')}
        </Button>

        {!isSaler() && !hideEditDelete && (
          <div className="flex gap-3 mb-4">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={onEdit}
              className="flex-1"
            >
              {t('edit')}
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={onDelete}
              className="flex-1"
              style={{ minHeight: '40px' }}
            >
              {t('delete')}
            </Button>
          </div>
        )}

        {/* 商品详情卡片 */}
        <Card className="mb-4">
          <div className="space-y-4">
            <div className="text-center">
              <Image
                src={API_CONFIG.BASE_URL + detailData.previewPhoto}
                alt={detailData.design}
                width={200}
                height={200}
                className="rounded-lg shadow-md mx-auto"
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                onClick={() => onViewImages(detailData.photos, detailData.previewPhoto)}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                  {detailData.design}
                </h1>
                <div className="text-sm text-gray-500">ID: {detailData.id}</div>
              </div>

              <div className="border-t border-gray-200 my-3"></div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('type')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {detailData.type.split(',').map((type, index) => (
                      <Tag color="blue" key={index}>
                        {typeList.find(t => t.value === type.trim())?.label || type}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('salePrice')}:</span>
                  <span className="text-orange-600 font-bold text-lg">
                    ${detailData.salePrice}
                  </span>
                </div>

                {isAdmin() && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('purchasePrice')}:</span>
                    <span className="text-gray-800 font-medium">
                      ${detailData.purchasePrice}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('inStoreStock')}:</span>
                  <span className={`font-bold ${sl2Items.reduce((s, i) => s + (i.inStoreStock || 0), 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {sl2Items.reduce((s, i) => s + (i.inStoreStock || 0), 0)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('tempStoreStock')}:</span>
                  <span className={`font-bold ${sl2Items.reduce((s, i) => s + (i.tempStoreStock || 0), 0) > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {sl2Items.reduce((s, i) => s + (i.tempStoreStock || 0), 0)}
                  </span>
                </div>



                <div className="flex justify-between">
                  <span className="text-gray-600">{t('hotness')}:</span>
                  <span className="text-gray-800">{detailData.hot || 0}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('fabric')}:</span>
                  <span className="text-gray-800">{detailData.fabric}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('color')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {detailData.color.map((color, index) => (
                      <Tag key={index}>{color}</Tag>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('size')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {detailData.size.map((size, index) => (
                      <Tag key={index}>{size}</Tag>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{t('createTime')}:</span>
                  <span className="text-gray-800">{detailData.createDate}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 库存管理 - 移动端 */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('stockManagement')}</h3>
            {canUseFeature('createItem') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  createForm.resetFields();
                  setCreateDrawerVisible(true);
                }}
                size="small"
              >
                {t('add')}
              </Button>
            )}
          </div>
          
          <Spin spinning={itemsLoading}>
            <Tabs
              defaultActiveKey="sl2"
              items={[
                {
                  key: 'sl2',
                  label: 'SL二店',
                  children: (
                    <div className="space-y-2">
                      {sl2Items.length > 0 ? (
                        sl2Items.map((itemData, index) => (
                          <div key={index}>
                            {renderMobileItemCard(itemData)}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">{t('noStockData')}</div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Spin>
        </Card>
      </div>

      {/* 编辑抽屉 - 桌面端 */}
      {!isMobile && (
        <Drawer
          title={t('editDesign')}
          placement="right"
          width={500}
          onClose={onEditDrawerClose}
          open={editDrawerVisible}
          footer={
            <div style={{ textAlign: 'right' }}>
              <Button onClick={onEditDrawerClose} style={{ marginRight: 8 }}>
                {t('cancel')}
              </Button>
              <Button type="primary" onClick={onEditSubmit}>
                {t('confirm')}
              </Button>
            </div>
          }
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              label={t('designCode')}
              name="design"
              rules={[
                { required: true, message: t('pleaseEnterDesignCode') },
                { whitespace: true, message: t('designCodeCannotBeEmpty') }
              ]}
            >
              <Input placeholder={t('designCode')} />
            </Form.Item>

            <Form.Item
              label={t('type')}
              name="type"
              rules={[
                { required: true, message: t('pleaseSelectDesignType') },
                { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneType') }
              ]}
            >
              <Select
                mode="multiple"
                placeholder={t('type')}
                options={typeList}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label={t('purchasePrice')}
              name="purchasePrice"
              rules={[{ required: true, message: t('pleaseEnterPurchasePrice') }]}
            >
              <Input placeholder={t('purchasePrice')} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label={t('salePrice')}
              name="salePrice"
              rules={[{ required: true, message: t('pleaseEnterSalePrice') }]}
            >
              <Input placeholder={t('salePrice')} />
            </Form.Item>

            <Form.Item label={t('remark')} name="remark">
              <Input.TextArea placeholder={t('remark')} rows={4} />
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 编辑抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={t('editItem')}
          placement="bottom"
          height="90%"
          onClose={onEditDrawerClose}
          open={editDrawerVisible}
          footer={
            <div className="flex gap-3">
              <Button block onClick={onEditDrawerClose}>
                {t('cancel')}
              </Button>
              <Button type="primary" block onClick={onEditSubmit}>
                {t('confirm')}
              </Button>
            </div>
          }
        >
          <Form form={editForm} layout="vertical">
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
              <Select placeholder={t('pleaseSelectDesignType')} mode="multiple" size="large" options={typeList} />
            </Form.Item>

            <Form.Item
              name="purchasePrice"
              label={t('purchasePrice')}
              rules={[{ required: true, message: t('pleaseEnterPurchasePrice') }]}
            >
              <InputNumber size="large" style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>

            <Form.Item
              name="salePrice"
              label={t('salePrice')}
              rules={[{ required: true, message: t('pleaseEnterSalePrice') }]}
            >
              <InputNumber size="large" style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>

            <Form.Item name="remark" label={t('remark')}>
              <Input.TextArea size="large" placeholder={t('pleaseEnterRemark')} rows={3} />
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 创建Item抽屉 - 桌面端 */}
      {!isMobile && (
        <Drawer
          title={t('addItem')}
          open={createDrawerVisible}
          onClose={() => {
            setCreateDrawerVisible(false);
            createForm.resetFields();
          }}
          width={500}
          maskClosable={true}
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
            <Form.Item
              label={t('warehouse')}
              name="warehouseName"
              rules={[
                { required: true, message: t('pleaseSelectWarehouse') },
                { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneWarehouse') }
              ]}
            >
              <Select mode="multiple" placeholder={t('warehouse')} options={warehouseOptions} />
            </Form.Item>
            
            <Form.Item
              label={t('color')}
              name="color"
              rules={[
                { required: true, message: t('pleaseSelectColor') },
                { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneColor') }
              ]}
            >
              <ColorSelect mode="multiple" placeholder={t('color')} />
            </Form.Item>
            
            <Form.Item
              label={t('size')}
              name="size"
              rules={[
                { required: true, message: t('pleaseSelectSize') },
                { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneSize') }
              ]}
            >
              <Select
                mode="multiple"
                placeholder={t('size')}
                options={sizeList.map(size => ({ label: size, value: size }))}
              />
            </Form.Item>
            
            <Form.Item
              label={t('stockQuantity')}
              name="stock"
              rules={[
                { required: true, message: t('pleaseEnterStockQuantity') },
                { type: 'number', min: 0, message: t('stockQuantityMustBePositive') }
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={0} placeholder={t('stockQuantity')} />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {t('confirmAdd')}
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 创建Item抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={t('addItem')}
          placement="bottom"
          height="80%"
          onClose={() => {
            setCreateDrawerVisible(false);
            createForm.resetFields();
          }}
          open={createDrawerVisible}
          footer={
            <div className="flex gap-3">
              <Button block onClick={() => setCreateDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block onClick={handleCreateSubmit}>
                {t('confirm')}
              </Button>
            </div>
          }
        >
          <Form form={createForm} layout="vertical">
            <Form.Item
              name="warehouseName"
              label={t('warehouse')}
              rules={[
                { required: true, message: t('pleaseSelectWarehouse') },
                { type: 'array', min: 1, message: t('pleaseSelectAtLeastOneWarehouse') }
              ]}
            >
              <Select
                mode="multiple"
                size="large"
                placeholder={t('pleaseSelectWarehouse')}
                options={warehouseOptions}
              />
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

            <Form.Item
              name="stock"
              label={t('stockQuantity')}
              rules={[
                { required: true, message: t('pleaseEnterStockQuantity') },
                { type: 'number', min: 0, message: t('stockQuantityMustBePositive') }
              ]}
            >
              <InputNumber size="large" style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Form>
        </Drawer>
      )}

      {/* 修改库存抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={t('modifyStock')}
          placement="bottom"
          height="55%"
          onClose={() => setStockDrawerVisible(false)}
          open={stockDrawerVisible}
          footer={
            <div className="flex gap-3">
              <Button block onClick={() => setStockDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block onClick={handleStockSubmit}>
                {t('confirm')}
              </Button>
            </div>
          }
        >
          <Form form={stockForm} layout="vertical">
            <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
              {currentItem?.color} / {currentItem?.size}
            </div>
            <Form.Item name="inStoreStock" label={t('inStoreStock')} rules={[{ type: 'number', min: 0, message: t('cannotBeLessThanZero') }]}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>
            <Form.Item name="tempStoreStock" label={t('tempStoreStock')} rules={[{ type: 'number', min: 0, message: t('cannotBeLessThanZero') }]}>
              <InputNumber size="large" style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>

          </Form>
        </Drawer>
      )}

      {/* 订单抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={orderType === 'store' ? t('storeAdjustment') : t('customerOrder')}
          placement="bottom"
          height="60%"
          onClose={() => setOrderDrawerVisible(false)}
          open={orderDrawerVisible}
          footer={
            <div className="flex gap-3">
              <Button block onClick={() => setOrderDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" block onClick={handleOrderSubmit}>
                {t('confirm')}
              </Button>
            </div>
          }
        >
          <Form form={orderForm} layout="vertical">
            <OrderForm size="large" />
          </Form>
        </Drawer>
      )}

      {/* 删除库存确认抽屉 - 移动端 */}
      {isMobile && (
        <Drawer
          title={t('confirmDelete')}
          placement="bottom"
          height="40%"
          onClose={() => setDeleteItemDrawerVisible(false)}
          open={deleteItemDrawerVisible}
          footer={
            <div className="flex gap-3">
              <Button block onClick={() => setDeleteItemDrawerVisible(false)}>
                {t('cancel')}
              </Button>
              <Button type="primary" danger block onClick={handleConfirmDeleteItem}>
                {t('confirmDelete')}
              </Button>
            </div>
          }
        >
          <div className="text-center py-8">
            <DeleteOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <h3 className="text-lg font-semibold mb-2">{t('confirmDeleteStock')}</h3>
            <p className="text-gray-600 mb-4">
              {t('confirmDeleteStockMessage')} <strong>{deleteItemData?.color} {deleteItemData?.size}</strong> {t('stockQuestionMark')}
            </p>
            <p className="text-sm text-gray-500">
              {t('deleteCannotBeUndone')}
            </p>
          </div>
        </Drawer>
      )}
    </>
  );
}
