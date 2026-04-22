#!/usr/bin/env ts-node
/**
 * 完整重置脚本 - 生产/开发环境分离版本
 *
 * 核心流程：
 * 1. 备份现有数据库数据
 * 2. 清空数据库
 * 3. 扫描真实 OneDrive 文件结构
 * 4. 读取真实 Excel 数据
 * 5. 创建开发环境文件夹镜像（可选）
 * 6. 验证文件夹结构（可选）
 * 7. 导入数据到数据库
 * 8. 生成完整报告
 *
 * 使用方法:
 *   npm run reset:complete                    # 开发模式
 *   npm run reset:complete:prod               # 生产模式
 *   npm run reset:complete:skip               # 跳过文件操作
 */
export {};
//# sourceMappingURL=completeReset.d.ts.map