'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Search, FolderKanban, CheckSquare, User } from 'lucide-react'
import { useSearchProjectsQuery, useSearchTasksQuery } from '@/state/api'
import { useDebounce } from '@/hooks/use-debounce'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  // Search APIs (only call if query has min length)
  const shouldSearch = debouncedQuery.length >= 2

  const { data: projectsData, isLoading: projectsLoading } = useSearchProjectsQuery(
    { q: debouncedQuery, limit: 5 },
    { skip: !shouldSearch }
  )

  const { data: tasksData, isLoading: tasksLoading } = useSearchTasksQuery(
    { q: debouncedQuery, limit: 5 },
    { skip: !shouldSearch }
  )

  const isLoading = projectsLoading || tasksLoading

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  // Navigate and close
  const handleSelect = (path: string) => {
    router.push(path)
    onOpenChange(false)
    setQuery('')
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search projects, tasks, or users..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!shouldSearch && (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
              <Search className="mb-2 h-8 w-8 opacity-50" />
              <p>Type to search projects and tasks</p>
              <p className="mt-1 text-xs">Minimum 2 characters required</p>
            </div>
          </CommandEmpty>
        )}

        {shouldSearch && !isLoading && !projectsData?.data?.length && !tasksData?.data?.length && (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
              <Search className="mb-2 h-8 w-8 opacity-50" />
              <p>No results found for &quot;{query}&quot;</p>
              <p className="mt-1 text-xs">Try a different search term</p>
            </div>
          </CommandEmpty>
        )}

        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {/* Projects */}
        {projectsData?.data && projectsData.data.length > 0 && (
          <CommandGroup heading="Projects">
            {projectsData.data.map((project) => (
              <CommandItem
                key={`project-${project.id}`}
                value={`project-${project.id}-${project.name}`}
                onSelect={() => handleSelect(`/projects/${project.id}`)}
                className="cursor-pointer"
              >
                <FolderKanban className="mr-2 h-4 w-4 text-blue-600" />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="font-medium">{project.mineSiteName || project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.projectCode} • {project.clientCompany}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      project.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-700'
                        : project.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Tasks */}
        {tasksData?.data && tasksData.data.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasksData.data.map((task) => (
              <CommandItem
                key={`task-${task.id}`}
                value={`task-${task.id}-${task.title}`}
                onSelect={() => handleSelect(`/tasks/${task.id}`)}
                className="cursor-pointer"
              >
                <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.taskCode} • {task.projects?.mineSiteName || 'No project'}
                      {task.mineral && <> • <span className="text-purple-600 font-medium">{task.mineral}</span></>}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      task.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-700'
                        : task.status === 'DONE'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'REVIEW'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        <kbd className="rounded border bg-muted px-1.5 py-0.5">↑↓</kbd> to navigate •{' '}
        <kbd className="rounded border bg-muted px-1.5 py-0.5">Enter</kbd> to select •{' '}
        <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd> to close
      </div>
    </CommandDialog>
  )
}
