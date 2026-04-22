"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mineralController_1 = require("../controllers/mineralController");
const cookieAuth_1 = require("../middleware/cookieAuth");
const router = express_1.default.Router();
// Apply authentication to all routes
router.use(cookieAuth_1.cookieAuth);
// Get all unique minerals (for autocomplete)
router.get("/", mineralController_1.getAllMinerals);
// Get mineral statistics
router.get("/stats", mineralController_1.getMineralStats);
exports.default = router;
//# sourceMappingURL=minerals.js.map