# IMS 每日销售统计修复说明

## 问题描述

删除收银员后，每日销售统计中缺少了该收银员的历史营业额数据，导致总计金额不正确。

### 示例
- 实际总营业额应该是 **约 30,000 SGD**（一店约 25,000 + 二店约 5,000）
- 但统计显示少了很多金额

## 根本原因

### 数据流程
1. 后端 SQL 查询 `t_receipt` 表，按 `DATE(create_date)` 和 `cashier` 分组统计销售额
2. 前端 `DailySaleDrawer.tsx` 的 `transformData()` 函数处理数据
3. 前端 `saler` 数组定义活跃收银员列表：`['Serene', 'Yen', 'Xiao Li','Gabrielle','Staff']`

### 问题代码（修复前）

```typescript
// 问题 1：只为 saler 数组中的收银员创建列
data.forEach((item: DailySaleData) => {
  if (!grouped[item.date]) {
    grouped[item.date] = { date: item.date };
    saler.forEach(c => (grouped[item.date][c] = null)); // ❌ 只初始化 saler 中的
  }
  grouped[item.date][item.cashier] = item.totalPrice; // ✅ 但实际会写入所有收银员
});

// 问题 2：计算总计时只统计 saler 数组中的收银员
Object.values(grouped).forEach((row: any) => {
  const sum = saler.reduce((sum, c) => sum + (row[c] || 0), 0); // ❌ 忽略已删除收银员
  row.total = parseFloat(sum.toFixed(2));
});

// 问题 3：总计行也只统计 saler 数组中的收银员
const totalSum = saler.reduce((sum: number, c) => sum + (totalRow[c] || 0), 0); // ❌
totalRow.total = parseFloat(totalSum.toFixed(2));
```

### 问题场景

1. 收银员 "Sandy" 之前有销售记录，金额在数据库中
2. 后来从 `saler` 数组中删除了 "Sandy"
3. 后端查询仍返回 "Sandy" 的历史数据
4. 前端 `transformData()` 会把 "Sandy" 的金额写入 `grouped[date]['Sandy']`
5. **但计算 total 时只累加 `saler` 数组中的收银员，忽略了 "Sandy"**
6. 导致总计金额少了 "Sandy" 的销售额

## 解决方案

### 修复思路

1. **收集所有出现过的收银员**（包括已删除的）
2. **计算总计时遍历所有 key**，而不仅限于 `saler` 数组
3. **动态生成表格列**，已删除的收银员用灰色标记显示

### 修复后代码

```typescript
function transformData(data: DailySaleData[]) {
  const grouped: any = {};
  
  // ✅ 收集所有出现过的收银员（包括已删除的）
  const allCashiers = new Set<string>();

  data.forEach((item: DailySaleData) => {
    allCashiers.add(item.cashier);
    
    if (!grouped[item.date]) {
      grouped[item.date] = { date: item.date };
      saler.forEach(c => (grouped[item.date][c] = null));
    }
    grouped[item.date][item.cashier] = item.totalPrice;
  });

  // ✅ 计算每行总计（包含所有收银员的销售额）
  Object.values(grouped).forEach((row: any) => {
    let sum = 0;
    Object.keys(row).forEach(key => {
      if (key !== 'date' && row[key] !== null) {
        sum += row[key]; // ✅ 累加所有收银员
      }
    });
    row.total = parseFloat(sum.toFixed(2));
  });

  // ✅ 添加总计行（包括已删除收银员）
  const totalRow: any = { date: "total" };
  
  saler.forEach((c: any) => {
    const sum = Object.values(grouped).reduce((sum: number, row: any) => sum + (row[c] || 0), 0);
    totalRow[c] = parseFloat(sum.toFixed(2));
  });
  
  // ✅ 为已删除的收银员也计算总计
  allCashiers.forEach(cashier => {
    if (!saler.includes(cashier)) {
      const sum = Object.values(grouped).reduce((sum: number, row: any) => sum + (row[cashier] || 0), 0);
      totalRow[cashier] = parseFloat(sum.toFixed(2));
    }
  });
  
  // ✅ 计算总计的 total 列（所有收银员的总和）
  let totalSum = 0;
  Object.keys(totalRow).forEach(key => {
    if (key !== 'date') {
      totalSum += totalRow[key];
    }
  });
  totalRow.total = parseFloat(totalSum.toFixed(2));

  return [...Object.values(grouped), totalRow];
}
```

### 动态列生成

