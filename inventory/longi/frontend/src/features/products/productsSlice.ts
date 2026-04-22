// src/features/products/productsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/** 本地 UI 状态类型 **/
interface ProductsUIState {
    draft: {
        id?: string       // 编辑时的产品 ID，新增时 undefined
        partNumberCN: string
        partNumberAU: string
        description: string
        // … 其他你表单里会用到的字段
    }
    page: number        // 当前页码
    pageSize: number    // 每页条数
    filter: string      // 简单的文本筛选
}

const initialState: ProductsUIState = {
    draft: {
        partNumberCN: '',
        partNumberAU: '',
        description: '',
    },
    page: 1,
    pageSize: 10,
    filter: '',
}

const productsSlice = createSlice({
    name: 'productsUI',
    initialState,
    reducers: {
        // 初始化或重置草稿
        initDraft(state, action: PayloadAction<Partial<ProductsUIState['draft']>>) {
            state.draft = {
                ...initialState.draft,
                ...action.payload,
            }
        },
        // 更新草稿字段
        updateDraftField<K extends keyof ProductsUIState['draft']>(
            state,
            action: PayloadAction<{ field: K; value: ProductsUIState['draft'][K] }>
        ) {
            const { field, value } = action.payload
            state.draft[field] = value
        },
        // 清空草稿
        clearDraft(state) {
            state.draft = initialState.draft
        },
        // 分页相关
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload
        },
        setPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload
        },
        // 筛选条件
        setFilter(state, action: PayloadAction<string>) {
            state.filter = action.payload
        },
    },
})

export const {
    initDraft,
    updateDraftField,
    clearDraft,
    setPage,
    setPageSize,
    setFilter,
} = productsSlice.actions

export default productsSlice.reducer
