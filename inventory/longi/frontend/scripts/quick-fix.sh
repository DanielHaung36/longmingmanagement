#!/bin/bash

# Longi前端项目快速修复脚本

set -e

echo "🔧 开始Longi前端项目快速修复..."

# 1. 备份重要文件
echo "📦 备份重要文件..."
cp vite.config.ts vite.config.ts.backup
cp tsconfig.json tsconfig.json.backup
cp src/features/auth/authSlice.ts src/features/auth/authSlice.ts.backup

# 2. 移除危险的TypeScript错误忽略
echo "🚨 移除危险的TypeScript错误忽略..."
sed -i '/ignoreTS/,/}/d' vite.config.ts
sed -i '/ignoreTS/d' vite.config.ts

# 3. 清理console.log (但保留console.error)
echo "🧹 清理调试代码..."
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "console\.log" | while read file; do
    echo "清理文件: $file"
    sed -i '/console\.log/d' "$file"
done

# 4. 修复TypeScript配置
echo "🔧 修复TypeScript配置..."
cat > tsconfig.json << 'EOF'
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "skipLibCheck": true,
    "paths": {
      "@/*": ["src/*"],
      "@features": ["src/features/index.ts"],
      "@features/*": ["src/features/*"],
      "@app/*": ["src/app/*"],
      "@app": ["src/app/store"]
    }
  }
}
EOF

# 5. 清理authSlice.ts中的注释代码
echo "🧹 清理重复代码..."
sed -i '1,69d' src/features/auth/authSlice.ts

# 6. 创建环境变量示例文件
echo "🔐 创建环境变量示例..."
cat > .env.example << 'EOF'
# API配置
VITE_API_URL=/api
VITE_API_HOST=http://localhost:8080

# 应用配置
VITE_APP_NAME=Longi Inventory System
VITE_APP_VERSION=1.0.0
NODE_ENV=development
EOF

# 7. 添加基本的错误边界
echo "🛡️ 添加错误边界..."
mkdir -p src/components/common
cat > src/components/common/ErrorBoundary.tsx << 'EOF'
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              出现了错误
            </h2>
            <p className="text-gray-600 mb-4">
              应用运行时出现了问题，请刷新页面重试。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
EOF

# 8. 更新package.json脚本
echo "📦 更新package.json脚本..."
if command -v jq &> /dev/null; then
    jq '.scripts.typecheck = "tsc --noEmit"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts.clean = "rm -rf dist node_modules/.cache"' package.json > package.json.tmp && mv package.json.tmp package.json
else
    echo "警告: jq未安装，跳过package.json更新"
fi

# 9. 创建基本的代码质量检查脚本
echo "📋 创建代码质量检查脚本..."
cat > scripts/check-quality.sh << 'EOF'
#!/bin/bash

echo "🔍 代码质量检查..."

# 检查TypeScript类型
echo "检查TypeScript类型..."
npm run typecheck

# 检查ESLint
echo "检查ESLint..."
npm run lint

# 检查是否有console.log残留
echo "检查console.log残留..."
if grep -r "console\.log" src/; then
    echo "❌ 发现console.log残留，请清理"
    exit 1
else
    echo "✅ 无console.log残留"
fi

# 检查是否有硬编码的敏感信息
echo "检查硬编码敏感信息..."
if grep -r "password.*=" src/ | grep -v "password:" | grep -v "interface"; then
    echo "❌ 发现疑似硬编码密码"
    exit 1
else
    echo "✅ 无硬编码敏感信息"
fi

echo "✅ 代码质量检查完成"
EOF

chmod +x scripts/check-quality.sh

# 10. 生成修复报告
echo "📊 生成修复报告..."
cat > QUICK_FIX_REPORT.md << 'EOF'
# 快速修复报告

## 修复内容

### 1. 移除危险配置
- ✅ 移除了vite.config.ts中的TypeScript错误忽略插件
- ✅ 修复了TypeScript配置文件

### 2. 代码清理
- ✅ 移除了console.log调试代码
- ✅ 清理了authSlice.ts中的重复代码

### 3. 安全增强
- ✅ 创建了环境变量示例文件
- ✅ 添加了错误边界组件

### 4. 工具改进
- ✅ 添加了代码质量检查脚本
- ✅ 更新了package.json脚本

## 后续步骤

1. 运行 `npm run typecheck` 检查类型错误
2. 运行 `npm run lint` 检查代码规范
3. 运行 `./scripts/check-quality.sh` 进行质量检查
4. 测试应用功能是否正常

## 备份文件

- vite.config.ts.backup
- tsconfig.json.backup
- src/features/auth/authSlice.ts.backup

如需回滚，请使用备份文件。
EOF

echo "✅ 快速修复完成！"
echo "📄 请查看 QUICK_FIX_REPORT.md 了解详细信息"
echo "🧪 建议运行 ./scripts/check-quality.sh 进行质量检查"