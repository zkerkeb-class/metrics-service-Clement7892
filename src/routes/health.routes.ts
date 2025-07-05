import { Router } from "express";
import healthController from "../controllers/health.controller";

const router = Router();

// Vérifier l'état de tous les services
router.get("/all", healthController.checkAllServices);

router.get("/service/:serviceName", healthController.checkServiceHealth);

router.post("/test-notification", healthController.sendTestNotification);

router.post("/monitoring", healthController.toggleMonitoring);

export default router;
