'use client';

import React from 'react';
import { Card, Button, FormInstance } from 'antd';
import Form from '@/app/components/common/ValidatedForm';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SearchFormCardProps {
  form: FormInstance;
  onSearch: () => void;
  onReset: () => void;
  children: React.ReactNode;
  /** 额外放在按钮右侧的内容，如"选中会员总余额"等统计信息 */
  extra?: React.ReactNode;
}

/**
 * 统一搜索表单容器
 * 风格：Card 包裹，vertical layout，flex-wrap 横排，统一间距
 */
export default function SearchFormCard({
  form,
  onSearch,
  onReset,
  children,
  extra,
}: SearchFormCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSearch}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', alignItems: 'flex-end' }}
      >
        {children}

        {/* 搜索 / 重置按钮 */}
        <Form.Item style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            style={{ marginRight: 8 }}
          >
            {t('search')}
          </Button>
          <Button onClick={onReset} icon={<ReloadOutlined />}>
            {t('reset')}
          </Button>
        </Form.Item>

        {/* 额外信息（可选） */}
        {extra && (
          <Form.Item style={{ marginBottom: 24 }}>
            {extra}
          </Form.Item>
        )}
      </Form>
    </Card>
  );
}
