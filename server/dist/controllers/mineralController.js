"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMineralStats = exports.getAllMinerals = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get all unique mineral types from the database
 * Used for autocomplete/suggestions
 */
const getAllMinerals = async (req, res) => {
    try {
        const { search } = req.query;
        // Get minerals from tasks
        const taskMinerals = await prisma.tasks.findMany({
            where: {
                mineral: {
                    not: null,
                },
                ...(search && {
                    mineral: {
                        contains: search,
                        mode: "insensitive",
                    },
                }),
            },
            select: {
                mineral: true,
            },
            distinct: ["mineral"],
        });
        // Get minerals from project mining info
        const miningInfoMinerals = await prisma.project_mining_info.findMany({
            where: {
                mineralType: {
                    not: null,
                },
                ...(search && {
                    mineralType: {
                        contains: search,
                        mode: "insensitive",
                    },
                }),
            },
            select: {
                mineralType: true,
            },
            distinct: ["mineralType"],
        });
        // Combine and deduplicate
        const allMinerals = new Set();
        taskMinerals.forEach((t) => {
            if (t.mineral)
                allMinerals.add(t.mineral);
        });
        miningInfoMinerals.forEach((m) => {
            if (m.mineralType)
                allMinerals.add(m.mineralType);
        });
        // Convert to sorted array
        const minerals = Array.from(allMinerals).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        res.json({
            success: true,
            message: `Found ${minerals.length} unique minerals`,
            data: minerals,
        });
    }
    catch (error) {
        console.error("❌ Get minerals failed:", error);
        res.status(500).json({
            success: false,
            message: `Get minerals failed: ${error.message}`,
        });
    }
};
exports.getAllMinerals = getAllMinerals;
/**
 * Get mineral statistics
 */
const getMineralStats = async (req, res) => {
    try {
        // Count tasks by mineral
        const taskStats = await prisma.tasks.groupBy({
            by: ["mineral"],
            where: {
                mineral: {
                    not: null,
                },
            },
            _count: {
                mineral: true,
            },
        });
        const stats = taskStats.map((stat) => ({
            mineral: stat.mineral,
            count: stat._count.mineral,
        }));
        res.json({
            success: true,
            message: "Mineral statistics retrieved successfully",
            data: stats,
        });
    }
    catch (error) {
        console.error("❌ Get mineral stats failed:", error);
        res.status(500).json({
            success: false,
            message: `Get mineral stats failed: ${error.message}`,
        });
    }
};
exports.getMineralStats = getMineralStats;
//# sourceMappingURL=mineralController.js.map