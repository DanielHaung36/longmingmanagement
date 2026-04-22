import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Warehouse {
  id: number
  name: string
  location: string
  createdAt?: string
  updatedAt?: string
}

export const warehousesApi = createApi({
  reducerPath: 'warehousesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
  }),
  tagTypes: ['Warehouse'],
  endpoints: (builder) => ({
    getWarehouses: builder.query<Warehouse[], void>({
      query: () => '/warehouses',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),
    // ...其它接口略
  }),
})

export const { useGetWarehousesQuery } = warehousesApi
