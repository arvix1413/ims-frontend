// 系统配置常量
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://119.28.104.20',
  TIMEOUT: 100000,
} as const;

// 店员列表 - 统一管理
export const STAFF_LIST = [
  'Serene',
  'Yen', 
  'Xiao Li',
  'Gabrielle',
  'Staff'
] as const;

// 支付状态
export const PAYMENT_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID'
} as const;

// 仓库类型
export const WAREHOUSE_TYPES = {
  IN_STORE: '店内仓',
  TEMP_STORE: '代存仓', 
  UNPAID_STORE: '未付仓',
  DAMAGED_STORE: '损耗仓'
} as const;

// 订单状态映射
export const ORDER_STATUS_MAP = {
  '0': { text: '待发货', color: '#faad14' },
  '1': { text: '已发货', color: '#1890ff' },
  '2': { text: '已完成', color: '#52c41a' },
  '3': { text: '缺货', color: '#ff4d4f' },
  '4': { text: '损坏', color: '#722ed1' },
  '5': { text: '已结单', color: '#52c41a' },
  '6': { text: '货到未取', color: '#fa8c16' },
  '7': { text: '未付try', color: '#eb2f96' },
} as const;

// Package充值配置
export const PACKAGE_TOPUP_MAP: Record<number, number> = {
  1200: 1350,
  1800: 2200,
  2800: 3500,
  3800: 5000,
  5000: 6750,
} as const;

// 表格默认配置
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_SCROLL: { x: 'max-content', y: 800 }
} as const;