import { BrowserRouter, Routes, Route ,Navigate,Outlet, useNavigate} from 'react-router-dom';
import { useEffect } from 'react';
import UnauthorizedPage from '../components/unauthorized-page.tsx';
import ProductList from '../features/products';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../features/auth/LoginPage';
import RequireAuth from "../features/auth/RequireAuth.tsx";
import FAQ from '../features/faq/faq';
import Team from '../features/user';
import Form from '../features/user/components/Form';
import ProfilePage from '../features/profile/profile.tsx';
import ScanInPage from '../features/inventory/scan-in/page.tsx';
import ScanOutPage from '../features/inventory/scan-out/page.tsx';
import Dashboard from '../features/dashboard/Dashboard';
import UserPermissionsPage from '../features/setting/usersetting.tsx';
import { AppLayout } from '../layout/app-layout.tsx';
import PurchasePage from '../features/purchase/Purchase';
import ProductDetailPage from '../features/products/ProductDetails';
import ProductEditPage from '../features/products/ProductEditPage';
import MobileMenu from '../features/mobile/Mobile.tsx';
import InventoryOverviewPage from '../features/inventory/components/InventoryOverviewPage';
import InventoryTransactionsPage from '../features/inventory/components/inventorytransions.tsx';
import SalesOrderManagement from '../features/sales/page';
import OrdersPage from '../features/orders/OrdersPage';
import ProductGroupsPage from '../features/product-groups/ProductGroupsPage';

/** 手机 (<768px) 跳 /mobile-menu，桌面跳 /dashboard */
function SmartRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    navigate(isMobile ? '/mobile-menu' : '/dashboard', { replace: true })
  }, [navigate])
  return null
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
   <Routes>
       {/* 公开路由：AuthLayout 下的登录、注册、忘记密码等 */}
        {/* ====== 认证模块（无需侧边栏/TopBar） ====== */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
        </Route>

        {/* ====== 主应用模块（带侧边栏/TopBar） ====== */}
       <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* 默认重定向 */}
          <Route index element={<SmartRedirect />} />

            {/* 手机端的几个页面 */}
          <Route path="/mobile-menu" element= {<MobileMenu/>}/>
          <Route path="/inventory/scan-in" element= {<ScanInPage />}/>
          <Route path="/inventory/scan-out" element= {<ScanOutPage/>}/>

          {/* 一级路由 */}

          <Route path="profile" element={<ProfilePage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="product-groups" element={<ProductGroupsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/edit/:id" element={<ProductEditPage />} />
          <Route path="sales" element={<SalesOrderManagement />} />
          <Route path="purchases">
            <Route index element={<PurchasePage/>}></Route>
          </Route>

          {/* 二级路由组：inventory/* */}
          <Route path="inventory" element={<Outlet />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<InventoryOverviewPage />} />
            <Route path=":inventoryId/transactions" element={<InventoryTransactionsPage/>}></Route>
          </Route>
          <Route path="/order" element={<OrdersPage />} />
          <Route path="team" element={<Team />} />
          <Route path="/team/create" element={<Form />} />
          <Route path="/team/edit" element={<Form />} />
          <Route path="faq" element={<FAQ />}></Route>
          <Route path="/settings/global" element={<UserPermissionsPage />}></Route>
        </Route>
          {/* TODO: 更多二级路由组：orders/*、stores/* … */}
        </Route>

        {/* ====== 未匹配路由，跳到登录 ====== */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
