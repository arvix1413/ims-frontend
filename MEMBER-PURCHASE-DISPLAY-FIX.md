# IMS 会员购买记录显示优化

## 修复内容

在会员购买记录页面的商品列表中添加了**颜色**、**尺码**和 **ORDER/IN STOCK** 的显示。

## 问题描述

之前会员购买记录只显示商品代码和价格，缺少重要的商品属性信息：
- ❌ 只显示：`Q403DR120 - $289`
- ✅ 现在显示：`Q403DR120 BLACK M [ORDER] - $289`

这导致：
1. 无法区分同一商品代码的不同颜色/尺码
2. 不知道是现货还是订单商品
3. 查询和核对时需要额外查看商品详情

## 解决方案

### 1. 更新数据类型

**文件**: `src/lib/types.ts`

添加了三个可选字段到 `PurchaseItem` 接口：

```typescript
export interface PurchaseItem {
  designCode: string;
  price: number;
  color?: string;        // 新增：颜色
  size?: string;         // 新增：尺码  
  stockType?: string;    // 新增：ORDER 或 IN STOCK
}
```

### 2. 更新商品显示逻辑

**文件**: `src/app/components/pages/member/MemberPurchaseHistory.tsx`

#### 表格列渲染（第 238-256 行）

修改前：
```typescript
{
  title: '商品',
  dataIndex: 'designList',
  key: 'designList',
  width: 350,
  render: (value: any) => {
    if (!Array.isArray(value) || value.length === 0) return <span>-</span>;
    return (
      <Space wrap>
        {value.map((item, idx) => (
          <Tag key={idx} color="blue">
            {item?.designCode} - ${item?.price}
          </Tag>
        ))}
      </Space>
    );
  }
}
```

修改后：
```typescript
{
  title: '商品',
  dataIndex: 'designList',
  key: 'designList',
  width: 450,  // 加宽以容纳更多信息
  render: (value: any) => {
    if (!Array.isArray(value) || value.length === 0) return <span>-</span>;
    return (
      <Space wrap>
        {value.map((item, idx) => {
          const parts = [item?.designCode];
          if (item?.color) parts.push(item.color);
          if (item?.size) parts.push(item.size);
          if (item?.stockType) parts.push(`[${item.stockType}]`);
          
          return (
            <Tag key={idx} color="blue" style={{ fontSize: 13 }}>
              {parts.join(' ')} - ${item?.price}
            </Tag>
          );
        })}
      </Space>
    );
  }
}
```

#### 显示逻辑说明

- 如果有颜色：显示颜色
- 如果有尺码：显示尺码
- 如果有 stockType：显示 `[ORDER]` 或 `[IN STOCK]`
- 所有部分用空格连接
- 最后显示价格

示例输出：
- `Q403DR120 BLACK M [ORDER] - $289`
- `0084SK008 YELLOW L [ORDER] - $159`
- `SLKDR01 BLACK L - $269` (没有 stockType 时)

### 3. 更新表单输入

#### 添加 stockType 输入框

在"添加购买记录"和"退还"两个表单中，都添加了 stockType 输入框：

```typescript
<Form.Item {...restField} name={[name, 'color']}>
  <Input placeholder="颜色" style={{ width: 120 }} />
</Form.Item>
<Form.Item {...restField} name={[name, 'size']}>
  <Input placeholder="尺码" style={{ width: 100 }} />
</Form.Item>
<Form.Item {...restField} name={[name, 'stockType']}>
  <Input placeholder="ORDER/IN STOCK" style={{ width: 140 }} />
</Form.Item>
```

#### 自动填充逻辑

当输入商品代码并失焦时，会自动查询商品详情并填充：

```typescript
onBlur={async (e) => {
  const code = e.target.value;
  if (!code) return;
  try {
    const res = await designService.getDesignDetail({ design: code });
    if (res.code === 200 && res.data?.length > 0) {
      const d = res.data[0];
      const designs = form.getFieldValue('designs') || [];
      designs[name] = { 
        ...designs[name], 
        price: parseFloat(d.salePrice ?? 0), 
        color: d.color?.[0] ?? '',      // 自动填充颜色
        size: d.size?.[0] ?? '',         // 自动填充尺码
        stockType: d.stockType ?? ''     // 自动填充 stockType
      };
      form.setFieldsValue({ designs: [...designs] });
      notification.success({ message: `已匹配：${d.design}，售价 $${d.salePrice}` });
    }
  } catch { notification.error({ message: '查询失败' }); }
}}
```

## 修复效果

### 修复前
| 购买日期 | 商品 | 销售员 | 总金额 |
|---------|------|--------|--------|
| 2026-06-29 | `Q403DR120 - $289` | GABRIELLE | $289 |

### 修复后
| 购买日期 | 商品 | 销售员 | 总金额 |
|---------|------|--------|--------|
| 2026-06-29 | `Q403DR120 BLACK M [ORDER] - $289` | GABRIELLE | $289 |
| 2026-06-28 | `0084SK008 YELLOW L [ORDER] - $159`<br/>`Q423JK002 BLACK M - $189`<br/>`SLKDR01 BLACK L - $269`<br/>`Q464SK03050 BLACK F - $99` | GABRIELLE | $657 |

## 数据兼容性

- **向后兼容**：旧数据没有 color/size/stockType 字段时，不会显示这些信息
- **可选字段**：所有新增字段都是可选的（`?:`），不会影响现有数据
- **自动补全**：新建记录时，如果商品详情中有这些信息，会自动填充

## 注意事项

1. **后端数据结构**
   - 确保后端返回的 `designList` 数组中包含 `color`、`size`、`stockType` 字段
   - 如果后端没有这些字段，前端会优雅降级（不显示）

2. **表单验证**
   - color、size、stockType 都是可选字段，不强制要求填写
   - 可以手动编辑自动填充的值

3. **显示宽度**
   - 商品列的宽度从 350px 增加到 450px
   - 确保有足够空间显示完整信息

## 测试建议

1. **显示测试**
   - 查看有完整信息的购买记录（颜色+尺码+stockType）
   - 查看部分信息的记录（只有颜色或尺码）
   - 查看旧数据（没有额外信息）

2. **输入测试**
   - 添加购买记录时，输入商品代码，验证自动填充
   - 手动修改颜色、尺码、stockType
   - 添加没有颜色/尺码的商品

3. **退还测试**
   - 退还表单同样支持颜色/尺码/stockType
   - 验证退还记录显示是否正确

## 相关文件

- **类型定义**: `src/lib/types.ts` - `PurchaseItem` 接口
- **会员购买记录页面**: `src/app/components/pages/member/MemberPurchaseHistory.tsx`
- **商品详情API**: `src/lib/api.ts` - `designService.getDesignDetail()`

## 后续优化建议

1. **下拉选择**：考虑将 stockType 改为下拉选择（ORDER / IN STOCK）
2. **颜色标签**：不同颜色可以显示不同的 Tag 颜色
3. **搜索增强**：支持按颜色、尺码、stockType 搜索
4. **统计报表**：按颜色、尺码分组统计销售情况

---

**修复人**: Kiro AI  
**修复日期**: 2026-06-30  
**问题报告**: 会员购买记录需要显示颜色、尺码和 ORDER 信息  
**构建状态**: ✅ 编译通过
