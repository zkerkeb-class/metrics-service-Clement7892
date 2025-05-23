import { Router } from "express";
import healthRoutes from "./health.routes";

const router = Router();

// Routes de santé
router.use("/health", healthRoutes);
// Routes de notification


export default router;
