import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

// 全局 BigInt 序列化支持
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

/* ROUTE IMPORTS */
import authRoutes from "./routes/authSimple"; // 新的简化Cookie认证
import userRoutes from "./routes/users";
import notificationRoutes from "./routes/notifications";
import folderRoutes from "./routes/folders";
// import seedRoutes from "./routes/seed"; // 旧架构 - 已禁用
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/taskRoutes";
import taskFileRoutes from "./routes/taskFileRoutes";
// import taskApprovalRoutes from "./routes/taskApprovalRoutes"; // 已整合到 taskRoutes
// import exportRoutes from "./routes/export"; // 旧架构 - 已禁用
// import excelRoutes from "./routes/excel"; // 旧架构 - 已禁用
// import knowledgeGraphRoutes from "./routes/knowledgeGraph"; // 旧架构 - 已禁用
import mineZoneRoutes from "./routes/mineZones";
import gdsRoutes from "./routes/gds";
// import fileUploadRoutes from "./routes/fileUpload"; // 旧架构 - 已禁用
import commentRoutes from "./routes/commentRoutes";
import fileRoutes from "./routes/fileRoutes";
import quotationRoutes from "./routes/quotationRoutes";
import miningInfoRoutes from "./routes/miningInfoRoutes";
import statsRoutes from "./routes/statsRoutes";
import teamRoutes from "./routes/teamRoutes";
import permissionRoutes from "./routes/permissionRoutes";
import activityRoutes from "./routes/activities";
import mineralRoutes from "./routes/minerals";
import auditRoutes from "./routes/audit";

/* MIDDLEWARE IMPORTS */
// 移除旧的认证中间件，使用新的Cookie认证

/* CONFIG IMPORTS */
import { config, validateConfig, printConfig } from "./config/config";
import { swaggerSpec } from "./config/swagger";

/* SERVICES */
import { neo4jService } from "./utils/neo4j";
import { WebSocketService } from "./services/websocketService";
import { createServer } from "http";

/* CONFIGURATIONS */
dotenv.config();

// 验证配置
try {
  validateConfig();
  printConfig();
} catch (error: any) {
  console.error("配置验证失败:", error.message);
  process.exit(1);
}

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use(helmet());

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(morgan("common"));

app.use(bodyParser.json({ limit: "10mb" }));

app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "10mb",
  })
);

const parseOrigins = (value?: string) =>
  value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

const rawOrigins = Array.from(
  new Set([
    ...parseOrigins(process.env.CLIENT_URL),
    ...parseOrigins(process.env.FRONTEND_URL),
    'http://localhost:3000',
    'http://localhost:3006',
    'http://100.104.132.122:3000',
  ])
);

const allowedOrigins = new Set(rawOrigins);
const allowedHostnames = new Set(
  rawOrigins
    .map((o) => {
      try {
        return new URL(o).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as string[]
);

// 始终允许网关域名（忽略端口），避免 NodePort/HTTPS 端口变化导致 CORS 失败
['clientlongi.easytool.page', 'serverlongi.easytool.page'].forEach((h) => allowedHostnames.add(h));

app.use(
  cors({
    origin: (origin, callback) => {
      // 允许无origin的请求（如Postman、cURL）
      if (!origin) return callback(null, true);

      // 精确匹配 origin
      if (allowedOrigins.has(origin)) return callback(null, true);

      // 放宽到主机名匹配（忽略端口和协议），便于 30443/8443 切换
      try {
        const hostname = new URL(origin).hostname;
        if (allowedHostnames.has(hostname)) return callback(null, true);
      } catch {}

      console.warn(`❌ CORS拒绝: ${origin}`);
      callback(new Error(`CORS不允许此来源: ${origin}`));
    },
    credentials: true, // 重要：允许发送Cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());

/* DEVELOPMENT MIDDLEWARE */
// 新的Cookie认证系统已启用，无需开发模式自动注入
console.log("✅ Cookie认证系统已启用");

/* SWAGGER API DOCUMENTATION */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "隆基项目管理API文档",
  })
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

/* ROUTES */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/folders", folderRoutes);
// app.use('/api/seed', seedRoutes);
app.use("/api/stats", statsRoutes); // 统计路由 (放前面，更具体的路由优先)
app.use("/api", quotationRoutes); // 报价路由 (使用项目ID作为路径参数)
app.use("/api", miningInfoRoutes); // 矿业信息路由 (使用项目ID作为路径参数)
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes); // 评论路由 (放前面，更具体的路由优先)
app.use("/api/files", fileRoutes); // 文件管理路由 (放前面，避免被taskFileRoutes覆盖)
app.use("/api", taskFileRoutes); // Task文件路由 (通用前缀，放后面)
// app.use("/api", taskApprovalRoutes); // 已整合到 taskRoutes
// app.use('/api/export', exportRoutes);
// app.use('/api/excel', excelRoutes);
// app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use("/api/mine-zones", mineZoneRoutes);
app.use("/api/gds", gdsRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/minerals", mineralRoutes);
app.use("/api/audit", auditRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "请求的资源不存在",
  });
});

// Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "服务器内部错误",
    });
  }
);

/* SERVER */

const port = process.env.PORT || 8081;

// 创建HTTP服务器
const httpServer = createServer(app);

// 初始化WebSocket
WebSocketService.initialize(httpServer);

// 启动服务器并初始化 Neo4j 连接
httpServer.listen(port, async () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 隆基项目管理系统后端服务启动成功`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📍 服务地址: http://localhost:${port}`);
  console.log(`📚 API文档: http://localhost:${port}/api-docs`);
  console.log(`📊 Swagger JSON: http://localhost:${port}/api-docs.json`);
  console.log(`🌍 环境: ${config.isDevelopment ? "开发模式" : "生产模式"}`);
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
