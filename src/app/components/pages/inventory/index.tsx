'use client';

import React, { useState, useRef } from 'react';
import { Table, Form, Input, DatePicker, Button, Card, message, Pagination, Spin, Drawer, Select, AutoComplete, InputNumber, notification } from 'antd';
import { SearchOutlined, ReloadOutlined, PrinterOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { InventoryRecordItem, InventoryRecordRequest } from '@/lib/types';
import { inventoryRecord, item as itemApi, receipt, designService, printService } from '@/lib/api';
import { API_CONFIG, STAFF_LIST } from '@/config/constants';
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
      notification.success({ message: '打印标签成功' });
      labelForm.resetFields();
      setColorOptions([]);
      setSizeOptions([]);
      onClose();
    } catch (error: any) {
      if (!error?.errorFields) {
        console.error('打印标签失败:', error);
        notification.error({ message: '打印标签失败' });
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

        <Form.Item name="code" label={t('designCode')} rules={[{ required: true, message: '请输入商品代码' }]}>
          <Input placeholder={t('pleaseEnterDesignCode')} onChange={e => handleCodeChange(e.target.value)} />
        </Form.Item>

        <Form.Item name="color" label={t('color')} rules={[{ required: true, message: '请选择颜色' }]}>
          <Select placeholder="请选择颜色" onChange={handleColorChange} options={colorOptions.map(c => ({ value: c, label: c }))} />
        </Form.Item>

        <Form.Item name="size" label={t('size')} rules={[{ required: true, message: '请选择尺码' }]}>
          <Select placeholder="请选择尺码" options={sizeOptions.map(s => ({ value: s, label: s }))} />
        </Form.Item>

        <Form.Item name="salePrice" label={t('salePrice')} rules={[{ required: true, message: '请输入价格' }]}>
          <Input placeholder={t('pleaseEnterPrice')} type="number" />
        </Form.Item>

        <Form.Item name="count" label={t('count')} rules={[{ required: true, type: 'number', min: 1, message: '请输入数量' }]}>
          <InputNumber min={1} step={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ────────────────────────────────────────────────────────────────
// 退货订单 Drawer
// ────────────────────────────────────────────────────────────────
function ReturnOrderDrawer({ visible, onClose, onSuccess }: { visible: boolean; onClose: () => void; onSuccess: () => void }) {
  const [returnForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rowCache, setRowCache] = useState<Record<number, { codeOptions: any[]; warehouseItems: any[] }>>({});
  const codeTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const designs = Form.useWatch('items', returnForm) as any[] | undefined;

  const handleCodeSearch = (name: number, val: string) => {
    if (codeTimers.current[name]) clearTimeout(codeTimers.current[name]);
    if (!val) return;
    codeTimers.current[name] = setTimeout(async () => {
      try {
        const res = await designService.getList({ design: val, typeList: [], searchPage: { desc: 1, page: 1, pageSize: 20, sort: 'id' } });
        setRowCache(prev => ({ ...prev, [name]: { ...prev[name], codeOptions: res?.data?.content ?? [] } }));
      } catch { /* ignore */ }
    }, 350);
  };

  const handleCodeSelect = async (name: number, val: string, option: any) => {
    try {
      const res = await itemApi.getList({ designId: option.designId, warehouseName: 'SL二店', searchPage: { desc: 1, page: 1, pageSize: 99, sort: '' } });
      const items = res?.data ?? [];
      const firstColor = items[0]?.color ?? '';
      const firstSize = items.find((i: any) => i.color === firstColor)?.size ?? '';
      const firstItemId = items.find((i: any) => i.color === firstColor && i.size === firstSize)?.id ?? null;
      setRowCache(prev => ({ ...prev, [name]: { codeOptions: [], warehouseItems: items } }));
      const curItems = returnForm.getFieldValue('items') || [];
      curItems[name] = { ...curItems[name], code: val, price: parseFloat(option.salePrice ?? 0), color: firstColor, size: firstSize, itemId: firstItemId };
      returnForm.setFieldsValue({ items: [...curItems] });
    } catch { notification.error({ message: '获取库存失败' }); }
  };

  const handleColorChange = (name: number, val: string) => {
    const warehouseItems = rowCache[name]?.warehouseItems ?? [];
    const firstSize = warehouseItems.find((i: any) => i.color === val)?.size ?? '';
    const firstItemId = warehouseItems.find((i: any) => i.color === val && i.size === firstSize)?.id ?? null;
    const curItems = returnForm.getFieldValue('items') || [];
    curItems[name] = { ...curItems[name], color: val, size: firstSize, itemId: firstItemId };
    returnForm.setFieldsValue({ items: [...curItems] });
    const newSizes = [...new Set(warehouseItems.filter((i: any) => i.color === val).map((i: any) => i.size).filter(Boolean))];
    setRowCache(prev => ({ ...prev, [name]: { ...prev[name] } }));
  };

  const handleSizeChange = (name: number, val: string) => {
    const warehouseItems = rowCache[name]?.warehouseItems ?? [];
    const cur = (returnForm.getFieldValue('items') || [])[name] || {};
    const itemId = warehouseItems.find((i: any) => i.color === cur.color && i.size === val)?.id ?? null;
    const curItems = returnForm.getFieldValue('items') || [];
    curItems[name] = { ...curItems[name], size: val, itemId };
    returnForm.setFieldsValue({ items: [...curItems] });
  };

  const handleSubmit = async () => {
    try {
      const values = await returnForm.validateFields();
      setLoading(true);

      for (const it of (values.items || [])) {
        if (!it.itemId) { notification.warning({ message: `商品 ${it.code} 未匹配到库存记录，跳过` }); continue; }
        try {
          // 从 rowCache 找当前库存，避免多余的 API 调用
          const allItems = Object.values(rowCache).flatMap(c => c.warehouseItems);
          const found = allItems.find((i: any) => i.id === it.itemId);
          const currentStock = found?.stock ?? 0;
          const newStock = currentStock + (it.qty ?? 1);
          await itemApi.modifyStock(it.itemId, newStock);
        } catch (err) {
          console.error('退货库存增加失败 itemId:', it.itemId, err);
        }
      }

      notification.success({ message: '退货订单创建成功，对应库存已更新' });
      returnForm.resetFields();
      setRowCache({});
      onClose();
      onSuccess();
    } catch (err: any) {
      if (!err?.errorFields) {
        console.error('退货订单失败:', err);
        notification.error({ message: '退货失败，请重试' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer title="退货订单" open={visible} onClose={onClose} width={900} footer={
      <div style={{ textAlign: 'right' }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>取消</Button>
        <Button type="primary" loading={loading} onClick={handleSubmit}>确认退货</Button>
      </div>
    }>
      <Form form={returnForm} layout="vertical">
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              <Form.Item>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>添加商品</Button>
              </Form.Item>
              {fields.map(({ key, name, ...restField }) => {
                const cache = rowCache[name] || { codeOptions: [], warehouseItems: [] };
                const cur = (returnForm.getFieldValue('items') || [])[name] || {};
                const colorOptions = [...new Set(cache.warehouseItems.map((i: any) => i.color).filter(Boolean))];
                const sizeOptions = [...new Set(cache.warehouseItems.filter((i: any) => !cur.color || i.color === cur.color).map((i: any) => i.size).filter(Boolean))];

                return (
                  <div key={key} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <Form.Item {...restField} name={[name, 'code']} label="商品代码" rules={[{ required: true, message: '请输入商品代码' }]}>
                      <AutoComplete
                        style={{ width: 180 }}
                        placeholder="输入code自动匹配"
                        options={(cache.codeOptions || []).map((d: any) => ({ value: d.design, label: `${d.design}  $${d.salePrice}`, designId: d.id, salePrice: d.salePrice }))}
                        onSearch={val => handleCodeSearch(name, val)}
                        onSelect={(val, opt) => handleCodeSelect(name, val, opt)}
                        filterOption={false}
                        allowClear
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'color']} label="颜色">
                      <Select placeholder="颜色" style={{ width: 130 }} options={colorOptions.map(c => ({ value: c, label: c }))} onChange={val => handleColorChange(name, val)} allowClear />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'size']} label="尺码">
                      <Select placeholder="尺码" style={{ width: 100 }} options={sizeOptions.map(s => ({ value: s, label: s }))} onChange={val => handleSizeChange(name, val)} allowClear />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'qty']} label="数量" initialValue={1} rules={[{ required: true, message: '请输入数量' }]}>
                      <InputNumber min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'remark']} label="备注">
                      <Input placeholder="退货原因" style={{ width: 160 }} />
                    </Form.Item>
                    <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginBottom: 24 }} />
                  </div>
                );
              })}
            </>
          )}
        </Form.List>
        <Form.Item name="operator" label="操作人" rules={[{ required: true, message: '请选择操作人' }]}>
          <Select placeholder="请选择操作人">
            {STAFF_LIST.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
          </Select>
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
  const [returnOrderVisible, setReturnOrderVisible] = useState(false);

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
        const processedData = response.data.content.map(item => {
          try {
            return { ...JSON.parse(item.body), ...item };
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
      console.error('获取库存修改记录失败:', error);
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
    { title: t('originalStock'), dataIndex: 'stock', key: 'stock', width: 100,
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
            <span>{t('originalStock')}: <b>{item.stock}</b></span>
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
            <Input placeholder="颜色" />
          </Form.Item>
          <Form.Item name="size" label={t('size')} className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[100px]">
            <Input placeholder="尺寸" />
          </Form.Item>
          <Form.Item name="operateDate" label={t('operationTime')} className="!mb-4 md:!mb-0 md:!flex-1 md:!min-w-[280px]">
            <DatePicker.RangePicker placeholder={[t('startTime'), t('endTime')]} className="w-full" />
          </Form.Item>
          <div className="flex gap-2 flex-wrap md:!mb-0">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('search')}</Button>
            <Button onClick={() => { form.resetFields(); fetchData(1); }} icon={<ReloadOutlined />}>{t('reset')}</Button>
            {canUseFeature('printLabel') && (
              <Button icon={<PrinterOutlined />} onClick={() => setPrintLabelVisible(true)}>打印标签</Button>
            )}
            <Button type="primary" danger icon={<PlusOutlined />} onClick={() => setReturnOrderVisible(true)}>退货订单</Button>
          </div>
        </Form>
      </Card>

      {/* 数据展示 */}
      <Card style={{ borderRadius: 12 }}>
        <div className="hidden md:block">
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

      {/* 打印标签 */}
      <PrintLabelPanel visible={printLabelVisible} onClose={() => setPrintLabelVisible(false)} />

      {/* 退货订单 */}
      <ReturnOrderDrawer visible={returnOrderVisible} onClose={() => setReturnOrderVisible(false)} onSuccess={() => fetchData(1)} />
    </div>
  );
}
