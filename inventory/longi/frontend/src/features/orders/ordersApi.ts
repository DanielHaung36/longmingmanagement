// src/features/orders/ordersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
}

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({   baseUrl: import.meta.env.VITE_API_URL, // 或者你的后端前缀
        credentials: 'include', }),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query<OrderRow[], void>({
      query: () => 'orders',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['Orders'],
    }),
    getOrder: builder.query<OrderRow, string>({
      query: (id) => `orders/${id}`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (_result, _err, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation<OrderRow, Omit<OrderRow, 'id'>>({
      query: (body) => ({
        url: 'orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Orders'],
    }),
    updateOrder: builder.mutation<OrderRow, { id: string, data: Partial<OrderRow> }>({
      query: ({ id, data }) => ({
        url: `orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Orders', id: arg.id }, 'Orders'],
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;
