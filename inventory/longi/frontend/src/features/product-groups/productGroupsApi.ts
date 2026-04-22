import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface ProductGroup {
  id: number
  name: string
  description?: string
  productCount: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateProductGroupDto {
  name: string
  description?: string
}

export interface UpdateProductGroupDto {
  id: number
  name?: string
  description?: string
}

export const productGroupsApi = createApi({
  reducerPath: 'productGroupsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
  }),
  tagTypes: ['ProductGroup'],
  endpoints: (builder) => ({
    getProductGroups: builder.query<ProductGroup[], void>({
      query: () => '/product-groups',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: [{ type: 'ProductGroup', id: 'LIST' }],
    }),
    createProductGroup: builder.mutation<ProductGroup, CreateProductGroupDto>({
      query: (body) => ({
        url: '/product-groups',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'ProductGroup', id: 'LIST' }],
    }),
    updateProductGroup: builder.mutation<ProductGroup, UpdateProductGroupDto>({
      query: ({ id, ...body }) => ({
        url: `/product-groups/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'ProductGroup', id: 'LIST' }],
    }),
    deleteProductGroup: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/product-groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'ProductGroup', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
} = productGroupsApi
