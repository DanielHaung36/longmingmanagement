import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { logout } from './authSlice'
import type { RootState } from '@/redux'
import { env } from '@/lib/env'

export interface SimplifiedUser {
  id: number;
  username: string;
  realName?: string;
  profilePictureUrl?: string;
}

export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  realName?: string;
  profilePictureUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: UserRole;
  departmentId?: number;
  position?: string;
  teamId?: number;
  phone?: string;
  employeeId?: string;
  lastLoginAt?: Date;
  lastNotificationReadTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: number;
  content: string;
  entityType: string;
  entityId: number;
  userId: number;
  user?: SimplifiedUser;
  parentId?: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
  images?: string[] | string;
  replyTo?: {
    id: number;
    userId: number;
    user?: SimplifiedUser;
    displayName?: string;
  } | null;
  displayName?: string;
  comment_mentions?: any[];
  mentions?: any[];
}

export interface TaskFile {
  id: number;
  taskId: number;
  fileName: string;
  fileType: 'DOCUMENT' | 'CAD_DRAWING' | 'IMAGE' | 'VIDEO' | 'DATA' | 'ARCHIVE' | 'OTHER';
  fileSize: number;
  mimeType: string;
  localPath: string;
  oneDrivePath?: string;
  relativePath: string;
  md5Hash: string;
  uploadStatus: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  uploadProgress: number;
  uploadSessionId?: string;
  totalChunks?: number;
  uploadedChunks?: any;
  chunkSize: number;
  uploadedBy: number;
  uploadedByUser?: SimplifiedUser;
  description?: string;
  tags: string[];
  version: number;
  isPublic: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimplifiedProject {
  id: number;
  name: string;
  projectCode: string;
  mineSiteName:string;
  projectManager:string;
  clientCompany:string;
  // jobType 已删除 - jobType 只在 task 级别定义
}

export interface Task {
  id: number;
  taskCode: string;
  jobType:string;
  title: string;
  description?: string;
  projectId: number;
  projects?: SimplifiedProject;
  authorUserId: number;
  mineral?: string;
  assignedUserId?: number;
  assignedUser?: SimplifiedUser;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  approvalStatus?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETE_PENDING';
  approvedBy?: number;
  approvedAt?: Date;
  completedAt?: Date;
  tags?: string;
  contactCompany?: string;
  excelComment?: string;
  projectManager?: string;
  quotationNumber?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  localFolderPath?: string;
  oneDriveFolderPath?: string;
  folderCreated?: boolean;
  excelRowNumber?: number;
  syncStatus?: string;
  deleteRequestedBy?: number;

