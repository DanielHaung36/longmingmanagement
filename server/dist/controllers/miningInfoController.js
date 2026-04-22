"use strict";
/**
 * MiningInfoController - 矿业信息控制器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiningInfoController = void 0;
const client_1 = require("@prisma/client");
const responseBuilder_1 = require("../utils/responseBuilder");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class MiningInfoController {
    /**
     * 获取项目的矿业信息
     * GET /api/projects/:projectId/mining-info
     */
    static async getMiningInfo(req, res) {
        try {
            const { projectId } = req.params;
            const miningInfo = await prisma.project_mining_info.findUnique({
                where: { projectId: parseInt(projectId) },
                include: {
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            projectCode: true,
                        },
                    },
                },
            });
            if (!miningInfo) {
                res.status(404).json(responseBuilder_1.ResponseBuilder.notFound('Mining Info'));
                return;
            }
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(miningInfo, '获取矿业信息成功'));
        }
        catch (error) {
            logger_1.logger.error('获取矿业信息失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, 'MINING_INFO_FETCH_FAILED'));
        }
    }
    /**
     * 更新或创建矿业信息
     * PUT /api/projects/:projectId/mining-info
     */
    static async upsertMiningInfo(req, res) {
        try {
            const { projectId } = req.params;
            const { mineralType, estimatedTonnage, grade, contactPerson, contactEmail, } = req.body;
            // 检查项目是否存在
            const project = await prisma.projects.findUnique({
                where: { id: parseInt(projectId) },
            });
            if (!project) {
                res.status(404).json(responseBuilder_1.ResponseBuilder.notFound('Project'));
                return;
            }
            // 使用 upsert 创建或更新
            const miningInfo = await prisma.project_mining_info.upsert({
                where: { projectId: parseInt(projectId) },
                update: {
                    mineralType,
                    estimatedTonnage: estimatedTonnage ? parseFloat(estimatedTonnage) : undefined,
                    grade,
                    contactPerson,
                    contactEmail,
                },
                create: {
                    projectId: parseInt(projectId),
                    mineralType,
                    estimatedTonnage: estimatedTonnage ? parseFloat(estimatedTonnage) : undefined,
                    grade,
                    contactPerson,
                    contactEmail,
                },
                include: {
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            projectCode: true,
                        },
                    },
                },
            });
            res.status(200).json(responseBuilder_1.ResponseBuilder.success(miningInfo, '矿业信息更新成功'));
        }
        catch (error) {
            logger_1.logger.error('更新矿业信息失败', { error: error.message });
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, 'MINING_INFO_UPDATE_FAILED'));
        }
    }
    /**
     * 删除矿业信息
     * DELETE /api/projects/:projectId/mining-info
     */
    static async deleteMiningInfo(req, res) {
        try {
            const { projectId } = req.params;
            await prisma.project_mining_info.delete({
                where: { projectId: parseInt(projectId) },
            });
            res.status(200).json(responseBuilder_1.ResponseBuilder.deleted('矿业信息删除成功'));
        }
        catch (error) {
            logger_1.logger.error('删除矿业信息失败', { error: error.message });
            if (error.code === 'P2025') {
                res.status(404).json(responseBuilder_1.ResponseBuilder.notFound('Mining Info'));
                return;
            }
            res.status(500).json(responseBuilder_1.ResponseBuilder.error(error.message, 'MINING_INFO_DELETE_FAILED'));
        }
    }
}
exports.MiningInfoController = MiningInfoController;
//# sourceMappingURL=miningInfoController.js.map