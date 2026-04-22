import {memo} from "react"
import type { FC, ReactNode } from "react"
import ProductListPage from "./Productlist";
import { Box } from "@mui/material";
export interface IProps {
    children?:ReactNode;
    //...这里定义相关类型
    //扩展相关属性
}

const ProductList:FC<IProps> = memo(function ({ children }) {
    return (
    <Box
    className="inventoryShippingPage"
    sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 600, md: 900, lg: 2400 },  // 响应式最大宽度
        px: { xs: 1, sm: 2, md: 2 }, // 响应式内边距
        // py: { xs: 1, sm: 2 },
        bgcolor: '#fff', // 可选：设置背景色
        height:'100%',
        flex:1,
        boxSizing: 'border-box'
    }}
    >
    <ProductListPage />
    </Box>
        )
})

export default ProductList
ProductList.displayName = "ProductList" //方便以后调试使用