import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { API_CONFIG } from '@/config/constants';
import { UserListResponse, CreateUserRequest, ModifyUserRequest, PaginationParams, UserListRequest, DesignListResponse, DesignListRequest, DesignDetailResponse, ModifyDesignRequest, CreateDesignRequest, CreateItemRequest, SearchPageParams, ItemData, CreateOrderRequest, OrderPageRequest, OrderPageResponse, ModifyOrderRequest, HotColdListResponse, HotColdListRequest, InventoryRecordResponse, InventoryRecordRequest, CustomerListResponse, CustomerListRequest, CustomerPageResponse, CustomerData, CreateCustomerRequest, ModifyCustomerRequest, MemberListResponse, MemberListRequest, ModifyMemberRequest, TopUpMemberRequest, MemberPurchaseResponse, MemberPurchaseRequest, CreateMemberRequest, CreatePurchaseRecordRequest, MemberPurchaseHistoryRequest, MemberPurchaseHistoryResponse, EmployeeOperationLogResponse, EmployeeOperationLogRequest, ReceiptListResponse, ReceiptListRequest, PrintReceiptRequest, PrintLabelRequest, PrintDailyReportRequest, DailySaleRequest, DailySaleResponse, CashListResponse, CashListRequest, CreateCashRequest, CashDrawerListResponse, CashDrawerListRequest, CreateCashDrawerRequest, UserBasicResponse, MemberPageResponse } from './types';
import GlobalNotification from './notificationUtils';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 避免重复处理401导致多次弹窗/跳转
let isHandlingUnauthorized = false;

