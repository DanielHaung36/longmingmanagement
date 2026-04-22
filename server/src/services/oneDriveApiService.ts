/**
 * OneDrive API 服务
 *
 * 使用 Microsoft Graph API 操作 OneDrive 云端文件夹
 * 解决本地删除后被 OneDrive 客户端从云端恢复的问题
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../utils/logger';
import https from 'https';
import querystring from 'querystring';

/**
 * 自定义 Auth Provider — 绕过 @azure/identity（需要 Node>=20）的限制
 * 使用 https 模块直接请求 Azure AD token endpoint
 */
class ManualClientCredentialProvider {
  private tenantId: string;
  private clientId: string;
  private clientSecret: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(tenantId: string, clientId: string, clientSecret: string) {
    this.tenantId = tenantId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getAccessToken(): Promise<string> {
    // 如果 token 还有 5 分钟以上有效期，直接用缓存
    if (this.cachedToken && Date.now() < this.tokenExpiry - 300_000) {
      return this.cachedToken;
    }

    const postData = querystring.stringify({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const token = await new Promise<string>((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'login.microsoftonline.com',
          path: `/${this.tenantId}/oauth2/v2.0/token`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (json.access_token) {
                this.tokenExpiry = Date.now() + (json.expires_in || 3600) * 1000;
                resolve(json.access_token);
              } else {
                reject(new Error(`Token error: ${json.error_description || json.error || data}`));
              }
            } catch (e) {
              reject(new Error(`Failed to parse token response: ${data.substring(0, 200)}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    this.cachedToken = token;
    return token;
  }
}

export class OneDriveApiService {
  private static client: Client | null = null;
  private static initialized = false;
  private static drivePrefix = ''; // e.g. "/sites/{siteId}/drive" or "/drives/{driveId}"

  // Azure AD 配置（从环境变量读取）
  private static TENANT_ID = process.env.AZURE_TENANT_ID || '';
  private static CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
  private static CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';

  // SharePoint 配置（优先）
  private static SHAREPOINT_SITE_HOSTNAME = process.env.SHAREPOINT_SITE_HOSTNAME || 'longimagnetaustraliaptyltd.sharepoint.com';
  private static SHAREPOINT_SITE_PATH = process.env.SHAREPOINT_SITE_PATH || '/sites/LongiAustralia';

  // OneDrive 根路径（相对于 OneDrive 根目录）
  private static ONEDRIVE_BASE_PATH = process.env.ONEDRIVE_BASE_PATH || '03 Project Management';

  /**
   * 构建 API 路径（统一使用 SharePoint 站点文档库）
   */
  private static buildItemPath(graphPath: string, suffix?: string): string {
    const s = suffix ? `:${suffix}` : '';
    return `${this.drivePrefix}/root:${graphPath}${s}`;
  }

  /**
   * 构建根级 children API 路径
   */
  private static buildRootChildrenPath(): string {
    return `${this.drivePrefix}/root/children`;
  }

  /**
   * 初始化 Graph Client
   * 使用自定义 Auth Provider 而非 @azure/identity（后者需要 Node >= 20）
   * 自动发现 SharePoint 站点 drive
   */
  private static async initialize(): Promise<boolean> {
    if (this.initialized && this.client) {
      return true;
    }

    // 检查必要的环境变量
    if (!this.TENANT_ID || !this.CLIENT_ID || !this.CLIENT_SECRET) {
      logger.warn('OneDrive API 未配置：缺少 Azure AD 凭据', {
        hasTenantId: !!this.TENANT_ID,
        hasClientId: !!this.CLIENT_ID,
        hasClientSecret: !!this.CLIENT_SECRET,
      });
      return false;
    }

    try {
      const tokenProvider = new ManualClientCredentialProvider(
        this.TENANT_ID,
        this.CLIENT_ID,
        this.CLIENT_SECRET,
      );

      // 验证 token 获取
      await tokenProvider.getAccessToken();

      // 创建 Graph Client（使用自定义 authProvider）
      this.client = Client.init({
        authProvider: async (done) => {
          try {
            const token = await tokenProvider.getAccessToken();
            done(null, token);
          } catch (err) {
            done(err as Error, null);
          }
        },
      });

      // 自动发现 SharePoint 站点并设置 drive 前缀
      try {
        const site = await this.client
          .api(`/sites/${this.SHAREPOINT_SITE_HOSTNAME}:${this.SHAREPOINT_SITE_PATH}`)
          .select('id')
          .get();
        this.drivePrefix = `/sites/${site.id}/drive`;
        logger.info('SharePoint 站点已发现', { siteId: site.id });
      } catch (siteError: any) {
        logger.error('SharePoint 站点发现失败，将无法访问文件', {
          hostname: this.SHAREPOINT_SITE_HOSTNAME,
          path: this.SHAREPOINT_SITE_PATH,
          error: siteError.message,
        });
        return false;
      }

      this.initialized = true;
      logger.info('OneDrive API 初始化成功（SharePoint 站点文档库）');
      return true;
    } catch (error: any) {
      logger.error('OneDrive API 初始化失败', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * 检查 OneDrive API 是否可用
   */
  static async isAvailable(): Promise<boolean> {
    return await this.initialize();
  }

  /**
   * 将路径转换为 Graph API 路径
   *
   * 支持两种输入格式：
   * 1. 旧格式（DB 遗留数据）: /mnt/onedrive/03 Project Management/Client/...
   *    → strip 挂载前缀 → /03 Project Management/Client/...
   * 2. 新格式（逻辑路径）: 03 Project Management/Client/...
   *    → 直接加 / 前缀 → /03 Project Management/Client/...
   */
  private static convertToGraphPath(localPath: string): string {
    // 仅移除旧的本地挂载前缀（向后兼容未迁移的 DB 数据）
    const mountPrefixes = [
      '/mnt/onedrive/',
      '/mnt/longi-storage/onedrive/',
    ];

    let relativePath = localPath;
    for (const prefix of mountPrefixes) {
      if (relativePath.startsWith(prefix)) {
        relativePath = relativePath.substring(prefix.length);
        break;
      }
    }

    // 替换反斜杠
    relativePath = relativePath.replace(/\\/g, '/');

    // 确保路径以 / 开头
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }

    return relativePath;
  }

  /**
   * 删除 OneDrive 云端文件夹
   *
   * @param localPath 本地 OneDrive 路径
   * @returns 删除结果
   */
  static async deleteFolder(localPath: string): Promise<{
    success: boolean;
    error?: string;
    skipped?: boolean;
  }> {
    try {
      // 1. 初始化客户端
      if (!await this.initialize()) {
        logger.info('OneDrive API 未配置，跳过云端删除', { localPath });
        return { success: true, skipped: true };
      }

      if (!this.client) {
        return { success: false, error: 'Graph Client 未初始化' };
      }

      // 2. 转换路径
      const graphPath = this.convertToGraphPath(localPath);
      logger.info('准备删除 OneDrive 云端文件夹', {
        localPath,
        graphPath,
      });

      // 3. 构建 API 路径
      const apiPath = this.buildItemPath(graphPath);

      // 4. 先检查文件夹是否存在
      try {
        await this.client.api(apiPath).get();
      } catch (checkError: any) {
        if (checkError.statusCode === 404) {
          logger.info('OneDrive 云端文件夹不存在，无需删除', { graphPath });
          return { success: true };
        }
        throw checkError;
      }

      // 5. 删除文件夹
      await this.client.api(apiPath).delete();

      logger.info('OneDrive 云端文件夹删除成功', {
        localPath,
        graphPath,
      });

      return { success: true };
    } catch (error: any) {
      logger.error('OneDrive 云端文件夹删除失败', {
        localPath,
        error: error.message,
        statusCode: error.statusCode,
        code: error.code,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建 OneDrive 云端文件夹
   *
   * @param localPath 本地 OneDrive 路径
   * @returns 创建结果
   */
  static async createFolder(localPath: string): Promise<{
    success: boolean;
    error?: string;
    skipped?: boolean;
  }> {
    try {
      if (!await this.initialize()) {
        logger.info('OneDrive API 未配置，跳过云端创建', { localPath });
        return { success: true, skipped: true };
      }

      if (!this.client) {
        return { success: false, error: 'Graph Client 未初始化' };
      }

      const graphPath = this.convertToGraphPath(localPath);
      const pathParts = graphPath.split('/').filter(p => p);
      const folderName = pathParts.pop() || '';
      const parentPath = '/' + pathParts.join('/');

      logger.info('准备创建 OneDrive 云端文件夹', {
        localPath,
        graphPath,
        parentPath,
        folderName,
      });

      const apiPath = this.buildItemPath(parentPath, '/children');

      // 创建文件夹
      await this.client.api(apiPath).post({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail', // 如果存在则失败
      });

      logger.info('OneDrive 云端文件夹创建成功', { graphPath });
      return { success: true };
    } catch (error: any) {
      // 如果文件夹已存在，视为成功
      if (error.statusCode === 409) {
        logger.info('OneDrive 云端文件夹已存在', { localPath });
        return { success: true };
      }

      logger.error('OneDrive 云端文件夹创建失败', {
        localPath,
        error: error.message,
        statusCode: error.statusCode,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 重命名 OneDrive 云端文件夹
   *
   * @param oldPath 旧路径
   * @param newName 新文件夹名
   * @returns 重命名结果
   */
  static async renameFolder(oldPath: string, newName: string): Promise<{
    success: boolean;
    error?: string;
    skipped?: boolean;
  }> {
    try {
      if (!await this.initialize()) {
        return { success: true, skipped: true };
      }

      if (!this.client) {
        return { success: false, error: 'Graph Client 未初始化' };
      }

      const graphPath = this.convertToGraphPath(oldPath);
      const apiPath = this.buildItemPath(graphPath);

      // 更新文件夹名称
      await this.client.api(apiPath).patch({
        name: newName,
      });

      logger.info('OneDrive 云端文件夹重命名成功', {
        oldPath,
        newName,
      });

      return { success: true };
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.info('OneDrive 云端文件夹不存在，跳过重命名', { oldPath });
        return { success: true };
      }

      logger.error('OneDrive 云端文件夹重命名失败', {
        oldPath,
        newName,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 下载 OneDrive 文件为 Buffer
   *
   * @param filePath OneDrive 路径（可以是本地挂载路径或相对路径）
   * @returns 文件内容 Buffer，如果失败返回 null
   */
  static async downloadFileAsBuffer(filePath: string): Promise<Buffer | null> {
    try {
      if (!await this.initialize() || !this.client) {
        logger.warn('OneDrive API 未配置，无法下载文件', { filePath });
        return null;
      }

      const graphPath = this.convertToGraphPath(filePath);
      const apiPath = this.buildItemPath(graphPath, '/content');

      logger.debug('下载 OneDrive 文件', { filePath, graphPath });

      const response = await this.client.api(apiPath).getStream();

      // 将 ReadableStream 转换为 Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      logger.info('OneDrive 文件下载成功', { filePath, size: buffer.length });
      return buffer;
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.info('OneDrive 文件不存在', { filePath });
        return null;
      }
      logger.error('OneDrive 文件下载失败', {
        filePath,
        error: error.message,
        statusCode: error.statusCode,
      });
      return null;
    }
  }

  /**
   * 上传文件到 OneDrive（支持小文件直传和大文件分片上传）
   *
   * @param filePath OneDrive 路径
   * @param content 文件内容 Buffer
   * @returns 上传结果
   */
  static async uploadFile(filePath: string, content: Buffer): Promise<{
    success: boolean;
    error?: string;
    skipped?: boolean;
  }> {
    try {
      if (!await this.initialize() || !this.client) {
        logger.info('OneDrive API 未配置，跳过上传', { filePath });
        return { success: true, skipped: true };
      }

      const graphPath = this.convertToGraphPath(filePath);
      const apiPath = this.buildItemPath(graphPath, '/content');

      logger.debug('上传文件到 OneDrive', { filePath, graphPath, size: content.length });

      // 小文件（<4MB）直接 PUT，大文件使用上传会话
      if (content.length < 4 * 1024 * 1024) {
        await this.client.api(apiPath).put(content);
      } else {
        // 大文件：创建上传会话
        const sessionApiPath = this.buildItemPath(graphPath, '/createUploadSession');

        const session = await this.client.api(sessionApiPath).post({
          item: { '@microsoft.graph.conflictBehavior': 'replace' },
        });

        const uploadUrl = session.uploadUrl;
        const chunkSize = 10 * 1024 * 1024; // 10MB chunks
        let offset = 0;

        while (offset < content.length) {
          const end = Math.min(offset + chunkSize, content.length);
          const chunk = content.subarray(offset, end);

          const headers: Record<string, string> = {
            'Content-Length': `${chunk.length}`,
            'Content-Range': `bytes ${offset}-${end - 1}/${content.length}`,
          };

          // Use fetch for upload session (not Graph client)
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers,
            body: new Uint8Array(chunk),
          });

          if (!response.ok && response.status !== 202) {
            throw new Error(`Upload chunk failed: ${response.status} ${response.statusText}`);
          }

          offset = end;
        }
      }

      logger.info('OneDrive 文件上传成功', { filePath, size: content.length });
      return { success: true };
    } catch (error: any) {
      logger.error('OneDrive 文件上传失败', {
        filePath,
        error: error.message,
        statusCode: error.statusCode,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 列出 OneDrive 文件夹的子项
   *
   * @param folderPath OneDrive 文件夹路径
   * @returns 子项数组（名称、类型、大小、修改时间）
   */
  static async listChildren(folderPath: string): Promise<{
    name: string;
    type: 'file' | 'folder';
    size: number;
    lastModifiedDateTime: string;
  }[]> {
    try {
      if (!await this.initialize() || !this.client) {
        return [];
      }

      const graphPath = this.convertToGraphPath(folderPath);
      const apiPath = this.buildItemPath(graphPath, '/children');

      const result = await this.client.api(apiPath)
        .select('name,size,lastModifiedDateTime,folder,file')
        .top(1000)
        .get();

      const items = (result.value || []).map((item: any) => ({
        name: item.name,
        type: item.folder ? 'folder' as const : 'file' as const,
        size: item.size || 0,
        lastModifiedDateTime: item.lastModifiedDateTime,
      }));

      logger.debug('OneDrive listChildren 成功', { folderPath, count: items.length });
      return items;
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.info('OneDrive 文件夹不存在', { folderPath });
        return [];
      }
      logger.error('OneDrive listChildren 失败', {
        folderPath,
        error: error.message,
        statusCode: error.statusCode,
      });
      return [];
    }
  }

  /**
   * 递归确保 OneDrive 文件夹路径存在（类似 fs.ensureDir）
   *
   * @param folderPath 完整文件夹路径
   */
  static async ensureFolder(folderPath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!await this.initialize() || !this.client) {
        return { success: true }; // 未配置则跳过
      }

      const graphPath = this.convertToGraphPath(folderPath);
      const segments = graphPath.split('/').filter(s => s);

      // 逐级创建文件夹
      let currentPath = '';
      for (const segment of segments) {
        const parentPath = currentPath || '/';
        currentPath = currentPath + '/' + segment;

        const apiPath = parentPath === '/'
          ? this.buildRootChildrenPath()
          : this.buildItemPath(parentPath, '/children');

        try {
          await this.client!.api(apiPath).post({
            name: segment,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail',
          });
        } catch (e: any) {
          if (e.statusCode !== 409) {
            // 409 = 已存在，忽略
            throw e;
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      logger.error('OneDrive ensureFolder 失败', {
        folderPath,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 移动/重命名 OneDrive 文件或文件夹
   *
   * @param itemPath 当前路径
   * @param newParentPath 新父文件夹路径（null 表示不移动）
   * @param newName 新名称（null 表示不重命名）
   */
  static async moveItem(
    itemPath: string,
    newParentPath: string | null,
    newName: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.initialize() || !this.client) {
        return { success: true };
      }

      const graphPath = this.convertToGraphPath(itemPath);
      const apiPath = this.buildItemPath(graphPath);

      const patchBody: any = {};
      if (newName) {
        patchBody.name = newName;
      }
      if (newParentPath) {
        const parentGraphPath = this.convertToGraphPath(newParentPath);
        patchBody.parentReference = {
          path: `${this.drivePrefix}/root:${parentGraphPath}`,
        };
      }

      await this.client.api(apiPath).patch(patchBody);

      logger.info('OneDrive moveItem 成功', { itemPath, newParentPath, newName });
      return { success: true };
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.info('OneDrive 项不存在，跳过移动', { itemPath });
        return { success: true };
      }
      logger.error('OneDrive moveItem 失败', {
        itemPath,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除 OneDrive 文件或文件夹
   */
  static async deleteItem(itemPath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return await this.deleteFolder(itemPath);
  }

  /**
   * 检查 OneDrive 云端文件夹是否存在
   */
  static async folderExists(localPath: string): Promise<boolean> {
    try {
      if (!await this.initialize() || !this.client) {
        return false;
      }

      const graphPath = this.convertToGraphPath(localPath);
      const apiPath = this.buildItemPath(graphPath);

      await this.client.api(apiPath).get();
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      logger.error('检查 OneDrive 文件夹存在性失败', { localPath, error: error.message });
      return false;
    }
  }

  /**
   * 创建 OneDrive 分享链接
   * @param filePath OneDrive 逻辑路径
   * @returns 分享链接 URL，失败返回 null
   */
  static async createShareLink(filePath: string): Promise<string | null> {
    try {
      if (!await this.initialize() || !this.client) {
        logger.warn('OneDrive API 未配置，无法创建分享链接', { filePath });
        return null;
      }

      const graphPath = this.convertToGraphPath(filePath);
      const apiPath = this.buildItemPath(graphPath, '/createLink');

      const result = await this.client.api(apiPath).post({
        type: 'view',
        scope: 'organization',
      });

      const url = result?.link?.webUrl ?? null;
      logger.info('OneDrive 分享链接创建成功', { filePath, url });
      return url;
    } catch (error: any) {
      logger.error('创建 OneDrive 分享链接失败', { filePath, error: error.message });
      return null;
    }
  }
}
