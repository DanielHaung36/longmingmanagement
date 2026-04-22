// productsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Product {
    id: string
    partNumberCN: string
    partNumberAU?: string
    barcode?: string
    compatiblemodels?: string
    description?: string
    codeSeq?: number
    code?: string
    descriptionChinese?: string
    asset?: string
    customer?: string
    note?: string
    partGroup?: string
    groupId?: number
    groupName?: string
    partLife?: string
    oem?: string
    purchasePrice?: number
    unitPrice?: number
    imageUrl?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateProductResponse {
  message: string
  products: Product[]
}

export interface ProductListResponse {
  data: Product[]
  total: number
  page: number
  pageSize: number
}

export interface ProductQueryParams {
  page?: number
  pageSize?: number
  search?: string
  groupId?: number
  customer?: string
  region?: 'australia' | 'china' | ''
  sortField?: string
  sortDir?: 'asc' | 'desc'
}

export interface ProductStats {
  totalProducts: number
  totalValue: number
  uniqueCustomers: number
}

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Product', 'Inventory'],

    endpoints: (builder) => ({
        // GET /products (server-side pagination + search + filter + sort)
        getProducts: builder.query<ProductListResponse, ProductQueryParams | void>({
            query: (params) => {
                const q = new URLSearchParams()
                if (params) {
                    if (params.page) q.append('page', params.page.toString())
                    if (params.pageSize != null) q.append('pageSize', params.pageSize.toString())
                    if (params.search) q.append('search', params.search)
                    if (params.groupId) q.append('groupId', params.groupId.toString())
                    if (params.customer) q.append('customer', params.customer)
                    if (params.region) q.append('region', params.region)
                    if (params.sortField) q.append('sortField', params.sortField)
                    if (params.sortDir) q.append('sortDir', params.sortDir)
                }
                const qs = q.toString()
                return `/products${qs ? '?' + qs : ''}`
            },
            transformResponse: (response: any) => ({
                data: response.data ?? [],
                total: response.total ?? 0,
                page: response.page ?? 1,
                pageSize: response.pageSize ?? response.limit ?? 20,
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        { type: 'Product' as const, id: 'LIST' },
                        ...result.data.map((p) => ({ type: 'Product' as const, id: p.id })),
                    ]
                    : [{ type: 'Product' as const, id: 'LIST' }],
        }),

        // GET /products?pageSize=0 (all products, for export)
        getAllProducts: builder.query<Product[], void>({
            query: () => '/products?pageSize=0',
            transformResponse: (response: ProductListResponse) => response.data || [],
            providesTags: [{ type: 'Product' as const, id: 'LIST' }],
        }),

        // GET /products/customers
        getProductCustomers: builder.query<string[], void>({
            query: () => '/products/customers',
            transformResponse: (response: any) => response.data ?? [],
            providesTags: [{ type: 'Product' as const, id: 'CUSTOMERS' }],
        }),

        // GET /products/stats
        getProductStats: builder.query<ProductStats, void>({
            query: () => '/products/stats',
            transformResponse: (response: any) => response.data,
            providesTags: [{ type: 'Product' as const, id: 'STATS' }],
        }),

        // GET /products/:id
        getProduct: builder.query<Product, string>({
            query: (id) => `/products/${id}`,
            transformResponse: (response: any) => response.data ?? response,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        }),

        // POST /products
        createProduct: builder.mutation<CreateProductResponse, Partial<Product>>({
            query: (data) => ({
                url: '/products',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: any): CreateProductResponse => ({
                message: response.message || 'created',
                products: Array.isArray(response.data) ? response.data : response.data ? [response.data] : [],
            }),
            invalidatesTags: [
                { type: 'Product', id: 'LIST' },
                { type: 'Product', id: 'CUSTOMERS' },
                { type: 'Product', id: 'STATS' },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),

        // PUT /products/:id
        updateProduct: builder.mutation<
            Product,
            Partial<Product> & Pick<Product, 'id'>
        >({
            query: ({ id, ...patch }) => ({
                url: `/products/${id}`,
                method: 'PUT',
                body: patch,
            }),
            transformResponse: (response: any): Product => response.data ?? response,
            invalidatesTags: (result, error, { id }) => [
                { type: 'Product', id },
                { type: 'Product', id: 'LIST' },
                { type: 'Product', id: 'CUSTOMERS' },
                { type: 'Product', id: 'STATS' },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),

        // DELETE /products/:id
        deleteProduct: builder.mutation<{ success: boolean; id: string }, string>({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Product', id },
                { type: 'Product', id: 'LIST' },
                { type: 'Product', id: 'CUSTOMERS' },
                { type: 'Product', id: 'STATS' },
                { type: 'Inventory', id: 'LIST' },
            ],
        }),

        // POST /products/:id/image
        uploadProductImage: builder.mutation<{ message: string; imageUrl: string }, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData()
                formData.append('image', file)
                return {
                    url: `/products/${id}/image`,
                    method: 'POST',
                    body: formData,
                }
            },
            invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
        }),

        // DELETE /products/:id/image
        deleteProductImage: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/products/${id}/image`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Product', id }],
        }),
    }),
})

export const {
    useGetProductsQuery,
    useLazyGetProductsQuery,
    useGetAllProductsQuery,
    useGetProductCustomersQuery,
    useGetProductStatsQuery,
    useGetProductQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useUploadProductImageMutation,
    useDeleteProductImageMutation,
} = productsApi
