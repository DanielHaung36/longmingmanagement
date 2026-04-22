-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('AC', 'AP', 'AQ', 'AS', 'AT');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('PRIMARY', 'COLLABORATOR', 'CONSULTANT', 'SUPPORT', 'REVIEWER');

-- CreateEnum
CREATE TYPE "public"."TestType" AS ENUM ('LABORATORY', 'PILOT', 'INDUSTRIAL', 'OPTIMIZATION');

-- CreateEnum
CREATE TYPE "public"."TestStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'ANALYSIS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('SYSTEM_ANNOUNCEMENT', 'PROJECT_CREATED', 'PROJECT_STATUS_CHANGE', 'PROJECT_DEADLINE', 'PROJECT_MEMBER_ADDED', 'TASK_ASSIGNED', 'TASK_STATUS_CHANGE', 'TASK_DEADLINE', 'TASK_OVERDUE', 'COMMENT_MENTION', 'COMMENT_REPLY', 'CHAT_MESSAGE', 'CHAT_MENTION', 'APPROVAL_PENDING', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'TEST_STARTED', 'TEST_COMPLETED', 'TEST_ALERT');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."WorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WorkflowInstanceStatus" AS ENUM ('RUNNING', 'COMPLETED', 'TERMINATED', 'SUSPENDED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."WorkflowTaskType" AS ENUM ('START', 'APPROVAL', 'NOTIFICATION', 'SCRIPT', 'PARALLEL', 'EXCLUSIVE', 'INCLUSIVE', 'END');

-- CreateEnum
CREATE TYPE "public"."WorkflowTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELEGATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('SYSTEM', 'PROJECT', 'TASK', 'TESTWORK', 'FILE', 'WORKFLOW', 'USER', 'TEAM', 'COMMENT', 'CHAT', 'NOTIFICATION', 'REPORT', 'MINE_ZONE');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE', 'EXECUTE', 'APPROVE', 'SHARE', 'EXPORT', 'ASSIGN', 'MONITOR', 'ANALYZE');

-- CreateEnum
CREATE TYPE "public"."PermissionScope" AS ENUM ('SYSTEM', 'ORGANIZATION', 'PROJECT', 'TEAM', 'PERSONAL');

