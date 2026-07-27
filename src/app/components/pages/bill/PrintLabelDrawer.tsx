'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button, Form, Input, notification, Select, Drawer, InputNumber } from 'antd';
import { AutoComplete } from 'antd';
import { useTranslation } from 'react-i18next';
import { PrintLabelRequest } from '@/lib/types';
import { printService, designService, item as itemApi } from '@/lib/api';
import { sizeList } from '@/lib/types';
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
  const codeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 輸入 code 後 debounce 搜索 design 列表
  const handleCodeSearch = (val: string) => {
    if (codeTimer.current) clearTimeout(codeTimer.current);
    setCodeOptions([]);
    setColorOptions([]);
    setSizeOptions([]);
    if (!val || val.length < 1) return;
    codeTimer.current = setTimeout(async () => {
      try {
        const res = await designService.getList({
          design: val,
          typeList: [],
          searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' },
        });
        const list = res?.data?.content ?? [];
        setCodeOptions(list.map((d: any) => ({
          value: d.design,
          label: `${d.design}  $${d.salePrice}`,
          designId: d.id,
          salePrice: d.salePrice,
        })));
      } catch { /* ignore */ }
    }, 350);
  };

  // 選中 design 後：填入售價 + 拉庫存顏色
  const handleCodeSelect = async (val: string, option: any) => {
    form.setFieldsValue({ salePrice: parseFloat(option.salePrice ?? 0), color: undefined, size: undefined });
    setColorOptions([]);
    setSizeOptions([]);
    const warehouseName = shop === 1 ? 'Slady一店' : shop === 2 ? 'SL二店' : 'Live直播间';
    try {
      const res = await itemApi.getList({
        designId: option.designId,
        warehouseName,
        searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' },
      });
      const items: any[] = res?.data ?? [];
      const colors = [...new Set(items.map((i: any) => i.color).filter(Boolean))] as string[];
      setColorOptions(colors);
      if (colors.length > 0) {
        const sizes = [...new Set(
          items.filter((i: any) => i.color === colors[0]).map((i: any) => i.size).filter(Boolean)
        )] as string[];
        setSizeOptions(sizes);
        form.setFieldsValue({ color: colors[0], size: sizes[0] });
      }
    } catch { /* ignore */ }
  };

  // 顏色改變時更新尺碼選項
  const handleColorChange = async (color: string) => {
    const code = form.getFieldValue('code');
    if (!code) return;
    const warehouseName = shop === 1 ? 'Slady一店' : shop === 2 ? 'SL二店' : 'Live直播间';
    try {
      const listRes = await designService.getList({ design: code, typeList: [], searchPage: { desc: 1, page: 1, pageSize: 5, sort: 'id' } });
      const designs = listRes?.data?.content ?? [];
      if (!designs.length) return;
      const res = await itemApi.getList({ designId: designs[0].id, warehouseName, searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
      const items: any[] = res?.data ?? [];
      const sizes = [...new Set(items.filter((i: any) => i.color === color).map((i: any) => i.size).filter(Boolean))] as string[];
      setSizeOptions(sizes);
      form.setFieldsValue({ size: sizes[0] });
    } catch { /* ignore */ }
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
          <Button type="primary" loading={loading} onClick={onPrint}>{t('confirmPrint')}</Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ count: 1 }}>
        <section style={{ marginBottom: 12 }}>
          {shops.map((s, i) => i > 0 && (
            <Button key={i} type={shop === i ? 'primary' : 'default'} style={{ borderRadius: 20, marginRight: 5 }}
              onClick={() => {
                setShops(i);
                // 切換店鋪時重新拉顏色
                const code = form.getFieldValue('code');
                if (code) handleCodeSearch(code);
              }}>
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
            onChange={(val) => {
              if (!val) {
                setColorOptions([]);
                setSizeOptions([]);
                setCodeOptions([]);
                form.setFieldsValue({ color: undefined, size: undefined, salePrice: undefined });
              }
            }}
          />
        </Form.Item>

        <Form.Item name="color" label={t('color')} rules={[{ required: true, message: t('pleaseSelectColor2') }]}>
          <Select
            placeholder={t('pleaseSelectColor2')}
            onChange={handleColorChange}
            options={colorOptions.map(c => ({ value: c, label: c }))}
          />
        </Form.Item>

        <Form.Item name="size" label={t('size')} rules={[{ required: true, message: t('pleaseSelectSize2') }]}>
          <Select
            placeholder={t('pleaseSelectSize2')}
            options={sizeOptions.length > 0 ? sizeOptions.map(s => ({ value: s, label: s })) : sizeList.map(s => ({ value: s, label: s }))}
          />
        </Form.Item>

        <Form.Item name="salePrice" label={t('salePrice')} rules={[{ required: true, message: t('pleaseEnterPrice2') }]}>
          <Input placeholder={t('pleaseEnterPrice')} type="number" />
        </Form.Item>

        <Form.Item name="count" label={t('count')} rules={[{ required: true, type: 'number', min: 1, message: t('pleaseEnterQuantity2') }]}>
          <InputNumber min={1} step={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

interface PrintLabelDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrintLabelDrawer({ visible, onClose }: PrintLabelDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shop, setShops] = useState(1);

  // 获取价格
  const getPrice = useCallback(async () => {
    const data = form.getFieldsValue();
    if (data.code) {
      try {
        const res = await designService.getDesignDetail({ design: data.code });

        if (res.code === 200 && res.data && res.data.length > 0) {
          form.setFieldsValue({ salePrice: res.data[0].salePrice });
        }
      } catch (error) {
        console.error('Get price failed:', error);
        notification.error({ message: t('getPriceFailed') });
      }
    }
  }, [form]);

  // 打印标签
  const onPrint = async () => {
    try {
      const data = form.getFieldsValue();
      const { code, color, size, salePrice, count } = data;
      
      if (code && color && size && salePrice && count) {
        setLoading(true);
        const params: PrintLabelRequest = {
          code,
          color,
          size,
          salePrice: parseFloat(salePrice),
          store: shop,
          count: Number(count)
        };
        
        await printService.printLabel(params);
        notification.success({ message: t('printLabelSuccess') });
        form.resetFields();
        setShops(1);
        onClose();
      } else {
        notification.error({ message: t('pleaseFillComplete') });
      }
    } catch (error) {
      console.error('Print label failed:', error);
      notification.error({ message: t('printLabelFailed') });
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const onReset = () => {
    form.resetFields();
    setShops(1);
  };

  return (
    <Drawer
      title={t('printLabel')}
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>{t('cancel')}</Button>
          <Button onClick={onReset} style={{ marginRight: 8 }}>{t('reset')}</Button>
          <Button type="primary" loading={loading} onClick={onPrint}>{t('confirmPrint')}</Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          color: colorList[0],
          size: sizeList[0],
          count: 1
        }}
      >
        <section style={{ marginBottom: 10, marginTop: 10 }}>
          {shops.map((item, index) => (
            index > 0 ? <Button
              key={index}
              type={shop === index ? 'primary' : 'default'}
              style={{ borderRadius: 20, marginRight: 5, marginBottom: 5 }}
              onClick={() => setShops(index)}
            >
              {item}
            </Button> : <></>
          ))}
        </section>

        <Form.Item
          name="code"
          label={t('designCode')}
          rules={[{ required: true, message: t('pleaseEnterDesignCode') }]}
        >
          <Input placeholder={t('pleaseEnterDesignCode')} />
        </Form.Item>

        <Form.Item
          name="color"
          label={t('color')}
          rules={[{ required: true, message: t('pleaseSelectColor') }]}
        >
          <ColorSelect 
              placeholder={t('color')} 
            />
        </Form.Item>

        <Form.Item
          name="size"
          label={t('size')}
          rules={[{ required: true, message: t('pleaseSelectSize') }]}
        >
          <Select placeholder={t('pleaseSelectSize')}>
            {sizeList.map(size => (
              <Select.Option key={size} value={size}>{size}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button onClick={getPrice} style={{ marginBottom: 16 }}>
            {t('detectPrice')}
          </Button>
        </Form.Item>

        <Form.Item
          name="salePrice"
          label={t('salePrice')}
          rules={[{ required: true, message: t('pleaseEnterPrice') }]}
        >
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
