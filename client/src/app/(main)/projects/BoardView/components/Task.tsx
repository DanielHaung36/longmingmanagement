import { useDrag } from 'react-dnd'
import Image from 'next/image'
import { EllipsisVertical, MessageSquareMore } from 'lucide-react'
import { format } from 'date-fns'
import { Task as TaskType } from '@/state/api'
import React from 'react'

const PriorityTag = ({ priority }: { priority: TaskType['priority'] }) => (
  <div
    className={`rounded-full px-2 py-1 text-xs font-semibold ${
      priority === 'URGENT'
        ? 'bg-red-200 text-red-700'
        : priority === 'HIGH'
        ? 'bg-yellow-200 text-yellow-700'
        : priority === 'MEDIUM'
        ? 'bg-green-200 text-green-700'
        : priority === 'LOW'
        ? 'bg-blue-200 text-blue-700'
        : 'bg-gray-200 text-gray-700'
    }`}
  >
    {priority}
  </div>
)

const TaskInfo = ({ task }: { task: TaskType }) => (
  <div className="mb-2 flex flex-col gap-2 rounded-lg bg-gray-50 dark:bg-neutral-900 p-3 border border-gray-200 dark:border-neutral-800">
    <h5 className="text-base font-semibold text-blue-500 dark:text-blue-300">Project: <span className="font-normal text-gray-800 dark:text-gray-200">{task.projects?.clientCompany}</span></h5>
    <h6 className="text-sm font-medium text-green-700 dark:text-green-300">MineSite: <span className="font-normal text-gray-700 dark:text-gray-200">{task.projects?.mineSiteName}</span></h6>
    {task.mineral && (
      <h6 className="text-sm font-medium flex items-center gap-2">
        Mineral:
        <span
          className={
            `px-2 py-0.5 rounded-full font-bold text-xs ` +
            (task.mineral.includes('Magnetite') ? 'bg-blue-200 text-blue-800' :
            task.mineral.includes('Hematite') ? 'bg-red-200 text-red-800' :
            task.mineral.includes('Lithium') ? 'bg-green-200 text-green-800' :
            task.mineral.includes('Rare Earth') ? 'bg-purple-200 text-purple-800' :
            task.mineral.includes('Coal') ? 'bg-gray-300 text-gray-800' :
            task.mineral.includes('Vanadium') ? 'bg-yellow-200 text-yellow-800' :
            task.mineral.includes('Manganese') ? 'bg-pink-200 text-pink-800' :
            task.mineral.includes('Ilmenite') ? 'bg-orange-200 text-orange-800' :
            task.mineral.includes('Minral Sand') ? 'bg-yellow-100 text-yellow-700' :
            task.mineral.includes('Silica') ? 'bg-cyan-200 text-cyan-800' :
            task.mineral.includes('Gold') ? 'bg-yellow-300 text-yellow-900' :
            task.mineral.includes('Tungsten') ? 'bg-gray-400 text-gray-900' :
            task.mineral.includes('Base Metal') ? 'bg-indigo-200 text-indigo-800' :
            task.mineral.includes('SPODUMENE') ? 'bg-lime-200 text-lime-800' :
            task.mineral.includes('Tin') ? 'bg-amber-200 text-amber-800' :
            task.mineral.includes('Quarry') ? 'bg-stone-200 text-stone-800' :
            task.mineral.includes('Others') ? 'bg-gray-200 text-gray-700' :
            'bg-gray-100 text-gray-700')
          }
        >
          {task.mineral}
        </span>
      </h6>
    )}
    {task.taskCode && <h6 className="text-xs text-gray-500 dark:text-gray-400">Task Code: <span className="font-mono">{task.taskCode}</span></h6>}
  </div>
)

export const Task: React.FC<{ task: TaskType }> = ({ task }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }))

  const taskTagsSplit = task.tags ? task.tags.split(',') : []
  const formattedStartDate = task.startDate ? format(new Date(task.startDate), 'P') : ''
  const formattedDueDate = task.dueDate ? format(new Date(task.dueDate), 'P') : ''
  const numberOfComments = task.comments && task.comments.length ? task.comments.length : 0

  const divRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (divRef.current) {
      drag(divRef.current)
    }
  }, [drag])
  // 这里是标题，标签，优先级，描述，指派人，评论数
  return (
    <div
      ref={divRef}
      className={`dark:bg-dark-secondary mb-4 rounded-md bg-white shadow ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* {task.taskFiles && task.taskFiles.length > 0 && (
        <Image
          src={task.taskFiles[0].localPath}
          alt={task.taskFiles[0].fileName}
          width={400}
          height={200}
          className="h-auto w-full rounded-t-md"
        />
      )} */}
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {task.priority && <PriorityTag priority={task.priority} />}
            <div className="flex gap-2">
              {taskTagsSplit.map((tag) => (
                <div key={tag} className="rounded-full bg-blue-100 px-2 py-1 text-xs">
                  {' '}
                  {tag}
                </div>
              ))}
            </div>
          </div>
          <button className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-neutral-500">
            <EllipsisVertical size={26} />
          </button>
        </div>
        <div className="my-3 flex justify-between">
          <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
        </div>
        <TaskInfo task={task} />

        <div className="text-xs text-gray-500 dark:text-neutral-500">
          {formattedStartDate && <span>{formattedStartDate} - </span>}
          {formattedDueDate && <span>{formattedDueDate}</span>}
        </div>
        <p className="text-sm text-gray-600 dark:text-neutral-500">{task.description}</p>
        <div className="dark:border-stroke-dark mt-4 border-t border-gray-200" />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-[6px] overflow-hidden">
            {task.assignedUser && (
              <Image
                key={task.assignedUser.id}
                src={task.assignedUser.profilePictureUrl || `/p${task.assignedUserId}.jpeg`}
                alt={task.assignedUser.username ?? 'Assigned User'}
                width={30}
                height={30}
                className="dark:border-dark-secondary h-8 w-8 rounded-full border-2 border-white object-cover"
              />
            )}
          </div>
          <div className="flex items-center text-gray-500 dark:text-neutral-500">
            <MessageSquareMore size={20} />
            <span className="ml-1 text-sm dark:text-neutral-400">{numberOfComments}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
