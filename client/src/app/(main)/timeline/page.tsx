'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGetAllTasksQuery } from '@/state/api'
import type { Task } from '@/state/api'
import { Calendar, Clock, Search, CheckCircle, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { PaginationMUI } from '@/components/ui/pagination-mui'
import Link from 'next/link'

type TimelineItem = {
  id: string
  taskId: number
  title: string
  description?: string | null
  status?: string | null
  createdAt: Date
  dueDate?: Date | null
  clientCompany?: string | null
  priority?: string | null
  taskCode?: string | null
}

export default function TimelinePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: tasksData } = useGetAllTasksQuery({
    page,
    limit: pageSize,
    search: searchTerm.trim() || undefined,
  })

  const tasks = tasksData?.data || []
  const pagination = tasksData?.pagination

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return tasks
      .map((t: Task) => ({
        id: `task-${t.id}`,
        taskId: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        createdAt: new Date(t.createdAt ?? new Date()),
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        priority: t.priority,
        taskCode: t.taskCode,
        clientCompany: t.projects?.clientCompany,
      }))
      .filter((item) => {
        if (!normalizedSearch) return true

        const haystack = [item.title, item.description, item.taskCode, item.clientCompany]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [tasks, searchTerm])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="h-8 w-8 text-emerald-600" />
          Projects Timeline
        </h1>
        <p className="text-gray-600 mt-2">Track Projects from creation to due dates in chronological order</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-emerald-200" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {timelineItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No items found</p>
              </CardContent>
            </Card>
          ) : (
            timelineItems.map((item) => (
              <div key={item.id} className="relative pl-20">
                <div className="absolute left-6 top-6 h-5 w-5 rounded-full border-4 border-white bg-blue-500" />

                <Link href={`/tasks/${item.taskId}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <Badge variant="secondary">Project</Badge>
                          {item.taskCode && (
                            <Badge variant="outline" className="font-mono">
                              {item.taskCode}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        {item.description && (
                          <CardDescription className="mt-1">{item.description}</CardDescription>
                        )}
                        <div className="mt-3 space-y-1 text-sm">
                          <div className="text-muted-foreground">
                            Created {format(item.createdAt, 'PPP')}
                          </div>
                          <div
                            className={
                              item.dueDate
                                ? item.dueDate < new Date()
                                  ? 'text-red-600 font-semibold'
                                  : item.dueDate.getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000
                                    ? 'text-amber-600 font-semibold'
                                    : 'text-muted-foreground'
                                : 'text-muted-foreground'
                            }
                          >
                            {item.dueDate ? `Due ${format(item.dueDate, 'PPP')}` : 'No due date'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            item.status === 'COMPLETED' || item.status === 'DONE'
                              ? 'default'
                              : item.status === 'IN_PROGRESS'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            item.status === 'COMPLETED' || item.status === 'DONE'
                              ? 'bg-green-500'
                              : item.status === 'IN_PROGRESS'
                                ? 'bg-blue-500'
                                : ''
                          }
                        >
                          {item.status}
                        </Badge>
                        {item.priority && (
                          <Badge
                            variant={
                              item.priority === 'URGENT'
                                ? 'destructive'
                                : item.priority === 'HIGH'
                                  ? 'default'
                                  : 'outline'
                            }
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(item.createdAt, 'PPP')}</span>
                      </div>
                      {item.clientCompany && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{item.clientCompany}</span>
                        </div>
                      )}
                    </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
      {pagination && (
        <div className="mt-8">
          <PaginationMUI
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.total}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
