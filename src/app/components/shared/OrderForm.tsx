'use client';

import React from 'react';
import { Input, InputNumber, Select } from 'antd';
import Form from '@/app/components/common/ValidatedForm';
import { useTranslation } from 'react-i18next';
import { STAFF_LIST, PAYMENT_STATUS } from '@/config/constants';

interface OrderFormProps {
  size?: 'small' | 'middle' | 'large';
  showQuantityOnly?: boolean;
}

export default function OrderForm({ size = 'middle', showQuantityOnly = false }: OrderFormProps) {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        name="amount"
        label={t('quantity')}
        rules={[
          { required: true, message: t('pleaseEnterQuantity') },
          { type: 'number', min: 1, message: t('quantityMustBePositive') }
        ]}
      >
        <InputNumber
          size={size}
          style={{ width: '100%' }}
          min={1}
          precision={0}
          placeholder={t('quantity')}
        />
      </Form.Item>

      {!showQuantityOnly && (
        <>
          <Form.Item
            name="customerContact"
            label="姓名电话"
          >
            <Input size={size} placeholder="姓名 / 电话" />
          </Form.Item>

          <Form.Item
            name="paymentFlag"
            label="付款状态"
            initialValue={PAYMENT_STATUS.UNPAID}
          >
            <Select size={size}>
              <Select.Option value={PAYMENT_STATUS.PAID}>PAID（已付）</Select.Option>
              <Select.Option value={PAYMENT_STATUS.UNPAID}>UNPAID（未付）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="orderedBy"
            label="订货人"
          >
            <Select size={size} placeholder="请选择订货人">
              {STAFF_LIST.map(staff => (
                <Select.Option key={staff} value={staff}>{staff}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </>
      )}

      <Form.Item
        name="remark"
        label={t('remark')}
        rules={showQuantityOnly ? [{ required: true, message: t('pleaseEnterRemark') }] : undefined}
      >
        <Input size={size} placeholder={t('pleaseEnterRemark')} />
      </Form.Item>
    </>
  );
}
