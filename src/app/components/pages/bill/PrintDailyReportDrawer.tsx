'use client';

import React, { useState } from 'react';
import { Button, Form, Select, DatePicker, notification, Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import { PrintDailyReportRequest } from '@/lib/types';
import { printService } from '@/lib/api';
import { saler } from './PrintReceipt';

interface PrintDailyReportDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const counter = [
  { label: 'Slady Fashion', value: 1 },
  { label: 'SL Studio', value: 2 }
];

export default function PrintDailyReportDrawer({ visible, onClose }: PrintDailyReportDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 打印每日结单
  const onPrint = async () => {
    try {
      const data = form.getFieldsValue();
      const selectedDate = data?.date?.format?.('YYYY-MM-DD');
      if (!selectedDate) {
        notification.error({ message: t('pleaseSelectDate') });
        return;
      }
      setLoading(true);
      
      const params: PrintDailyReportRequest = {
        ...data,
        shop: "Slady Studio Pte. Ltd.",
        date: selectedDate
      };
      
      await printService.printDailyReport(params);
      notification.success({ message: t('printDailyReportSuccess') });
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('打印每日结单失败:', error);
      notification.error({ message: t('printDailyReportFailed') });
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const onReset = () => {
    form.resetFields();
  };

  return (
    <Drawer
      title={t('printDailyReport')}
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
          store: 2,
          saler: saler[0]
        }}
      >
        <Form.Item
          name="store"
          label={t('store')}
          rules={[{ required: true, message: '请选择店铺' }]}
        >
          <Select placeholder={t('pleaseSelectStore')}>
            {counter.map(item => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="saler"
          label={t('cashier')}
          rules={[{ required: true, message: '请选择收银员' }]}
        >
          <Select placeholder={t('pleaseSelectCashier')}>
            {saler.map(item => (
              <Select.Option key={item} value={item}>{item}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label={t('date')}
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
