import { Router } from "express";
import healthRoutes from "./health.routes";
import metricsRoutes from "./metrics.routes";

const router = Router();

// Routes de santé
router.use("/health", healthRoutes);

// Routes de métriques
router.use("/metrics", metricsRoutes);

export default router;
