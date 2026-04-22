# Excel版本还原功能说明

## 功能概述

系统为Excel文件提供了完整的**版本控制和还原功能**，每次对Excel的修改（创建、更新、删除）都会自动记录到变更日志中，可以随时还原到任意历史版本。

## 变更日志位置

- **日志文件**: 与Excel文件同目录的 `excel-changelog.json`
- **备份目录**: `backups/` 文件夹
- **示例文件**: `data/excel-changelog-example.json`

## 日志格式

每条变更记录包含：

```json
{
  "id": 1,
  "action": "CREATE|UPDATE|DELETE",
  "projectCode": "2024-AT-BXT-001",
  "timestamp": "2024-10-03T02:15:30.123Z",
  "version": "v1",
  "details": {
    "rowNumber": 5,
    "projectId": 12,
    "data": { /* 创建时的数据 */ },
    "oldData": { /* 更新前的数据 */ },
    "newData": { /* 更新后的数据 */ }
  }
}
```

## 使用方法

### 1. 查看版本历史

```bash
# 查看最近20个版本
npx tsx src/scripts/restoreExcelVersion.ts history

# 查看最近50个版本
npx tsx src/scripts/restoreExcelVersion.ts history 50
```

输出示例：
```
📚 Excel版本历史:
====================================================================================================
[v52] UPDATE - 2024-AT-BXT-001 - 2025/10/3 14:08:15
      变更: clientCompany: "宝钢铁矿" → "宝钢矿业有限公司"
[v51] CREATE - 2024-AT-FMG-002 - 2025/10/3 14:08:15
[v50] CREATE - 2024-AT-BXT-001 - 2025/10/3 14:08:15
...
====================================================================================================

总共 52 个版本
```

### 2. 还原到指定版本

```bash
# 还原到版本v50
npx tsx src/scripts/restoreExcelVersion.ts restore v50

# 或者省略v前缀
npx tsx src/scripts/restoreExcelVersion.ts restore 50
```

执行流程：
1. ✅ 自动备份当前Excel到 `backups/restore_backup_时间戳.xlsx`
2. ✅ 重新执行v1到v50的所有操作，重建Excel
3. ✅ 保存还原后的Excel

### 3. 撤销操作

```bash
# 撤销最近1个操作
npx tsx src/scripts/restoreExcelVersion.ts undo

# 撤销最近5个操作
npx tsx src/scripts/restoreExcelVersion.ts undo 5
```

## 工作原理

### 自动记录
每次执行以下操作时自动记录：
- `ExcelService.syncProjectCreate()` - 新增项目
- `ExcelService.syncProjectUpdate()` - 更新项目
- `ExcelService.syncProjectDelete()` - 删除项目（软删除）

### 还原机制
1. **读取日志**: 获取目标版本前的所有操作记录
2. **重建Excel**:
   - 创建空白Excel表格
   - 按时间顺序重放所有操作
   - CREATE操作添加行
   - UPDATE操作修改行
   - DELETE操作删除行
3. **保存文件**: 覆盖当前Excel

## 注意事项

⚠️ **重要提示**:

1. **自动备份**: 还原前会自动备份当前版本到 `backups/` 目录
2. **完整重建**: 还原是重建整个Excel，不是差量更新
3. **行号保持**: 还原后的行号与历史版本一致
4. **数据完整性**: 确保变更日志文件完整，不要手动修改

## 示例场景

### 场景1: 误删除项目后还原

```bash
# 1. 查看历史，找到删除前的版本（假设是v48）
npx tsx src/scripts/restoreExcelVersion.ts history

# 2. 还原到删除前的版本
npx tsx src/scripts/restoreExcelVersion.ts restore v48
```

### 场景2: 批量修改错误后回退

```bash
# 撤销最近3个错误修改
npx tsx src/scripts/restoreExcelVersion.ts undo 3
```

### 场景3: 对比不同版本

```bash
# 1. 备份当前版本
cp excel.xlsx excel_current.xlsx

# 2. 还原到历史版本v40
npx tsx src/scripts/restoreExcelVersion.ts restore v40

# 3. 导出对比
cp excel.xlsx excel_v40.xlsx

# 4. 还原回当前版本（查看最新版本号并还原）
npx tsx src/scripts/restoreExcelVersion.ts restore v52
```

## 技术细节

### 支持的字段
还原时会恢复以下Excel列：
- A: Job Type
- B: Client (clientCompany)
- C: Mine Site (mineSiteName)
- D: Project (name)
- E: Mineral (mineralType)
- F: Contact Person (contactPerson)
- G: Project Manager (projectManager)
- N: Project Code (projectCode)
- O: OneDrive Path (oneDrivePath)

### 行号管理
- 表头固定在第1行
- 数据从第2行开始
- 行号在变更日志中永久记录
- 删除操作只移除数据，不改变其他行号

## 故障排查

### 问题1: 找不到变更日志
```
⚠️  变更日志不存在
```
**原因**: `excel-changelog.json` 文件不存在
**解决**: 执行一次Excel操作（创建/更新项目）会自动创建

### 问题2: 版本号不存在
```
❌ 版本 v999 不存在
```
**原因**: 指定的版本号超出范围
**解决**: 先用 `history` 命令查看可用版本

### 问题3: 备份失败
```
❌ 无法创建备份
```
**原因**: 权限问题或磁盘空间不足
**解决**: 检查 `backups/` 目录权限和磁盘空间

## 最佳实践

1. **定期备份**: 重要操作前手动备份 `excel-changelog.json`
2. **版本标记**: 在关键节点记录版本号（如: v100是月底版本）
3. **测试还原**: 定期测试还原功能确保日志完整性
4. **清理备份**: 定期清理 `backups/` 目录的旧备份文件

## 相关文件

- **还原工具**: `server/src/scripts/restoreExcelVersion.ts`
- **Excel服务**: `server/src/services/excelService.ts`
- **变更日志**: `data/excel-changelog.json`
- **备份目录**: `data/backups/`

---

**提示**: 此功能基于变更日志实现，请确保系统正常记录所有Excel操作。
