'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Drawer, Input, InputNumber, message, Space, Switch, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import Form from '@/app/components/common/ValidatedForm';
import { useTranslation } from 'react-i18next';
import { memberPackageApi } from '@/lib/api';
import { MemberPackageConfig, MemberPackageMutation } from '@/lib/types';

const emptyDescriptions = {
  description: '',
  benefitDescription: '',
  termsDescription: '',
};

export default function MemberPackageManagement() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [packages, setPackages] = useState<MemberPackageConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MemberPackageConfig | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await memberPackageApi.getAll();
      if (response.code === 200) {
        setPackages(response.data || []);
      } else {
        message.error(response.msg || t('fetchMemberPackagesFailed'));
      }
    } catch (error) {
      console.error('fetch member packages failed:', error);
      message.error(t('fetchMemberPackagesFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  const openCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({
      ...emptyDescriptions,
      enabled: true,
      sortOrder: (packages.length + 1) * 10,
    });
    setDrawerOpen(true);
  };

  const openEdit = (record: MemberPackageConfig) => {
    setEditingPackage(record);
    form.setFieldsValue({
      name: record.name,
      saleAmount: Number(record.saleAmount),
      creditAmount: Number(record.creditAmount),
      description: record.description || '',
      benefitDescription: record.benefitDescription || '',
      termsDescription: record.termsDescription || '',
      enabled: record.enabled === 1,
      sortOrder: record.sortOrder ?? 0,
    });
    setDrawerOpen(true);
  };

  const toMutation = (record: MemberPackageConfig, enabled = record.enabled): MemberPackageMutation & { id: number } => ({
    id: record.id,
    name: record.name,
    saleAmount: Number(record.saleAmount),
    creditAmount: Number(record.creditAmount),
    description: record.description || '',
    benefitDescription: record.benefitDescription || '',
    termsDescription: record.termsDescription || '',
    enabled,
    sortOrder: record.sortOrder ?? 0,
  });

  const handleStatusChange = async (record: MemberPackageConfig, enabled: boolean) => {
    setUpdatingStatusId(record.id);
    try {
      const response = await memberPackageApi.modify(toMutation(record, enabled ? 1 : 0));
      if (response.code === 200) {
        setPackages((current) => current.map((item) => item.id === record.id ? response.data : item));
        message.success(t(enabled ? 'memberPackageEnabled' : 'memberPackageDisabled'));
      } else {
        message.error(response.msg || t('saveMemberPackageFailed'));
      }
    } catch (error) {
      console.error('update member package status failed:', error);
      message.error(t('saveMemberPackageFailed'));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: MemberPackageMutation = {
        name: values.name.trim(),
        saleAmount: Number(values.saleAmount),
        creditAmount: Number(values.creditAmount),
        description: values.description || '',
        benefitDescription: values.benefitDescription || '',
        termsDescription: values.termsDescription || '',
        enabled: values.enabled ? 1 : 0,
        sortOrder: Number(values.sortOrder || 0),
      };

      setSaving(true);
      const response = editingPackage
        ? await memberPackageApi.modify({ ...payload, id: editingPackage.id })
        : await memberPackageApi.create(payload);

      if (response.code === 200) {
        message.success(t(editingPackage ? 'modifySuccess' : 'createSuccess'));
        setDrawerOpen(false);
        setEditingPackage(null);
        await fetchPackages();
      } else {
        message.error(response.msg || t('saveMemberPackageFailed'));
      }
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('save member package failed:', error);
      message.error(t('saveMemberPackageFailed'));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<MemberPackageConfig> = [
    {
      title: t('packageName'),
      dataIndex: 'name',
      key: 'name',
      width: 155,
      render: (name: string) => <span className="font-semibold text-gray-900">{name}</span>,
    },
    {
      title: t('packageSaleAmount'),
      dataIndex: 'saleAmount',
      key: 'saleAmount',
      width: 115,
      render: (amount: number) => `$${Number(amount).toFixed(2)}`,
    },
    {
      title: t('packageCreditAmount'),
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      width: 125,
      render: (amount: number) => `$${Number(amount).toFixed(2)}`,
    },
    {
      title: t('packageBonusAmount'),
      key: 'bonusAmount',
      width: 110,
      render: (_, record) => {
        const bonus = Number(record.creditAmount) - Number(record.saleAmount);
        return <span className={bonus > 0 ? 'font-medium text-emerald-700' : 'text-gray-500'}>${bonus.toFixed(2)}</span>;
      },
    },
    {
      title: t('packageDescriptions'),
      key: 'descriptions',
      render: (_, record) => {
        const descriptionParts = [record.description, record.benefitDescription, record.termsDescription].filter(Boolean);
        const tooltip = (
          <div className="max-w-sm space-y-1">
            {record.description && <div><strong>{t('packageDescription')}:</strong> {record.description}</div>}
            {record.benefitDescription && <div><strong>{t('packageBenefits')}:</strong> {record.benefitDescription}</div>}
            {record.termsDescription && <div><strong>{t('packageTerms')}:</strong> {record.termsDescription}</div>}
          </div>
        );
        return descriptionParts.length ? (
          <Tooltip title={tooltip}>
            <div className="space-y-0.5 text-xs leading-4 text-gray-600">
              {descriptionParts.map((part, index) => <div key={index} className="truncate">{part}</div>)}
            </div>
          </Tooltip>
        ) : <span className="text-gray-400">—</span>;
      },
    },
    {
      title: t('packageStatus'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 105,
      render: (enabled: number, record) => (
        <Switch
          size="small"
          checked={enabled === 1}
          checkedChildren={t('enabled')}
          unCheckedChildren={t('disabled')}
          loading={updatingStatusId === record.id}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 85,
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          {t('edit')}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-semibold text-gray-900 md:text-2xl">{t('memberPackageManagement')}</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchPackages()} loading={loading}>
            {t('refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('createMemberPackage')}
          </Button>
        </Space>
      </div>

      <Table<MemberPackageConfig>
        rowKey="id"
        columns={columns}
        dataSource={packages}
        loading={loading}
        pagination={false}
        tableLayout="fixed"
        locale={{ emptyText: t('noMemberPackages') }}
        size="middle"
      />

      <Drawer
        title={t(editingPackage ? 'editMemberPackage' : 'createMemberPackage')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        destroyOnClose
        extra={(
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>{t('cancel')}</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>{t('save')}</Button>
          </Space>
        )}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label={t('packageName')} rules={[{ required: true, whitespace: true, message: t('packageNameRequired') }]}>
            <Input maxLength={100} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Form.Item name="saleAmount" label={t('packageSaleAmount')} rules={[{ required: true, message: t('packageAmountRequired') }]}>
              <InputNumber min={0.01} precision={2} prefix="$" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="creditAmount" label={t('packageCreditAmount')} rules={[{ required: true, message: t('packageAmountRequired') }]}>
              <InputNumber min={0.01} precision={2} prefix="$" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label={t('packageDescription')}>
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="benefitDescription" label={t('packageBenefits')}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="termsDescription" label={t('packageTerms')}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <Form.Item name="sortOrder" label={t('packageSortOrder')} rules={[{ type: 'number', min: 0 }]}>
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="enabled" label={t('packageStatus')} valuePropName="checked">
              <Switch checkedChildren={t('enabled')} unCheckedChildren={t('disabled')} />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
