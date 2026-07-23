import React from 'react';
import { Tag } from 'antd';

export interface ProductItemData {
  code?: string;
  designCode?: string;
  color?: string;
  size?: string;
  stockType?: string;
  qty?: number;
  price?: number;
  finalPrice?: number;
  discount?: number;
  discountPercent?: number;
}

interface ProductItemTagProps {
  item: ProductItemData;
}

/**
 * 商品项统一展示组件
 * 用于账单页面和会员购买记录页面的商品展示
 */
export const ProductItemTag: React.FC<ProductItemTagProps> = ({ item }) => {
  const code = item.code || item.designCode;
  const originalPrice = item.price;
  const finalPrice = item.finalPrice ?? item.price;
  const discount = item.discount || 0;
  const discountPercent = item.discountPercent || 0;
  const hasDiscount = discount > 0 || discountPercent > 0;
  
  // 简洁模式：无折扣或数据不完整时使用单行显示
  if (!hasDiscount || originalPrice == null || finalPrice == null) {
    return (
      <Tag>
        <span style={{ color: '#396293', fontWeight: 'bold' }}>{code}</span>
        {item.color ? <span style={{ color: '#595959' }}> {item.color}</span> : null}
        {item.size ? <span style={{ color: '#595959' }}> {item.size}</span> : null}
        {item.stockType === 'order' ? <span style={{ color: '#faad14', fontWeight: 'bold' }}> [ORDER]</span> : null}
        {item.qty ? <span> × {item.qty}</span> : null}
        {finalPrice != null ? <span> | ${Number(finalPrice).toFixed(2)}</span> : null}
      </Tag>
    );
  }
  
  // 详细模式：有折扣时显示原价、折扣、实付
  return (
    <div style={{ 
      border: '1px solid #d9d9d9', 
      borderRadius: 4, 
      padding: '8px 12px',
      backgroundColor: '#fafafa',
      width: '100%'
    }}>
      {/* 第一行：商品基本信息 */}
      <div style={{ marginBottom: 6 }}>
        <span style={{ color: '#396293', fontWeight: 'bold', fontSize: 14 }}>{code}</span>
        {item.color ? <span style={{ color: '#595959' }}> {item.color}</span> : null}
        {item.size ? <span style={{ color: '#595959' }}> {item.size}</span> : null}
        {item.stockType === 'order' ? <span style={{ color: '#faad14', fontWeight: 'bold' }}> [ORDER]</span> : null}
        {item.qty ? <span style={{ fontWeight: 500 }}> × {item.qty}</span> : null}
      </div>
      
      {/* 第二行：价格明细 */}
      <div style={{ fontSize: 13, lineHeight: '20px', color: '#595959' }}>
        <div>
          <span style={{ display: 'inline-block', width: 60 }}>原价:</span>
          <span style={{ textDecoration: 'line-through', color: '#8c8c8c' }}>
            ${Number(originalPrice).toFixed(2)}
          </span>
        </div>
        <div>
          <span style={{ display: 'inline-block', width: 60 }}>折扣:</span>
          <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
            {discount > 0 && `-$${Number(discount).toFixed(2)}`}
            {discount > 0 && discountPercent > 0 && ' '}
            {discountPercent > 0 && `(${Number(discountPercent)}% off)`}
          </span>
        </div>
        <div>
          <span style={{ display: 'inline-block', width: 60 }}>实付:</span>
          <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 14 }}>
            ${Number(finalPrice).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