  deleteRequestedAt?: Date;
  deleteReason?: string;
  parentTaskId?: number;
  quotationDate?: Date;
  clientFeedback?: string;
  originalOneDrivePath?: string;
  comments?: Comment[];
  taskFiles?: TaskFile[];
}

export interface MineSite {
  id: number;
  code: string;
  name: string;
  location?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  clientFolderPath: string | null | undefined;
  id: number;
  name: string;
  description?: string;
  projectCode: string;
  // jobType 已删除 - jobType 只在 task 级别定义，避免歧义
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress: number;
  clientCompany?: string;
  mineSiteName?: string;
  mineZoneId?: number;
  mineZone?: MineSite;
  ownerId: number;
  owner?: SimplifiedUser;
  teamId?: number;
  approvalStatus: string;
  deleteRequestedBy?: number;
  deleteRequestedAt?: Date;
  deleteReason?: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
  projectMembers?: SimplifiedUser[];
  comments?: Comment[];
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  managerId?: number;
  manager?: SimplifiedUser;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  recipientId: number;
  senderId?: number;
  relatedType?: string;
  relatedId?: number;
  metadata?: any;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  channels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: number;
  projectId: number;
  quotationNumber?: string;
  requestDate?: Date;
  quotationProvidedDate?: Date;
  feedbackFromClient?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: number;
  tableName: string;
  recordId: number;
  action: string;
  changes?: any;
  userId?: number;
  user?: {
    id: number;
    username: string;
    realName?: string;
    email: string;
  };
  createdAt: Date;
}

// ==================== 基础响应类型 ====================

// 通用成功响应（单个实体）
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 通用错误响应
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// 分页信息
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserListData {
  data: User[];
  pagination: Pagination;
}

export type UserListResponse = ApiResponse<UserListData>;

// ==================== 列表响应类型（精确匹配后端）====================

// Projects 列表响应
export interface ProjectListResponse {
  success: boolean;
  message: string;
  data: {
    projects: Project[];
    pagination: Pagination;
  };
}

// Tasks 列表响应
export interface TaskListResponse {
  success: boolean;
  message: string;
  data: Task[];
  pagination: Pagination;
}

// Teams 列表响应
export interface TeamListResponse {
  success: boolean;
  message: string;
  data: {
    teams: Team[];
    pagination: Pagination;
  };
}

export interface TaskStatsSummary {
  overview: {
    total: number;
    completed: number;
    completionRate: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  workload: {
    avgEstimatedHours: number;
    avgActualHours: number;
  };
}
// ==================== 基础 Query 配置 ====================

/**
 * 基础 fetchBaseQuery（使用Cookie认证）
 */
const baseQuery = fetchBaseQuery({
  // 确保生产/运行时始终有一个安全的默认前缀
  baseUrl: env.apiBaseUrl || '/api',
  credentials: 'include', // 重要：自动发送Cookie
})

/**
 * 简化的 baseQuery（Cookie会自动刷新）
 *
 * 功能：
 * 1. Cookie认证自动处理，无需手动刷新
 * 2. 401错误直接登出
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // 执行请求
  let result = await baseQuery(args, api, extraOptions)

  // 如果返回 401，说明Cookie过期或无效，直接登出
  if (result.error && result.error.status === 401) {
    console.log('[API] 401未授权，Cookie无效或已过期，登出用户')
    api.dispatch(logout())
  }

  return result
}

// ==================== 认证相关类型 ====================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  realName?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  users?: User;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export const api = createApi({
  baseQuery: baseQueryWithReauth, // 使用带自动刷新功能的 baseQuery
  reducerPath: 'api',
  tagTypes: ["Projects", "Tasks", "Teams", "Comments", "Notifications", "Quotations", "Users", "MineSites", "Auth", "Permissions", "Activities", "Minerals"],

  // ==================== 缓存优化配置 ====================
  // 保持未使用数据的时间（秒）- 30秒后删除未使用的缓存，节省内存
  keepUnusedDataFor: 30,

  // 重新挂载或参数变化时的重新请求时间（秒）- 15秒内不重新请求，减少不必要的请求
  refetchOnMountOrArgChange: 15,

  // 网络重连时自动刷新
  refetchOnReconnect: true,

  // 窗口重新获得焦点时不自动刷新（避免频繁请求）
  // 注意：WebSocket会提供实时更新，不需要focus时刷新
  refetchOnFocus: false,

  endpoints: (build) => ({
    // ==================== Authentication ====================
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: build.mutation<{ success: boolean; message: string }, { refreshToken?: string }>({
      query: (body) => ({
        url: 'auth/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    verifyAuth: build.query<AuthResponse, void>({
      query: () => 'auth/verify',
      providesTags: ['Auth'],
    }),
    getCurrentUser: build.query<AuthResponse, void>({
      query: () => 'auth/me',
      providesTags: ['Auth'],
    }),
    refreshToken: build.mutation<AuthResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: 'auth/refresh',
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: build.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: build.mutation<{ success: boolean; message: string }, { token: string; newPassword: string }>({
      query: (body) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    changePassword: build.mutation<{ success: boolean; message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: 'auth/change-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    // ==================== Projects ====================
  getProjects: build.query<ProjectListResponse, { page?: number; pageSize?: number }>({
    query: (params) => ({ url: "projects", params }),
    providesTags: (result) =>
      result
        ? [
            { type: "Projects" as const, id: "LIST" }, // 刷新整个列表
            ...result.data.projects.map((project) => ({ type: "Projects" as const, id: project.id })),
          ]
        : [{ type: "Projects" as const, id: "LIST" }],
  }),
    // 获取唯一的 Client Companies（高效查询，用于下拉选项）
    getClientCompanies: build.query<ApiResponse<string[]>, void>({
      query: () => "projects/client-companies",
      providesTags: [{ type: "Projects", id: "CLIENT_COMPANIES" }],
    }),
    getProjectById: build.query<ApiResponse<Project>, number>({
      query: (id) => `projects/${id}`,
      providesTags: (result, error, id) => [{ type: "Projects", id }],
    }),
    getPendingProjects: build.query<ProjectListResponse, { page?: number; pageSize?: number }>({
      query: (params) => ({
        url: "projects/pending",
        params,
      }),
      providesTags: ["Projects"],
    }),
    getDraftProjects: build.query<ProjectListResponse, { page?: number; pageSize?: number }>({
      query: (params) => ({
        url: "projects/draft",
        params,
      }),
      providesTags: ["Projects"],
    }),
    getMyDraftProjects: build.query<ProjectListResponse, { page?: number; pageSize?: number }>({
      query: (params) => ({
        url: "projects/my-draft",
        params,
      }),
      providesTags: ["Projects"],
    }),
    getPendingDeleteProjects: build.query<ProjectListResponse, { page?: number; pageSize?: number }>({
      query: (params) => ({
        url: "projects/pending-delete",
        params,
      }),
      providesTags: ["Projects"],
    }),
    searchProjects: build.query<ApiResponse<Project[]>, { q: string; limit?: number }>({
      query: (params) => ({
        url: "projects/search",
        params,
      }),
      providesTags: ["Projects"],
    }),
    createProject: build.mutation<ApiResponse<Project>, Partial<Project> & { autoApproveFromTask?: boolean }>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    updateProject: build.mutation<ApiResponse<Project>, { id: number; data: Partial<Project> }>({
      query: ({ id, data }) => ({
        url: `projects/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Projects", id }, "Projects"],
    }),
    deleteProject: build.mutation<ApiResponse<void>, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `projects/${id}`,
        method: "DELETE",
        body: { reason },
      }),
      invalidatesTags: ["Projects"],
    }),
submitProjectForApproval: build.mutation<
  ApiResponse<Project>,
  { id: number; autoApprove?: boolean }
>({
  query: ({ id, autoApprove }) => ({
    url: `projects/${id}/submit${autoApprove ? '?autoApprove=true' : ''}`,
    method: "POST",
  }),
  // 正确写法：一定要 invalidate LIST 标签
  invalidatesTags: (result, error, { id }) => [
    { type: "Projects", id },           // 单个项目缓存失效
    { type: "Projects", id: "LIST" },   // 关键：刷新整个列表！！
  ],
}),
    approveProject: build.mutation<ApiResponse<Project>, { id: number; approved: boolean; comment?: string }>({
      query: ({ id, approved, comment }) => ({
        url: `projects/${id}/approve`,
        method: "POST",
        body: { approved, comment },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Projects", id }, "Projects"],
    }),
    withdrawProjectApproval: build.mutation<ApiResponse<Project>, number>({
      query: (id) => ({
        url: `projects/${id}/withdraw`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Projects", id }, "Projects"],
    }),
    requestProjectDeletion: build.mutation<ApiResponse<Project>, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `projects/${id}/request-deletion`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Projects", id }, "Projects"],
    }),
    approveProjectDeletion: build.mutation<ApiResponse<any>, { id: number; approved: boolean; comment?: string }>({
      query: ({ id, approved, comment }) => ({
        url: `projects/${id}/approve-deletion`,
        method: "POST",
        body: { approved, comment },
      }),
      invalidatesTags: ["Projects"],
    }),
    withdrawProjectDeletion: build.mutation<ApiResponse<Project>, number>({
      query: (id) => ({
        url: `projects/${id}/withdraw-deletion`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Projects", id }, "Projects"],
    }),
    batchApproveProjects: build.mutation<ApiResponse<any>, { projectIds: number[]; approved: boolean; comment?: string }>({
      query: (data) => ({
        url: "projects/batch-approve",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Projects"],
    }),

    // ==================== Tasks ====================
    getAllTasks: build.query<TaskListResponse, {
      search?: string;           // 全文搜索
      jobType?: string;          // 业务类型 (AT/AC/AQ/AS/AP)
      mineral?: string;          // Mineral过滤
      page?: number;             // 页码
      limit?: number;            // 每页数量
      status?: string;           // 工作流状态
      priority?: string;         // 优先级
      projectId?: number;        // 项目ID
      approvalStatus?: string;   // 审批状态
      assignedUserId?:number|null;
      dueRange?: 'dueThisWeek' | 'overdue';
    }>({
      query: (params) => ({
        url: "tasks",
        params,
      }),
      providesTags: ["Tasks"],
    }),
    getTaskById: build.query<ApiResponse<Task>, number>({
      query: (id) => `tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Tasks", id }],
    }),
    getPendingTasks: build.query<ApiResponse<Task[]>, void>({
      query: () => "tasks/pending",
      providesTags: ["Tasks"],
    }),
    getDraftTasks: build.query<ApiResponse<Task[]>, void>({
      query: () => "tasks/draft",
      providesTags: ["Tasks"],
    }),
    getMyTasks: build.query<ApiResponse<Task[]>, { status?: string; priority?: string }>({
      query: (params) => ({
        url: "tasks/my",
        params,
      }),
      providesTags: ["Tasks"],
    }),
    getTasksByProject: build.query<ApiResponse<Task[]>, { projectId: number; status?: string; priority?: string }>({
      query: ({ projectId, ...params }) => ({
        url: `tasks/project/${projectId}`,
        params,
      }),
      providesTags: ["Tasks"],
    }),
    searchTasks: build.query<ApiResponse<Task[]>, { q: string; limit?: number }>({
      query: (params) => ({
        url: "tasks/search",
        params,
      }),
      providesTags: ["Tasks"],
    }),
    getMinerals: build.query<ApiResponse<string[]>, void>({
      query: () => ({
        url: "tasks/minerals",
      }),
      providesTags: ["Tasks"],
    }),
    getTaskStats: build.query<ApiResponse<TaskStatsSummary>, { startDate?: string; endDate?: string; projectId?: number; jobType?: string } | void>({
      query: (params) => ({
        url: "stats/tasks",
        params,
      }),
      providesTags: ["Tasks"],
    }),
    getDashboardStats: build.query<ApiResponse<{
      overview: {
        totalProjects: number;
        activeProjects: number;
        totalTasks: number;
        activeTasks: number;
        myTasks: number;
        pendingApprovals: {
          projects: number;
          tasks: number;
        };
      };
      projectsByJobType: Record<string, number>;
      tasksByStatus: Record<string, number>;
      tasksByPriority: Record<string, number>;
      recentActivities: any[];
    }>, void>({
      query: () => "stats/dashboard",
      providesTags: ["Tasks", "Projects"],
    }),
    getProjectStats: build.query<ApiResponse<{
      overview: {
        total: number;
        avgTasksPerProject: number;
      };
      byJobType: Record<string, number>;
      byStatus: Record<string, number>;
      byApprovalStatus: Record<string, number>;
      topClients: Array<{ client: string; projectCount: number }>;
    }>, { startDate?: string; endDate?: string; jobType?: string; status?: string } | void>({
      query: (params) => ({
        url: "stats/projects",
        params,
      }),
      providesTags: ["Projects"],
    }),
    createTask: build.mutation<ApiResponse<Task>, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks", "Projects"],
    }),
    createBatchTasks: build.mutation<ApiResponse<any>, { projectId: number; tasks: Partial<Task>[] }>({
      query: (data) => ({
        url: "tasks/batch",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tasks", "Projects"],
    }),
    updateTask: build.mutation<ApiResponse<Task>, { id: number; data: Partial<Task> }>({
      query: ({ id, data }) => ({
        url: `tasks/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tasks", id }, "Tasks"],
    }),
    updateTaskStatus: build.mutation<ApiResponse<Task>, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tasks", id }, "Tasks"],
    }),
    deleteTask: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks", "Projects"],
    }),
    submitTaskForApproval: build.mutation<ApiResponse<Task>, number>({
      query: (id) => ({
        url: `tasks/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Tasks", id }, "Tasks"],
    }),
    approveTask: build.mutation<ApiResponse<Task>, { id: number; approved: boolean; comment?: string }>({
      query: ({ id, approved, comment }) => ({
        url: `tasks/${id}/approve`,
        method: "POST",
        body: { approved, comment },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tasks", id }, "Tasks"],
    }),
    withdrawTaskApproval: build.mutation<ApiResponse<Task>, number>({
      query: (id) => ({
        url: `tasks/${id}/withdraw`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Tasks", id }, "Tasks"],
    }),
    batchApproveTasks: build.mutation<ApiResponse<any>, { taskIds: number[]; approved: boolean; comment?: string }>({
      query: (data) => ({
        url: "tasks/batch-approve",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tasks"],
    }),
    requestTaskDeletion: build.mutation<ApiResponse<Task>, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `tasks/${id}/request-deletion`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tasks", id }, "Tasks"],
    }),
    approveTaskDeletion: build.mutation<ApiResponse<Task | null>, { id: number; approved: boolean; comment?: string }>({
      query: ({ id, approved, comment }) => ({
        url: `tasks/${id}/approve-deletion`,
        method: "POST",
        body: { approved, comment },
      }),
      invalidatesTags: ["Tasks", "Projects"],
    }),
    withdrawTaskDeletion: build.mutation<ApiResponse<Task>, number>({
      query: (id) => ({
        url: `tasks/${id}/withdraw-deletion`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Tasks", id }, "Tasks"],
    }),
    getPendingDeletionTasks: build.query<ApiResponse<Task[]>, void>({
      query: () => "tasks/pending-deletion",
      providesTags: ["Tasks"],
    }),
    exportTasksToExcel: build.query<Blob, { jobType?: string; status?: string; priority?: string; approvalStatus?: string; startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: "tasks/export",
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // ==================== Teams ====================
    getTeams: build.query<TeamListResponse, { isActive?: boolean; page?: number; pageSize?: number }>({
      query: (params) => ({
        url: "teams",
        params,
      }),
      providesTags: ["Teams"],
    }),
    getTeamById: build.query<ApiResponse<Team>, number>({
      query: (id) => `teams/${id}`,
      providesTags: (result, error, id) => [{ type: "Teams", id }],
    }),
    searchTeams: build.query<ApiResponse<Team[]>, { q: string; limit?: number }>({
      query: (params) => ({
        url: "teams/search",
        params,
      }),
      providesTags: ["Teams"],
    }),
    createTeam: build.mutation<ApiResponse<Team>, Partial<Team>>({
      query: (team) => ({
        url: "teams",
        method: "POST",
        body: team,
      }),
      invalidatesTags: ["Teams"],
    }),
    updateTeam: build.mutation<ApiResponse<Team>, { id: number; data: Partial<Team> }>({
      query: ({ id, data }) => ({
        url: `teams/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Teams", id }, "Teams"],
    }),
    deleteTeam: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teams"],
    }),

    // ==================== Comments ====================
    getComments: build.query<ApiResponse<{ comments: Comment[]; pagination: any }>, { entityType: string; entityId: number; page?: number; limit?: number }>({
      query: ({ entityType, entityId, ...params }) => ({
        url: `comments/${entityType}/${entityId}`,
        params,
      }),
      providesTags: ["Comments"],
    }),
    createComment: build.mutation<ApiResponse<Comment>, { content: string; images?: string[]; entityType: string; entityId: number; parentId?: number; mentionedUserIds?: number[] }>({
      query: (data) => ({
        url: "comments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Comments", "Tasks", "Projects", "Notifications"],
    }),
    updateComment: build.mutation<ApiResponse<Comment>, { id: number; content: string; images?: string[]; mentionedUserIds?: number[] }>({
      query: ({ id, ...data }) => ({
        url: `comments/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Comments", "Notifications"],
    }),
    deleteComment: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comments", "Notifications"],
    }),
    getMentionedComments: build.query<ApiResponse<Comment[]>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: "comments/mentions/me",
        params,
      }),
      providesTags: ["Comments"],
    }),

    // ==================== Notifications ====================
    getUserNotifications: build.query<ApiResponse<Notification[]>, { userId: number; page?: number; limit?: number }>({
      query: ({ userId, ...params }) => ({
        url: `notifications/user/${userId}`,
        params,
      }),
      providesTags: ["Notifications"],
      // Automatically refetch every 30 seconds to check for new notifications
      pollingInterval: 30000,
    }),
    getUnreadCount: build.query<ApiResponse<{ count: number }>, number>({
      query: (userId) => `notifications/user/${userId}/unread-count`,
      providesTags: ["Notifications"],
      // Automatically refetch every 30 seconds to update notification badge
      pollingInterval: 30000,
    }),
    getNotificationStats: build.query<ApiResponse<any>, number>({
      query: (userId) => `notifications/user/${userId}/stats`,
      providesTags: ["Notifications"],
    }),
    markNotificationAsRead: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsAsRead: build.mutation<ApiResponse<void>, number>({
      query: (userId) => ({
        url: `notifications/user/${userId}/read-all`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotification: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
    clearReadNotifications: build.mutation<ApiResponse<void>, number>({
      query: (userId) => ({
        url: `notifications/user/${userId}/clear-read`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ==================== Quotations ====================
    getProjectQuotation: build.query<ApiResponse<Quotation>, number>({
      query: (projectId) => `projects/${projectId}/quotations`,
      providesTags: (result, error, projectId) => [{ type: "Quotations", id: projectId }],
    }),
    upsertQuotation: build.mutation<ApiResponse<Quotation>, { projectId: number; data: Partial<Quotation> }>({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}/quotations`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: "Quotations", id: projectId }, "Projects"],
    }),
    deleteQuotation: build.mutation<ApiResponse<void>, number>({
      query: (projectId) => ({
        url: `projects/${projectId}/quotations`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, projectId) => [{ type: "Quotations", id: projectId }, "Projects"],
    }),

    // ==================== Users ====================
    getUsers: build.query<UserListResponse, void | { page?: number; pageSize?: number; search?: string }>({
      query: (params) => ({
        url: "users",
        params,
      }),
      providesTags: (result) => {
        if (!result?.data?.data) {
          return [{ type: "Users" as const, id: "LIST" }];
        }

        return [
          ...result.data.data.map((user) => ({ type: "Users" as const, id: user.id })),
          { type: "Users" as const, id: "LIST" },
        ];
      },
    }),
    getUserById: build.query<ApiResponse<User>, number>({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    searchUsers: build.query<ApiResponse<User[]>, { q: string; limit?: number }>({
      query: (params) => ({
        url: "users/search",
        params,
      }),
      providesTags: ["Users"],
    }),
    createUser: build.mutation<ApiResponse<User>, Partial<User> & { password: string }>({
      query: (data) => ({
        url: "auth/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUser: build.mutation<ApiResponse<User>, { id: number } & Partial<User>>({
      query: ({ id, ...data }) => ({
        url: `users/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }, "Users"],
    }),
    deleteUser: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // ==================== Mine Sites ====================
    getMineSites: build.query<ApiResponse<MineSite[]>, void>({
      query: () => "mine-zones",  // ✅ 修复：使用正确的后端路由
      providesTags: ["MineSites"],
    }),
    getMineSiteById: build.query<ApiResponse<MineSite>, number>({
      query: (id) => `mine-zones/${id}`,  // ✅ 修复：使用正确的后端路由
      providesTags: (result, error, id) => [{ type: "MineSites", id }],
    }),
    createMineSite: build.mutation<ApiResponse<MineSite>, Partial<MineSite>>({
      query: (data) => ({
        url: "mine-zones",  // ✅ 修复：使用正确的后端路由
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MineSites"],
    }),
    updateMineSite: build.mutation<ApiResponse<MineSite>, { id: number; data: Partial<MineSite> }>({
      query: ({ id, data }) => ({
        url: `mine-zones/${id}`,  // ✅ 修复：使用正确的后端路由
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "MineSites", id }, "MineSites"],
    }),
    deleteMineSite: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `mine-zones/${id}`,  // ✅ 修复：使用正确的后端路由
        method: "DELETE",
      }),
      invalidatesTags: ["MineSites"],
    }),

    // ==================== Folder Preview ====================
    getTaskFolderContents: build.query<ApiResponse<any>, { taskId: number; subfolder?: string }>({
      query: ({ taskId, subfolder }) => ({
        url: `folders/task/${taskId}`,
        params: { subfolder },
      }),
    }),
    getProjectFolderContents: build.query<ApiResponse<any>, { projectId: number; subfolder?: string; folderType?: "client" | "minesite" }>({
      query: ({ projectId, subfolder, folderType }) => ({
        url: `folders/project/${projectId}`,
        params: { subfolder, folderType },
      }),
    }),
    browseFolderContents: build.query<ApiResponse<any>, { path: string; isOneDrive?: boolean }>({
      query: ({ path, isOneDrive }) => ({
        url: `folders/browse`,
        params: { path, isOneDrive },
      }),
    }),
    downloadFile: build.query<Blob, { path: string }>({
      query: ({ path }) => ({
        url: `folders/download`,
        params: { path },
        responseHandler: (response) => response.blob(),
      }),
    }),
    uploadFileToFolder: build.mutation<ApiResponse<any>, FormData>({
      query: (formData) => ({
        url: `folders/upload`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Tasks"], // 刷新任务文件列表
    }),
    createShareLink: build.mutation<ApiResponse<{ url: string }>, { path: string }>({
      query: ({ path }) => ({
        url: `folders/share-link?path=${encodeURIComponent(path)}`,
        method: "POST",
      }),
    }),
    requestFileDelete: build.mutation<ApiResponse<any>, { fileId: number; reason: string }>({
      query: (data) => ({
        url: `folders/request-delete`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tasks"],
    }),
    approveFileDelete: build.mutation<ApiResponse<any>, { fileId: number; approved: boolean; comment?: string }>({
      query: (data) => ({
        url: `folders/approve-delete`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tasks"],
    }),
    createFolder: build.mutation<ApiResponse<any>, { targetPath?: string; folderName: string; taskId: number }>({
      query: (data) => ({
        url: `folders/create-folder`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tasks"],
    }),

    // ==================== Permissions ====================
    getMyPermissions: build.query<ApiResponse<string[]>, void>({
      query: () => "permissions/me",
      providesTags: ["Permissions"],
    }),
    getUserPermissions: build.query<ApiResponse<string[]>, number>({
      query: (userId) => `permissions/user/${userId}`,
      providesTags: (result, error, userId) => [{ type: "Permissions", id: userId }],
    }),
    getRolePermissions: build.query<ApiResponse<string[]>, UserRole>({
      query: (role) => `permissions/role/${role}`,
      providesTags: (result, error, role) => [{ type: "Permissions", id: role }],
    }),
    getAllPermissions: build.query<ApiResponse<string[]>, void>({
      query: () => "permissions/all",
      providesTags: ["Permissions"],
    }),
    grantPermission: build.mutation<ApiResponse<null>, {
      userId: number;
      permissionCode: string;
      scope: string;
      resourceType?: string;
      resourceId?: number;
      expiresAt?: Date;
      reason?: string;
    }>({
      query: (data) => ({
        url: "permissions/grant",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Permissions", id: userId }, "Permissions"],
    }),
    revokePermission: build.mutation<ApiResponse<null>, {
      userId: number;
      permissionCode: string;
      scope: string;
      resourceType?: string;
      resourceId?: number;
    }>({
      query: (data) => ({
        url: "permissions/revoke",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Permissions", id: userId }, "Permissions"],
    }),
    updateUserRole: build.mutation<ApiResponse<null>, { userId: number; role: UserRole }>({
      query: ({ userId, role }) => ({
        url: `permissions/user/${userId}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "Users", id: userId },
        { type: "Permissions", id: userId },
        "Users",
        "Permissions",
      ],
    }),

    // ==================== Activities ====================
    getRecentActivities: build.query<ApiResponse<Activity[]>, { limit?: number }>({
      query: ({ limit = 10 }) => `activities/recent?limit=${limit}`,
      providesTags: ["Activities"],
    }),
    getUserActivities: build.query<ApiResponse<Activity[]>, { userId: number; limit?: number }>({
      query: ({ userId, limit = 10 }) => `activities/user/${userId}?limit=${limit}`,
      providesTags: (result, error, { userId }) => [{ type: "Activities", id: userId }],
    }),

    // ==================== Minerals ====================
    getAllMinerals: build.query<ApiResponse<string[]>, { search?: string } | void>({
      query: (params) => ({
        url: 'minerals',
        params: params || {},
      }),
      providesTags: ["Minerals"],
    }),
    getMineralStats: build.query<ApiResponse<{ mineral: string; count: number }[]>, void>({
      query: () => 'minerals/stats',
      providesTags: ["Minerals"],
    }),

    // ==================== User OneDrive Path Configuration ====================
    saveOneDrivePath: build.mutation<ApiResponse<{ oneDriveLocalPath: string }>, { userId: number; oneDriveLocalPath: string }>({
      query: (body) => ({
        url: 'users/onedrive-path',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: "Users", id: userId }],
    }),
    getOneDrivePath: build.query<ApiResponse<{ oneDriveLocalPath: string }>, number>({
      query: (userId) => `users/${userId}/onedrive-path`,
      providesTags: (result, error, userId) => [{ type: "Users", id: userId }],
    }),
  }),
});

export const {
  // Authentication (8 endpoints)
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useVerifyAuthQuery,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,

  // Projects (18 endpoints)
  useGetProjectsQuery,
  useGetClientCompaniesQuery,
  useGetProjectByIdQuery,
  useGetPendingProjectsQuery,
  useGetDraftProjectsQuery,
  useGetMyDraftProjectsQuery,
  useGetPendingDeleteProjectsQuery,
  useSearchProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useSubmitProjectForApprovalMutation,
  useApproveProjectMutation,
  useWithdrawProjectApprovalMutation,
  useRequestProjectDeletionMutation,
  useApproveProjectDeletionMutation,
  useWithdrawProjectDeletionMutation,
  useBatchApproveProjectsMutation,

  // Tasks (21 endpoints)
  useGetAllTasksQuery,
  useGetTaskByIdQuery,
  useGetPendingTasksQuery,
  useGetDraftTasksQuery,
  useGetMyTasksQuery,
  useGetTasksByProjectQuery,
  useSearchTasksQuery,
  useGetMineralsQuery,
  useGetTaskStatsQuery,
  useGetDashboardStatsQuery,
  useGetProjectStatsQuery,
  useCreateTaskMutation,
  useCreateBatchTasksMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useSubmitTaskForApprovalMutation,
  useApproveTaskMutation,
  useWithdrawTaskApprovalMutation,
  useBatchApproveTasksMutation,
  useRequestTaskDeletionMutation,
  useApproveTaskDeletionMutation,
  useWithdrawTaskDeletionMutation,
  useGetPendingDeletionTasksQuery,
  useExportTasksToExcelQuery,

  // Teams (6 endpoints)
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useSearchTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,

  // Comments (5 endpoints)
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetMentionedCommentsQuery,

  // Notifications (7 endpoints)
  useGetUserNotificationsQuery,
  useGetUnreadCountQuery,
  useGetNotificationStatsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useClearReadNotificationsMutation,

  // Quotations (3 endpoints)
  useGetProjectQuotationQuery,
  useUpsertQuotationMutation,
  useDeleteQuotationMutation,

  // Users (6 endpoints)
  useGetUsersQuery,
  useGetUserByIdQuery,
  useSearchUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,

  // MineSites (5 endpoints)
  useGetMineSitesQuery,
  useGetMineSiteByIdQuery,
  useCreateMineSiteMutation,
  useUpdateMineSiteMutation,
  useDeleteMineSiteMutation,

  // Folder Preview (8 endpoints)
  useGetTaskFolderContentsQuery,
  useGetProjectFolderContentsQuery,
  useBrowseFolderContentsQuery,
  useDownloadFileQuery,
  useUploadFileToFolderMutation,
  useCreateShareLinkMutation,
  useRequestFileDeleteMutation,
  useApproveFileDeleteMutation,
  useCreateFolderMutation,

  // Permissions (7 endpoints)
  useGetMyPermissionsQuery,
  useGetUserPermissionsQuery,
  useGetRolePermissionsQuery,
  useGetAllPermissionsQuery,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useUpdateUserRoleMutation,

  // Activities (2 endpoints)
  useGetRecentActivitiesQuery,
  useGetUserActivitiesQuery,

  // Minerals (2 endpoints)
  useGetAllMineralsQuery,
  useGetMineralStatsQuery,

  // User OneDrive Path (2 endpoints)
  useSaveOneDrivePathMutation,
  useGetOneDrivePathQuery,
} = api;
