'use client';

import React from 'react';
import { ORDER_STATUS_MAP } from '@/config/constants';

interface StatusRendererProps {
  status: string;
  className?: string;
}

export default function StatusRenderer({ status, className }: StatusRendererProps) {
  const statusInfo = ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP] || { 
    text: '未知', 
    color: '#d9d9d9' 
  };
  
  return (
    <span 
      className={className}
      style={{ 
        color: statusInfo.color, 
        fontWeight: 'bold' 
      }}
    >
      {statusInfo.text}
    </span>
  );
}