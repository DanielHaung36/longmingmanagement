import {memo} from "react"
import type { FC, ReactNode } from "react"

export interface IProps {
    children?:ReactNode;
    //...这里定义相关类型
    //扩展相关属性
}

const ProductsPage:FC<IProps> = memo(function ({ children }) {
    return (
        <div className="productsPage">
            <div>ProductsPage</div>
        </div>
    )
})

export default ProductsPage
ProductsPage.displayName = "ProductsPage" //方便以后调试使用