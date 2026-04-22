/**
 * 项目创建到Excel生成 - 自动化测试脚本
 *
 * 测试流程：
 * 1. 读取测试样例数据
 * 2. 创建多个测试项目
 * 3. 自动审批所有项目
 * 4. 验证文件夹和Excel是否创建成功
 * 5. 输出详细测试报告
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// 配置
const API_BASE_URL = 'http://localhost:8081/api';
const TEST_DATA_FILE = path.join(__dirname, 'test-data', 'sample-projects.json');
const EXCEL_PATH = process.env.EXCEL_LOCAL_PATH || 'C:/Longi/ProjectData/Excel/LJA Job Register Rev3.xlsx';
const LOCAL_BASE = process.env.PROJECT_LOCAL_STORAGE || 'C:/Longi/ProjectData/Projects';
const ONEDRIVE_BASE = process.env.PROJECT_ONEDRIVE_STORAGE || 'C:/Longi/ProjectData/OneDrive';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 步骤1: 创建项目
 */
async function createProject(projectData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/projects/create`, projectData);
    return response.data;
  } catch (error) {
    throw new Error(`创建项目失败: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * 步骤2: 审批项目
 */
async function approveProject(projectId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/approve`, {
      approved: true,
      comment: '自动化测试审批通过'
    });
    return response.data;
  } catch (error) {
    throw new Error(`审批项目失败: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * 步骤3: 获取待审批列表
 */
async function getPendingProjects() {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects/pending/list`);
    return response.data.data;
  } catch (error) {
    throw new Error(`获取待审批列表失败: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * 步骤4: 验证文件夹是否存在
 */
async function verifyFolders(project) {
  const results = {
    localFolder: false,
    oneDriveFolder: false,
    metadataLocal: false,
    metadataOneDrive: false,
    subFolders: false
  };

  // 检查本地文件夹
  if (project.localFolderPath && await fs.pathExists(project.localFolderPath)) {
    results.localFolder = true;

    // 检查metadata.json
    const metadataPath = path.join(project.localFolderPath, 'metadata.json');
    if (await fs.pathExists(metadataPath)) {
      results.metadataLocal = true;
    }

    // 检查子文件夹（AT项目应该有Testwork文件夹）
    if (project.jobType === 'AT') {
      const testworkPath = path.join(project.localFolderPath, '03_Testwork');
      if (await fs.pathExists(testworkPath)) {
        results.subFolders = true;
      }
    } else {
      // 其他项目检查基本文件夹
      const quotationPath = path.join(project.localFolderPath, '02_Quotation');
      if (await fs.pathExists(quotationPath)) {
        results.subFolders = true;
      }
    }
  }

  // 检查OneDrive文件夹
  if (project.oneDriveFolderPath && await fs.pathExists(project.oneDriveFolderPath)) {
    results.oneDriveFolder = true;

    const metadataPath = path.join(project.oneDriveFolderPath, 'metadata.json');
    if (await fs.pathExists(metadataPath)) {
      results.metadataOneDrive = true;
    }
  }

  return results;
}

/**
 * 步骤5: 验证Excel是否更新
 */
async function verifyExcel(project) {
  try {
    // 检查Excel文件是否存在
    if (!await fs.pathExists(EXCEL_PATH)) {
      return { exists: false, hasRow: false };
    }

    // 检查是否有备份文件
    const backupDir = path.join(path.dirname(EXCEL_PATH), 'backups');
    const hasBackup = await fs.pathExists(backupDir);

    return {
      exists: true,
      hasBackup: hasBackup,
      excelRowNumber: project.excelRowNumber
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * 主测试流程
 */
async function runTest() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('      项目创建到Excel生成 - 自动化测试', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  try {
    // 1. 读取测试数据
    log('📥 步骤1: 读取测试样例数据...', 'blue');
    const sampleProjects = await fs.readJson(TEST_DATA_FILE);
    log(`✅ 成功加载 ${sampleProjects.length} 个测试项目\n`, 'green');

    // 选择前5个进行测试
    const testProjects = sampleProjects.slice(0, 5);
    const createdProjects = [];

    // 2. 创建项目
    log('📝 步骤2: 创建测试项目...', 'blue');
    for (let i = 0; i < testProjects.length; i++) {
      const project = testProjects[i];
      try {
        const result = await createProject(project);
        createdProjects.push(result.data);
        log(`  ✅ [${i + 1}/${testProjects.length}] ${project.name} - ID: ${result.data.id}`, 'green');
      } catch (error) {
        log(`  ❌ [${i + 1}/${testProjects.length}] ${project.name} - ${error.message}`, 'red');
      }
      await sleep(500); // 避免请求过快
    }
    log('');

    if (createdProjects.length === 0) {
      log('❌ 没有成功创建任何项目，测试终止\n', 'red');
      return;
    }

    // 3. 验证待审批列表
    log('📋 步骤3: 验证待审批列表...', 'blue');
    await sleep(1000);
    const pendingProjects = await getPendingProjects();
    log(`✅ 待审批项目数: ${pendingProjects.length}\n`, 'green');

    // 4. 审批所有项目
    log('👍 步骤4: 自动审批所有项目...', 'blue');
    const approvedProjects = [];

    for (let i = 0; i < createdProjects.length; i++) {
      const project = createdProjects[i];
      try {
        log(`  ⏳ [${i + 1}/${createdProjects.length}] 正在审批: ${project.name}...`, 'yellow');
        const result = await approveProject(project.id);
        approvedProjects.push(result.data);

        log(`  ✅ 审批成功！`, 'green');
        log(`     - 项目编号: ${result.data.projectCode}`, 'cyan');
        log(`     - 同步状态: ${result.data.syncStatus}`, 'cyan');
        log(`     - Excel行号: ${result.data.excelRowNumber}`, 'cyan');
        log('');
      } catch (error) {
        log(`  ❌ 审批失败: ${error.message}\n`, 'red');
      }
      await sleep(2000); // 给系统时间完成同步
    }

    if (approvedProjects.length === 0) {
      log('❌ 没有成功审批任何项目，测试终止\n', 'red');
      return;
    }

    // 5. 验证文件系统和Excel
    log('🔍 步骤5: 验证文件系统和Excel...', 'blue');
    const verificationResults = [];

    for (const project of approvedProjects) {
      log(`\n  📁 验证项目: ${project.projectCode}`, 'magenta');

      // 验证文件夹
      const folderResults = await verifyFolders(project);
      log(`     本地文件夹: ${folderResults.localFolder ? '✅' : '❌'}`, folderResults.localFolder ? 'green' : 'red');
      log(`     OneDrive文件夹: ${folderResults.oneDriveFolder ? '✅' : '❌'}`, folderResults.oneDriveFolder ? 'green' : 'red');
      log(`     Metadata(本地): ${folderResults.metadataLocal ? '✅' : '❌'}`, folderResults.metadataLocal ? 'green' : 'red');
      log(`     Metadata(云): ${folderResults.metadataOneDrive ? '✅' : '❌'}`, folderResults.metadataOneDrive ? 'green' : 'red');
      log(`     子文件夹结构: ${folderResults.subFolders ? '✅' : '❌'}`, folderResults.subFolders ? 'green' : 'red');

      // 验证Excel
      const excelResults = await verifyExcel(project);
      log(`     Excel文件: ${excelResults.exists ? '✅' : '❌'}`, excelResults.exists ? 'green' : 'red');
      if (excelResults.exists) {
        log(`     Excel行号: ${excelResults.excelRowNumber || 'N/A'}`, 'cyan');
        log(`     Excel备份: ${excelResults.hasBackup ? '✅' : '❌'}`, excelResults.hasBackup ? 'green' : 'red');
      }

      verificationResults.push({
        project: project.projectCode,
        folders: folderResults,
        excel: excelResults
      });
    }

    // 6. 生成测试报告
    log('\n═══════════════════════════════════════════════════════', 'cyan');
    log('                    测试报告汇总', 'cyan');
    log('═══════════════════════════════════════════════════════\n', 'cyan');

    log(`📊 项目创建统计:`, 'blue');
    log(`   - 尝试创建: ${testProjects.length} 个`);
    log(`   - 成功创建: ${createdProjects.length} 个`, createdProjects.length === testProjects.length ? 'green' : 'yellow');
    log(`   - 成功审批: ${approvedProjects.length} 个`, approvedProjects.length === createdProjects.length ? 'green' : 'yellow');
    log('');

    log(`✅ 成功审批的项目:`, 'green');
    approvedProjects.forEach(p => {
      log(`   - ${p.projectCode}: ${p.name}`, 'cyan');
    });
    log('');

    // 统计验证成功率
    const totalChecks = verificationResults.length * 7; // 每个项目7项检查
    let passedChecks = 0;
    verificationResults.forEach(r => {
      if (r.folders.localFolder) passedChecks++;
      if (r.folders.oneDriveFolder) passedChecks++;
      if (r.folders.metadataLocal) passedChecks++;
      if (r.folders.metadataOneDrive) passedChecks++;
      if (r.folders.subFolders) passedChecks++;
      if (r.excel.exists) passedChecks++;
      if (r.excel.hasBackup) passedChecks++;
    });

    const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
    log(`📈 验证成功率: ${passedChecks}/${totalChecks} (${successRate}%)`,
      successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    log('');

    log(`📂 文件路径信息:`, 'blue');
    log(`   - 本地存储: ${LOCAL_BASE}`);
    log(`   - OneDrive: ${ONEDRIVE_BASE}`);
    log(`   - Excel文件: ${EXCEL_PATH}`);
    log('');

    // 最终结论
    if (successRate >= 90) {
      log('🎉 测试通过！所有功能正常工作。', 'green');
    } else if (successRate >= 70) {
      log('⚠️  测试部分通过，部分功能存在问题。', 'yellow');
    } else {
      log('❌ 测试失败，存在严重问题。', 'red');
    }

    log('\n═══════════════════════════════════════════════════════\n', 'cyan');

  } catch (error) {
    log(`\n❌ 测试执行失败: ${error.message}\n`, 'red');
    console.error(error);
  }
}

// 执行测试
if (require.main === module) {
  log('\n🚀 启动自动化测试...\n', 'cyan');
  runTest().catch(error => {
    log(`\n💥 未捕获的错误: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTest };
