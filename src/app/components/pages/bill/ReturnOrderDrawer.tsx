'use client';

import React, { useState, useRef } from 'react';
import { Drawer, Button, Form, AutoComplete, Select, InputNumber, Input, notification } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { item as itemApi, designService } from '@/lib/api';
import { STAFF_LIST } from '@/config/constants';

interface ReturnOrderDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnOrderDrawer({ visible, onClose, onSuccess }: ReturnOrderDrawerProps) {
  const { t } = useTranslation();
  const [returnForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rowCache, setRowCache] = useState<Record<number, { codeOptions: any[]; warehouseItems: any[] }>>({});
  const codeTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const handleCodeSearch = (name: number, val: string) => {
    if (codeTimers.current[name]) clearTimeout(codeTimers.current[name]);
    if (!val) {
      setRowCache(prev => ({ 
        ...prev, 
        [name]: { 
          codeOptions: [],
          warehouseItems: prev[name]?.warehouseItems ?? []
        } 
      }));
      return;
    }
    codeTimers.current[name] = setTimeout(async () => {
      try {
        const res = await designService.getList({ 
          design: val, 
          typeList: [], 
          searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' } 
        });
        
        // Validate response structure
        if (!res) {
          console.warn('API response is null or undefined');
          return;
        }
        
        // Check if API returned success code
        if (res.code !== 200) {
          console.warn('API returned non-200 code:', res.code, res.msg);
          return;
        }
        
        // Extract content array from response
        let content: any[] = [];
        if (res.data) {
          if (Array.isArray(res.data)) {
            content = res.data;
          } else if (res.data.content && Array.isArray(res.data.content)) {
            content = res.data.content;
          }
        }
        
        setRowCache(prev => ({ 
          ...prev, 
          [name]: { 
            codeOptions: content,
            warehouseItems: prev[name]?.warehouseItems ?? []
          } 
        }));
      } catch (err) {
        console.error('Failed to search design code:', err);
        // Don't throw error, just log it to prevent page crash
      }
    }, 350);
  };

