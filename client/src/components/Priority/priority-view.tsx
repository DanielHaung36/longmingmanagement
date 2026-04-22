"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useGetAllTasksQuery, type Task } from "@/state/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Clock, ExternalLink, Flame, Gauge, List, Triangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaginationMUI } from "@/components/ui/pagination-mui";

type PriorityKey = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "BACKLOG";

const PRIORITY_META: Record<
  PriorityKey,
  {
    label: string;
    description: string;
    gradient: string;
    badge: string;
    icon: React.ComponentType<any>;
  }
> = {
  URGENT: {
    label: "Critical (Urgent)",
    description: "Tasks requiring immediate attention to prevent project risk.",
    gradient: "from-red-500 via-red-600 to-red-700",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: Flame,
  },
  HIGH: {
    label: "High Priority",
    description: "Important tasks that should be scheduled without delay.",
    gradient: "from-orange-500 via-orange-600 to-orange-700",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Triangle,
  },
  MEDIUM: {
    label: "Medium Priority",
    description: "General work items that follow the standard delivery plan.",
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Gauge,
  },
  LOW: {
    label: "Low Priority",
    description: "Opportunistic work to fill gaps or improve quality.",
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: List,
  },
  BACKLOG: {
    label: "Backlog",
    description: "Ideas and requests waiting for prioritisation.",
    gradient: "from-stone-500 via-stone-600 to-stone-700",
    badge: "bg-stone-100 text-stone-700 border-stone-200",
    icon: AlertCircle,
  },
};

const STATUS_BADGES: Record<
  NonNullable<Task["status"]>,
  string
> = {
  TODO: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  REVIEW: "bg-purple-100 text-purple-700 border-purple-200",
  DONE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-neutral-200 text-neutral-600 border-neutral-300",
};

const APPROVAL_BADGES: Record<
  NonNullable<Task["approvalStatus"]>,
  string
> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  DELETE_PENDING: "bg-red-100 text-red-700 border-red-200",
};

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function PriorityView({ priority }: { priority: PriorityKey }) {
  const meta = PRIORITY_META[priority];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const isBacklog = priority === "BACKLOG";

  useEffect(() => {
    setPage(1);
  }, [priority]);

  const queryArgs = {
    page,
    limit: pageSize,
    priority: isBacklog ? undefined : priority,
    approvalStatus: isBacklog ? "DRAFT" : undefined,
  } as const;

  const { data, isLoading, isFetching, error, refetch } = useGetAllTasksQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  });

  const tasks: Task[] = data?.data || [];
  const pagination = data?.pagination;

  const totalCount = pagination?.total ?? tasks.length;

  const stats = useMemo(() => {
    if (tasks.length === 0) {
      return {
        total: totalCount,
        byStatus: {} as Record<string, number>,
        totalHours: 0,
        completed: 0,
        dueSoon: 0,
      };
    }

    const byStatus = tasks.reduce<Record<string, number>>((acc, task) => {
      const key = task.status || "UNKNOWN";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const completed = byStatus.DONE || 0;

    const now = Date.now();
    const dueSoon = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate).getTime();
      return due >= now && due <= now + 3 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      total: totalCount,
      byStatus,
      totalHours,
      completed,
      dueSoon,
    };
  }, [tasks, totalCount]);

  const totalItems = pagination?.total ?? stats.total;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Badge className={cn("border px-3 py-1 text-sm font-medium", meta.badge)}>
            {meta.label}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Priority Pipeline
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">{meta.description}</p>
          <div className="flex gap-2">
            <Link href="/tasks/list">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Task List
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "rounded-xl px-4 py-6 text-white shadow-lg",
            "bg-gradient-to-br",
            meta.gradient
          )}
        >
          <div className="flex items-center gap-3">
            <meta.icon className="h-10 w-10" />
            <div>
              <div className="text-sm uppercase tracking-wide text-white/80">Total Projects</div>
              <div className="text-3xl font-semibold">{stats.total}</div>
              <div className="mt-1 text-xs text-white/70">
                {stats.completed} completed • {stats.dueSoon} due in 3 days
              </div>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <List className="h-4 w-4" />
            Task Table
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Status Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Loading tasks…</CardTitle>
                <CardDescription>Fetching latest items for this priority.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full rounded-md" />
                ))}
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Unable to load tasks</CardTitle>
                <CardDescription className="text-red-600">
                  Please try refreshing. If the issue persists, contact support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => refetch()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : tasks.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>No tasks yet</CardTitle>
                <CardDescription>
                  Assign work to this priority to see it tracked here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tasks/new">
                  <Button>Create task</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="whitespace-nowrap">Task Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="min-w-[160px]">Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead className="whitespace-nowrap">Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm">{task.taskCode}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                              {task.title}
                            </Link>
                            <div className="text-xs text-slate-500">
                              {task.mineral ? `Mineral: ${task.mineral}` : "No mineral set"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.projects ? (
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                <span className="truncate">{task.projects.clientCompany}</span>
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {task.projects.mineSiteName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">No project linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", STATUS_BADGES[task.status || "TODO"])}
                          >
                            {task.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", APPROVAL_BADGES[task.approvalStatus || "DRAFT"])}
                          >
                            {task.approvalStatus || "DRAFT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(task.dueDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/tasks/${task.id}`} title="Open task details">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination && (
                <PaginationMUI
                  currentPage={pagination.page}
                  totalPages={totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                />
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Status & Capacity Overview</CardTitle>
              <CardDescription>
                Snapshot of the workload and progress for {meta.label.toLowerCase()} tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatBlock
                title="Total Active"
                value={stats.total}
                description="Tasks currently tracked in this queue."
                icon={<List className="h-4 w-4 text-slate-500" />}
              />
              <StatBlock
                title="Completed"
                value={stats.completed}
                description="Tasks marked as done."
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              />
              <StatBlock
                title="Total Estimated Hours"
                value={`${stats.totalHours.toFixed(1)} h`}
                description="Sum of planned effort."
                icon={<Clock className="h-4 w-4 text-indigo-500" />}
              />
              <StatBlock
                title="Due within 3 days"
                value={stats.dueSoon}
                description="Upcoming deadlines in the next 72 hours."
                icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
              />
              <div className="col-span-full">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">By Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant="outline"
                      className={cn("text-xs", STATUS_BADGES[status as keyof typeof STATUS_BADGES] ?? "bg-slate-100")}
                    >
                      {status}: {count}
                    </Badge>
                  ))}
                  {Object.keys(stats.byStatus).length === 0 && (
                    <span className="text-xs text-slate-500">No status data</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBlock({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 shadow-sm">{icon}</div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="text-2xl font-semibold text-slate-900">{value}</div>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
