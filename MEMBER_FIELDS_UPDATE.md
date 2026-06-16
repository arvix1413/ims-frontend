# 会员管理新增字段更新说明

## 更新日期
2026-06-16

## 更新内容

在会员管理模块中新增以下字段：

### 新增字段

1. **height** (身高)
   - 类型: Integer
   - 单位: cm (厘米)
   - 说明: 会员身高信息
   - 数据库字段: `height INT`

2. **weight** (体重)
   - 类型: BigDecimal
   - 单位: kg (公斤)
   - 精度: 5,1 (最多5位数字，1位小数)
   - 说明: 会员体重信息
   - 数据库字段: `weight DECIMAL(5,1)`

3. **size** (尺码)
   - 类型: String
   - 长度: 最多50个字符
   - 说明: 会员常穿尺码
   - 数据库字段: `size VARCHAR(50)`

4. **personalNotes** (个人备注及喜好)
   - 类型: String (TEXT)
   - 说明: 记录会员的个人喜好、购买习惯等备注信息
   - 数据库字段: `personal_notes TEXT`

## 修改的文件

### 后端 (Java)

1. **实体类**
   - `src/main/java/com/dream/ims/entity/Member.java`
   - 添加了4个新字段

2. **DTO类**
   - `src/main/java/com/dream/ims/dto/member/MemberDto.java`
   - `src/main/java/com/dream/ims/dto/member/MemberForm.java`
   - 添加了4个新字段

3. **数据库脚本**
   - `sql/alter_t_member_add_personal_info.sql`
   - 新建的数据库迁移脚本

### 前端 (TypeScript + React)

1. **类型定义**
   - `src/lib/types.ts`
   - 更新了 `MemberData`, `ModifyMemberRequest`, `CreateMemberRequest` 接口

2. **会员管理页面**
   - `src/app/components/pages/member/index.tsx`
   - 在新增、修改、详情显示中都添加了新字段
   - 支持桌面端和移动端

3. **会员购买历史页面**
   - `src/app/components/pages/member/MemberPurchaseHistory.tsx`
   - 在会员详细信息卡片中添加新字段显示

## 部署步骤

### 1. 数据库更新

执行以下SQL脚本：

```bash
mysql -u ims -p ims < sql/alter_t_member_add_personal_info.sql
```

或者手动执行SQL：

```sql
ALTER TABLE `t_member` 
ADD COLUMN `height` INT COMMENT '身高(cm)' AFTER `registration_date`,
ADD COLUMN `weight` DECIMAL(5,1) COMMENT '体重(kg)' AFTER `height`,
ADD COLUMN `size` VARCHAR(50) COMMENT '尺码' AFTER `weight`,
ADD COLUMN `personal_notes` TEXT COMMENT '个人备注及喜好' AFTER `size`;
```

### 2. 后端部署

```bash
cd ims-backend
mvn clean package -DskipTests
# 部署到生产环境
```

### 3. 前端部署

```bash
cd ims-frontend
npm run build
# 部署到生产环境
```

## 功能说明

### 新增会员
- 可以在创建会员时填写身高、体重、尺码和个人备注
- 这些字段都是可选的

### 修改会员
- 可以修改会员的身高、体重、尺码和个人备注信息
- 这些字段都是可选的

### 查看会员
- 在会员列表的移动端卡片中会显示这些信息（如果有填写）
- 在会员购买历史页面的详情卡片中会显示这些信息（如果有填写）

## 注意事项

1. 所有新增字段都是**可选的**，不会影响现有数据
2. 身高范围限制为 0-300 cm
3. 体重范围限制为 0-500 kg，支持一位小数
4. 尺码为文本输入，可以填写如 "S"、"M"、"L" 等
5. 个人备注支持多行文本输入

## 测试建议

1. 测试新增会员时填写新字段
2. 测试修改现有会员添加新字段
3. 测试在会员列表和详情页面查看新字段
4. 测试新字段为空时的显示效果
5. 测试边界值（如身高300cm、体重500kg）

## 回滚方案

如果需要回滚，执行以下SQL：

```sql
ALTER TABLE `t_member` 
DROP COLUMN `height`,
DROP COLUMN `weight`,
DROP COLUMN `size`,
DROP COLUMN `personal_notes`;
```

然后重新部署之前的代码版本。
