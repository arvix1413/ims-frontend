'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, E_USER_TYPE } from '@/lib/types';

// 权限管理Hook
export function usePermissions() {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await api.user.getBasic();
      if (response.code === 200) {
        setUserInfo(response.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 权限检查函数
  const hasPermission = (requiredTypes: string[]) => {
    if (!userInfo) return false;
    return requiredTypes.includes(userInfo.type);
  };

  // 检查是否为管理员
  const isAdmin = () => {
    return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN]);
  };

  // 检查是否为销售员
  const isSaler = () => {
    return hasPermission([E_USER_TYPE.SALER]);
  };

  // 检查是否为财务
  const isFinance = () => {
    return hasPermission([E_USER_TYPE.FINANCE]);
  };

  // 检查是否为物流
  const isLogistics = () => {
    return hasPermission([E_USER_TYPE.LOGISTICS]);
  };

  // 检查是否为韩国物流
  const isKoreanLogistics = () => {
    return hasPermission([E_USER_TYPE.KOREAN_LOGISTICS]);
  };

  // 检查是否为产品管理
  const isProductManagement = () => {
    return hasPermission([E_USER_TYPE.PRODUCTMANAGEMENT]);
  };

  // 检查是否为超级管理员
  const isSuperAdmin = () => {
    return hasPermission([E_USER_TYPE.SUPERADMIN]);
  };

  // 根据用户类型获取可访问的页面
  const getAccessiblePages = () => {
    if (!userInfo) return [];

    switch (userInfo.type) {
      case E_USER_TYPE.SUPERADMIN:
        return ['employeeManagement'];
      
      case E_USER_TYPE.SALER:
        return [
          'designManagement',
          'orderManagement', 
          'inventoryRecords',
          'billManagement',
          'memberManagement',
          'customerManagement'
        ];
      
      case E_USER_TYPE.LOGISTICS:
      case E_USER_TYPE.KOREAN_LOGISTICS:
        return ['orderManagement'];
      
      case E_USER_TYPE.FINANCE:
        return ['billManagement'];
      
      case E_USER_TYPE.PRODUCTMANAGEMENT:
        return ['designManagement'];
      
      case E_USER_TYPE.ADMIN:
      default:
        return [
          'employeeManagement',
          'designManagement',
          'orderManagement',
          'inventoryRecords',
          'employeeHistory',
          'billManagement',
          'memberManagement',
          'customerManagement'
        ];
    }
  };

  // 检查页面是否可访问
  const canAccessPage = (pageName: string) => {
    const accessiblePages = getAccessiblePages();
    return accessiblePages.includes(pageName);
  };

  // 获取财务用户可访问的店铺（根据用户名末位数字）
  // 返回 null 表示可以访问所有店铺，返回数字表示只能访问指定店铺
  const getFinanceStoreAccess = (): number | null => {
    if (!userInfo || userInfo.type !== E_USER_TYPE.FINANCE) {
      return null; // 非财务用户或未登录，可以访问所有店铺
    }
    
    const name = userInfo.name || '';
    const lastChar = name.charAt(name.length - 1);
    const lastDigit = parseInt(lastChar, 10);
    
    // 如果末位是数字 1 或 2，返回对应的店铺编号
    if (lastDigit === 1) {
      return 1; // 一店
    } else if (lastDigit === 2) {
      return 2; // 二店
    }
    
    return null; // 如果末位不是 1 或 2，默认可以访问所有店铺
  };

  // 检查功能是否可用
  const canUseFeature = (feature: string) => {
    if (!userInfo) return false;

    switch (feature) {
      case 'createEmployee':
      case 'editEmployee':
      case 'deleteEmployee':
        return isAdmin();
      
      case 'createDesign':
      case 'editDesign':
      case 'deleteDesign':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.PRODUCTMANAGEMENT]);
      
      case 'modifyStock':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN]);
      
      case 'createOrder':
      case 'editOrder':
      case 'deleteOrder':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.SALER, E_USER_TYPE.LOGISTICS, E_USER_TYPE.KOREAN_LOGISTICS]);
      
      case 'createMember':
      case 'editMember':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.SALER]);

      case 'createCustomer':
      case 'editCustomer':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.SALER]);

      case 'deleteCustomer':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN]);
      
      case 'deleteMember':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN]);
      
      case 'printReceipt':
      case 'printLabel':
      case 'printDailyReport':
      case 'cashInOut':
      case 'openingClosingBalance':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.SALER]);
      
      case 'cashManagement':
      case 'balanceManagement':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.FINANCE]);
      
      case 'createItem':
      case 'modifyStock':
      case 'deleteItem':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN, E_USER_TYPE.PRODUCTMANAGEMENT]);
      
      case 'deleteMember':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN]);
      
      case 'deletePurchaseRecord':
        return hasPermission([E_USER_TYPE.ADMIN, E_USER_TYPE.SUPERADMIN]);
      
      default:
        return true;
    }
  };

  return {
    userInfo,
    loading,
    hasPermission,
    isAdmin,
    isSaler,
    isFinance,
    isLogistics,
    isKoreanLogistics,
    isProductManagement,
    isSuperAdmin,
    getAccessiblePages,
    canAccessPage,
    canUseFeature,
    getFinanceStoreAccess
  };
}
