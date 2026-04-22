# Longi Desktop Application

## 快速开始

### 1. 安装依赖
```bash
cd longi-desktop
npm install
```

### 2. 启动开发模式
```bash
# 确保你的 Web 应用已经在 http://localhost:3000 运行
cd ../client
npm run dev

# 然后在另一个终端启动 Electron
cd ../longi-desktop
npm start
```

### 3. 测试文件打开功能
1. 在 Electron 窗口中访问 Settings → Preferences
2. 配置 OneDrive 路径（例如：`C:\Users\YourName\OneDrive\Documents - Longi Australia\03 Project Management`）
3. 点击 Save Path
4. 访问任何项目或任务的文件列表
5. 点击 📂 按钮测试打开文件/文件夹

### 4. 打包成安装程序
```bash
npm run build
# 输出：dist/Longi Project Management Setup.exe
```

## 配置说明

### 修改服务器地址
编辑 `electron/main.js` 第 16 行：
```javascript
// 开发环境
mainWindow.loadURL('http://localhost:3000');

// 生产环境
// mainWindow.loadURL('http://your-server-ip:3000');
```

## 调试

打开应用后会自动打开 DevTools，你可以：
- 查看控制台日志
- 检查 `window.electronAPI` 是否存在
- 测试路径转换功能
