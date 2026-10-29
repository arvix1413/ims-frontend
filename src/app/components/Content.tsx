'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/lib/usePermissions';
import EmployeeManagement from './pages/employee';
import InventoryRecords from './pages/inventory';
import EmployeeHistory from './pages/employee/history';
import MemberManagement from './pages/member';
import CustomerManagement from './pages/customer';
import BillManagement from './pages/bill';
import Design from './pages/design/index';
import Order from './pages/order';
import OrderHistory from './pages/orderHistory/index';
import MemberPackageManagement from './pages/member/MemberPackageManagement';

interface ContentProps {
  activePage: string;
  sidebarCollapsed?: boolean;
  setActivePage?: (page: string) => void;
}

export default function Content({ activePage, sidebarCollapsed = false, setActivePage }: ContentProps) {
  const { t } = useTranslation();
  const { canAccessPage, loading } = usePermissions();

  useEffect(() => {
    if (!loading && !canAccessPage(activePage) && setActivePage) {
      const accessiblePages = [
        'designManagement',
        'employeeManagement',
        'orderManagement',
        'inventoryRecords',
        'employeeHistory',
        'billManagement',
        'memberManagement',
        'customerManagement',
        'memberPackageManagement',
      ];
      const firstAccessiblePage = accessiblePages.find((page) => canAccessPage(page));
      if (firstAccessiblePage) {
        setActivePage(firstAccessiblePage);
      }
    }
  }, [activePage, canAccessPage, setActivePage, loading]);

  const renderPage = () => {
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

    // 仅挂载当前页，切换导航时卸载并重新请求数据
    switch (activePage) {
      case 'employeeManagement':
        return <EmployeeManagement key={activePage} />;
      case 'designManagement':
        return <Design key={activePage} />;
      case 'orderManagement':
        return <Order key={activePage} />;
      case 'orderHistory':
        return <OrderHistory key={activePage} />;
      case 'inventoryRecords':
        return <InventoryRecords key={activePage} />;
      case 'employeeHistory':
        return <EmployeeHistory key={activePage} />;
      case 'billManagement':
        return <BillManagement key={activePage} />;
      case 'memberManagement':
        return <MemberManagement key={activePage} />;
      case 'customerManagement':
        return <CustomerManagement key={activePage} />;
      case 'memberPackageManagement':
        return <MemberPackageManagement key={activePage} />;
      default:
        return <Design key="designManagement" />;
    }
  };

  return (
    <main className={`min-w-0 flex-1 overflow-x-hidden p-2 md:p-4 transition-all duration-300 ease-in-out w-full ${sidebarCollapsed ? 'ml-0' : ''}`}>
      <div className="app-content-panel bg-white rounded-xl shadow-sm border border-gray-200 md:min-h-[calc(100vh-120px)]">
        {renderPage()}
      </div>
    </main>
  );
}
