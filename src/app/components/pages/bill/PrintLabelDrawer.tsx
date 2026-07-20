'use client';

import React, { useState, useCallback } from 'react';
import { Button, Form, Input, notification, Select, Drawer, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { PrintLabelRequest } from '@/lib/types';
import { printService, designService } from '@/lib/api';
import { colorList, sizeList } from '@/lib/types';
import { shops } from './PrintReceipt';
import ColorSelect from '../../ColorSelect';

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