-- CreateEnum
CREATE TYPE "public"."Permission" AS ENUM ('SYSTEM_ADMIN', 'USER_MANAGE', 'ROLE_MANAGE', 'TEAM_MANAGE', 'PROJECT_CREATE', 'PROJECT_READ', 'PROJECT_UPDATE', 'PROJECT_DELETE', 'PROJECT_MEMBER_MANAGE', 'TASK_CREATE', 'TASK_READ', 'TASK_UPDATE', 'TASK_DELETE', 'TASK_ASSIGN', 'TESTWORK_CREATE', 'TESTWORK_READ', 'TESTWORK_UPDATE', 'TESTWORK_DELETE', 'TESTWORK_EXECUTE', 'TESTWORK_MONITOR', 'TESTWORK_ANALYZE', 'WORKFLOW_CREATE', 'WORKFLOW_APPROVE', 'WORKFLOW_DELEGATE', 'WORKFLOW_MANAGE', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_DELETE', 'FILE_SHARE', 'COMMENT_CREATE', 'COMMENT_READ', 'COMMENT_DELETE', 'CHAT_PARTICIPATE', 'CHAT_MANAGE', 'NOTIFICATION_SEND', 'NOTIFICATION_MANAGE', 'REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_MANAGE', 'MINE_ZONE_CREATE', 'MINE_ZONE_READ', 'MINE_ZONE_UPDATE', 'MINE_ZONE_DELETE');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "public"."PermissionScope" NOT NULL DEFAULT 'SYSTEM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_definitions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" "public"."ResourceType" NOT NULL,
    "action" "public"."ActionType" NOT NULL,
    "scope" "public"."PermissionScope" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "scope" "public"."PermissionScope" NOT NULL DEFAULT 'SYSTEM',
    "resourceType" "public"."ResourceType",
    "resourceId" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permissions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "scope" "public"."PermissionScope" NOT NULL,
    "resourceType" "public"."ResourceType",
    "resourceId" INTEGER,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "assignedBy" INTEGER,
    "reason" TEXT,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resource_permissions" (
    "id" SERIAL NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "resourceType" "public"."ResourceType" NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "inheritParent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "managerId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mine_zones" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mine_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "realName" TEXT,
    "phone" TEXT,
    "profilePictureUrl" TEXT,
    "departmentId" INTEGER,
    "position" TEXT,
    "employeeId" TEXT,
    "teamId" INTEGER,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastNotificationReadTime" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectCode" TEXT NOT NULL,
    "jobType" "public"."JobType" NOT NULL,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "priority" "public"."Priority" NOT NULL DEFAULT 'LOW',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "mineralType" TEXT,
    "mineZoneId" INTEGER,
    "clientCompany" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "estimatedTonnage" DECIMAL(15,2),
    "grade" TEXT,
    "ownerId" INTEGER NOT NULL,
    "teamId" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "budget" DECIMAL(15,2),
    "actualCost" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_teams" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'COLLABORATOR',
    "description" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "project_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_members" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "public"."Priority" NOT NULL DEFAULT 'LOW',
    "tags" TEXT,
    "projectId" INTEGER NOT NULL,
    "parentTaskId" INTEGER,
    "authorUserId" INTEGER NOT NULL,
    "assignedUserId" INTEGER,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_dependencies" (
    "id" SERIAL NOT NULL,
    "dependentTaskId" INTEGER NOT NULL,
    "dependsOnTaskId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FS',
    "delay" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."testwork_projects" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "testType" "public"."TestType" NOT NULL,
    "sampleCode" TEXT NOT NULL,
    "sampleSource" TEXT,
    "testObjective" TEXT,
    "methodology" TEXT,
    "status" "public"."TestStatus" NOT NULL DEFAULT 'PLANNING',
    "leadScientistId" INTEGER,
    "laboratory" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testwork_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."test_steps" (
    "id" SERIAL NOT NULL,
    "testworkId" INTEGER NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO',
    "operatorId" INTEGER,
    "supervisorId" INTEGER,
    "parameters" JSONB,
    "results" JSONB,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."test_monitoring" (
    "id" SERIAL NOT NULL,
    "stepId" INTEGER NOT NULL,
    "parameterName" TEXT NOT NULL,
    "value" DECIMAL(15,6) NOT NULL,
    "unit" TEXT,
    "isNormal" BOOLEAN NOT NULL DEFAULT true,
    "alertMessage" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" INTEGER,

    CONSTRAINT "test_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_rooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'project',
    "projectId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_room_members" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "chat_room_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "replyToId" INTEGER,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_mentions" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_reactions" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comment_mentions" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "recipientId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "relatedType" TEXT,
    "relatedId" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "channels" "public"."NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"public"."NotificationChannel"[],
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_notification_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "typeSettings" JSONB NOT NULL DEFAULT '{}',
    "quietHours" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "nodeData" JSONB NOT NULL,
    "edgeData" JSONB NOT NULL,
    "canvasConfig" JSONB,
    "startNodeId" TEXT NOT NULL,
    "endNodeIds" TEXT[],
    "variables" JSONB,
    "createdById" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "roleIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_instances" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "businessType" TEXT NOT NULL,
    "businessId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "title" TEXT NOT NULL,
    "urgency" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."WorkflowInstanceStatus" NOT NULL DEFAULT 'RUNNING',
    "currentNodes" TEXT[],
    "completedNodes" TEXT[],
    "startUserId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "variables" JSONB,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_tasks" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "taskType" "public"."WorkflowTaskType" NOT NULL,
    "assignmentType" TEXT NOT NULL,
    "assignmentValue" TEXT NOT NULL,
    "candidateUsers" INTEGER[],
    "actualAssignee" INTEGER,
    "approvalType" TEXT NOT NULL DEFAULT 'single',
    "requiredCount" INTEGER,
    "status" "public"."WorkflowTaskStatus" NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "result" TEXT,
    "comments" TEXT,
    "attachments" TEXT[],
    "conditionExpression" TEXT,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_approvals" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "comments" TEXT,
    "attachments" TEXT[],
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_delegations" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "reason" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workflow_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_logs" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_configs" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."backup_records" (
    "id" SERIAL NOT NULL,
    "backupType" TEXT NOT NULL,
    "backupSize" BIGINT NOT NULL,
    "filePath" TEXT NOT NULL,
    "cloudPath" TEXT,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "errorMessage" TEXT,
    "checksum" TEXT,
    "retention" INTEGER NOT NULL DEFAULT 30,
    "createdBy" INTEGER,

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."queue_jobs" (
    "id" SERIAL NOT NULL,
    "queue" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "processedBy" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_cache" (
    "id" SERIAL NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheValue" JSONB NOT NULL,
    "cacheType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_logs" (
    "id" SERIAL NOT NULL,
    "metricType" TEXT NOT NULL,
    "endpoint" TEXT,
    "userId" INTEGER,
    "duration" INTEGER,
    "memoryUsage" BIGINT,
    "queryCount" INTEGER,
    "errorCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."error_logs" (
    "id" SERIAL NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorCode" TEXT,
    "message" TEXT NOT NULL,
    "stackTrace" TEXT,
    "endpoint" TEXT,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."smtp_configs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "encryption" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxPerHour" INTEGER NOT NULL DEFAULT 100,
    "maxPerDay" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smtp_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_logs" (
    "id" SERIAL NOT NULL,
    "smtpConfigId" INTEGER,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmails" TEXT[],
    "ccEmails" TEXT[],
    "bccEmails" TEXT[],
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "attachments" JSONB,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "bounceReason" TEXT,
    "messageId" TEXT,
    "trackingId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "entityType" TEXT,
    "entityId" INTEGER,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_blacklist" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "addedBy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_statistics" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "smtpConfigId" INTEGER,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "uniqueOpens" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "deliveryRate" DECIMAL(5,2),
    "openRate" DECIMAL(5,2),
    "clickRate" DECIMAL(5,2),
    "bounceRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_indexes" (
    "id" SERIAL NOT NULL,
    "indexName" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "syncCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "indexId" INTEGER,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "results" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "executionTime" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_statistics" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "totalSearches" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "avgExecutionTime" INTEGER DEFAULT 0,
    "topQueries" JSONB,
    "topUsers" JSONB,
    "noResultsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_contents" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "metadata" JSONB,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "lastIndexed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_definitions_code_key" ON "public"."permission_definitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "public"."role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_scope_resourceType_resourceId_key" ON "public"."user_roles"("userId", "roleId", "scope", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_scope_resourceType_res_key" ON "public"."user_permissions"("userId", "permissionId", "scope", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_permissions_permissionId_resourceType_resourceId_key" ON "public"."resource_permissions"("permissionId", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "public"."departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mine_zones_code_key" ON "public"."mine_zones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognitoId_key" ON "public"."users"("cognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "public"."users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectCode_key" ON "public"."projects"("projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "project_teams_projectId_teamId_key" ON "public"."project_teams"("projectId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "public"."project_members"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_dependentTaskId_dependsOnTaskId_key" ON "public"."task_dependencies"("dependentTaskId", "dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "testwork_projects_projectId_key" ON "public"."testwork_projects"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "testwork_projects_sampleCode_key" ON "public"."testwork_projects"("sampleCode");

-- CreateIndex
CREATE UNIQUE INDEX "chat_room_members_roomId_userId_key" ON "public"."chat_room_members"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_mentions_messageId_userId_key" ON "public"."chat_mentions"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "public"."message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "comments_entityType_entityId_idx" ON "public"."comments"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_mentions_commentId_userId_key" ON "public"."comment_mentions"("commentId", "userId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "public"."notifications"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "public"."notifications"("recipientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_userId_key" ON "public"."user_notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_category_name_version_key" ON "public"."workflow_templates"("category", "name", "version");

-- CreateIndex
CREATE INDEX "workflow_instances_businessType_businessId_idx" ON "public"."workflow_instances"("businessType", "businessId");

-- CreateIndex
CREATE INDEX "workflow_instances_startUserId_status_idx" ON "public"."workflow_instances"("startUserId", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_projectId_status_idx" ON "public"."workflow_instances"("projectId", "status");

-- CreateIndex
CREATE INDEX "workflow_tasks_instanceId_status_idx" ON "public"."workflow_tasks"("instanceId", "status");

-- CreateIndex
CREATE INDEX "workflow_tasks_actualAssignee_status_idx" ON "public"."workflow_tasks"("actualAssignee", "status");

-- CreateIndex
CREATE UNIQUE INDEX "task_approvals_taskId_userId_key" ON "public"."task_approvals"("taskId", "userId");

-- CreateIndex
CREATE INDEX "workflow_logs_instanceId_createdAt_idx" ON "public"."workflow_logs"("instanceId", "createdAt");

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "public"."attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "attachments_isTemplate_category_idx" ON "public"."attachments"("isTemplate", "category");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "public"."system_configs"("key");

-- CreateIndex
CREATE INDEX "backup_records_backupType_status_idx" ON "public"."backup_records"("backupType", "status");

-- CreateIndex
CREATE INDEX "backup_records_startTime_idx" ON "public"."backup_records"("startTime");

-- CreateIndex
CREATE INDEX "queue_jobs_queue_status_priority_idx" ON "public"."queue_jobs"("queue", "status", "priority");

-- CreateIndex
CREATE INDEX "queue_jobs_scheduledAt_idx" ON "public"."queue_jobs"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_cache_cacheKey_key" ON "public"."system_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "system_cache_cacheType_expiresAt_idx" ON "public"."system_cache"("cacheType", "expiresAt");

-- CreateIndex
CREATE INDEX "performance_logs_metricType_createdAt_idx" ON "public"."performance_logs"("metricType", "createdAt");

-- CreateIndex
CREATE INDEX "performance_logs_userId_createdAt_idx" ON "public"."performance_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_errorType_severity_createdAt_idx" ON "public"."error_logs"("errorType", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_isResolved_severity_idx" ON "public"."error_logs"("isResolved", "severity");

-- CreateIndex
CREATE INDEX "email_logs_status_scheduledAt_idx" ON "public"."email_logs"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "email_logs_toEmails_idx" ON "public"."email_logs"("toEmails");

-- CreateIndex
CREATE INDEX "email_logs_entityType_entityId_idx" ON "public"."email_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "email_logs_userId_createdAt_idx" ON "public"."email_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "public"."email_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_code_key" ON "public"."email_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "email_blacklist_email_key" ON "public"."email_blacklist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_statistics_date_smtpConfigId_key" ON "public"."email_statistics"("date", "smtpConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "search_indexes_indexName_key" ON "public"."search_indexes"("indexName");

-- CreateIndex
CREATE INDEX "search_logs_userId_createdAt_idx" ON "public"."search_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "search_logs_query_idx" ON "public"."search_logs"("query");

-- CreateIndex
CREATE UNIQUE INDEX "search_statistics_date_key" ON "public"."search_statistics"("date");

-- CreateIndex
CREATE INDEX "search_contents_entityType_entityId_idx" ON "public"."search_contents"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "search_contents_isIndexed_idx" ON "public"."search_contents"("isIndexed");

-- CreateIndex
CREATE INDEX "search_contents_title_idx" ON "public"."search_contents"("title");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "public"."audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "public"."audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permission_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permission_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resource_permissions" ADD CONSTRAINT "resource_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permission_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resource_permissions" ADD CONSTRAINT "resource_permissions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_mineZoneId_fkey" FOREIGN KEY ("mineZoneId") REFERENCES "public"."mine_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_teams" ADD CONSTRAINT "project_teams_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_teams" ADD CONSTRAINT "project_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_dependencies" ADD CONSTRAINT "task_dependencies_dependentTaskId_fkey" FOREIGN KEY ("dependentTaskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_dependencies" ADD CONSTRAINT "task_dependencies_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."testwork_projects" ADD CONSTRAINT "testwork_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."testwork_projects" ADD CONSTRAINT "testwork_projects_leadScientistId_fkey" FOREIGN KEY ("leadScientistId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."test_steps" ADD CONSTRAINT "test_steps_testworkId_fkey" FOREIGN KEY ("testworkId") REFERENCES "public"."testwork_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."test_steps" ADD CONSTRAINT "test_steps_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."test_steps" ADD CONSTRAINT "test_steps_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."test_monitoring" ADD CONSTRAINT "test_monitoring_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."test_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_rooms" ADD CONSTRAINT "chat_rooms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_room_members" ADD CONSTRAINT "chat_room_members_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_room_members" ADD CONSTRAINT "chat_room_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_mentions" ADD CONSTRAINT "chat_mentions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_project_fkey" FOREIGN KEY ("entityId") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_task_fkey" FOREIGN KEY ("entityId") REFERENCES "public"."tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment_mentions" ADD CONSTRAINT "comment_mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment_mentions" ADD CONSTRAINT "comment_mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_notification_settings" ADD CONSTRAINT "user_notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_templates" ADD CONSTRAINT "workflow_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_templates" ADD CONSTRAINT "workflow_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_instances" ADD CONSTRAINT "workflow_instances_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_instances" ADD CONSTRAINT "workflow_instances_startUserId_fkey" FOREIGN KEY ("startUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_instances" ADD CONSTRAINT "workflow_instances_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_tasks" ADD CONSTRAINT "workflow_tasks_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_tasks" ADD CONSTRAINT "workflow_tasks_actualAssignee_fkey" FOREIGN KEY ("actualAssignee") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_approvals" ADD CONSTRAINT "task_approvals_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."workflow_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_approvals" ADD CONSTRAINT "task_approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_delegations" ADD CONSTRAINT "workflow_delegations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."workflow_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_delegations" ADD CONSTRAINT "workflow_delegations_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_delegations" ADD CONSTRAINT "workflow_delegations_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_logs" ADD CONSTRAINT "workflow_logs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_logs" ADD CONSTRAINT "workflow_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_configs" ADD CONSTRAINT "system_configs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."backup_records" ADD CONSTRAINT "backup_records_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_logs" ADD CONSTRAINT "performance_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."error_logs" ADD CONSTRAINT "error_logs_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_smtpConfigId_fkey" FOREIGN KEY ("smtpConfigId") REFERENCES "public"."smtp_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_templates" ADD CONSTRAINT "email_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_templates" ADD CONSTRAINT "email_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_blacklist" ADD CONSTRAINT "email_blacklist_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_statistics" ADD CONSTRAINT "email_statistics_smtpConfigId_fkey" FOREIGN KEY ("smtpConfigId") REFERENCES "public"."smtp_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_logs" ADD CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_logs" ADD CONSTRAINT "search_logs_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "public"."search_indexes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