  const handleCodeSelect = async (name: number, val: string, option: any) => {
    try {
      if (!option || !option.designId) {
        console.error('Invalid option selected:', option);
        return;
      }
      
      const res = await itemApi.getList({ 
        designId: option.designId, 
        warehouseName: 'SL二店', 
        searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } 
      });
      
      const items = Array.isArray(res?.data) ? res.data : res?.data?.content ?? [];
      const firstColor = items[0]?.color ?? '';
      const firstSize = items.find((i: any) => i?.color === firstColor)?.size ?? '';
      const firstItemId = items.find((i: any) => i?.color === firstColor && i?.size === firstSize)?.id ?? null;
      
      setRowCache(prev => ({ 
        ...prev, 
        [name]: { 
          codeOptions: prev[name]?.codeOptions ?? [], 
          warehouseItems: items 
        } 
      }));
      
      const curItems = returnForm.getFieldValue('items') || [];
      curItems[name] = { 
        ...curItems[name], 
        code: val, 
        price: parseFloat(option.salePrice ?? 0), 
        color: firstColor, 
        size: firstSize, 
        itemId: firstItemId 
      };
      returnForm.setFieldsValue({ items: [...curItems] });
    } catch (err) {
      console.error('Failed to select design code:', err);
      notification.error({ message: t('fetchStockFailed') });
    }
  };

  const handleColorChange = (name: number, val: string) => {
    const warehouseItems = rowCache[name]?.warehouseItems ?? [];
    const firstSize = warehouseItems.find((i: any) => i?.color === val)?.size ?? '';
    const firstItemId = warehouseItems.find((i: any) => i?.color === val && i?.size === firstSize)?.id ?? null;
    const curItems = returnForm.getFieldValue('items') || [];
    curItems[name] = { ...curItems[name], color: val, size: firstSize, itemId: firstItemId };
    returnForm.setFieldsValue({ items: [...curItems] });
  };

  const handleSizeChange = (name: number, val: string) => {
    const warehouseItems = rowCache[name]?.warehouseItems ?? [];
    const cur = (returnForm.getFieldValue('items') || [])[name] || {};
    const itemId = warehouseItems.find((i: any) => i?.color === cur.color && i?.size === val)?.id ?? null;
    const curItems = returnForm.getFieldValue('items') || [];
    curItems[name] = { ...curItems[name], size: val, itemId };
    returnForm.setFieldsValue({ items: [...curItems] });
  };

  const handleSubmit = async () => {
    try {
      const values = await returnForm.validateFields();
      setLoading(true);
      for (const it of (values.items || [])) {
        if (!it || !it.itemId) { 
          if (it?.code) {
            notification.warning({ message: t('itemNoStockRecord', { code: it.code }) }); 
          }
          continue; 
        }
        try {
          const allItems = Object.values(rowCache || {})
            .filter(c => c && Array.isArray(c.warehouseItems))
            .flatMap(c => c.warehouseItems || []);
          const found = allItems.find((i: any) => i?.id === it.itemId);
          const currentStock = found?.inStoreStock ?? 0;
          const newStock = currentStock + (it.qty ?? 1);
          await itemApi.modifyStock(it.itemId, newStock);
        } catch (err) {
          console.error('退货库存增加失败 itemId:', it.itemId, err);
          // stock update failed, continue with other items
        }
      }
      notification.success({ message: t('returnOrderSuccess') });
      returnForm.resetFields();
      setRowCache({});
      onClose();
      onSuccess();
    } catch (err: any) {
      if (!err?.errorFields) {
        console.error('退货订单失败:', err);
        notification.error({ message: t('returnOrderFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer 
      title={t('returnOrder')} 
      open={visible} 
      onClose={onClose} 
      width={900} 
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>{t('cancel')}</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>{t('confirm')}</Button>
        </div>
      }
    >
      <Form form={returnForm} layout="vertical">
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              <Form.Item>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>{t('addProduct')}</Button>
              </Form.Item>
              {fields.map(({ key, name, ...restField }) => {
                const cache = rowCache[name] || { codeOptions: [], warehouseItems: [] };
                const cur = (returnForm.getFieldValue('items') || [])[name] || {};
                const colorOptions = [...new Set((cache.warehouseItems || []).map((i: any) => i?.color).filter(Boolean))];
                const sizeOptions = [...new Set((cache.warehouseItems || []).filter((i: any) => !cur.color || i?.color === cur.color).map((i: any) => i?.size).filter(Boolean))];
                return (
                  <div key={key} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <Form.Item {...restField} name={[name, 'code']} label={t('designCode')} rules={[{ required: true, message: t('pleaseEnterDesignCode') }]}>
                      <AutoComplete
                        style={{ width: 180 }}
                        placeholder={t('pleaseEnterDesignCode')}
                        options={(cache.codeOptions || []).filter(d => d && d.design).map((d: any) => ({ 
                          value: d.design, 
                          label: `${d.design}  $${d.salePrice ?? 0}`, 
                          designId: d.id, 
                          salePrice: d.salePrice 
                        }))}
                        onSearch={val => handleCodeSearch(name, val)}
                        onSelect={(val, opt) => handleCodeSelect(name, val, opt)}
                        filterOption={false}
                        allowClear
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'color']} label={t('color')}>
                      <Select placeholder={t('color')} style={{ width: 130 }} options={(colorOptions || []).map(c => ({ value: c, label: c }))} onChange={val => handleColorChange(name, val)} allowClear />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'size']} label={t('size')}>
                      <Select placeholder={t('size')} style={{ width: 100 }} options={(sizeOptions || []).map(s => ({ value: s, label: s }))} onChange={val => handleSizeChange(name, val)} allowClear />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'qty']} label={t('qty')} initialValue={1} rules={[{ required: true, message: t('pleaseEnterAmount') }]}>
                      <InputNumber min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'remark']} label={t('remark')}>
                      <Input placeholder={t('remark')} style={{ width: 160 }} />
                    </Form.Item>
                    <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginBottom: 24 }} />
                  </div>
                );
              })}
            </>
          )}
        </Form.List>
        <Form.Item name="operator" label={t('operator')} rules={[{ required: true, message: t('pleaseEnterOperator') }]}>
          <Select placeholder={t('pleaseEnterOperator')}>
            {(STAFF_LIST || []).map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
          </Select>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
