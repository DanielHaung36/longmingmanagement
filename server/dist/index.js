"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// 全局 BigInt 序列化支持
BigInt.prototype.toJSON = function () {
    return this.toString();
};
/* ROUTE IMPORTS */
const authSimple_1 = __importDefault(require("./routes/authSimple")); // 新的简化Cookie认证
const users_1 = __importDefault(require("./routes/users"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const folders_1 = __importDefault(require("./routes/folders"));
// import seedRoutes from "./routes/seed"; // 旧架构 - 已禁用
const projects_1 = __importDefault(require("./routes/projects"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const taskFileRoutes_1 = __importDefault(require("./routes/taskFileRoutes"));
// import taskApprovalRoutes from "./routes/taskApprovalRoutes"; // 已整合到 taskRoutes
// import exportRoutes from "./routes/export"; // 旧架构 - 已禁用
// import excelRoutes from "./routes/excel"; // 旧架构 - 已禁用
// import knowledgeGraphRoutes from "./routes/knowledgeGraph"; // 旧架构 - 已禁用
const mineZones_1 = __importDefault(require("./routes/mineZones"));
const gds_1 = __importDefault(require("./routes/gds"));
// import fileUploadRoutes from "./routes/fileUpload"; // 旧架构 - 已禁用
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const quotationRoutes_1 = __importDefault(require("./routes/quotationRoutes"));
const miningInfoRoutes_1 = __importDefault(require("./routes/miningInfoRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const permissionRoutes_1 = __importDefault(require("./routes/permissionRoutes"));
const activities_1 = __importDefault(require("./routes/activities"));
const minerals_1 = __importDefault(require("./routes/minerals"));
const audit_1 = __importDefault(require("./routes/audit"));
/* MIDDLEWARE IMPORTS */
// 移除旧的认证中间件，使用新的Cookie认证
/* CONFIG IMPORTS */
const config_1 = require("./config/config");
const swagger_1 = require("./config/swagger");
const websocketService_1 = require("./services/websocketService");
const http_1 = require("http");
/* CONFIGURATIONS */
dotenv_1.default.config();
// 验证配置
try {
    (0, config_1.validateConfig)();
    (0, config_1.printConfig)();
}
catch (error) {
    console.error("配置验证失败:", error.message);
    process.exit(1);
}
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json({ limit: "10mb" }));
app.use(body_parser_1.default.urlencoded({
    extended: false,
    limit: "10mb",
}));
const parseOrigins = (value) => value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
const rawOrigins = Array.from(new Set([
    ...parseOrigins(process.env.CLIENT_URL),
    ...parseOrigins(process.env.FRONTEND_URL),
    'http://localhost:3000',
    'http://localhost:3006',
    'http://100.104.132.122:3000',
]));
const allowedOrigins = new Set(rawOrigins);
const allowedHostnames = new Set(rawOrigins
    .map((o) => {
    try {
        return new URL(o).hostname;
    }
    catch {
        return null;
    }
})
    .filter(Boolean));
// 始终允许网关域名（忽略端口），避免 NodePort/HTTPS 端口变化导致 CORS 失败
['clientlongi.easytool.page', 'serverlongi.easytool.page'].forEach((h) => allowedHostnames.add(h));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // 允许无origin的请求（如Postman、cURL）
        if (!origin)
            return callback(null, true);
        // 精确匹配 origin
        if (allowedOrigins.has(origin))
            return callback(null, true);
        // 放宽到主机名匹配（忽略端口和协议），便于 30443/8443 切换
        try {
            const hostname = new URL(origin).hostname;
            if (allowedHostnames.has(hostname))
                return callback(null, true);
        }
        catch { }
        console.warn(`❌ CORS拒绝: ${origin}`);
        callback(new Error(`CORS不允许此来源: ${origin}`));
    },
    credentials: true, // 重要：允许发送Cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, cookie_parser_1.default)());
/* DEVELOPMENT MIDDLEWARE */
// 新的Cookie认证系统已启用，无需开发模式自动注入
console.log("✅ Cookie认证系统已启用");
/* SWAGGER API DOCUMENTATION */
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "隆基项目管理API文档",
}));
// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_1.swaggerSpec);
});
/* ROUTES */
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get("/", (req, res) => {
    res.json({
        message: "Longi Project Management API",
        version: "1.0.0",
        status: "running",
        documentation: "/api-docs",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            userSearch: "/api/users/search",
            notifications: "/api/notifications",
            folders: "/api/folders",
            projects: "/api/projects",
            projectQuotations: "/api/projects/:projectId/quotations",
            projectMiningInfo: "/api/projects/:projectId/mining-info",
            tasks: "/api/tasks",
            taskFileUpload: "/api/tasks/:taskId/files (POST)",
            fileManagement: "/api/files",
            comments: "/api/comments",
            stats: "/api/stats",
            mineZones: "/api/mine-zones",
            gds: "/api/gds",
            permissions: "/api/permissions",
            audit: "/api/audit",
        },
    });
});
// API Routes
app.use("/api/auth", authSimple_1.default);
app.use("/api/users", users_1.default);
app.use("/api/notifications", notifications_1.default);
app.use("/api/folders", folders_1.default);
// app.use('/api/seed', seedRoutes);
app.use("/api/stats", statsRoutes_1.default); // 统计路由 (放前面，更具体的路由优先)
app.use("/api", quotationRoutes_1.default); // 报价路由 (使用项目ID作为路径参数)
app.use("/api", miningInfoRoutes_1.default); // 矿业信息路由 (使用项目ID作为路径参数)
app.use("/api/projects", projects_1.default);
app.use("/api/tasks", taskRoutes_1.default);
app.use("/api/comments", commentRoutes_1.default); // 评论路由 (放前面，更具体的路由优先)
app.use("/api/files", fileRoutes_1.default); // 文件管理路由 (放前面，避免被taskFileRoutes覆盖)
app.use("/api", taskFileRoutes_1.default); // Task文件路由 (通用前缀，放后面)
// app.use("/api", taskApprovalRoutes); // 已整合到 taskRoutes
// app.use('/api/export', exportRoutes);
// app.use('/api/excel', excelRoutes);
// app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use("/api/mine-zones", mineZones_1.default);
app.use("/api/gds", gds_1.default);
app.use("/api/teams", teamRoutes_1.default);
app.use("/api/permissions", permissionRoutes_1.default);
app.use("/api/activities", activities_1.default);
app.use("/api/minerals", minerals_1.default);
app.use("/api/audit", audit_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "请求的资源不存在",
    });
});
// Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "服务器内部错误",
    });
});
/* SERVER */
const port = process.env.PORT || 8081;
// 创建HTTP服务器
const httpServer = (0, http_1.createServer)(app);
// 初始化WebSocket
websocketService_1.WebSocketService.initialize(httpServer);
// 启动服务器并初始化 Neo4j 连接
httpServer.listen(port, async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 隆基项目管理系统后端服务启动成功`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 服务地址: http://localhost:${port}`);
    console.log(`📚 API文档: http://localhost:${port}/api-docs`);
    console.log(`📊 Swagger JSON: http://localhost:${port}/api-docs.json`);
    console.log(`🌍 环境: ${config_1.config.isDevelopment ? "开发模式" : "生产模式"}`);
    console.log(`🔌 WebSocket: ws://localhost:${port}/socket.io`);
    console.log(`${"=".repeat(60)}\n`);
    // 初始化 Neo4j 连接
    // try {
    //   await neo4jService.connect();
    //   console.log('✅ Neo4j knowledge graph ready');
    // } catch (error) {
    //   console.error('⚠️ Neo4j connection failed:', error);
    //   console.log('💡 Knowledge graph features will be unavailable');
    // }
});
//# sourceMappingURL=index.js.map