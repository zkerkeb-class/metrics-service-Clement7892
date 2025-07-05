import { Router } from "express";
import metricsController from "../controllers/metrics.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

// Routes pour récupérer les métriques
router.get("/realtime", authenticateJWT, metricsController.getRealTimeMetrics);
router.get("/last-hour", authenticateJWT, metricsController.getLastHourMetrics);
router.get(
  "/last-24-hours",
  authenticateJWT,
  metricsController.getLast24HoursMetrics
);
router.get(
  "/custom",
  authenticateJWT,
  metricsController.getCustomPeriodMetrics
);

// Routes pour les distributions et analyses
router.get(
  "/distribution/requests",
  authenticateJWT,
  metricsController.getRequestDistribution
);
router.get(
  "/distribution/status",
  authenticateJWT,
  metricsController.getStatusDistribution
);
router.get(
  "/performance/endpoints",
  authenticateJWT,
  metricsController.getEndpointPerformance
);

// Routes pour enregistrer des métriques (pour l'intégration avec d'autres services)
router.post(
  "/record/request",
  authenticateJWT,
  metricsController.recordRequestMetric
);
router.post(
  "/record/mongo",
  authenticateJWT,
  metricsController.recordMongoMetric
);
router.post(
  "/record/bandwidth",
  authenticateJWT,
  metricsController.recordBandwidthMetric
);

export default router;
