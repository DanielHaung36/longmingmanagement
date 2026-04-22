#!/usr/bin/env bash
set -e

echo "🚀 初始化前端项目目录和文件…"

# 1. 目录结构
mkdir -p public/assets
mkdir -p src/{api,app,features/{products,orders,stores},layouts,components,hooks,mocks,routes,styles,utils}

# 2. 空文件或基础文件
touch public/index.html

# API client
cat > src/api/client.ts << 'EOF'
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default axios;
EOF

# Redux store & hooks
cat > src/app/store.ts << 'EOF'
import { configureStore } from '@reduxjs/toolkit';
// import your feature reducers here:
// import productsReducer from '../features/products/productsSlice';

export const store = configureStore({
  reducer: {
    // products: productsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
EOF

cat > src/app/hooks.ts << 'EOF'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
EOF

# Tailwind & PostCSS 配置
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ]
}
EOF

cat > src/styles/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# 根入口
cat > src/index.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './app/store';

if (process.env.NODE_ENV === 'development') {
  import('./mocks/browser').then(({ worker }) => worker.start());
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
EOF

cat > src/App.tsx << 'EOF'
import React from 'react';
import AppRoutes from './routes/AppRoutes';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
}

export default App;
EOF

# Routes
cat > src/routes/AppRoutes.tsx << 'EOF'
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductsPage from '../features/products/ProductsPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        {/* TODO: add other routes */}
      </Routes>
    </BrowserRouter>
  );
}
EOF

# MSW Mock
cat > src/mocks/handlers.ts << 'EOF'
import { rest } from 'msw';
import { products } from './db.json';

export const handlers = [
  rest.get('/products', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('_page') || '1');
    const limit = Number(req.url.searchParams.get('_limit') || '10');
    const start = (page - 1) * limit;
    return res(
      ctx.status(200),
      ctx.set('X-Total-Count', products.length.toString()),
      ctx.json(products.slice(start, start + limit))
    );
  }),
  // TODO: add other handlers
];
EOF

cat > src/mocks/browser.ts << 'EOF'
import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
EOF

cat > src/mocks/db.json << 'EOF'
{
  "products": [
    { "id":1, "djj_code":"P001", "name":"起重机 A1", "price":100000 },
    { "id":2, "djj_code":"P002", "name":"装载机 B2", "price":85000 },
    { "id":3, "djj_code":"P003", "name":"挖掘机 C3", "price":120000 },
    { "id":4, "djj_code":"P004", "name":"压路机 D4", "price":95000 },
    { "id":5, "djj_code":"P005", "name":"平地机 E5", "price":78000 },
    { "id":6, "djj_code":"P006", "name":"混凝土泵车 F6", "price":110000 },
    { "id":7, "djj_code":"P007", "name":"叉车 G7", "price":45000 },
    { "id":8, "djj_code":"P008", "name":"履带式起重机 H8", "price":135000 },
    { "id":9, "djj_code":"P009", "name":"推土机 I9", "price":98000 },
    { "id":10,"djj_code":"P010", "name":"铲车 J10", "price":67000 },
    { "id":11,"djj_code":"P011", "name":"沥青摊铺机 K11", "price":89000 },
    { "id":12,"djj_code":"P012", "name":"桥梁起重机 L12", "price":145000 },
    { "id":13,"djj_code":"P013", "name":"管桩打桩机 M13", "price":115000 },
    { "id":14,"djj_code":"P014", "name":"旋挖钻机 N14", "price":125000 },
    { "id":15,"djj_code":"P015", "name":"钻机 O15", "price":112000 },
    { "id":16,"djj_code":"P016", "name":"高空作业平台 P16", "price":72000 },
    { "id":17,"djj_code":"P017", "name":"升降机 Q17", "price":68000 },
    { "id":18,"djj_code":"P018", "name":"履带吊 R18", "price":132000 },
    { "id":19,"djj_code":"P019", "name":"轨道吊 S19", "price":140000 },
    { "id":20,"djj_code":"P020", "name":"汽车吊 T20", "price":89000 }
  ]
}
EOF

# Feature placeholder files
for feat in products orders stores; do
  mkdir -p src/features/$feat/components
  touch src/features/$feat/{${feat}Slice.ts,${feat}Api.ts,${feat^}Page.tsx,types.ts}
done

# Layouts & common components
touch src/layouts/{MainLayout.tsx,Sidebar.tsx}
touch src/components/{Button.tsx,Table.tsx,Pagination.tsx}
touch src/hooks/{usePagination.ts,useDebounce.ts}
touch src/utils/{formatDate.ts,validate.ts}

echo "✅ 初始化完成，请安装依赖并启动："
echo "   cd frontend && npm install"
echo "   npm start"
