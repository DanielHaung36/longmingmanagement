/**
 * Electron 桥接工具
 * 用于 Web 应用与 Electron 主进程通信
 */

// 检测是否在 Electron 环境中运行
export const isElectron = (): boolean => {
  return !!(window as any).electronAPI;
};

// 获取用户配置的 OneDrive 本地路径
export const getOneDriveLocalPath = (): string => {
  // 从 localStorage 读取用户配置
  return localStorage.getItem('onedrive_local_path') || '';
};

// 保存用户配置的 OneDrive 本地路径
export const setOneDriveLocalPath = (path: string): void => {
  localStorage.setItem('onedrive_local_path', path);
};

/**
 * 将服务器路径转换为本地路径
 * @param serverPath - 服务器返回的路径，例如：03 Project Management/Client/...
 *                     或旧格式：/mnt/onedrive/03 Project Management/Client/...
 * @returns 本地路径，例如：C:\Users\xxx\OneDrive\Documents - Longi Australia\03 Project Management\Client\...
 */
export const convertServerPathToLocal = (serverPath: string): string => {
  const localBasePath = getOneDriveLocalPath();

  if (!localBasePath) {
    console.warn('OneDrive local path not configured');
    return '';
  }

  // 移除旧的服务器路径前缀（兼容未迁移的数据）
  let relativePath = serverPath
    .replace(/^\/mnt\/onedrive\/?/, '')
    .replace(/^\/mnt\/longi-storage\/onedrive\/?/, '');

  // 如果 localBasePath 已经包含 "03 Project Management"，
  // 则移除 relativePath 中的重复前缀，避免路径拼接重复
  if (localBasePath.includes('03 Project Management') && relativePath.startsWith('03 Project Management')) {
    relativePath = relativePath.replace(/^03 Project Management[\/\\]?/, '');
  }

  // 转换路径分隔符：/ → \
  const windowsPath = relativePath.replace(/\//g, '\\');

  // 拼接本地路径（确保中间只有一个反斜杠）
  const localPath = localBasePath.endsWith('\\')
    ? `${localBasePath}${windowsPath}`
    : `${localBasePath}\\${windowsPath}`;

  return localPath;
};

/**
 * 在文件浏览器中打开路径
 * @param serverPath - 服务器返回的路径
 * @param isFolder - 是否是文件夹（true=文件夹，false=文件）
 */
export const openFileInExplorer = async (serverPath: string, isFolder: boolean = false): Promise<void> => {
  if (!isElectron()) {
    alert('此功能仅在桌面应用中可用。请下载 Longi Desktop 应用。');
    return;
  }

  const localPath = convertServerPathToLocal(serverPath);

  if (!localPath) {
    alert('请先在设置中配置 OneDrive 本地路径');
    return;
  }

  try {
    const result = await (window as any).electronAPI.openPath(localPath, isFolder);

    if (!result.success) {
      console.error('Failed to open path:', result.error);
      alert(`无法打开${isFolder ? '文件夹' : '文件'}：${result.error}\n\n路径：${localPath}`);
    }
  } catch (error) {
    console.error('Error opening file:', error);
    alert('打开文件时出错');
  }
};

/**
 * 在文件浏览器中显示文件（定位到文件）
 * @param serverPath - 服务器返回的路径
 */
export const showFileInFolder = async (serverPath: string): Promise<void> => {
  if (!isElectron()) {
    alert('此功能仅在桌面应用中可用。请下载 Longi Desktop 应用。');
    return;
  }

  const localPath = convertServerPathToLocal(serverPath);

  if (!localPath) {
    alert('请先在设置中配置 OneDrive 本地路径');
    return;
  }

  try {
    const result = await (window as any).electronAPI.showInFolder(localPath);

    if (!result.success) {
      console.error('Failed to show in folder:', result.error);
      alert(`无法定位文件：${result.error}\n\n路径：${localPath}`);
    }
  } catch (error) {
    console.error('Error showing file:', error);
    alert('定位文件时出错');
  }
};

/**
 * 路径示例和提示文本
 */
export const PATH_EXAMPLES = {
  windows: 'C:\\Users\\YourName\\OneDrive\\Documents - Longi Australia\\03 Project Management',
  description: '请输入你电脑上 OneDrive 的 "03 Project Management" 文件夹的完整路径'
};
