// 用户基本信息响应
export interface UserBasicResponse {
  msg: string;
  code: number;
  data: User;
}

// 用户类型枚举
export enum E_USER_TYPE {
  ADMIN = "ADMIN",
  SALER = "SALER", 
  FINANCE = "FINANCE",
  LOGISTICS = "LOGISTICS",
  KOREAN_LOGISTICS = "KOREAN_LOGISTICS",
  SUPERADMIN = "SUPERADMIN",
  PRODUCTMANAGEMENT = "PRODUCTMANAGEMENT"
}

// 用户相关类型定义
export interface User {
  id: number;
  name: string;
  type: string;
  deleted: number;
  local: string;
  createDate: string;
}

export interface UserListResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: User[];
  };
}

export interface CreateUserRequest {
  name: string;
  type: string;
  password: string;
}

export interface ModifyUserRequest {
  id: number;
  name: string;
  type: string;
}


// 表单相关类型
export interface UserFormData {
  name: string;
  type: string;
  password?: string;
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  size: number;
}

// 搜索分页参数
export interface SearchPageParams {
  desc: number;
  page: number;
  pageSize: number;
  sort: string;
}

// 用户列表请求参数
export interface UserListRequest {
  searchPage: SearchPageParams;
  keyWord: string;
}

// 商品设计相关类型
export interface DesignItem {
  id: number;
  type: string;
  design: string;
  salePrice: string;
  inStoreStock: number;
  tempStoreStock: number;
  previewPhoto: string;
}

export interface DesignListResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: DesignItem[];
  };
}

export interface DesignListRequest {
  typeList: string[];
  design: string;
  searchPage: SearchPageParams;
  hasStock?: number; // 是否有库存筛选
}

// 创建商品请求参数
export interface CreateDesignRequest {
  design: string;
  type: string;
  color: string[];
  size: string[];
  fabricList: Array<{ fabric: string; percent?: number }>;
  purchasePrice: string;
  salePrice: string;
  remark?: string;
  fabric: string;
  photos: string;
  previewPhoto: string;
}

// 创建Item请求参数
export interface CreateItemRequest {
  designId: number;
  warehouseName: string[];
  [key: string]: any;
}

// 爆/冷款商品数据类型
export interface HotColdItem {
  id: number;
  hot: number;
  type: string;
  design: string;
  salePrice: string;
  stock: number;
  previewPhoto: string;
}

export interface HotColdListResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: HotColdItem[];
  };
}

export interface HotColdListRequest {
  type: string;
  searchPage: SearchPageParams;
}

// 库存修改记录相关类型
export interface InventoryRecordItem {
  id: number;
  userId: number;
  userName: string;
  uri: string;
  body: string;
  createDate: string;
}

export interface InventoryRecordResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: InventoryRecordItem[];
  };
}

export interface InventoryRecordRequest {
  searchPage: SearchPageParams;
  uri: string;
  body?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
}

// 会员管理相关类型
export interface MemberData {
  id: number;
  name: string;
  phone: string;
  voucherNumber: number;
  balance: number;
  membershipPackageTotal: number;
  remark: string;
  registrationDate: string;
  // 新增字段
  height?: number;  // 身高（cm）
  weight?: number;  // 体重（kg）
  size?: string;    // 尺码
  personalNotes?: string;  // 个人备注及喜好
}

export interface MemberListResponse {
  msg: string;
  code: number;
  data: any[];
}
export interface MemberPageResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: MemberData[];
  };
}


export interface MemberListRequest {
  searchPage: SearchPageParams;
  name?: string;
  phone?: string;
}

// 客户管理（账单客人，电话唯一）
export interface CustomerData {
  id: number;
  name: string;
  phone: string;
  remark?: string;
  createDate?: string;
  modifyDate?: string;
}

export interface CustomerPageResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: CustomerData[];
  };
}

export interface CustomerListResponse {
  msg: string;
  code: number;
  data: CustomerData[];
}

export interface CustomerListRequest {
  searchPage: SearchPageParams;
  name?: string;
  phone?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  remark?: string;
}

export interface ModifyCustomerRequest {
  id: number;
  name: string;
  phone: string;
  remark?: string;
}

export interface ModifyMemberRequest {
  id: number;
  name: string;
  phone: string;
  registrationDate: string;
  voucherNumber: number;
  remark: string;
  // 新增字段
  height?: number;
  weight?: number;
  size?: string;
  personalNotes?: string;
}

export interface TopUpMemberRequest {
  id: number;
  saler: string;
  balance: number;
  remark: string;
}

// 会员购买记录相关类型
export interface PurchaseItem {
  itemId?: number;     // t_item.id，用于精确定位库存
  designCode: string;
  price: number;
  number?: number;     // 数量
  color?: string;
  size?: string;
  stockType?: string;  // order 或 inStock
}

export interface MemberPurchaseRecord {
  id: number;
  type: number;
  saler: string;
  memberId: number;
  designString: string;
  designList: PurchaseItem[];
  sum: number;
  memberRemainingAmount: number;
  purchaseDate: string;
  createDate: string;
  remark: string;
  memberName: string;
  memberPhone: string;
  voucherNumber: number;
}

export interface MemberPurchaseResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: MemberPurchaseRecord[];
  };
}

export interface MemberPurchaseRequest {
  memberId: number;
  searchPage: SearchPageParams;
}

// 新增会员相关类型
export interface CreateMemberRequest {
  name: string;
  phone: string;
  registrationDate: string;
  voucherNumber: number;
  remark: string;
  balance: number;
  membershipPackageTotal: number;
  // 新增字段
  height?: number;
  weight?: number;
  size?: string;
  personalNotes?: string;
}

// 新增购买记录相关类型
export interface CreatePurchaseRecordRequest {
  purchaseDate: string;
  designs: Array<{
    itemId?: number;      // t_item.id，inStock 时必填
    designCode: string;
    color?: string;
    size?: string;
    number?: number;      // 数量，默认 1
    price: number;
    stockType?: string;   // inStock | order
  }>;
  saler: string;
  remark: string;
  memberId: number;
  sum: string;
}

// 会员购买记录查询相关类型
export interface MemberPurchaseHistoryRequest {
  searchPage: SearchPageParams;
  refund?: number;
  types?: number[];
  memberName?: string;
  voucherNumber?: string;
}

export interface MemberPurchaseHistoryResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: MemberPurchaseRecord[];
  };
}

// 员工操作历史记录相关类型
export interface EmployeeOperationLog {
  id: number;
  userId: number;
  userName: string;
  uri: string;
  body: string;
  createDate: string;
}

export interface EmployeeOperationLogResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: EmployeeOperationLog[];
  };
}

export interface EmployeeOperationLogRequest {
  searchPage: SearchPageParams;
  userName?: string;
  uri?: string;
  startDate?: string;
  endDate?: string;
}

// 账单管理相关类型
export interface ReceiptItem {
  qty: number;
  code: string;
  price: number;
  discount: number;
  finalPrice: number;
  discountPercent: number;
}

export interface ReceiptData {
  id: number;
  refNo: string;
  itemList: ReceiptItem[] | string;
  receiptDate: string;
  createDate: string;
  cashier: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  paymentList?: Array<{ payment: string; amount: number }>;
  totalPrice?: number;
  store?: number;
  gst?: number;
  void?: number;
  voided?: number;
}

export interface ReceiptListResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: ReceiptData[];
  };
}

export interface ReceiptListRequest {
  searchPage: SearchPageParams;
  store: number;
  refNo?: string;
  item?: string;
  startDateTime?: string;
  endDateTime?: string;
  customerId?: number;
  customerPhone?: string;
}

// 打印账单相关类型
export interface PrintReceiptItem {
  code: string;
  qty: number;
  price: number;
  discountPercent: number;
  discount: number;
  finalPrice: number;
  color?: string;
  size?: string;
  itemId?: number | null;
  stockType?: 'order' | 'inStock';  // order或in stock标识
}

export interface PrintReceiptPayment {
  payment: string;
  amount: number;
}

