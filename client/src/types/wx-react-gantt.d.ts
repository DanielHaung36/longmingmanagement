declare module 'wx-react-gantt' {
  import type { ComponentType, MutableRefObject, ReactNode } from 'react'

  export type GanttScale = {
    unit: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
    step?: number
    format?: string
    css?: (date: Date) => string
  }

  export type GanttTask = {
    id: string | number
    text: string
    start?: Date
    end?: Date
    duration?: number
    progress?: number
    parent?: string | number
    type?: string
    open?: boolean
    [key: string]: unknown
  }

  export type GanttColumn = {
    id: string
    header?: string
    width?: number
    flexGrow?: number
    align?: 'left' | 'center' | 'right'
    template?: (task: GanttTask) => ReactNode
  }

  export interface GanttProps {
    tasks?: GanttTask[]
    links?: Array<Record<string, unknown>>
    scales?: GanttScale[]
    columns?: GanttColumn[]
    apiRef?: MutableRefObject<any>
  }

  export const Gantt: ComponentType<GanttProps>
  export const Willow: ComponentType<{ children?: ReactNode }>
}

declare module 'wx-react-gantt/dist/gantt.css'
