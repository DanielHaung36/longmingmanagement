// src/features/inventory/inventoryApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { InventoryRow, InventoryTransaction } from './components/InventoryModel'

/** 将后端 snake_case + 嵌套 product/warehouse 映射到前端 camelCase InventoryRow */
function mapInventoryRow(item: any): InventoryRow {
    const p = item.product ?? {}
    const w = item.warehouse ?? {}
    const actualQty = Number(item.actual_qty ?? 0)
    const lockedQty = Number(item.locked_qty ?? 0)
    return {
        id:                Number(item.id),
        productID:         item.product_id ?? '',
        warehouseID:       Number(item.warehouse_id ?? 0),
        warehouseName:     w.name ?? '',
        partNumberCN:      p.part_number_cn ?? '',
        partNumberAU:      p.part_number_au ?? '',
        barcode:           p.barcode ?? '',
        compatiblemodels:  p.compatiblemodels ?? '',
        description:       p.description ?? '',
        descriptionChinese: p.description_chinese ?? '',
        warehouse:         w.name ?? '',
        siteLocation:      item.site_location ?? '',
        asset:             p.asset ?? '',
        customer:          p.customer ?? '',
        note:              p.note ?? '',
        partGroup:         p.part_group ?? '',
        partLife:          p.part_life ?? '',
        oem:               p.oem ?? '',
        purchasePrice:     Number(p.purchase_price ?? 0),
        unitPrice:         Number(p.unit_price ?? 0),
        actualQty,
        lockedQty,
        availableQty:      actualQty - lockedQty,
        operator:          item.operator ?? '',
        operationTime:     item.operation_time ?? '',
    }
}

