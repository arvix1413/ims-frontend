'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { App } from 'antd';

interface NotificationManagerContextType {
  // 成功提示
  success: (message: ReactNode, description?: ReactNode) => void;
  // 错误提示
  error: (message: ReactNode, description?: ReactNode) => void;
  // 警告提示
  warning: (message: ReactNode, description?: ReactNode) => void;
  // 信息提示
  info: (message: ReactNode, description?: ReactNode) => void;
  // 自定义提示
  custom: (config: {
    message: ReactNode;
    description?: ReactNode;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
    key?: string;
  }) => void;
  // 关闭所有提示
  destroy: () => void;
}

const NotificationManagerContext = createContext<NotificationManagerContextType | undefined>(undefined);

interface NotificationManagerProviderProps {
  children: ReactNode;
}

export function NotificationManagerProvider({ children }: NotificationManagerProviderProps) {
  const { notification } = App.useApp();

  // 成功提示
  const success = (message: ReactNode, description?: ReactNode) => {
    notification.success({
      message,
      description,
      duration: 4.5,
      placement: 'top',
    });
  };

  // 错误提示
  const error = (message: ReactNode, description?: ReactNode) => {
    notification.error({
      message,
      description,
      duration: 6,
      placement: 'top',
    });
  };

  // 警告提示
  const warning = (message: ReactNode, description?: ReactNode) => {
    notification.warning({
      message,
      description,
      duration: 4.5,
      placement: 'top',
    });
  };

  // 信息提示
  const info = (message: ReactNode, description?: ReactNode) => {
    notification.info({
      message,
      description,
      duration: 4.5,
      placement: 'top',
    });
  };

  // 自定义提示
  const custom = (config: {
    message: ReactNode;
    description?: ReactNode;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
    key?: string;
  }) => {
    const { type = 'info', duration = 4.5, placement = 'top', ...rest } = config;
    
    notification[type]({
      ...rest,
      duration,
      placement,
    });
  };

  // 关闭所有提示
  const destroy = () => {
    notification.destroy();
  };

  const value: NotificationManagerContextType = {
    success,
    error,
    warning,
    info,
    custom,
    destroy,
  };

  return (
    <NotificationManagerContext.Provider value={value}>
      {children}
    </NotificationManagerContext.Provider>
  );
}

// 自定义Hook
export function useNotification() {
  const context = useContext(NotificationManagerContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationManagerProvider');
  }
  return context;
}
