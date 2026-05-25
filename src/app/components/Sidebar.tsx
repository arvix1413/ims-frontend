'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'antd';
import { 
  Users, 
  Truck, 
  History, 
  TrendingUp, 
  MessageSquare, 
  Package, 
  Clock, 
  UserCheck, 
  CreditCard,
  Contact,
  ChevronLeft,
  ChevronRight,
  Shirt,
  X,
  Globe,
  LogOut
} from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';
import { authManager } from '@/lib/auth';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { canAccessPage } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const allMenuItems = [
    { name: 'designManagement', icon: Shirt, color: 'text-red-600', bgColor: 'bg-red-50', hoverColor: 'group-hover:text-red-700' },
    { name: 'employeeManagement', icon: Users, color: 'text-stone-600', bgColor: 'bg-stone-50', hoverColor: 'group-hover:text-stone-700' },
    { name: 'orderManagement', icon: Truck, color: 'text-green-600', bgColor: 'bg-green-50', hoverColor: 'group-hover:text-green-700' },
    // { name: 'orderHistory', icon: History, color: 'text-purple-600', bgColor: 'bg-purple-50', hoverColor: 'group-hover:text-purple-700' },
    { name: 'hotColdItems', icon: TrendingUp, color: 'text-red-600', bgColor: 'bg-red-50', hoverColor: 'group-hover:text-red-700' },
    { name: 'inventoryRecords', icon: Package, color: 'text-indigo-600', bgColor: 'bg-indigo-50', hoverColor: 'group-hover:text-indigo-700' },
    { name: 'employeeHistory', icon: Clock, color: 'text-teal-600', bgColor: 'bg-teal-50', hoverColor: 'group-hover:text-teal-700' },
    { name: 'billManagement', icon: CreditCard, color: 'text-yellow-600', bgColor: 'bg-yellow-50', hoverColor: 'group-hover:text-yellow-700' },
    { name: 'memberManagement', icon: UserCheck, color: 'text-pink-600', bgColor: 'bg-pink-50', hoverColor: 'group-hover:text-pink-700' },
    { name: 'customerManagement', icon: Contact, color: 'text-cyan-600', bgColor: 'bg-cyan-50', hoverColor: 'group-hover:text-cyan-700' }
  ];

  // 根据权限过滤菜单项
  const menuItems = allMenuItems.filter(item => canAccessPage(item.name));

  // 处理页面切换，同时更新URL参数
  const handlePageChange = (pageName: string) => {
    setActivePage(pageName);
    
    // 更新URL参数
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageName);
    router.push(`/?${params.toString()}`, { scroll: false });
    
    // 关闭移动端抽屉
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  // 桌面端侧边栏内容
  const desktopSidebar = (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200 min-h-screen transition-all duration-300 ease-in-out relative z-10 flex-shrink-0`}>
      {/* 折叠按钮 */}
      <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} p-4 border-b border-gray-200`}>
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-900" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          )}
        </button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <button
                  onClick={() => handlePageChange(item.name)}
                  className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 md:py-3.5 rounded-lg transition-colors duration-200 min-h-[44px] ${
                    activePage === item.name
                      ? 'bg-gray-900 text-white border-l-4 border-gray-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? t(item.name) : undefined}
                >
                  <div className={`${!isCollapsed ? 'mr-3' : ''} flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                    activePage === item.name 
                      ? 'bg-gray-800' 
                      : `${item.bgColor} group-hover:scale-110`
                  }`}>
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${
                      activePage === item.name 
                        ? 'text-white' 
                        : `${item.color} ${item.hoverColor}`
                    }`} />
                  </div>
                  {!isCollapsed && (
                    <span className={`truncate ${
                      activePage === item.name
                        ? 'text-white'
                        : 'text-gray-900'
                    }`}>{t(item.name)}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );

  // 移动端抽屉内容
  const mobileSidebar = (
    <Drawer
      placement="left"
      onClose={onMobileClose}
      open={mobileOpen}
      closable={false}
      width="80%"
      styles={{ body: { padding: 0 } }}
    >
      {/* 顶部用户信息 */}
      <div className="bg-gray-900 p-6 text-white relative">
        {/* 关闭按钮 */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="关闭菜单"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">S</span>
          </div>
          <div>
            <div className="text-lg font-semibold">Slady</div>
            <div className="text-sm opacity-90">{t('managementSystem')}</div>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;
          
          return (
            <button
              key={item.name}
              onClick={() => handlePageChange(item.name)}
              className={`w-full flex items-center px-6 py-4 transition-colors ${
                isActive 
                  ? 'bg-gray-900 text-white border-l-4 border-gray-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-6 h-6 mr-4 ${isActive ? 'text-white' : item.color}`} />
              <span className={`text-base ${isActive ? 'text-white font-medium' : 'text-gray-700'}`}>
                {t(item.name)}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        {/* 语言切换 */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <Globe className="w-6 h-6 mr-4 text-gray-600" />
          <span className="text-base text-gray-700">
            {i18n.language === 'zh' ? 'English' : '中文'}
          </span>
        </button>

        {/* 退出登录 */}
        <button
          onClick={() => {
            authManager.logout();
            if (onMobileClose) onMobileClose();
          }}
          className="w-full flex items-center px-6 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
        >
          <LogOut className="w-6 h-6 mr-4 text-red-600" />
          <span className="text-base text-red-600">{t('logout')}</span>
        </button>
      </div>
    </Drawer>
  );

  return (
    <>
      {/* 桌面端：固定侧边栏 */}
      <div className="hidden md:block">
        {desktopSidebar}
      </div>
      
      {/* 移动端：抽屉式侧边栏 */}
      <div className="md:hidden">
        {mobileSidebar}
      </div>
    </>
  );
}