```typescript
// 在组件中添加 state 存储所有收银员
const [allCashiers, setAllCashiers] = useState<string[]>([]);

// 查询时收集所有收银员
const res = await printService.getDailySale(query);
if (res.code === 200) {
  const cashierSet = new Set<string>();
  res.data.forEach((item: DailySaleData) => {
    cashierSet.add(item.cashier);
  });
  setAllCashiers(Array.from(cashierSet));
  setData(transformData(res.data));
}

// 动态生成表格列
const columns = useMemo(() => {
  return [
    { title: "Date", dataIndex: "date", key: "date", fixed: 'left' },
    // 活跃收银员（正常显示）
    ...saler.map(c => ({
      title: c,
      dataIndex: c,
      key: c,
      render: (value: number | null) => value !== null ? value.toFixed(2) : '0.00',
    })),
    // 已删除的收银员（灰色斜体显示）
    ...allCashiers
      .filter(c => !saler.includes(c))
      .map(c => ({
        title: `${c} (已删除)`,
        dataIndex: c,
        key: c,
        render: (value: number | null) => (
          <span style={{ color: '#999', fontStyle: 'italic' }}>
            {value !== null ? value.toFixed(2) : '0.00'}
          </span>
        ),
      })),
    { 
      title: "total", 
      dataIndex: "total", 
      key: "total",
      fixed: 'right',
      render: (value: number | null) => (
        <strong>{value !== null ? value.toFixed(2) : '0.00'}</strong>
      ),
    }
  ];
}, [allCashiers]);
```

## 修复效果

### 修复前
- 总计金额：少了已删除收银员的销售额
- 表格列：只显示活跃收银员（`saler` 数组）
- 已删除收银员的数据：**丢失**

### 修复后
- 总计金额：✅ **包含所有收银员（活跃 + 已删除）的销售额**
- 表格列：
  - 活跃收银员：正常显示
  - 已删除收银员：灰色斜体，标记 "(已删除)"
- 已删除收银员的数据：✅ **完整保留并计入总计**

## 数据示例

### 假设数据
- 2026-06-30：
  - Serene: $8,000
  - Yen: $6,000
  - Sandy (已删除): $10,000
  - Staff: $1,000

### 修复前显示
| Date       | Serene | Yen   | Xiao Li | Gabrielle | Staff | Total   |
|------------|--------|-------|---------|-----------|-------|---------|
| 2026-06-30 | 8000   | 6000  | 0       | 0         | 1000  | **15,000** ❌ |
| total      | 8000   | 6000  | 0       | 0         | 1000  | **15,000** ❌ |

### 修复后显示
| Date       | Serene | Yen   | Xiao Li | Gabrielle | Staff | Sandy (已删除) | Total   |
|------------|--------|-------|---------|-----------|-------|----------------|---------|
| 2026-06-30 | 8000   | 6000  | 0       | 0         | 1000  | *10,000*       | **25,000** ✅ |
| total      | 8000   | 6000  | 0       | 0         | 1000  | *10,000*       | **25,000** ✅ |

## 注意事项

1. **不要直接从数据库删除收银员记录**
   - 历史销售记录的 `cashier` 字段仍引用该收银员名称
   - 只需从前端 `saler` 数组移除即可

2. **已删除收银员的数据会显示**
   - 用灰色斜体标记，方便识别
   - 仍计入总计，确保财务数据准确

3. **Table 滚动支持**
   - 添加了 `scroll={{ x: 'max-content' }}` 支持横向滚动
   - Date 列固定在左侧，Total 列固定在右侧

## 文件修改

- **文件**: `src/app/components/pages/bill/DailySaleDrawer.tsx`
- **修改时间**: 2026-06-30
- **修改内容**:
  1. `transformData()` 函数：收集所有收银员，计算总计时遍历所有 key
  2. 添加 `allCashiers` state 存储所有收银员
  3. 动态生成 `columns`，区分活跃/已删除收银员
  4. `onQuery()` 函数：收集并设置所有收银员
  5. Table 组件：添加 `scroll` 属性支持横向滚动

## 测试建议

1. 查询包含已删除收银员历史数据的日期范围
2. 验证总计金额是否包含所有收银员
3. 确认已删除收银员以灰色标记显示
4. 对比数据库实际金额与统计显示金额

## 相关文件

- 后端 SQL: `src/main/resources/mapper/ReceiptDao.xml` - `groupCashierDate` 查询
- 收银员定义: `src/app/components/pages/bill/PrintReceipt.tsx` - `saler` 数组
- 数据类型: `src/lib/types.ts` - `DailySaleData` 接口

---

**修复人**: Kiro AI  
**修复日期**: 2026-06-30  
**问题报告**: 删除收银员后系统每日销售统计少了营业额（应约 30,000 实际少很多）