export const inventoryApi = createApi({
    reducerPath: 'inventoryApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL, // 或者你的后端前缀
        credentials: 'include',
    }),
    tagTypes: ['Inventory', 'InventoryTransactions','TodayStats'],
    endpoints: (builder) => ({
        /** 获取所有库存记录 */
        getInventory: builder.query<InventoryRow[], void>({
            query: () => '/inventory?limit=0',
            transformResponse: (response: any) => {
                const raw: any[] = response.data ?? response
                return raw.map(mapInventoryRow)
            },
            providesTags: (result) =>
                result
                    ? [
                        { type: 'Inventory' as const, id: 'LIST' },
                        ...result.map((row) => ({ type: 'Inventory' as const, id: row.id })),
                    ]
                    : [{ type: 'Inventory' as const, id: 'LIST' }],
        }),
        /** 根据 ID 获取单条库存详情 */
        getInventoryById: builder.query<InventoryRow, number>({
            query: (id) => `/inventory/${id}`,
            transformResponse: (response: any) => mapInventoryRow(response.data ?? response),
            providesTags: (result, error, id) => [{ type: 'Inventory', id }],
        }),
        /** 新增一条库存记录 */
        createInventory: builder.mutation<InventoryRow, Partial<InventoryRow>>({
            query: (data) => ({
                url: '/inventory',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
        }),
        /** 更新库存记录（PUT 或 PATCH） */
        updateInventory: builder.mutation<
            InventoryRow,
            { id: number, action?: "in" | "out"; deltaQty?: number } & Partial<InventoryRow>>({
                query: ({ id, ...patch }) => ({
                    url: `/inventory/${id}`,
                    method: 'PUT',
                    body: patch,
                }),
                invalidatesTags: (result, error, { id }) => [{ type: 'Inventory', id }, { type: 'Inventory', id: 'LIST' }, { type: 'InventoryTransactions' as const, id: id }],
            }),
        /** 入库 */
        stockIn: builder.mutation<{ success: boolean }, { inventory_id: number; quantity: number; note?: string }>({
            query: (body) => ({ url: '/inventory/in', method: 'POST', body }),
            invalidatesTags: (result, error, { inventory_id }) => [
                { type: 'Inventory', id: inventory_id },
                { type: 'Inventory', id: 'LIST' },
                { type: 'TodayStats', id: 'TODAY' },
            ],
        }),
        /** 出库 */
        stockOut: builder.mutation<{ success: boolean }, { inventory_id: number; quantity: number; note?: string }>({
            query: (body) => ({ url: '/inventory/out', method: 'POST', body }),
            invalidatesTags: (result, error, { inventory_id }) => [
                { type: 'Inventory', id: inventory_id },
                { type: 'Inventory', id: 'LIST' },
                { type: 'TodayStats', id: 'TODAY' },
            ],
        }),
        /** 删除一条库存记录 */
        deleteInventory: builder.mutation<{ success: boolean; id: number }, number>({
            query: (id) => ({
                url: `/inventory/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Inventory', id }],
        }),
        getInventoryTransactions: builder.query<InventoryTransaction[], number>({
            query: (inventoryId) => `/inventory/${inventoryId}/transactions`,
            transformResponse: (response: any) => {
                const raw: any[] = response.data ?? response
                return raw.map((tx: any) => ({
                    id: Number(tx.id),
                    inventoryID: Number(tx.inventory_id),
                    txType: tx.tx_type as 'IN' | 'OUT',
                    quantity: Number(tx.quantity),
                    operator: tx.operator ?? '',
                    createdAt: tx.created_at ?? '',
                    note: tx.note ?? '',
                }))
            },
            providesTags: (result, error, inventoryId) =>
                [
                    { type: 'InventoryTransactions', id: inventoryId }]
        }),
        deleteInventoryTransaction: builder.mutation<{ success: boolean; id: number }, number>({
            query: (transactionId) => ({
                url: `/inventory-transactions/${transactionId}`,
                method: "DELETE",
            }),
            // 你可以根据业务需要指定 tags
            invalidatesTags: (result, error, transactionId) => [
                { type: "InventoryTransactions", id: transactionId }
            ],
        }),
        scanIn: builder.mutation<{ success: boolean; inventory: InventoryRow }, { code: string; format?: string; quantity: number; warehouseId?: number }>({
            query: ({ code, format, quantity, warehouseId }) => ({
                url: "/inventory/scan-in",
                method: "POST",
                body: { code, format, quantity, warehouseId },
            }),
            invalidatesTags: [{ type: "Inventory", id: "LIST" }],
        }),
        scanOut: builder.mutation<{ success: boolean; inventory: InventoryRow }, { code: string; format?: string; quantity: number; warehouseId?: number }>({
            query: ({ code, format, quantity, warehouseId }) => ({
                url: "/inventory/scan-out",
                method: "POST",
                body: { code, format, quantity, warehouseId },
            }),
            invalidatesTags: [{ type: "Inventory", id: "LIST" }],
        }),
        getInventoryByCode: builder.query<InventoryRow, string>({
            query: (code) => `/inventory/by-code/${code}`,
            transformResponse: (response: any) => response.data ?? response,
            providesTags: (result, error, code) => [{ type: 'Inventory', id: code }],
            }),
                // —— 新增：今天入/出库汇总 ——
    getTodayStats: builder.query<
      { inbound: number; outbound: number },
      void
    >({
      query: () => '/inventory/stats/today',
      transformResponse: (response: any) => response.data ?? response,
      // 如果你想用 RTK Query 缓存并且在某些操作后失效，可以打 tag，
      // 这里简单不打 tag 也没问题
      providesTags: [{ type: 'TodayStats', id: 'TODAY' }],
    }),

    // 获取最近的出入库记录（所有库存的交易记录）
    getRecentTransactions: builder.query<
      (InventoryTransaction & { partNumberAU?: string; description?: string })[],
      { limit?: number }
    >({
      query: ({ limit = 20 }) => `/inventory/transactions/recent?limit=${limit}`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: [{ type: 'InventoryTransactions', id: 'RECENT' }],
    }),

    // 获取交易记录的附件列表
    getTransactionAttachments: builder.query<TransactionAttachment[], number>({
      query: (transactionId) => `/inventory/transactions/${transactionId}/attachments`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result, error, transactionId) => [
        { type: 'InventoryTransactions', id: `ATTACHMENTS_${transactionId}` }
      ],
    }),

    // 上传交易附件
    uploadTransactionAttachment: builder.mutation<
      TransactionAttachment,
      { transactionId: number; file: File; description?: string; operator?: string }
    >({
      query: ({ transactionId, file, description, operator }) => {
        const formData = new FormData()
        formData.append('file', file)
        if (description) formData.append('description', description)
        if (operator) formData.append('operator', operator)
        return {
          url: `/inventory/transactions/${transactionId}/attachments`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { transactionId }) => [
        { type: 'InventoryTransactions', id: `ATTACHMENTS_${transactionId}` }
      ],
    }),

    // 删除交易附件
    deleteTransactionAttachment: builder.mutation<{ message: string }, number>({
      query: (attachmentId) => ({
        url: `/inventory/transactions/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'InventoryTransactions' }],
    }),

    }),
})

// 交易附件类型
export interface TransactionAttachment {
  id: number
  transactionID: number
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  attachType: 'IMAGE' | 'DOCUMENT' | 'OTHER'
  description: string
  uploadedBy: string
  createdAt: string
}

export const {
    useGetInventoryQuery,
    useGetInventoryByIdQuery,
    useCreateInventoryMutation,
    useUpdateInventoryMutation,
    useStockInMutation,
    useStockOutMutation,
    useDeleteInventoryMutation,
    useDeleteInventoryTransactionMutation,
    useGetInventoryTransactionsQuery,
    useScanInMutation,
    useScanOutMutation,
    useGetInventoryByCodeQuery,
    useGetTodayStatsQuery,
    useGetRecentTransactionsQuery,
    useGetTransactionAttachmentsQuery,
    useUploadTransactionAttachmentMutation,
    useDeleteTransactionAttachmentMutation,
} = inventoryApi
