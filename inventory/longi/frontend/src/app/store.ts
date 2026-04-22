import { configureStore, } from '@reduxjs/toolkit';
// import your feature reducers here:
import productsReducer from '../features/products/productsSlice';
import { productsApi } from '../features/products/productsApi'
import authReducer from "../features/auth/authSlice"
import { authApi } from '../features/auth/authApi'
import { inventoryApi } from '../features/inventory/inventoryApi'
import { warehousesApi } from '../features/warehouses/warehousesApi';
import { ordersApi } from '../features/orders/ordersApi';
import { userApi } from '../features/user/userApi';
import { permissionApi } from '../features/setting/permissionApi';
import { productGroupsApi } from '../features/product-groups/productGroupsApi';
export const store = configureStore({
  reducer: {
    //slice reducers
    auth:authReducer,
    [authApi.reducerPath]: authApi.reducer,
    products: productsReducer,      // 可选：如果你还想在 productsSlice 放额外 state
    [productsApi.reducerPath]: productsApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [warehousesApi.reducerPath]:warehousesApi.reducer,
        [ordersApi.reducerPath]: ordersApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [permissionApi.reducerPath]:permissionApi.reducer,
        [productGroupsApi.reducerPath]: productGroupsApi.reducer,
    // RTK 会把 getDefaultMiddleware 当第一个参数传给你

  },
  middleware: (getDefaultMiddleware) =>
      // 必须将 RTK Query 的中间件添加到默认中间件链中
      getDefaultMiddleware()
          .concat(authApi.middleware)
          .concat(productsApi.middleware)
          .concat(inventoryApi.middleware)
          .concat(warehousesApi.middleware)
          .concat(ordersApi.middleware)
          .concat(permissionApi.middleware)
          .concat(userApi.middleware)
          .concat(productGroupsApi.middleware),

   // 关键！缺少这行会触发警告

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
