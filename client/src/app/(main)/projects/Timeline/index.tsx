import { useAppSelector } from '@/redux'
import { useGetAllTasksQuery } from '@/state/api'
import type { Task as ApiTask } from '@/state/api'
import { Gantt, ViewMode } from 'gantt-task-react'
import type { DisplayOption, Task as GanttTask } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import React, { useState, useMemo } from 'react'
type TimelineViewProps = {
  setIsModelNewTaskOpen: (isOpen: boolean) => void
  children?: React.ReactNode
}

const TimelineView = ({ setIsModelNewTaskOpen: _setIsModelNewTaskOpen }: TimelineViewProps) => {
  const TASK_FETCH_LIMIT = 1000
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode)
  const { data: tasks, isLoading, error } = useGetAllTasksQuery({ limit: TASK_FETCH_LIMIT })

  // 视图模式 Day/Week/Month/Year（Year为自定义，仅UI用）
  const [uiViewMode, setUiViewMode] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month')
  const displayOptions = useMemo<Omit<DisplayOption, 'viewMode'>>(
    () => ({
      locale: 'en-US',
    }),
    [],
  )
  // Dialog 相关
  const [dialogTask, setDialogTask] = useState<GanttTask | null>(null)
  // 缩放相关：columnWidth
  const [columnWidth, setColumnWidth] = useState(150)
  // 生成 ganttTasks，保证 start/end 都是有效日期，否则用当前时间兜底
  const ganttTasks = useMemo<GanttTask[]>(() => {
    if (!tasks?.data) return []

    return (
      tasks.data
        .map((task: ApiTask) => {
          const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt)
          const end = task.dueDate ? new Date(task.dueDate) : new Date(start)
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
          return {
            start,
            end,
            name: task.title,
            id: `Task-${task.id}`,
            type: 'task' as const,
            progress: task.progress ?? 0,
            isDisabled: false,
          }
        })
        .filter((task): task is GanttTask => Boolean(task))
    )
  }, [tasks])

  // 视图切换
  const handleViewModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUiViewMode(event.target.value as 'Day' | 'Week' | 'Month' | 'Year')
  }

  // 缩放滑块事件
  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColumnWidth(Number(event.target.value))
  }

  if (isLoading) return <div>Loading...</div>
  if (error || !tasks) return <div>An error occurred while fetching tasks</div>

  // 处理甘特点击
  const handleTaskClick = (task: GanttTask) => {
    setDialogTask(task)
  }

  // Year视图下，设置更大columnWidth
  const effectiveColumnWidth = uiViewMode === 'Year' ? 300 : columnWidth
  // 传递给 Gantt 的 viewMode
  const ganttViewMode = uiViewMode === 'Year' ? ViewMode.Month : ViewMode[uiViewMode as 'Day' | 'Week' | 'Month']

  return (
    <div className="px-4 xl:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 py-5">
        <div>
          <h1 className="me-2 text-lg font-bold dark:text-white">Project Tasks Timeline</h1>
          {uiViewMode === 'Year' && (
            <div className="mt-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded inline-block">
              Year View：每月宽度加大，便于全年任务分布宏观观察（非真正年粒度）
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* 视图模式选择 */}
          <div className="relative inline-block w-40">
            <select
              className="focus:shadow-outline dark:border-dark-secondary dark:bg-dark-secondary block w-full appearance-none rounded border border-gray-400 bg-white px-4 py-2 pr-8 leading-tight shadow hover:border-gray-500 focus:outline-none dark:text-white"
              value={uiViewMode}
              onChange={handleViewModeChange}
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Year">Year</option>
            </select>
          </div>
          {/* 缩放滑块 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Zoom</span>
            <input
              type="range"
              min={80} // 限制最小宽度为80px，避免表头重叠
              max={300}
              step={10}
              value={columnWidth}
              onChange={handleZoomChange}
              className="w-32 accent-blue-500"
              disabled={uiViewMode === 'Year'}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{effectiveColumnWidth}px</span>
          </div>
        </div>
      </div>

      <div className="dark:bg-dark-secondary overflow-hidden rounded-md bg-white shadow dark:text-white">
        <div className="timeline">
          <Gantt
            tasks={ganttTasks}
            {...displayOptions}
            viewMode={ganttViewMode}
            columnWidth={effectiveColumnWidth}
            listCellWidth="100px"
            barBackgroundColor={isDarkMode ? '#101214' : '#aeb8c2'}
            barBackgroundSelectedColor={isDarkMode ? '#000' : '#9ba1a6'}
            onClick={handleTaskClick}
          />
        </div>
      </div>

      {/* Dialog 弹窗 */}
      {dialogTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">任务详情</h2>
              <button onClick={() => setDialogTask(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-2">
              <div><b>名称：</b>{dialogTask.name}</div>
              <div><b>起始：</b>{dialogTask.start?.toLocaleString?.() || ''}</div>
              <div><b>结束：</b>{dialogTask.end?.toLocaleString?.() || ''}</div>
              <div><b>进度：</b>{dialogTask.progress?.toFixed?.(1) || 0}%</div>
              <div><b>ID：</b>{dialogTask.id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimelineView
