import { Request, Response } from "express";
import metricsService from "../services/metrics.service";
import { logger } from "../utils/logger";

class MetricsController {
  /**
   * Obtient les métriques en temps réel (dernières 5 minutes)
   */
  async getRealTimeMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const metrics = metricsService.getRealTimeMetrics();

      return res.status(200).json({
        success: true,
        data: {
          ...metrics,
          timestamp: new Date().toISOString(),
          period: "realtime"
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des métriques temps réel:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Obtient les métriques de la dernière heure
   */
  async getLastHourMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const metrics = metricsService.getLastHourMetrics();

      return res.status(200).json({
        success: true,
        data: {
          ...metrics,
          timestamp: new Date().toISOString(),
          period: "lastHour"
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des métriques de la dernière heure:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Obtient les métriques des dernières 24 heures
   */
  async getLast24HoursMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const metrics = metricsService.getLast24HoursMetrics();

      return res.status(200).json({
        success: true,
        data: {
          ...metrics,
          timestamp: new Date().toISOString(),
          period: "last24Hours"
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des métriques des dernières 24h:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Obtient les métriques pour une période personnalisée
   */
  async getCustomPeriodMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          success: false,
          message:
            "Les paramètres 'start' et 'end' sont requis (format ISO 8601)"
        });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Format de date invalide. Utilisez le format ISO 8601"
        });
      }

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: "La date de début doit être antérieure à la date de fin"
        });
      }

      const metrics = metricsService.getMetrics({
        start: startDate,
        end: endDate
      });

      return res.status(200).json({
        success: true,
        data: {
          ...metrics,
          timestamp: new Date().toISOString(),
          period: "custom",
          timeRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des métriques personnalisées:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Obtient la distribution des requêtes par endpoint
   */
  async getRequestDistribution(req: Request, res: Response): Promise<Response> {
    try {
      const { period = "last24Hours" } = req.query;
      let timeRange: { start: Date; end: Date };

      switch (period) {
        case "realtime":
          timeRange = {
            start: new Date(Date.now() - 5 * 60 * 1000),
            end: new Date()
          };
          break;
        case "lastHour":
          timeRange = {
            start: new Date(Date.now() - 60 * 60 * 1000),
            end: new Date()
          };
          break;
        case "last24Hours":
        default:
          timeRange = {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          };
          break;
      }

      const distribution = metricsService.getRequestDistribution(timeRange);

      return res.status(200).json({
        success: true,
        data: {
          distribution,
          timestamp: new Date().toISOString(),
          period: period as string,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          }
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération de la distribution des requêtes:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Obtient la distribution des codes de statut
   */
  async getStatusDistribution(req: Request, res: Response): Promise<Response> {
    try {
      const { period = "last24Hours" } = req.query;
      let timeRange: { start: Date; end: Date };

      switch (period) {
        case "realtime":
          timeRange = {
            start: new Date(Date.now() - 5 * 60 * 1000),
            end: new Date()
          };
          break;
        case "lastHour":
          timeRange = {
            start: new Date(Date.now() - 60 * 60 * 1000),
            end: new Date()
          };
          break;
        case "last24Hours":
        default:
          timeRange = {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          };
          break;
      }

      const distribution = metricsService.getStatusDistribution(timeRange);

      return res.status(200).json({
        success: true,
        data: {
          distribution,
          timestamp: new Date().toISOString(),
          period: period as string,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          }
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération de la distribution des statuts:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Obtient les performances par endpoint
   */
  async getEndpointPerformance(req: Request, res: Response): Promise<Response> {
    try {
      const { period = "last24Hours" } = req.query;
      let timeRange: { start: Date; end: Date };

      switch (period) {
        case "realtime":
          timeRange = {
            start: new Date(Date.now() - 5 * 60 * 1000),
            end: new Date()
          };
          break;
        case "lastHour":
          timeRange = {
            start: new Date(Date.now() - 60 * 60 * 1000),
            end: new Date()
          };
          break;
        case "last24Hours":
        default:
          timeRange = {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          };
          break;
      }

      const performance = metricsService.getEndpointPerformance(timeRange);

      return res.status(200).json({
        success: true,
        data: {
          performance,
          timestamp: new Date().toISOString(),
          period: period as string,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          }
        }
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des performances par endpoint:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Enregistre une métrique de requête (pour les tests ou l'intégration)
   */
  async recordRequestMetric(req: Request, res: Response): Promise<Response> {
    try {
      const {
        method,
        path,
        statusCode,
        duration,
        responseSize,
        userAgent,
        ip
      } = req.body;

      if (!method || !path || !statusCode || duration === undefined) {
        return res.status(400).json({
          success: false,
          message: "Les champs method, path, statusCode et duration sont requis"
        });
      }

      metricsService.recordRequest({
        method,
        path,
        statusCode,
        duration,
        responseSize: responseSize || 0,
        userAgent,
        ip
      });

      return res.status(200).json({
        success: true,
        message: "Métrique de requête enregistrée avec succès"
      });
    } catch (error) {
      logger.error(
        "Erreur lors de l'enregistrement de la métrique de requête:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Enregistre une métrique MongoDB (pour les tests ou l'intégration)
   */
  async recordMongoMetric(req: Request, res: Response): Promise<Response> {
    try {
      const { operation, collection, duration, success, error } = req.body;

      if (
        !operation ||
        !collection ||
        duration === undefined ||
        success === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Les champs operation, collection, duration et success sont requis"
        });
      }

      metricsService.recordMongoOperation({
        operation,
        collection,
        duration,
        success,
        error
      });

      return res.status(200).json({
        success: true,
        message: "Métrique MongoDB enregistrée avec succès"
      });
    } catch (error) {
      logger.error(
        "Erreur lors de l'enregistrement de la métrique MongoDB:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Enregistre une métrique de bande passante (pour les tests ou l'intégration)
   */
  async recordBandwidthMetric(req: Request, res: Response): Promise<Response> {
    try {
      const { bytesIn, bytesOut, requestsPerSecond } = req.body;

      if (
        bytesIn === undefined ||
        bytesOut === undefined ||
        requestsPerSecond === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Les champs bytesIn, bytesOut et requestsPerSecond sont requis"
        });
      }

      metricsService.recordBandwidth({
        bytesIn,
        bytesOut,
        requestsPerSecond
      });

      return res.status(200).json({
        success: true,
        message: "Métrique de bande passante enregistrée avec succès"
      });
    } catch (error) {
      logger.error(
        "Erreur lors de l'enregistrement de la métrique de bande passante:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }
}

export default new MetricsController();