// 请求拦截器 - 添加token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ims-token');
    if (token) {
      config.headers['ims-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期和业务错误码
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 一些接口会以HTTP 200返回，但业务code为401，这里统一处理
    const bizCode = (response?.data && (response.data.code ?? response.data.status)) as number | undefined;
    if (bizCode === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      const serverMsg = response.data?.message || response.data?.msg;
      const message = serverMsg || 'Token is expired or not found, please log in again';
      try { GlobalNotification.error('登录已过期', message); } catch (_) {}
      try { localStorage.removeItem('ims-token'); } catch (_) {}
      if (typeof window !== 'undefined') {
        const pathname = window.location?.pathname || '';
        if (pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      // 返回一个拒绝的Promise，阻止后续业务逻辑继续执行
      return Promise.reject(new Error('Unauthorized'));
    }
    // 处理非200的业务错误码，显示错误提示
    if (bizCode !== undefined && bizCode !== 200) {
      const errorMsg = response.data?.msg || response.data?.message || '请求失败';
      try {
        GlobalNotification.error('错误', errorMsg);
      } catch (_) {
        // 如果 GlobalNotification 未初始化，忽略错误
      }
    }
    return response;
  },
  (error) => {
    if (!isHandlingUnauthorized && (error.response?.status === 401 || error.response?.data?.code === 401)) {
      isHandlingUnauthorized = true;
      // Token过期，统一处理：提示并跳转登录
      const serverMsg = error.response?.data?.message || error.response?.data?.msg;
      const message = serverMsg || 'Token is expired or not found, please log in again';

      try {
        GlobalNotification.error('登录已过期', message);
      } catch (_) {}

      try {
        localStorage.removeItem('ims-token');
      } catch (_) {}

      if (typeof window !== 'undefined') {
        const pathname = window.location?.pathname || '';
        if (pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API接口类型定义
export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  msg: string;
  code: number;
  data: string;
}

export interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data: T;
}

// API方法封装
export const api = {
  // 登录接口
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  // 用户管理接口
  user: {
    // 获取用户基本信息
    getBasic: async (): Promise<UserBasicResponse> => {
      const response = await apiClient.post<UserBasicResponse>('/user/basic');
      return response.data;
    },

    // 获取用户列表
    getList: async (params: UserListRequest): Promise<UserListResponse> => {
      const response = await apiClient.post<UserListResponse>(API_ENDPOINTS.USER.LIST, params);
      return response.data;
    },

    // 创建用户
    create: async (data: CreateUserRequest): Promise<ApiResponse> => {
      const response = await apiClient.put<ApiResponse>(API_ENDPOINTS.USER.CREATE, data);
      return response.data;
    },

    // 修改用户
    modify: async (data: ModifyUserRequest): Promise<ApiResponse> => {
      const response = await apiClient.put<ApiResponse>(API_ENDPOINTS.USER.MODIFY, data);
      return response.data;
    },

    // 删除用户
    delete: async (data: number[]): Promise<ApiResponse> => {
      const response = await apiClient.delete<ApiResponse>(API_ENDPOINTS.USER.DELETE, { data });
      return response.data;
    },
  },

  // 商品设计接口
  design: {
    // 获取商品设计列表
    getList: async (params: DesignListRequest): Promise<DesignListResponse> => {
      const response = await apiClient.post<DesignListResponse>(API_ENDPOINTS.PRODUCT.DESIGN, params);
      return response.data;
    },

    // 获取商品详情
    getDetail: async (id: number): Promise<DesignDetailResponse> => {
      const response = await apiClient.get<DesignDetailResponse>(`${API_ENDPOINTS.PRODUCT.DESIGN_DETAIL}?id=${id}`);
      return response.data;
    },

    // 修改商品
    modify: async (data: ModifyDesignRequest): Promise<ApiResponse> => {
      const response = await apiClient.put<ApiResponse>(API_ENDPOINTS.PRODUCT.DESIGN_MODIFY, data);
      return response.data;
    },

    // 删除商品
    delete: async (ids: number[]): Promise<ApiResponse> => {
      const response = await apiClient.delete<ApiResponse>(API_ENDPOINTS.PRODUCT.DESIGN_DELETE, { data: ids });
      return response.data;
    },

    // 创建商品
    create: async (data: CreateDesignRequest): Promise<ApiResponse<{ id: number }>> => {
      const response = await apiClient.put<ApiResponse<{ id: number }>>(API_ENDPOINTS.PRODUCT.DESIGN_CREATE, data);
      return response.data;
    },
  },

  // 文件上传接口
  file: {
    // 上传文件
    upload: async (formData: FormData): Promise<ApiResponse<string>> => {
      const response = await apiClient.put<ApiResponse<string>>(API_ENDPOINTS.FILE.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    // 获取文件列表
    getList: async (folderPath: string): Promise<ApiResponse<string[]>> => {
      const response = await apiClient.get<ApiResponse<string[]>>(`/file/list?folderPath=${encodeURIComponent(folderPath)}`);
      return response.data;
    },

    // 修改文件
    modify: async (formData: FormData): Promise<ApiResponse> => {
      const response = await apiClient.post<ApiResponse>('/file/modify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },

  // Item接口
  item: {
    // 创建Item
    create: async (data: CreateItemRequest): Promise<ApiResponse> => {
      const response = await apiClient.put<ApiResponse>(API_ENDPOINTS.ITEM.CREATE, data);
      return response.data;
    },
  },

  // 通用GET请求
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  // 通用POST请求
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  // 通用PUT请求
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  // 通用DELETE请求
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  },
};

// Item相关API
export const item = {
  // 获取商品库存列表
  getList: async (params: { designId: number; warehouseName: string; searchPage: SearchPageParams }): Promise<ApiResponse<ItemData[]>> => {
    const response = await apiClient.post<ApiResponse<ItemData[]>>('/item/list', params);
    return response.data;
  },
  
  // 删除商品
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>('/item/delete', {
      data: [id]
    });
    return response.data;
  },
  
  // 修改库存
  modifyStock: async (id: number, stock: number): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/item/modify-stock?id=${id}&stock=${stock}`);
    return response.data;
  },
  
  // 创建商品
  create: async (params: CreateItemRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/item/create', params);
    return response.data;
  },
};

// Order相关API
export const order = {
  // 创建订单
  create: async (params: CreateOrderRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/order/create', params);
    return response.data;
  },
  
  // 获取订单分页列表
  getPage: async (params: OrderPageRequest): Promise<ApiResponse<OrderPageResponse>> => {
    const response = await apiClient.post<ApiResponse<OrderPageResponse>>('/order/page', params);
    return response.data;
  },
  
  // 修改订单
  modify: async (params: ModifyOrderRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/order/modify', params);
    return response.data;
  },
  
  // 删除订单
  delete: async (ids: number[]): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>('/order/delete', {
      data: ids
    });
    return response.data;
  },
  
  // 导出订单
  export: async (params: OrderPageRequest) => {
    const response = await apiClient.post('/order/export', params);
    return response.data;
  },
};

// 爆/冷款API
export const hotCold = {
  // 获取爆/冷款列表
  getList: async (params: HotColdListRequest): Promise<HotColdListResponse> => {
    const response = await apiClient.post<HotColdListResponse>('/design/page', params);
    return response.data;
  },
};

// 库存修改记录API
export const inventoryRecord = {
  // 获取库存修改记录列表
  getList: async (params: InventoryRecordRequest): Promise<InventoryRecordResponse> => {
    const response = await apiClient.post<InventoryRecordResponse>('/operation-log/list', params);
    return response.data;
  },
};

// 客户管理API
export const customerApi = {
  getList: async (params: CustomerListRequest): Promise<CustomerListResponse> => {
    const response = await apiClient.post<CustomerListResponse>('/customer/list', params);
    return response.data;
  },
  getPage: async (params: CustomerListRequest): Promise<CustomerPageResponse> => {
    const response = await apiClient.post<CustomerPageResponse>('/customer/page', params);
    return response.data;
  },
  fetchByPhone: async (phone: string): Promise<ApiResponse<CustomerData>> => {
    const response = await apiClient.get<ApiResponse<CustomerData>>('/customer/fetch-by-phone', { params: { phone } });
    return response.data;
  },
  create: async (params: CreateCustomerRequest): Promise<ApiResponse<CustomerData>> => {
    const response = await apiClient.put<ApiResponse<CustomerData>>('/customer/create', params);
    return response.data;
  },
  modify: async (params: ModifyCustomerRequest): Promise<ApiResponse<CustomerData>> => {
    const response = await apiClient.put<ApiResponse<CustomerData>>('/customer/modify', params);
    return response.data;
  },
  delete: async (ids: number[]): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>('/customer/delete', { data: ids });
    return response.data;
  },
};

// 会员管理API
export const member = {
  // 获取会员列表
  getList: async (params: MemberListRequest): Promise<MemberListResponse> => {
    const response = await apiClient.post<MemberListResponse>('/member/list', params);
    return response.data;
  },
    // 获取会员列表
  getPage: async (params: MemberListRequest): Promise<MemberPageResponse> => {
    const response = await apiClient.post<MemberPageResponse>('/member/page', params);
    return response.data;
  },
  // 修改会员信息
  modify: async (params: ModifyMemberRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/member/modify', params);
    return response.data;
  },
  
  // 会员充值
  topUp: async (params: TopUpMemberRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/member/top-up', params);
    return response.data;
  },
  
  // 删除会员
  delete: async (ids: number[]): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>('/member/delete', {
      data: ids
    });
    return response.data;
  },
  
  // 获取会员购买记录
  getPurchaseHistory: async (params: MemberPurchaseRequest): Promise<MemberPurchaseResponse> => {
    const response = await apiClient.post<MemberPurchaseResponse>('/memberPurchaseHistory/page', params);
    return response.data;
  },
  
  // 创建会员
  create: async (params: CreateMemberRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/member/create', params);
    return response.data;
  },
  
  // 创建购买记录
  createPurchaseRecord: async (params: CreatePurchaseRecordRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/memberPurchaseHistory/create', params);
    return response.data;
  },
  
  // 删除购买记录
  deletePurchaseRecord: async (ids: number[]): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>('/memberPurchaseHistory/delete', {
      data: ids
    });
    return response.data;
  },
  
  // 获取会员购买记录（通用查询）
  getPurchaseHistoryList: async (params: MemberPurchaseHistoryRequest): Promise<MemberPurchaseHistoryResponse> => {
    const response = await apiClient.post<MemberPurchaseHistoryResponse>('/memberPurchaseHistory/page', params);
    return response.data;
  },
};

// 员工操作历史记录API
export const employeeOperationLog = {
  // 获取员工操作历史记录列表
  getList: async (params: EmployeeOperationLogRequest): Promise<EmployeeOperationLogResponse> => {
    const response = await apiClient.post<EmployeeOperationLogResponse>('/operation-log/list', params);
    return response.data;
  },
};

// 账单管理API
export const receipt = {
  // 获取账单列表
  getList: async (params: ReceiptListRequest): Promise<ReceiptListResponse> => {
    const response = await apiClient.post<ReceiptListResponse>('/receipt/page', params);
    return response.data;
  },
  
  // 重新打印账单
  reprint: async (receiptId: number): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/print/reprint/receipt?receiptId=${receiptId}`);
    return response.data;
  },
  
  // 打印账单
  print: async (params: PrintReceiptRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/print/receipt', params);
    return response.data;
  },
  
  // 删除账单
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/receipt/delete?id=${id}`);
    return response.data;
  },
  modifyVoided: async (id: number, voided: number): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/receipt/modify-voided?id=${id}&voided=${voided}`);
    return response.data;
  },
};

// 设计服务API（用于打印账单时获取商品价格）
export const designService = {
  // 获取设计列表（用于扫码获取价格）
  getList: async (params: DesignListRequest): Promise<DesignListResponse> => {
    const response = await apiClient.post<DesignListResponse>('/design/page', params);
    return response.data;
  },
  
  // 获取设计详情（用于自动填充价格/颜色/尺码）
  getDesignDetail: async (params: { design: string }): Promise<any> => {
    // 先用 list 拿到 id
    const listRes = await apiClient.post<any>('/design/list', params);
    if (listRes.data?.code !== 200 || !listRes.data?.data?.length) {
      return listRes.data;
    }
    const id = listRes.data.data[0].id;
    // 再用 detail 拿颜色/尺码
    const detailRes = await apiClient.get<any>(`/design/detail?id=${id}`);
    if (detailRes.data?.code === 200) {
      // 合并 list 的 salePrice 和 detail 的 color/size
      const merged = { ...listRes.data.data[0], ...detailRes.data.data };
      return { ...detailRes.data, data: [merged] };
    }
    return listRes.data;
  },
};

// 打印服务API
export const printService = {
  // 打印标签
  printLabel: async (params: PrintLabelRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/print/label', params);
    return response.data;
  },
  
  // 打印每日结单
  printDailyReport: async (params: PrintDailyReportRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/print/daily/report', params);
    return response.data;
  },
  
  // 获取每日销售情况
  getDailySale: async (params: DailySaleRequest): Promise<DailySaleResponse> => {
    const response = await apiClient.post<DailySaleResponse>('/receipt/group/cashier/day', params);
    return response.data;
  },
};

// 现金管理API
export const cashService = {
  // 获取现金进出列表
  getList: async (params: CashListRequest): Promise<CashListResponse> => {
    const response = await apiClient.post<CashListResponse>('/cash/page', params);
    return response.data;
  },
  
  // 创建现金进出记录
  create: async (params: CreateCashRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/cash/create', params);
    return response.data;
  },
  
  // 删除现金进出记录
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/cash/delete?id=${id}`);
    return response.data;
  },
};

// 现金抽屉余额API
export const cashDrawerService = {
  // 获取现金抽屉余额列表
  getList: async (params: CashDrawerListRequest): Promise<CashDrawerListResponse> => {
    const response = await apiClient.post<CashDrawerListResponse>('/cashDrawer/page', params);
    return response.data;
  },
  
  // 创建现金抽屉余额记录
  create: async (params: CreateCashDrawerRequest): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/cashDrawer/create', params);
    return response.data;
  },
  
  // 删除现金抽屉余额记录
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/cashDrawer/delete?id=${id}`);
    return response.data;
  },
  
  // 打开钱箱
  open: async (store: number): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/cashDrawer/open', { store });
    return response.data;
  },
};

export default apiClient;
