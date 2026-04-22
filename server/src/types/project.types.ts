export interface CreateProjectDTO {
  name: string;
  description?: string;
  projectCode: string;         // 由前端或后端生成
  // jobType 已删除 - jobType 只在 task 级别定义，避免歧义
  clientCompany?: string;
  mineSiteName?: string;
  contactPerson?: string;
  contactEmail?: string;
  mineralType?: string;
  estimatedTonnage?: number;
  grade?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  budget?: number;
  currency?: string;           // 默认 AUD
  ownerId: number;
  teamId?: number;
  mineZoneId?: number;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  status?: 'PLANNING' | 'ONGOING' | 'COMPLETED' | 'ON_HOLD';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  progress?: number;
  clientCompany?: string;
  mineSiteName?: string;
  contactPerson?: string;
  contactEmail?: string;
  mineralType?: string;
  estimatedTonnage?: number;
  grade?: string;
  startDate?: Date;
  endDate?: Date;
  actualEndDate?: Date;
  budget?: number;
  actualCost?: number;
  currency?: string;
  notes?: string;
}


export interface ApprovalDTO {
  approved: boolean;          // true=批准，false=拒绝
  approvedBy: number;         // 审批人 ID
  comment?: string;           // 备注或拒绝原因
}

export interface SyncRequestDTO {
  projectId: number;
  trigger: 'APPROVAL' | 'MANUAL' | 'AUTO'; // 同步触发来源
}

export interface SyncResultDTO {
  localPath: string;
  oneDrivePath: string;
  excelRow: number;
  success: boolean;
  error?: string;
  lastSyncTime?: Date;
}
export interface ProjectDetailDTO {
  id: number;
  name: string;
  projectCode: string;
  jobType: string;
  status: string;
  priority: string;
  progress: number;
  clientCompany?: string;
  mineSiteName?: string;
  contactPerson?: string;
  contactEmail?: string;
  mineralType?: string;
  estimatedTonnage?: number;
  grade?: string;
  budget?: number;
  actualCost?: number;
  currency: string;
  notes?: string;

  // 三层存储
  localFolderPath?: string;
  oneDriveFolderPath?: string;
  excelRowNumber?: number;
  syncStatus: string;
  lastSyncTime?: Date;
  syncError?: string;

  // 审批
  approvalStatus: string;
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}


export interface ProjectListItemDTO {
  id: number;
  name: string;
  projectCode: string;
  jobType: string;
  status: string;
  approvalStatus: string;
  syncStatus: string;
  clientCompany?: string;
  mineSiteName?: string;
  createdAt: Date;
}


export interface PendingApprovalDTO {
  id: number;
  name: string;
  projectCode: string;
  jobType: string;
  clientCompany: string;
  mineSiteName: string;
  createdAt: Date;
}


export interface SyncLogDTO {
  id: number;
  projectId: number;
  syncType: 'LOCAL_CREATION' | 'EXCEL_UPDATE' | 'ONEDRIVE_SYNC';
  status: 'SUCCESS' | 'FAILED' | 'SYNCING';
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
  filesCount?: number;
}