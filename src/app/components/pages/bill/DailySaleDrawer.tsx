'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, DatePicker, Table, Drawer, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { DailySaleData } from '@/lib/types';
import { printService } from '@/lib/api';
import { usePermissions } from '@/lib/usePermissions';
import moment from 'moment';
import { saler } from './PrintReceipt';

interface DailySaleDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// 转换数据 -> pivot 格式
function transformData(data: DailySaleData[]) {
  const grouped: any = {};
  
  // 收集所有出现过的收银员（包括已删除的）
  const allCashiers = new Set<string>();

  data.forEach((item: DailySaleData) => {
    allCashiers.add(item.cashier);
    
    if (!grouped[item.date]) {
      grouped[item.date] = { date: item.date };
      // 初始化 saler 数组中的收银员（用于显示列）
      saler.forEach(c => (grouped[item.date][c] = null));
    }
    grouped[item.date][item.cashier] = item.totalPrice;
  });

  // 计算每行总计（包含所有收银员的销售额，不仅限于 saler 数组）
  Object.values(grouped).forEach((row: any) => {
    let sum = 0;
    // 遍历行中的所有 key（除了 date），累加所有收银员的销售额
    Object.keys(row).forEach(key => {
      if (key !== 'date' && row[key] !== null) {
        sum += row[key];
      }
    });
    row.total = parseFloat(sum.toFixed(2));
  });

  // 添加总计行
  const totalRow: any = { date: "total" };
  
  // 为 saler 数组中的收银员计算总计（用于显示）
  saler.forEach((c: any) => {
    const sum = Object.values(grouped).reduce((sum: number, row: any) => sum + (row[c] || 0), 0);
    totalRow[c] = parseFloat(sum.toFixed(2));
  });
  
  // 为已删除的收银员也计算总计（他们的数据也要加入 total）
  allCashiers.forEach(cashier => {
    if (!saler.includes(cashier)) {
      const sum = Object.values(grouped).reduce((sum: number, row: any) => sum + (row[cashier] || 0), 0);
      totalRow[cashier] = parseFloat(sum.toFixed(2));
    }
  });
  
  // 计算总计的 total 列（所有收银员的总和）
  let totalSum = 0;
  Object.keys(totalRow).forEach(key => {
    if (key !== 'date') {
      totalSum += totalRow[key];
    }
  });
  totalRow.total = parseFloat(totalSum.toFixed(2));

  return {
    tableData: [...Object.values(grouped), totalRow],
    allCashiers: Array.from(allCashiers)
  };
}

export default function DailySaleDrawer({ visible, onClose }: DailySaleDrawerProps) {
  const { t } = useTranslation();
  const { getFinanceStoreAccess } = usePermissions();
  const [data, setData] = useState<any[]>([]);
  const [dateTime, setDateTime] = useState<any>();
  const [activeTab, setActiveTab] = useState('2'); // 默认二店
  const [loading, setLoading] = useState(false);
  const [allCashiers, setAllCashiers] = useState<string[]>([]); // 存储所有收银员（包括已删除的）

  // 获取财务用户可访问的店铺
  const financeStoreAccess = getFinanceStoreAccess();

  // 动态生成表格列（包括已删除的收银员）
  const columns = useMemo(() => {
    return [
      { title: "Date", dataIndex: "date", key: "date", fixed: 'left' as const },
      // 先显示 saler 数组中的活跃收银员
      ...saler.map(c => ({
        title: c,
        dataIndex: c,
        key: c,
        render: (value: number | null | undefined) => (value != null && !isNaN(value)) ? value.toFixed(2) : '0.00',
      })),
      // 再显示已删除的收银员（以灰色标记）
      ...allCashiers
        .filter(c => !saler.includes(c))
        .map(c => ({
          title: `${c} (已删除)`,
          dataIndex: c,
          key: c,
          render: (value: number | null | undefined) => (
            <span style={{ color: '#999', fontStyle: 'italic' }}>
              {(value != null && !isNaN(value)) ? value.toFixed(2) : '0.00'}
            </span>
          ),
        })),
      { 
        title: "total", 
        dataIndex: "total", 
        key: "total",
        fixed: 'right' as const,
        render: (value: number | null | undefined) => (
          <strong>{(value != null && !isNaN(value)) ? value.toFixed(2) : '0.00'}</strong>
        ),
      }
    ];
  }, [allCashiers]);

  // 查询数据
  const onQuery = useCallback(async () => {
    try {
      setLoading(true);
      let query: any;
      
      if (dateTime) {
        query = {
          startDateTime: dateTime[0].format('YYYY-MM-DD') + " 00:00:00",
          endDateTime: dateTime[1].format('YYYY-MM-DD') + " 23:59:59",
          store: parseInt(activeTab),
        };
      } else {
        query = {
          startDateTime: moment(new Date()).format('YYYY-MM-DD') + " 00:00:00",
          endDateTime: moment(new Date()).format('YYYY-MM-DD') + " 23:59:59",
          store: parseInt(activeTab),
        };
      }

      const res = await printService.getDailySale(query);
      if (res.code === 200) {
        const result = transformData(res.data);
        setAllCashiers(result.allCashiers);
        setData(result.tableData);
      }
    } catch (error) {
      console.error('获取销售数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dateTime, activeTab]);

  // 初始化数据
  useEffect(() => {
    if (visible) {
      onQuery();
    }
  }, [visible, onQuery]);

  // Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 根据财务用户权限过滤可显示的店铺
  const tabItems = useMemo(() => {
    const allTabs = [
      {
        key: '1',
        label: '一店',
        children: (
          <div>
            <div style={{ marginBottom: 16 }}>
              <DatePicker.RangePicker 
                placeholder={[t('startTime'), t('endTime')]} 
                onChange={(e) => setDateTime(e)}
                style={{ marginRight: 16 }}
              />
              <Button type="primary" onClick={onQuery} loading={loading}>
              {t('search')}
              </Button>
            </div>
            
            <div style={{ height: 20 }}></div>
            
            <Table
              dataSource={data}
              columns={columns}
              pagination={false}
              bordered
              rowKey="date"
              loading={loading}
              scroll={{ x: 1500 }}
            />
          </div>
        ),
      },
      {
        key: '2',
        label: '二店',
        children: (
          <div>
            <div style={{ marginBottom: 16 }}>
              <DatePicker.RangePicker 
                placeholder={[t('startTime'), t('endTime')]} 
                onChange={(e) => setDateTime(e)}
                style={{ marginRight: 16 }}
              />
              <Button type="primary" onClick={onQuery} loading={loading}>
              {t('search')}
              </Button>
            </div>
            
            <div style={{ height: 20 }}></div>
            
            <Table
              dataSource={data}
              columns={columns}
              pagination={false}
              bordered
              rowKey="date"
              loading={loading}
              scroll={{ x: 1500 }}
            />
          </div>
        ),
      },
    ];

    // 如果是财务用户且只能访问特定店铺，则只显示该店铺
    if (financeStoreAccess !== null) {
      return allTabs.filter(tab => tab.key === financeStoreAccess.toString());
    }

    // 否则显示所有店铺
    return allTabs;
  }, [financeStoreAccess, t, data, loading, onQuery, dateTime]);

  // 当财务用户只能访问一个店铺时，自动设置activeTab
  useEffect(() => {
    if (financeStoreAccess !== null) {
      setActiveTab(financeStoreAccess.toString());
    }
  }, [financeStoreAccess]);

  return (
    <Drawer
      title={t('dailySales')}
      placement="right"
      onClose={onClose}
      open={visible}
      width={800}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose}>{t('close')}</Button>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
      />
    </Drawer>
  );
}
