"use strict";
/**
 * Swagger API文档配置
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '隆基矿业项目管理系统 API',
            version: '1.0.0',
            description: `
# 矿业项目管理系统后端API文档

## 功能概述
- 项目生命周期管理（创建、审批、更新、删除）
- 自动项目编号生成（AT、AQ、AC、AS、AP）
- 本地 + OneDrive 双份文件夹同步
- Excel双向同步
- 用户认证与授权
- 知识图谱集成（Neo4j）

## 认证说明
- 开发模式：自动登录（DEV_AUTO_LOGIN=true）
- 生产模式：需要JWT Token
- Header: \`Authorization: Bearer <token>\`

## 项目状态流转
1. **创建项目** → PENDING（待审批）
2. **审批通过** → APPROVED → 生成正式编号 → 创建文件夹 → 同步Excel
3. **项目进行** → IN_PROGRESS
4. **删除申请** → PENDING_DELETE → 审批删除 → 物理删除文件夹和数据库
      `,
            contact: {
                name: 'Longi Technical Team',
                email: 'support@longi.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:8081',
                description: '开发环境'
            },
            {
                url: 'http://localhost:8081/api',
                description: '开发环境 (带API前缀)'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT认证token'
                }
            },
            schemas: {
                // 项目相关Schema
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Magnetic Separation Test' },
                        description: { type: 'string', example: 'Iron ore magnetic separation project' },
                        projectCode: { type: 'string', example: 'AT0001' },
                        jobType: {
                            type: 'string',
                            enum: ['AT', 'AQ', 'AC', 'AS', 'AP'],
                            example: 'AT',
                            description: 'AT=试验, AQ=报价, AC=咨询, AS=销售, AP=生产'
                        },
                        status: {
                            type: 'string',
                            enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
                            example: 'IN_PROGRESS'
                        },
                        approvalStatus: {
                            type: 'string',
                            enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PENDING_DELETE'],
                            example: 'APPROVED',
                            description: 'DRAFT=草稿, PENDING=待审批, APPROVED=已通过, REJECTED=已拒绝, PENDING_DELETE=待删除'
                        },
                        clientCompany: { type: 'string', example: 'Baoxin Mining Corporation' },
                        mineSiteName: { type: 'string', example: 'Baoxin Test Mine' },
                        contactPerson: { type: 'string', example: 'Zhang Wei' },
                        contactEmail: { type: 'string', example: 'zhang.wei@baoxin.com' },
                        mineralType: { type: 'string', example: 'Iron Ore' },
                        localFolderPath: { type: 'string', example: 'C:\\Longi\\ProjectData\\Projects\\Client\\Baoxin\\...' },
                        oneDriveFolderPath: { type: 'string', example: 'C:\\Users\\...\\OneDrive\\...' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        budget: { type: 'string', example: '100000' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateProjectRequest: {
                    type: 'object',
                    required: ['name', 'jobType', 'clientCompany', 'mineSiteName'],
                    properties: {
                        name: { type: 'string', example: 'Magnetic Separation Test', minLength: 1 },
                        description: { type: 'string', example: 'Iron ore separation project' },
                        jobType: { type: 'string', enum: ['AT', 'AQ', 'AC', 'AS', 'AP'], example: 'AT' },
                        clientCompany: { type: 'string', example: 'Baoxin Mining', minLength: 1 },
                        mineSiteName: { type: 'string', example: 'Baoxin Test Mine', minLength: 1 },
                        contactPerson: { type: 'string', example: 'Zhang Wei' },
                        contactEmail: { type: 'string', format: 'email', example: 'zhang@example.com' },
                        mineralType: { type: 'string', example: 'Iron Ore' },
                        startDate: { type: 'string', format: 'date', example: '2025-01-15' },
                        endDate: { type: 'string', format: 'date', example: '2025-03-15' },
                        budget: { type: 'number', example: 100000 }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        username: { type: 'string', example: 'admin' },
                        email: { type: 'string', example: 'admin@longi.com' },
                        realName: { type: 'string', example: 'Admin User' },
                        role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'USER'], example: 'ADMIN' }
                    }
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: '操作成功' },
                        data: { type: 'object' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: '错误信息' }
                    }
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Projects',
                description: '项目管理API'
            },
            {
                name: 'Approval',
                description: '审批流程API'
            },
            {
                name: 'Users',
                description: '用户管理API'
            },
            {
                name: 'Auth',
                description: '认证相关API'
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts'
    ]
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map