export interface PrintReceiptRequest {
  shop: string;
  cashier: string;
  item: PrintReceiptItem[];
  paymentList: PrintReceiptPayment[];
  gst: number;
  totalPrice: number;
  store: number;
  address: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
}

// Package充值配置
export const PACKAGE_TOPUP_MAP: Record<number, number> = {
  1200: 1350,
  1800: 2200,
  2800: 3500,
  3800: 5000,
  5000: 6750,
} as const;

// 打印标签相关类型
export interface PrintLabelRequest {
  code: string;
  color: string;
  size: string;
  salePrice: number;
  store: number;
  count: number;
}

// 打印每日结单相关类型
export interface PrintDailyReportRequest {
  store: number;
  saler: string;
  date: string;
  shop: string;
}

// 每日销售情况相关类型
export interface DailySaleRequest {
  startDate: string;
  endDate: string;
  store: number;
}

export interface DailySaleData {
  date: string;
  cashier: string;
  totalPrice: number;
}

export interface DailySaleResponse {
  msg: string;
  code: number;
  data: DailySaleData[];
}

// 现金进出相关类型
export interface CashData {
  id: number;
  amount: number;
  createDate: string;
  remark: string;
  type?: number;
  store?: number;
}

export interface CashListResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: CashData[];
  };
}

export interface CashListRequest {
  searchPage: SearchPageParams;
  store: number;
  startDateTime?: string;
  endDateTime?: string;
}

export interface CreateCashRequest {
  type: number; // 1: Cash In, 2: Cash Out
  amount: number;
  remark: string;
  store: number;
}

// 现金抽屉余额相关类型
export interface CashDrawerData {
  id: number;
  amount: number;
  type: number; // 1: Opening Balance, 2: Closing Balance
  createDate: string;
  remark?: string;
  store?: number;
}

export interface CashDrawerListResponse {
  msg: string;
  code: number;
  data: {
    number: number;
    size: number;
    totalPages: number;
    numberOfElements: number;
    totalElements: number;
    content: CashDrawerData[];
  };
}

export interface CashDrawerListRequest {
  searchPage: SearchPageParams;
  store: number;
  startDateTime?: string;
  endDateTime?: string;
}

export interface CreateCashDrawerRequest {
  type: number; // 1: Opening Balance, 2: Closing Balance
  amount: number;
  store: number;
  date: string;
}

// 商品类型选项
export const typeList: any[] = [
  { value: 'AL', label: 'A型裙' },
  { value: 'DR', label: 'DR连衣裙' },
  { value: 'TB', label: 'TB上衣' },
  { value: 'SK', label: 'SK半裙' },
  { value: 'ST', label: 'ST短裤' },
  { value: 'PT', label: 'PT裤子' },
  { value: 'GO', label: 'GO晚礼服' },
  { value: 'JK', label: 'JK外套' },
  { value: 'JS', label: 'JS连体裤' },
  { value: 'BT', label: 'BT皮带' },
  { value: 'SH', label: 'SH鞋子' },
  { value: 'SE', label: 'SE套装' },
  { value: 'SI', label: 'SI真丝' },
  { value: 'AC', label: 'AC饰品' },
  { value: 'BG', label: 'BG包包' },
  { value: 'CDJ', label: 'CDJ穿戴甲' },
  { value: 'SO', label: "SO特价" },
  { value: 'CL', label: 'Classic经典款' },
  { value: 'IN', label: 'IN内搭' },
  { value: 'BP', label: 'BP护肤' },
  { value: 'XL', label: "L & XL加价大码" },
];

// 颜色选项
export const colorList = ['Black','White','Beige','Pink','Blue', 'Grey', 'Khaki','Red', 'Silver','Orange', 'Yellow', 'Green',   'Stripes', 'Grid', 'Purple',    'Brown', 'Champagne', 'Navy', 'Sky', 'Mustard', 'Mint', 'Peach', 'Cream', 'Charcoal',  'Gold'];

// 面料选项
export const fabricList = ['Knits', 'Denim', 'Silk', 'Polyester', 'Lace', 'Chiffon', 'Cotton', 'Linen', 'Tweed fabric', 'Stretch fabrics', 'leather', 'PVC'];

