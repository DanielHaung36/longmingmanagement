const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  // 配置持久化 session（记住登录状态）
  const ses = session.defaultSession;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:longi', // 使用持久化分区，保存 cookies 和 session
    }
  });

  // 开发环境：加载本地开发服务器
  // mainWindow.loadURL('http://localhost:3000');

  // 生产环境：修改为你的服务器地址
  mainWindow.loadURL('https://clientlongi.easytool.page');

  // 打开开发者工具（调试用）
  // mainWindow.webContents.openDevTools();
}

// 处理打开文件路径
ipcMain.handle('open-file-path', async (event, filePath, isFolder = false) => {
  try {
    console.log('Opening path:', filePath, 'isFolder:', isFolder);

    // 检查路径是否存在
    if (!fs.existsSync(filePath)) {
      console.error('Path does not exist:', filePath);
      return { success: false, error: '路径不存在: ' + filePath };
    }

    if (isFolder) {
      // 明确是文件夹：使用 shell.openPath 打开（更可靠）
      console.log('Opening folder with shell.openPath');
      const result = await shell.openPath(filePath);

      if (result) {
        console.error('Failed to open folder:', result);
        return { success: false, error: result };
      }

      console.log('Successfully opened folder');
      return { success: true };
    } else {
      // 明确是文件：使用默认应用打开
      console.log('Opening file with default application');
      const result = await shell.openPath(filePath);

      if (result) {
        console.error('Failed to open file:', result);
        return { success: false, error: result };
      }

      console.log('Successfully opened file');
      return { success: true };
    }
  } catch (error) {
    console.error('Error opening path:', error);
    return { success: false, error: error.message };
  }
});

// 在文件浏览器中显示文件
ipcMain.handle('show-in-folder', async (event, filePath) => {
  try {
    console.log('Showing in folder:', filePath);
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error showing in folder:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
