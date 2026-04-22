import React from 'react'
import { useDrop } from 'react-dnd'
import { EllipsisVertical, Plus } from 'lucide-react'
import { Task as TaskType } from '@/state/api'
import { Task } from './Task'

type TaskColumnProps = {
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  tasks: TaskType[]
  moveTask: (
    taskId: number,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED',
  ) => void
  setIsModelNewTaskOpen: (isOpen: boolean) => void
}

export const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, moveTask, setIsModelNewTaskOpen }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: number }) => moveTask(item.id, status),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }))
  const tasksCount = tasks.filter((task) => task.status === status).length
  const statusColors: any = {
    TODO: '#2563EB',
    IN_PROGRESS: '#059669',
    REVIEW: '#D97706',
    DONE: '#000000',
    CANCELLED: '#F87171',
  }

  const setDropRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node)
  }, [drop])
  //这里是标题和三个点和加号
  return (
    <div
      ref={setDropRef}
      className={`sl:py-4 rounded-lg py-2 xl:px-2 ${isOver ? 'bg-gray-100 dark:bg-neutral-950' : ''}`}
    >
      <div className="mb-3 flex w-full">
        <div
          className={`w-2 !bg-${statusColors[status]} rounded-l-lg`}
          style={{ backgroundColor: statusColors[status] }}
        ></div>
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4">
          <h3 className="flex items-center text-lg font-semibold text-gray-700 capitalize dark:text-white">
            {status.replace('_', ' ')}{' '}
            <span
              className="ml-2 inline-block rounded-full bg-gray-200 text-center text-sm font-medium dark:bg-neutral-800 dark:text-gray-300"
              style={{ width: '1.5rem', height: '1.5rem' }}
            >
              {tasksCount}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700">
              <EllipsisVertical size={26} />
            </button>
            <button
              onClick={() => setIsModelNewTaskOpen(true)}
              className="dark:bg-dark-tertiary flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:text-white"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      {tasks
        .filter((task) => task.status === status)
        .map((task) => (
          <Task key={task.id} task={task} />
        ))}
    </div>
  )
}
