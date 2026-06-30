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
  const price = item.finalPrice ?? item.price;
  
  return (
    <Tag>
      <span style={{ color: '#396293', fontWeight: 'bold' }}>{code}</span>
      {item.color ? <span style={{ color: '#595959' }}> {item.color}</span> : null}
      {item.size ? <span style={{ color: '#595959' }}> {item.size}</span> : null}
      {item.stockType === 'order' ? <span style={{ color: '#faad14', fontWeight: 'bold' }}> [ORDER]</span> : null}
      {item.qty ? <span> × {item.qty}</span> : null}
      {price != null ? <span> | ${Number(price).toFixed(2)}</span> : null}
    </Tag>
  );
};
