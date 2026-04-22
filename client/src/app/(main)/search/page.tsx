'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchProjectsQuery, useSearchTasksQuery, useSearchUsersQuery } from '@/state/api'
import { Search as SearchIcon, Briefcase, CheckCircle, User, Filter, Calendar } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { ThrottledLink } from '@/components/ui/throttled-link'
import { format } from 'date-fns'

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const debouncedSearch = useDebounce(searchTerm, 500)

  const { data: projectsData, isLoading: loadingProjects } = useSearchProjectsQuery({
    q: debouncedSearch,
    limit: 20,
  }, {
    skip: !debouncedSearch
  })

  const { data: tasksData, isLoading: loadingTasks } = useSearchTasksQuery({
    q: debouncedSearch,
    limit: 20,
  }, {
    skip: !debouncedSearch
  })

  const { data: usersData, isLoading: loadingUsers } = useSearchUsersQuery({
    q: debouncedSearch,
    limit: 20,
  }, {
    skip: !debouncedSearch
  })

  const projects = projectsData?.data || []
  const tasks = tasksData?.data || []
  const users = usersData?.data || []

  const totalResults = projects.length + tasks.length + users.length
  const isLoading = loadingProjects || loadingTasks || loadingUsers

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SearchIcon className="h-8 w-8 text-emerald-600" />
          Search
        </h1>
        <p className="text-gray-600 mt-2">Search across projects and users</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for projects or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-lg h-12"
              autoFocus
            />
          </div>
          {debouncedSearch && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {isLoading ? 'Searching...' : `Found ${totalResults} results`}
              </p>
              {searchTerm !== debouncedSearch && (
                <p className="text-xs text-gray-400">Typing...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {!debouncedSearch ? (
        <Card>
          <CardContent className="py-12 text-center">
            <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Start typing to search</p>
            <p className="text-gray-400 text-sm mt-2">Search across all projects and team members</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">
              All ({totalResults})
            </TabsTrigger>
            {/* <TabsTrigger value="projects">
              Projects ({projects.length})
            </TabsTrigger> */}
            <TabsTrigger value="tasks">
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              Users ({users.length})
            </TabsTrigger>
          </TabsList>

          {/* All Results */}
          <TabsContent value="all" className="space-y-4">
            {totalResults === 0 && !isLoading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No results found for "{debouncedSearch}"</p>
                </CardContent>
              </Card>
            )}

            {/* {projects.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  Projects
                </h3>
                {projects.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )} */}

            {tasks.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Tasks
                </h3>
                {tasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}

            {users.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Users
                </h3>
                {users.map((user: any) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-3">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No projects found</p>
                </CardContent>
              </Card>
            ) : (
              projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-3">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No tasks found</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3">
            {users.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No users found</p>
                </CardContent>
              </Card>
            ) : (
              users.map((user: any) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  return (
    <ThrottledLink href={`/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                {/* jobType Badge 已删除 - jobType 只在 task 级别定义 */}
                <Badge variant="outline">{project.projectCode}</Badge>
              </div>
              <CardTitle className="text-lg">{project.mineSiteName || project.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>
            <Badge variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
            <span>{project.clientCompany}</span>
            <span>•</span>
            <span>{format(new Date(project.createdAt), 'PP')}</span>
          </div>
        </CardHeader>
      </Card>
    </ThrottledLink>
  )
}

function TaskCard({ task }: { task: any }) {
  return (
    <ThrottledLink href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <Badge variant="outline" className="font-mono">{task.taskCode}</Badge>
                <Badge variant={task.priority === 'URGENT' ? 'destructive' : 'secondary'}>
                  {task.priority}
                </Badge>
              </div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            </div>
            <Badge variant={task.status === 'DONE' ? 'default' : 'secondary'}>
              {task.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    </ThrottledLink>
  )
}

function UserCard({ user }: { user: any }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
            {user.realName ? user.realName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{user.realName || user.username}</CardTitle>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>
          <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
            {user.role}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  )
}
