'use client';

import React, { useState, useRef } from 'react';
import { Table, Form, Input, DatePicker, Button, Card, message, Pagination, Spin, Drawer, Select, InputNumber, notification } from 'antd';
import { SearchOutlined, ReloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { InventoryRecordItem, InventoryRecordRequest } from '@/lib/types';
import { inventoryRecord, item as itemApi, designService, printService } from '@/lib/api';
import { API_CONFIG } from '@/config/constants';
import { sizeList } from '@/lib/types';
import { colorList } from '@/lib/types';
import { usePermissions } from '@/lib/usePermissions';
import moment from 'moment';
import { useInitialListRefresh } from '@/lib/useListRefresh';

// ────────────────────────────────────────────────────────────────
// 打印标签内嵌组件（原 PrintLabelDrawer，移入此模块）
// ────────────────────────────────────────────────────────────────
function PrintLabelPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [labelForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shop, setShop] = useState(1);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const codeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shops = ['', 'Slady Fashion Pte. Ltd.', 'SL Studio Pte. Ltd.'];

  // 输入 code 后自动拉取颜色/尺码选项
  const handleCodeChange = (val: string) => {
    if (codeTimer.current) clearTimeout(codeTimer.current);
    labelForm.setFieldsValue({ color: undefined, size: undefined });
    setColorOptions([]);
    setSizeOptions([]);
    if (!val || val.length < 1) return;
    codeTimer.current = setTimeout(async () => {
      try {
        const warehouseName = shop === 1 ? 'SL二店' : 'Live直播间';
        const listRes = await designService.getList({
          design: val, typeList: [], searchPage: { desc: 1, page: 1, pageSize: 5, sort: 'id' }
        });
        const designs = listRes?.data?.content ?? [];
        if (designs.length === 0) return;
        const designId = designs[0].id;
        const itemRes = await itemApi.getList({ designId, warehouseName, searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
        const items = itemRes?.data ?? [];
        const colors = [...new Set(items.map((i: any) => i.color).filter(Boolean))] as string[];
        setColorOptions(colors);
        if (colors.length > 0) {
          const sizes = [...new Set(items.filter((i: any) => i.color === colors[0]).map((i: any) => i.size).filter(Boolean))] as string[];
          setSizeOptions(sizes);
          labelForm.setFieldsValue({ salePrice: parseFloat(designs[0].salePrice ?? 0), color: colors[0], size: sizes[0] });
        }
      } catch { /* ignore */ }
    }, 400);
  };

  const handleColorChange = async (color: string) => {
    const code = labelForm.getFieldValue('code');
    if (!code) return;
    try {
      const warehouseName = shop === 1 ? 'SL二店' : 'Live直播间';
      const listRes = await designService.getList({ design: code, typeList: [], searchPage: { desc: 1, page: 1, pageSize: 5, sort: 'id' } });
      const designs = listRes?.data?.content ?? [];
      if (!designs.length) return;
      const itemRes = await itemApi.getList({ designId: designs[0].id, warehouseName, searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
      const items = itemRes?.data ?? [];
      const sizes = [...new Set(items.filter((i: any) => i.color === color).map((i: any) => i.size).filter(Boolean))] as string[];
      setSizeOptions(sizes);
      labelForm.setFieldsValue({ size: sizes[0] });
    } catch { /* ignore */ }
  };

  const onPrint = async () => {
    try {
      const values = await labelForm.validateFields();
      const { code, color, size, salePrice, count } = values;
      setLoading(true);
      await printService.printLabel({ code, color, size, salePrice: parseFloat(salePrice), store: shop, count: Number(count) });
      notification.success({ message: t('printLabelSuccess') });
      labelForm.resetFields();
      setColorOptions([]);
      setSizeOptions([]);
      onClose();
    } catch (error: any) {
      if (!error?.errorFields) {
        console.error('Print label failed:', error);
        notification.error({ message: t('printLabelFailed') });
      }
    } finally {
      setLoading(false);
    }
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
          <Button onClick={() => { labelForm.resetFields(); setColorOptions([]); setSizeOptions([]); }} style={{ marginRight: 8 }}>{t('reset')}</Button>
          <Button type="primary" loading={loading} onClick={onPrint}>{t('confirmPrint')}</Button>
        </div>
      }
    >
      <Form form={labelForm} layout="vertical" initialValues={{ count: 1 }}>
        <section style={{ marginBottom: 12 }}>
          {shops.map((s, i) => i > 0 && (
            <Button key={i} type={shop === i ? 'primary' : 'default'} style={{ borderRadius: 20, marginRight: 5 }} onClick={() => { setShop(i); handleCodeChange(labelForm.getFieldValue('code') || ''); }}>
              {s}
            </Button>
          ))}
        </section>

        <Form.Item name="code" label={t('designCode')} rules={[{ required: true, message: t('pleaseEnterProductCode3') }]}>
          <Input placeholder={t('pleaseEnterDesignCode')} onChange={e => handleCodeChange(e.target.value)} />
        </Form.Item>

        <Form.Item name="color" label={t('color')} rules={[{ required: true, message: t('pleaseSelectColor2') }]}>
          <Select placeholder={t('pleaseSelectColor2')} onChange={handleColorChange} options={colorOptions.map(c => ({ value: c, label: c }))} />
        </Form.Item>

        <Form.Item name="size" label={t('size')} rules={[{ required: true, message: t('pleaseSelectSize2') }]}>
          <Select placeholder={t('pleaseSelectSize2')} options={sizeOptions.map(s => ({ value: s, label: s }))} />
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

// ────────────────────────────────────────────────────────────────
// 主页面：库存记录
// ────────────────────────────────────────────────────────────────
export default function InventoryRecords() {
  const { t } = useTranslation();
  const { canUseFeature } = usePermissions();
  const [form] = Form.useForm();
  const [data, setData] = useState<InventoryRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [printLabelVisible, setPrintLabelVisible] = useState(false);

  const fetchData = async (page = 1, searchParams: any = {}) => {
    setLoading(true);
    setData([]);
    try {
      const formValues = form.getFieldsValue();
      const params: InventoryRecordRequest = {
        searchPage: { desc: 1, page, pageSize: 20, sort: 'create_date' },
        uri: '/item/modify-stock',
        ...formValues,
        ...searchParams
      };
      if (formValues.operateDate && formValues.operateDate.length === 2) {
        params.startDate = formValues.operateDate[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.endDate = formValues.operateDate[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
        delete (params as any).operateDate;
      }
      // 从 params 移除未使用的字段（userName 已删除）
      delete (params as any).userName;

      const response = await inventoryRecord.getList(params);
      if (response.code === 200) {
        const processedData = response.data.content.map((item: any) => {
          try {
            const parsed = JSON.parse(item.body);
            // 只取 body 里有用的展示字段，不覆盖 item 本身的字段
            return {
              design: parsed?.design,
              color: parsed?.color,
              size: parsed?.size,
              warehouseName: parsed?.warehouseName,
              previewPhoto: parsed?.previewPhoto,
              inStoreStock: parsed?.inStoreStock,
              newStock: parsed?.newStock,
              ...item,  // item 字段优先（id, createDate 等）
            };
          } catch {
            return item;
          }
        });
        setData(processedData);
        setPagination({ current: response.data.number + 1, pageSize: response.data.size, total: response.data.totalElements });
      } else {
        setData([]);
        setPagination({ current: 1, pageSize: 20, total: 0 });
      }
    } catch (error) {
      console.error('Failed to get inventory records:', error);
      message.error(t('fetchInventoryRecordsFailed'));
      setData([]);
      setPagination({ current: 1, pageSize: 20, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useInitialListRefresh(() => fetchData(1));

  const columns = [
    { title: t('productImage'), dataIndex: 'previewPhoto', key: 'previewPhoto', width: 100, fixed: 'left' as const,
      render: (photo: string) => (
        <img style={{ height: 80, width: 64, objectFit: 'cover' }} alt="" src={API_CONFIG.BASE_URL + photo}
          onError={(e) => { const img = e.target as HTMLImageElement; if (!img.src.includes('data:image')) img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E'; }} />
      )
    },
    { title: t('designCode'), dataIndex: 'design', key: 'design', width: 140, fixed: 'left' as const },
    { title: t('color'), dataIndex: 'color', key: 'color', width: 100 },
    { title: t('size'), dataIndex: 'size', key: 'size', width: 80 },
    { title: t('warehouse'), dataIndex: 'warehouseName', key: 'warehouseName', width: 120 },
    { title: t('originalStock'), dataIndex: 'inStoreStock', key: 'inStoreStock', width: 100,
      render: (s: number) => <span style={{ fontWeight: 'bold' }}>{s}</span>
    },
    { title: t('newStock'), dataIndex: 'newStock', key: 'newStock', width: 100,
      render: (s: number) => <span style={{ fontWeight: 'bold', color: s > 0 ? '#52c41a' : '#ff4d4f' }}>{s}</span>
    },
    { title: t('operationTime'), dataIndex: 'createDate', key: 'createDate', width: 180 },
  ];

  const renderCard = (item: any, index: number) => (
    <Card key={item.id} className="mb-3" style={{ borderRadius: 12 }}>
      <div className="flex items-start space-x-3">
        <img className="w-16 h-20 object-cover rounded-lg border border-gray-200" alt="" src={API_CONFIG.BASE_URL + item.previewPhoto}
          onError={(e) => { const img = e.target as HTMLImageElement; if (!img.src.includes('data:image')) img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E'; }} />
        <div className="flex-1">
          <div className="font-bold text-gray-900 mb-1">{item.design}</div>
          <div className="grid grid-cols-2 gap-1 text-sm mb-2">
            <span className="text-gray-500">{t('color')}: <b>{item.color}</b></span>
            <span className="text-gray-500">{t('size')}: <b>{item.size}</b></span>
            <span className="text-gray-500">{t('warehouse')}: <b>{item.warehouseName}</b></span>
          </div>
          <div className="bg-gray-50 rounded p-2 text-sm">
            <span>{t('originalStock')}: <b>{item.inStoreStock}</b></span>
            <span className="ml-4">{t('newStock')}: <b style={{ color: item.newStock > 0 ? '#52c41a' : '#ff4d4f' }}>{item.newStock}</b></span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{moment(item.createDate).format('YYYY-MM-DD HH:mm:ss')}</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-4 md:p-6">
      {/* 搜索表单 */}
      <Card className="mb-4" style={{ borderRadius: 12 }}>
        <Form form={form} layout="vertical" className="md:!flex md:!flex-wrap md:!items-end md:!gap-4" onFinish={() => fetchData(1)}>
          <Form.Item name="body" label={t('designCode')} className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[160px]">
            <Input placeholder={t('pleaseEnterDesignCode')} />
          </Form.Item>
          <Form.Item name="color" label={t('color')} className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[120px]">
            <Input placeholder={t('colorPlaceholder')} />
          </Form.Item>
          <Form.Item name="size" label={t('size')} className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[100px]">
            <Input placeholder={t('sizePlaceholder')} />
          </Form.Item>
          <Form.Item name="operateDate" label={t('operationTime')} className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[280px]">
            <DatePicker.RangePicker placeholder={[t('startTime'), t('endTime')]} className="w-full" />
          </Form.Item>
          <div className="flex gap-2 flex-wrap md:!mb-0">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('search')}</Button>
            <Button onClick={() => { form.resetFields(); fetchData(1); }} icon={<ReloadOutlined />}>{t('reset')}</Button>
            {canUseFeature('printLabel') && (
              <Button icon={<PrinterOutlined />} onClick={() => setPrintLabelVisible(true)}>{t('printLabelButton')}</Button>
            )}
          </div>
        </Form>
      </Card>

      {/* 数据展示 */}
      <Card style={{ borderRadius: 12, overflow: 'auto' }}>
        <div className="hidden md:block">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total}
              onChange={p => fetchData(p)} showSizeChanger={false} showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`} />
          </div>
        </div>
        <div className="block md:hidden">
          {loading ? (
            <div className="text-center py-8"><Spin size="large" /></div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('noData')}</div>
          ) : (
            <div className="space-y-3">{data.map((item, idx) => renderCard(item, idx))}</div>
          )}
          {data.length > 0 && (
            <div className="mt-6 text-center">
              <Pagination current={pagination.current} pageSize={pagination.pageSize} total={pagination.total}
                onChange={p => fetchData(p)} showSizeChanger={false} />
            </div>
          )}
        </div>
      </Card>

      {/* {t('printLabelPanel')} */}
      <PrintLabelPanel visible={printLabelVisible} onClose={() => setPrintLabelVisible(false)} />
    </div>
  );
}
