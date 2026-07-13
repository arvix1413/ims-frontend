'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from './components/AuthGuard';
import ResponsiveRouter from './components/ResponsiveRouter';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Content from './components/Content';

// 内部组件处理useSearchParams
function HomeContent() {
  const searchParams = useSearchParams();
  const [activePage, setActivePage] = useState('designManagement');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 从URL参数获取当前页面，如果没有则使用默认值
  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      setActivePage(page);
    }
  }, [searchParams]);

  const toggleHeader = () => {
    setHeaderCollapsed(!headerCollapsed);
  };

  return (
    <AuthGuard>
      <ResponsiveRouter>
        <div className="min-h-screen bg-gray-50 md:min-w-[1200px] md:overflow-x-auto">
        {/* Header 容器 - 桌面端带过渡效果，移动端固定显示 */}
        <div 
          className="transition-all duration-300 ease-in-out overflow-hidden md:block"
          style={{
            height: headerCollapsed ? '0px' : '72px'
          }}
        >
          <Header onMenuClick={() => setMobileNavOpen(true)} />
        </div>
        
        {/* 切换按钮 - 仅桌面端显示 */}
        <div className="relative hidden md:block">
          <button
            onClick={toggleHeader}
            className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all z-50 hover:scale-110"
            title={headerCollapsed ? "展开Header" : "折叠Header"}
          >
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${headerCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 15l7-7 7 7" 
              />
            </svg>
          </button>
        </div>
        
        <div className="flex min-w-0 w-full">
          {/* Sidebar - 桌面端固定，移动端抽屉 */}
          <Sidebar 
            activePage={activePage} 
            setActivePage={setActivePage}
            isCollapsed={sidebarCollapsed}
            setIsCollapsed={setSidebarCollapsed}
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
          />
          
          {/* Content - 移动端添加顶部padding */}
          <div className="flex-1 min-w-0 overflow-x-hidden md:pt-0">
            <Content activePage={activePage} sidebarCollapsed={sidebarCollapsed} setActivePage={setActivePage} />
          </div>
        </div>
        </div>
      </ResponsiveRouter>
    </AuthGuard>
  );
}

// 主组件，包装Suspense
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
