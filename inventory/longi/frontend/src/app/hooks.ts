// src/app/hooks.ts

// 运行时代码只引用这两个 hook
import { useDispatch, useSelector } from 'react-redux'

// 类型层面的导入，要用 import type
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// “运行时” hook：dispatch 只能接受 AppDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

// “类型层面”声明：指明 useSelector 要返回 RootState 的类型
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
