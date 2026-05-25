'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/lib/usePermissions';
import EmployeeManagement from './pages/employee';
import HotColdItems from './pages/hotCold';
import InventoryRecords from './pages/inventory';
import EmployeeHistory from './pages/employee/history';
import MemberManagement from './pages/member';
import CustomerManagement from './pages/customer';
import BillManagement from './pages/bill';
import Design from './pages/design/index';
import Order from './pages/order';
import OrderHistory from './pages/orderHistory/index';

interface ContentProps {
  activePage: string;
  sidebarCollapsed?: boolean;
  setActivePage?: (page: string) => void;
}

export default function Content({ activePage, sidebarCollapsed = false, setActivePage }: ContentProps) {
  const { t } = useTranslation();
  const { canAccessPage, loading } = usePermissions();

  // 检查当前页面是否可访问，如果不可访问则切换到第一个可访问的页面
  useEffect(() => {
    // 等待权限加载完成后再检查
    if (!loading && !canAccessPage(activePage) && setActivePage) {
      const accessiblePages = ['designManagement', 'employeeManagement', 'orderManagement', 'hotColdItems', 'inventoryRecords', 'employeeHistory', 'billManagement', 'memberManagement', 'customerManagement'];
      const firstAccessiblePage = accessiblePages.find(page => canAccessPage(page));
      if (firstAccessiblePage) {
        setActivePage(firstAccessiblePage);
      }
    }
  }, [activePage, canAccessPage, setActivePage, loading]);

  const renderPage = () => {
    // 如果权限还在加载中，显示loading
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      );
    }

    // 检查页面访问权限
    if (!canAccessPage(activePage)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('accessDenied')}</h2>
            <p className="text-gray-600">{t('noPermissionToAccess')}</p>
          </div>
        </div>
      );
    }
    // 使用 CSS 隐藏而不是卸载组件，保持所有页面的状态
    return (
      <>
        <div style={{ display: activePage === 'employeeManagement' ? 'block' : 'none' }}>
          <EmployeeManagement />
        </div>
        <div style={{ display: activePage === 'designManagement' ? 'block' : 'none' }}>
          <Design />
        </div>
        <div style={{ display: activePage === 'orderManagement' ? 'block' : 'none' }}>
          <Order />
        </div>
        <div style={{ display: activePage === 'orderHistory' ? 'block' : 'none' }}>
          <OrderHistory />
        </div>
        <div style={{ display: activePage === 'hotColdItems' ? 'block' : 'none' }}>
          <HotColdItems />
        </div>
        <div style={{ display: activePage === 'inventoryRecords' ? 'block' : 'none' }}>
          <InventoryRecords />
        </div>
        <div style={{ display: activePage === 'employeeHistory' ? 'block' : 'none' }}>
          <EmployeeHistory />
        </div>
        <div style={{ display: activePage === 'billManagement' ? 'block' : 'none' }}>
          <BillManagement />
        </div>
        <div style={{ display: activePage === 'memberManagement' ? 'block' : 'none' }}>
          <MemberManagement />
        </div>
        <div style={{ display: activePage === 'customerManagement' ? 'block' : 'none' }}>
          <CustomerManagement />
        </div>
      </>
    );
  };

  return (
    <main className={`flex-1 p-3 md:p-6 transition-all duration-300 ease-in-out md:min-w-[800px] w-full ${sidebarCollapsed ? 'ml-0' : ''}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 md:min-h-[calc(100vh-120px)]">
        {renderPage()}
      </div>
    </main>
  );
}