// 尺码选项
export const sizeList = ['Free Size', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

// 仓库枚举
export enum WAREHOUSE {
  SLADY = 'Slady一店',
  SL = 'SL二店',
  LIVE = 'Live直播间'
}

// 商品详情类型
export interface DesignDetail {
  id: number;
  design: string;
  type: string;
  hot: number;
  fabric: string;
  photos: string;
  stock: number;
  salePrice: string;
  purchasePrice: string;
  previewPhoto: string;
  color: string[];
  size: string[];
  createDate: string;
  remark:string;
}

export interface DesignDetailResponse {
  msg: string;
  code: number;
  data: DesignDetail;
}

// 修改商品请求参数
export interface ModifyDesignRequest {
  id: number;
  design: string;
  type: string;
  purchasePrice: string;
  salePrice: string;
  remark?: string;
}

// Item相关类型定义
export interface ItemData {
  id: number;
  designId: number;
  color: string;
  size: string;
  warehouseName: string;
  createDate: string;
  inStoreStock: number;      // 店内仓
  tempStoreStock: number;    // 代存仓
  damagedStock: number;      // 损耗仓
}

// 创建订单请求参数
export interface CreateOrderRequest {
  itemId: number;
  amount: number;
  type: number;
  remark: string;
  paymentStatus: number;
  status: string;
  customerContact?: string;   // 姓名电话
  paymentFlag?: string;       // PAID / UNPAID
  orderedBy?: string;         // 订货人
  statusChangeUserId?: number;
  statusChangeUserName?: string;
  statusChangeTime?: string;
}

// 创建商品请求参数
export interface CreateItemRequest {
  designId: number;
  warehouseName: string[];
  color: string[];
  size: string[];
  inStoreStock: number;
}

// 订单状态历史记录
export interface OrderStatusHistory {
  fromStatus?: string; // 原状态
  toStatus: string; // 目标状态
  userId: number; // 操作人ID
  userName: string; // 操作人名字
  time: string; // 操作时间
}

// 订单数据
export interface OrderData {
  id: number;
  itemId: number;
  previewPhoto: string;
  design: string;
  warehouseName: string;
  designCode: string;
  salePrice: string;
  color: string;
  size: string;
  amount: number;
  date: string;
  remark: string;
  status: string;
  paymentStatus: number;
  createDate: string;
  type?: number;               // 订单类型：0-店补，1-客定
  customerContact?: string;    // 姓名电话
  paymentFlag?: string;        // PAID/UNPAID
  orderedBy?: string;          // 订货人
  pendingDate?: string; // 旧字段，保留兼容性
  operator?: string; // 旧字段，保留兼容性
  statusChangeUserId?: number; // 状态变更操作人ID
  statusChangeUserName?: string; // 状态变更操作人名字
  statusChangeTime?: string; // 状态变更时间
  statusHistory?: string; // 状态历史记录（JSON 字符串）
}

// 订单分页请求参数
export interface OrderPageRequest {
  areaType: number;
  warehouseName: string;
  searchPage: SearchPageParams;
  status: string[];
  design?: string;
  remark?: string;
  startDate?: string;
  endDate?: string;
}

// 订单分页响应
export interface OrderPageResponse {
  number: number;
  size: number;
  totalPages: number;
  numberOfElements: number;
  totalElements: number;
  content: OrderData[];
}

// 修改订单请求参数
export interface ModifyOrderRequest {
  size?: string;
  color?: string;
  remark?: string;
  amount?: number;
  id: number;
  customerContact?: string;
  paymentFlag?: string;
  orderedBy?: string;
  pendingDate?: string; // 旧字段，保留兼容性
  status?: string;
  operator?: string; // 旧字段，保留兼容性
  statusChangeUserId?: number; // 状态变更操作人ID
  statusChangeUserName?: string; // 状态变更操作人名字
  statusChangeTime?: string; // 状态变更时间 (格式: YYYY-MM-DD HH:mm:ss)
}
