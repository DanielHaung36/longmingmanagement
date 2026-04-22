#!/usr/bin/env ts-node

/**
 * Excel诊断脚本 - 检查Excel读取问题
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
const envFilePath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFilePath });

const excelPath = process.env.EXCEL_ONEDRIVE_PATH ||
  'C:/Users/longi/OneDrive - Longi Magnet Australia Pty ltd/Documents - Longi Australia/03 Project Management/LJA Job Register Rev3.xlsm';

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║           Excel 文件诊断报告                       ║');
console.log('╚════════════════════════════════════════════════════╝\n');

console.log(`📁 Excel 文件路径: ${excelPath}\n`);

try {
  // 检查文件是否存在
  const fs = require('fs');
  if (!fs.existsSync(excelPath)) {
    console.log('❌ 文件不存在！');
    console.log('   请检查路径是否正确\n');
    process.exit(1);
  }
  console.log('✅ 文件存在\n');

  // 读取Excel
  console.log('📖 正在读取Excel文件...');
  const workbook = XLSX.readFile(excelPath, { cellFormula: false });

  // 显示所有工作表
  console.log('\n📊 工作表列表:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });

  // 使用"Job Data"工作表
  const sheetName = workbook.SheetNames.includes('Job Data') ? 'Job Data' : workbook.SheetNames[0];
  console.log(`\n✅ 使用工作表: ${sheetName}\n`);

  const worksheet = workbook.Sheets[sheetName];

  // 先显示原始前5行单元格内容
  console.log('📋 原始单元格内容（前5行）:');
  for (let row = 1; row <= 5; row++) {
    console.log(`\n   第${row}行:`);
    for (let col = 0; col < 10; col++) {
      const colLetter = String.fromCharCode(65 + col); // A, B, C...
      const cellRef = `${colLetter}${row}`;
      const cell = worksheet[cellRef];
      if (cell && cell.v) {
        console.log(`      ${cellRef}: ${cell.v}`);
      }
    }
  }

  // 跳过第1行标题，从第2行作为列名
  console.log('\n🔍 正确读取数据（跳过第1行标题）...\n');
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    blankrows: false,
    range: 1, // 跳过第1行标题 "LONGi Magnet Australia Job Register"
  }) as Record<string, any>[];

  console.log(`📈 总行数: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log('❌ 工作表为空！');
    process.exit(1);
  }

  // 显示第一行的列名
  console.log('📋 Excel 列名（前10列）:');
  const firstRow = rows[0];
  const columnNames = Object.keys(firstRow).slice(0, 10);
  columnNames.forEach((col, index) => {
    console.log(`   ${index + 1}. "${col}"`);
  });

  if (Object.keys(firstRow).length > 10) {
    console.log(`   ... 还有 ${Object.keys(firstRow).length - 10} 列\n`);
  } else {
    console.log('');
  }

  // 检查关键列
  console.log('🔍 检查关键列:');
  const keyColumns = [
    'Job ID',
    'Project Manager',
    'Client',
    'Mine/Site',
    'Job Type',
  ];

  keyColumns.forEach(col => {
    const exists = Object.keys(firstRow).some(k =>
      k.toLowerCase().replace(/[^a-z0-9]/g, '') === col.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    if (exists) {
      const matchedCol = Object.keys(firstRow).find(k =>
        k.toLowerCase().replace(/[^a-z0-9]/g, '') === col.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      console.log(`   ✅ ${col} → 匹配到: "${matchedCol}"`);
    } else {
      console.log(`   ❌ ${col} → 未找到`);
    }
  });

  // 显示前3行数据样例
  console.log('\n📄 数据样例（前3行）:');
  rows.slice(0, 3).forEach((row, index) => {
    console.log(`\n   第 ${index + 1} 行:`);

    // 显示Job ID
    const jobId = row['Job ID'] || row['job_id'] || row['Task Code'] || '';
    console.log(`      Job ID: ${jobId}`);

    // 显示Project Manager
    const pm = row['Project Manager'] || row['project_manager'] || '';
    console.log(`      Project Manager: ${pm}`);

    // 显示Client
    const client = row['Client'] || row['client'] || '';
    console.log(`      Client: ${client}`);
  });

  // 统计Project Manager字段
  console.log('\n👥 Project Manager 统计:');
  const pmSet = new Set<string>();
  let pmCount = 0;
  let emptyPmCount = 0;

  rows.forEach(row => {
    const pm = (row['Project Manager'] || row['project_manager'] || '').toString().trim();
    if (pm) {
      pmSet.add(pm);
      pmCount++;
    } else {
      emptyPmCount++;
    }
  });

  console.log(`   • 有Project Manager的行: ${pmCount}`);
  console.log(`   • 无Project Manager的行: ${emptyPmCount}`);
  console.log(`   • 唯一的Project Manager数量: ${pmSet.size}\n`);

  if (pmSet.size > 0) {
    console.log('   唯一的Project Manager列表:');
    Array.from(pmSet).slice(0, 10).forEach((pm, index) => {
      console.log(`      ${index + 1}. ${pm}`);
    });
    if (pmSet.size > 10) {
      console.log(`      ... 还有 ${pmSet.size - 10} 个\n`);
    } else {
      console.log('');
    }
  }

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║                 ✅ 诊断完成                        ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

} catch (error: any) {
  console.log('\n❌ 错误:', error.message);
  console.log('\n详细错误信息:');
  console.log(error);
  process.exit(1);
}
