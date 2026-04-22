const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给 Web 应用
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件路径
  openPath: (filePath, isFolder = false) => {
    console.log('Preload: openPath called with:', filePath, 'isFolder:', isFolder);
    return ipcRenderer.invoke('open-file-path', filePath, isFolder);
  },

  // 在文件浏览器中显示
  showInFolder: (filePath) => {
    console.log('Preload: showInFolder called with:', filePath);
    return ipcRenderer.invoke('show-in-folder', filePath);
  },

  // 标记是否在 Electron 中运行
  isElectron: true
});

console.log('Preload script loaded - electronAPI is available');
