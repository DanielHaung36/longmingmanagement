export interface CreateProjectDTO {
    name: string;
    description?: string;
    projectCode: string;
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
    currency?: string;
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
    approved: boolean;
    approvedBy: number;
    comment?: string;
}
export interface SyncRequestDTO {
    projectId: number;
    trigger: 'APPROVAL' | 'MANUAL' | 'AUTO';
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
    localFolderPath?: string;
    oneDriveFolderPath?: string;
    excelRowNumber?: number;
    syncStatus: string;
    lastSyncTime?: Date;
    syncError?: string;
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
//# sourceMappingURL=project.types.d.ts.map