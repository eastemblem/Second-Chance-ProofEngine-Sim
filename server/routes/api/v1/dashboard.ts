import express from "express";
import { requireAuth } from "../../../middleware/validation";
import dashboardRoutes from "../../dashboard";

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(requireAuth);

// Use existing dashboard routes with v1 prefix
router.use('/', dashboardRoutes);

export default router;