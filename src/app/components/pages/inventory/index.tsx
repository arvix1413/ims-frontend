'use client';

import React, { useState } from 'react';
import { Table, Input, DatePicker, Button, Card, message, Pagination, Spin } from 'antd';
import Form from '@/app/components/common/ValidatedForm';
import { SearchOutlined, ReloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { InventoryRecordItem, InventoryRecordRequest } from '@/lib/types';
import { inventoryRecord } from '@/lib/api';
import { API_CONFIG } from '@/config/constants';
import { usePermissions } from '@/lib/usePermissions';
import moment from 'moment';
import { useInitialListRefresh } from '@/lib/useListRefresh';
import PrintLabelDrawer from '../bill/PrintLabelDrawer';

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
              // 店內庫存（修改前）
              inStoreStock: parsed?.inStoreStock,
              // 代存庫存（修改前）
              tempStoreStock: parsed?.tempStoreStock,
              // 修改後：優先用分開的欄位，舊記錄 fallback 到 newStock
              newInStoreStock: parsed?.newInStoreStock ?? null,
              newTempStoreStock: parsed?.newTempStoreStock ?? null,
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
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, fixed: 'left' as const,
      render: (id: number) => <span style={{ fontSize: 12, color: '#8c8c8c' }}>{id}</span>
    },
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
    {
      title: <span style={{ color: '#1677ff' }}>店內庫存</span>,
      children: [
        {
          title: '修改前', dataIndex: 'inStoreStock', key: 'inStoreStock', width: 80,
          render: (s: number) => <span style={{ fontWeight: 'bold', color: '#595959' }}>{s ?? '-'}</span>
        },
        {
          title: '修改後', dataIndex: 'newInStoreStock', key: 'newInStoreStock', width: 80,
          render: (s: number, record: any) => {
            if (s === null || s === undefined) return <span style={{ color: '#bfbfbf' }}>-</span>;
            const diff = s - (record.inStoreStock ?? 0);
            return (
              <span style={{ fontWeight: 'bold', color: diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : '#595959' }}>
                {s}{diff !== 0 && <span style={{ fontSize: 11, marginLeft: 4 }}>({diff > 0 ? '+' : ''}{diff})</span>}
              </span>
            );
          }
        },
      ]
    },
    {
      title: <span style={{ color: '#2563eb' }}>代存庫存</span>,
      children: [
        {
          title: '修改前', dataIndex: 'tempStoreStock', key: 'tempStoreStock', width: 80,
          render: (s: number) => <span style={{ fontWeight: 'bold', color: '#595959' }}>{s ?? '-'}</span>
        },
        {
          title: '修改後', dataIndex: 'newTempStoreStock', key: 'newTempStoreStock', width: 80,
          render: (s: number, record: any) => {
            if (s === null || s === undefined) return <span style={{ color: '#bfbfbf' }}>-</span>;
            const diff = s - (record.tempStoreStock ?? 0);
            return (
              <span style={{ fontWeight: 'bold', color: diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : '#595959' }}>
                {s}{diff !== 0 && <span style={{ fontSize: 11, marginLeft: 4 }}>({diff > 0 ? '+' : ''}{diff})</span>}
              </span>
            );
          }
        },
      ]
    },
    { title: t('operationTime'), dataIndex: 'createDate', key: 'createDate', width: 180 },
  ] as any[];

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
          <div className="bg-gray-50 rounded p-2 text-sm space-y-1">
            {/* 店內庫存 */}
            <div>
              <span style={{ color: '#1677ff', fontWeight: 600 }}>店內</span>
              <span className="ml-2 text-gray-500">修改前: <b>{item.inStoreStock ?? '-'}</b></span>
              <span className="ml-2">修改後: <b style={{ color: item.newInStoreStock > (item.inStoreStock ?? 0) ? '#52c41a' : item.newInStoreStock < (item.inStoreStock ?? 0) ? '#ff4d4f' : '#595959' }}>
                {item.newInStoreStock !== null && item.newInStoreStock !== undefined ? item.newInStoreStock : '-'}
              </b></span>
            </div>
            {/* 代存庫存 */}
            <div>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>代存</span>
              <span className="ml-2 text-gray-500">修改前: <b>{item.tempStoreStock ?? '-'}</b></span>
              <span className="ml-2">修改後: <b style={{ color: item.newTempStoreStock > (item.tempStoreStock ?? 0) ? '#52c41a' : item.newTempStoreStock < (item.tempStoreStock ?? 0) ? '#ff4d4f' : '#595959' }}>
                {item.newTempStoreStock !== null && item.newTempStoreStock !== undefined ? item.newTempStoreStock : '-'}
              </b></span>
            </div>
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
      <PrintLabelDrawer visible={printLabelVisible} onClose={() => setPrintLabelVisible(false)} />
    </div>
  );
}
