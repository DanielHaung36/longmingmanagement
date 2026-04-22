import express from "express";
import { getAllMinerals, getMineralStats } from "../controllers/mineralController";
import { cookieAuth } from "../middleware/cookieAuth";

const router = express.Router();

// Apply authentication to all routes
router.use(cookieAuth);

// Get all unique minerals (for autocomplete)
router.get("/", getAllMinerals);

// Get mineral statistics
router.get("/stats", getMineralStats);

export default router;
