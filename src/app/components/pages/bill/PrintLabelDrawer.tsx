'use client';

import React, { useState, useRef } from 'react';
import { Button, Form, Input, notification, Select, Drawer, InputNumber } from 'antd';
import { AutoComplete } from 'antd';
import { useTranslation } from 'react-i18next';
import { printService, designService, item as itemApi } from '@/lib/api';
import { shops } from './PrintReceipt';

interface PrintLabelDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrintLabelDrawer({ visible, onClose }: PrintLabelDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shop, setShops] = useState(1);
  const [codeOptions, setCodeOptions] = useState<{ value: string; label: string; designId: number; salePrice: string }[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [variantItems, setVariantItems] = useState<any[]>([]);
  const [selectedDesignCode, setSelectedDesignCode] = useState('');
  const [loadingVariants, setLoadingVariants] = useState(false);
  const codeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearVariantSelection = () => {
    setSelectedDesignCode('');
    setVariantItems([]);
    setColorOptions([]);
    setSizeOptions([]);
    form.setFieldsValue({ color: undefined, size: undefined, salePrice: undefined });
  };

  const loadDesignVariants = async (option: any) => {
    setLoadingVariants(true);
    setSelectedDesignCode(option.value);
    setVariantItems([]);
    setColorOptions([]);
    setSizeOptions([]);
    form.setFieldsValue({
      code: option.value,
      salePrice: parseFloat(option.salePrice ?? 0),
      color: undefined,
      size: undefined,
    });

    try {
      const res = await itemApi.getList({
        designId: option.designId,
        searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' },
      });
      const items: any[] = res?.data ?? [];
      const colors = [...new Set(items.map((item: any) => item.color).filter(Boolean))] as string[];
      const firstColor = colors[0];
      const sizes = firstColor
        ? [...new Set(items.filter((item: any) => item.color === firstColor).map((item: any) => item.size).filter(Boolean))] as string[]
        : [];

      setVariantItems(items);
      setColorOptions(colors);
      setSizeOptions(sizes);
      form.setFieldsValue({ color: firstColor, size: sizes[0] });
    } catch {
      clearVariantSelection();
      notification.error({ message: t('printLabelFailed') });
    } finally {
      setLoadingVariants(false);
    }
  };

  // 輸入 code 後 debounce 搜索 design 列表
  const handleCodeSearch = (val: string) => {
    if (codeTimer.current) clearTimeout(codeTimer.current);
    setCodeOptions([]);
    clearVariantSelection();
    if (!val || val.length < 1) return;
    codeTimer.current = setTimeout(async () => {
      try {
        const res = await designService.getList({
          design: val,
          typeList: [],
          searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' },
        });
        const list = res?.data?.content ?? [];
        const options = list.map((d: any) => ({
          value: d.design,
          label: `${d.design}  $${d.salePrice}`,
          designId: d.id,
          salePrice: d.salePrice,
        }));
        setCodeOptions(options);
        const normalizedCode = val.trim().toLowerCase();
        const exactMatches = options.filter((option: any) => option.value.toLowerCase() === normalizedCode);
        if (exactMatches.length === 1) {
          await loadDesignVariants(exactMatches[0]);
        }
      } catch (err) { 
        console.error('Search failed:', err);
      }
    }, 350);
  };

  // 選中 design 後：填入售價 + 拉庫存顏色
  const handleCodeSelect = async (val: string, option: any) => {
    await loadDesignVariants(option);
  };

  // 顏色改變時更新尺碼選項
  const handleColorChange = (color: string) => {
    const sizes = [...new Set(
      variantItems.filter((item: any) => item.color === color).map((item: any) => item.size).filter(Boolean)
    )] as string[];
    setSizeOptions(sizes);
    form.setFieldsValue({ size: sizes[0] });
  };

  // 打印標籤
  const onPrint = async () => {
    try {
      const values = await form.validateFields();
      const { code, color, size, salePrice, count } = values;
      setLoading(true);
      await printService.printLabel({ code, color, size, salePrice: parseFloat(salePrice), store: shop, count: Number(count) });
      notification.success({ message: t('printLabelSuccess') });
      form.resetFields();
      setColorOptions([]);
      setSizeOptions([]);
      setCodeOptions([]);
      setVariantItems([]);
      setSelectedDesignCode('');
      onClose();
    } catch (error: any) {
      if (!error?.errorFields) {
        notification.error({ message: t('printLabelFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    form.resetFields();
    setShops(1);
    setColorOptions([]);
    setSizeOptions([]);
    setCodeOptions([]);
    setVariantItems([]);
    setSelectedDesignCode('');
  };

  return (
    <Drawer
      title={t('printLabel')}
      placement="right"
      onClose={onClose}
      open={visible}
      width={420}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>{t('cancel')}</Button>
          <Button onClick={onReset} style={{ marginRight: 8 }}>{t('reset')}</Button>
          <Button type="primary" loading={loading} disabled={!selectedDesignCode || loadingVariants} onClick={onPrint}>{t('confirmPrint')}</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ count: 1 }}>
        <section style={{ marginBottom: 12 }}>
          {shops.map((s, i) => i > 0 && (
            <Button
              key={i}
              type={shop === i ? 'primary' : 'default'}
              style={{ borderRadius: 20, marginRight: 5 }}
              onClick={() => {
                setShops(i);
                const code = form.getFieldValue('code');
                if (code) handleCodeSearch(code);
              }}
            >
              {s}
            </Button>
          ))}
        </section>

        <Form.Item name="code" label={t('designCode')} rules={[{ required: true, message: t('pleaseEnterProductCode3') }]}>
          <AutoComplete
            placeholder={t('pleaseEnterDesignCode')}
            options={codeOptions}
            onSearch={handleCodeSearch}
            onSelect={handleCodeSelect}
            filterOption={false}
            allowClear
            popupMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 300, maxHeight: 400 }}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            onChange={(val) => {
              if (!val || val !== selectedDesignCode) {
                clearVariantSelection();
                if (!val) setCodeOptions([]);
              }
            }}
          />
        </Form.Item>

        <Form.Item name="color" label={t('color')} rules={[{ required: true, message: t('pleaseSelectColor2') }]}>
          <Select
            placeholder={t('pleaseSelectColor2')}
            onChange={handleColorChange}
            disabled={!selectedDesignCode || loadingVariants}
            loading={loadingVariants}
            options={colorOptions.map(c => ({ value: c, label: c }))}
          />
        </Form.Item>

        <Form.Item name="size" label={t('size')} rules={[{ required: true, message: t('pleaseSelectSize2') }]}>
          <Select
            placeholder={t('pleaseSelectSize2')}
            disabled={!selectedDesignCode || loadingVariants || sizeOptions.length === 0}
            loading={loadingVariants}
            options={sizeOptions.map(s => ({ value: s, label: s }))}
          />
        </Form.Item>

        <Form.Item name="salePrice" label={t('salePrice')} rules={[{ required: true, message: t('pleaseEnterPrice2') }]}>
          <Input placeholder={t('pleaseEnterPrice')} type="number" />
        </Form.Item>

        <Form.Item
          name="count"
          label={t('count')}
          rules={[
            { required: true, type: 'number', min: 1, message: t('pleaseEnterCount') },
            {
              validator: (_, value) =>
                value === undefined || value === null || Number.isInteger(value)
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('countMustBeInteger'))),
            },
          ]}
        >
          <InputNumber min={1} step={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
