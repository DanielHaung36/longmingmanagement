import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGetAllTasksQuery, useUpdateTaskStatusMutation } from '@/state/api'
import { TaskColumn } from './TaskColumn'

type BoardProps = {
  id?: string
  setIsModelNewTaskOpen: (isOpen: boolean) => void
  children?: React.ReactNode
}

const BoardView: React.FC<BoardProps> = ({ id, setIsModelNewTaskOpen, children }) => {
  const taskStatus: Array<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'> = [
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'DONE',
    'CANCELLED',
  ]
  const approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'APPROVED'
  const { data: tasks, isLoading, error } = useGetAllTasksQuery({ approvalStatus: approvalStatus })
  const [updateTaskStatus] = useUpdateTaskStatusMutation()

  const moveTask = async (
    taskId: number,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED',
  ) => {
    await updateTaskStatus({ id: taskId, status: newStatus })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>An error occurred while loading tasks</div>
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={(tasks?.data ?? []).filter((task) => task.status === status)}
            moveTask={moveTask}
            setIsModelNewTaskOpen={setIsModelNewTaskOpen}
          />
        ))}
      </div>
    </DndProvider>
  )
}

export default BoardView
