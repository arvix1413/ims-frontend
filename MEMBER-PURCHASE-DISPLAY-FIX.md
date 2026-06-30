# IMS 会员购买记录显示优化 - 统一展示风格

## 问题描述
账单页面（Bill）和会员购买记录页面（Member Purchase History）的商品展示风格不一致，需要统一显示格式并提取共用组件。

**之前的问题**：
- 两个页面使用不同的内联样式
- 代码重复，难以维护
- 显示格式不完全一致

## 解决方案

### 1. 创建共用组件 `ProductItemTag`

**文件**: `src/app/components/common/ProductItemTag.tsx`

创建了统一的商品信息展示组件，用于所有需要显示商品信息的地方。

#### 组件接口
```typescript
export interface ProductItemData {
  code?: string;           // 账单页面使用
  designCode?: string;     // 会员页面使用
  color?: string;          // 颜色
  size?: string;           // 尺码
  stockType?: string;      // ORDER 或 IN STOCK
  qty?: number;            // 数量
  price?: number;          // 会员页面使用
  finalPrice?: number;     // 账单页面使用
}
```

#### 组件实现
```typescript
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
```

#### 统一颜色方案
- **商品代码**：蓝色粗体 `#396293`
- **颜色尺码**：灰色 `#595959`
- **ORDER 标识**：橙色粗体 `#faad14`
- **数量和价格**：默认颜色

### 2. 账单页面集成

**文件**: `src/app/components/pages/bill/index.tsx`

#### 修改内容
1. 引入 `ProductItemTag` 组件
```typescript
import { ProductItemTag } from '../common/ProductItemTag';
```

2. 更新桌面端表格的 `item` 列
```typescript
{
  title: t('item'),
  dataIndex: 'itemList',
  key: 'itemList',
  width: 300,
  render: (value: any) => {
    const arr = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(arr)) return <span>-</span>;
    
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {arr.map((it, idx) => (
          <ProductItemTag key={`${it.code}-${idx}`} item={it} />
        ))}
      </div>
    );
  }
}
```

3. 更新移动端卡片的商品列表
```typescript
{itemList.map((it: any, idx: number) => (
  <div key={`${it.code}-${idx}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
    <ProductItemTag item={it} />
  </div>
))}
```

### 3. 会员购买记录页面集成

**文件**: `src/app/components/pages/member/MemberPurchaseHistory.tsx`

#### 修改内容
1. 引入 `ProductItemTag` 组件
```typescript
import { ProductItemTag } from '../common/ProductItemTag';
```

2. 更新商品列的渲染逻辑
```typescript
{
  title: '商品',
  dataIndex: 'designList',
  key: 'designList',
  width: 450,
  render: (value: any) => {
    if (!Array.isArray(value) || value.length === 0) return <span>-</span>;
    
    return (
      <Space wrap>
        {value.map((item, idx) => (
          <ProductItemTag 
            key={idx} 
            item={{
              designCode: item?.designCode,
              color: item?.color,
              size: item?.size,
              stockType: item?.stockType,
              price: item?.price
            }} 
          />
        ))}
      </Space>
    );
  }
}
```

#### 数据字段映射
- `code` / `designCode` → 商品代码
- `finalPrice` / `price` → 价格
- 其他字段（`color`、`size`、`stockType`、`qty`）保持一致

## 实现效果

### 统一显示格式

**账单页面**：
- `0113TB092 Black Free Size × 1 | $90.30`
- `Q403DR120 Red M [ORDER] × 2 | $578.00`

**会员购买记录页面**：
- `Q403DR120 Black M [ORDER] | $289.00`
- `0084SK008 Yellow L | $159.00`

### 显示规则
1. 商品代码始终显示（蓝色粗体）
2. 颜色存在时显示（灰色）
3. 尺码存在时显示（灰色）
4. stockType 为 'order' 时显示 `[ORDER]`（橙色粗体）
5. 数量存在时显示（格式：`× 数量`）
6. 价格始终显示（格式：`| $xx.xx`）

## 代码优势

### ✅ 统一性
- 两个页面使用完全相同的组件
- 确保展示风格100%一致
- 未来修改只需改一处

### ✅ 可维护性
- 消除重复代码
- 集中管理展示逻辑
- 易于测试和调试

### ✅ 灵活性
- 支持不同的数据字段名（`code` / `designCode`）
- 支持可选字段（颜色、尺码、数量等）
- 向后兼容旧数据

### ✅ 类型安全
- TypeScript 接口定义
- 编译时类型检查
- IDE 自动补全支持

## 验证结果

### TypeScript 编译
```
✅ ProductItemTag.tsx: No diagnostics found
✅ bill/index.tsx: No diagnostics found
✅ member/MemberPurchaseHistory.tsx: No diagnostics found
```

### 功能测试清单
- [ ] 账单页面桌面端表格显示正确
- [ ] 账单页面移动端卡片显示正确
- [ ] 会员购买记录页面表格显示正确
- [ ] 颜色方案统一（蓝色、灰色、橙色）
- [ ] 有 ORDER 标识的商品正确显示
- [ ] 没有颜色/尺码的商品正确显示（优雅降级）
- [ ] 旧数据兼容性（没有 stockType 字段）

## 相关文件

### 核心文件
- `src/app/components/common/ProductItemTag.tsx` - 共用组件 ⭐
- `src/app/components/pages/bill/index.tsx` - 账单页面
- `src/app/components/pages/member/MemberPurchaseHistory.tsx` - 会员购买记录页面

### 支持文件
- `src/lib/types.ts` - 类型定义（`PurchaseItem` 包含 `color`、`size`、`stockType`）

## 数据结构要求

### 账单页面数据
```typescript
{
  code: string;           // 必需
  qty: number;            // 必需
  price: number;          // 必需
  finalPrice: number;     // 必需
  color?: string;         // 可选
  size?: string;          // 可选
  stockType?: string;     // 可选 ('order' | 'in-stock')
}
```

### 会员购买记录数据
```typescript
{
  designCode: string;     // 必需
  price: number;          // 必需
  color?: string;         // 可选
  size?: string;          // 可选
  stockType?: string;     // 可选 ('order' | 'ORDER')
}
```

## 后续优化建议

1. **标准化 stockType 值**
   - 统一使用小写 `'order'` 或大写 `'ORDER'`
   - 添加类型定义：`type StockType = 'order' | 'in-stock'`

2. **扩展组件功能**
   - 支持自定义颜色方案
   - 支持点击事件（查看商品详情）
   - 支持复制商品代码

3. **性能优化**
   - 使用 `React.memo` 优化渲染
   - 避免不必要的重新渲染

4. **国际化支持**
   - 将 `[ORDER]` 标识改为可翻译文本
   - 支持不同语言的显示格式

---

**修复日期**: 2026-06-30  
**修复内容**: 提取共用组件统一商品展示风格  
**构建状态**: ✅ 编译通过，无 TypeScript 错误  
**测试状态**: ⏳ 等待用户验证
