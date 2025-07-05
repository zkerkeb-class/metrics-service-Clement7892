import { logger } from "../utils/logger";

interface RequestMetrics {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  responseSize: number;
  userAgent?: string;
  ip?: string;
}

interface MongoMetrics {
  timestamp: Date;
  operation: string;
  collection: string;
  duration: number;
  success: boolean;
  error?: string;
}

interface BandwidthMetrics {
  timestamp: Date;
  bytesIn: number;
  bytesOut: number;
  requestsPerSecond: number;
}

interface PerformanceMetrics {
  requests: RequestMetrics[];
  mongo: MongoMetrics[];
  bandwidth: BandwidthMetrics[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalMongoOperations: number;
    successfulMongoOperations: number;
    failedMongoOperations: number;
    averageMongoTime: number;
    totalBandwidthIn: number;
    totalBandwidthOut: number;
    averageRequestsPerSecond: number;
  };
}

class MetricsService {
  private requestMetrics: RequestMetrics[] = [];
  private mongoMetrics: MongoMetrics[] = [];
  private bandwidthMetrics: BandwidthMetrics[] = [];
  private maxMetricsHistory: number = 10000; // Garder les 10000 dernières métriques
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Enregistre une métrique de requête
   */
  recordRequest(metrics: Omit<RequestMetrics, "timestamp">): void {
    const requestMetric: RequestMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.requestMetrics.push(requestMetric);
    this.cleanupOldMetrics();
  }

  /**
   * Enregistre une métrique MongoDB
   */
  recordMongoOperation(metrics: Omit<MongoMetrics, "timestamp">): void {
    const mongoMetric: MongoMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.mongoMetrics.push(mongoMetric);
    this.cleanupOldMetrics();
  }

  /**
   * Enregistre une métrique de bande passante
   */
  recordBandwidth(metrics: Omit<BandwidthMetrics, "timestamp">): void {
    const bandwidthMetric: BandwidthMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.bandwidthMetrics.push(bandwidthMetric);
    this.cleanupOldMetrics();
  }

  /**
   * Obtient les métriques pour une période donnée
   */
  getMetrics(timeRange: { start: Date; end: Date }): PerformanceMetrics {
    const filteredRequests = this.requestMetrics.filter(
      (metric) =>
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const filteredMongo = this.mongoMetrics.filter(
      (metric) =>
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const filteredBandwidth = this.bandwidthMetrics.filter(
      (metric) =>
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const summary = this.calculateSummary(
      filteredRequests,
      filteredMongo,
      filteredBandwidth
    );

    return {
      requests: filteredRequests,
      mongo: filteredMongo,
      bandwidth: filteredBandwidth,
      summary
    };
  }

  /**
   * Obtient les métriques des dernières 24 heures
   */
  getLast24HoursMetrics(): PerformanceMetrics {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return this.getMetrics({ start, end });
  }

  /**
   * Obtient les métriques de la dernière heure
   */
  getLastHourMetrics(): PerformanceMetrics {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    return this.getMetrics({ start, end });
  }

  /**
   * Obtient les métriques en temps réel (dernières 5 minutes)
   */
  getRealTimeMetrics(): PerformanceMetrics {
    const end = new Date();
    const start = new Date(end.getTime() - 5 * 60 * 1000);
    return this.getMetrics({ start, end });
  }

  /**
   * Obtient la distribution des requêtes par endpoint
   */
  getRequestDistribution(timeRange: {
    start: Date;
    end: Date;
  }): Record<string, number> {
    const filteredRequests = this.requestMetrics.filter(
      (metric) =>
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const distribution: Record<string, number> = {};

    filteredRequests.forEach((request) => {
      const key = `${request.method} ${request.path}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Obtient la distribution des codes de statut
   */
  getStatusDistribution(timeRange: {
    start: Date;
    end: Date;
  }): Record<number, number> {
    const filteredRequests = this.requestMetrics.filter(
      (metric) =>
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const distribution: Record<number, number> = {};

    filteredRequests.forEach((request) => {
      distribution[request.statusCode] =
        (distribution[request.statusCode] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Obtient les performances par endpoint
   */
  getEndpointPerformance(timeRange: { start: Date; end: Date }): Record<
    string,
    {
      count: number;
      averageDuration: number;
      successRate: number;
      totalDuration: number;
    }
  > {
    const filteredRequests = this.requestMetrics.filter(
      (metric) =>
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const performance: Record<
      string,
      {
        count: number;
        averageDuration: number;
        successRate: number;
        totalDuration: number;
      }
    > = {};

    filteredRequests.forEach((request) => {
      const key = `${request.method} ${request.path}`;
      const isSuccess = request.statusCode >= 200 && request.statusCode < 400;

      if (!performance[key]) {
        performance[key] = {
          count: 0,
          averageDuration: 0,
          successRate: 0,
          totalDuration: 0
        };
      }

      performance[key].count++;
      performance[key].totalDuration += request.duration;
      performance[key].averageDuration =
        performance[key].totalDuration / performance[key].count;

      const successCount = filteredRequests.filter(
        (r) =>
          `${r.method} ${r.path}` === key &&
          r.statusCode >= 200 &&
          r.statusCode < 400
      ).length;
      performance[key].successRate =
        (successCount / performance[key].count) * 100;
    });

    return performance;
  }

  /**
   * Calcule le résumé des métriques
   */
  private calculateSummary(
    requests: RequestMetrics[],
    mongo: MongoMetrics[],
    bandwidth: BandwidthMetrics[]
  ) {
    const totalRequests = requests.length;
    const successfulRequests = requests.filter(
      (r) => r.statusCode >= 200 && r.statusCode < 400
    ).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime =
      requests.length > 0
        ? requests.reduce((sum, r) => sum + r.duration, 0) / requests.length
        : 0;

    const totalMongoOperations = mongo.length;
    const successfulMongoOperations = mongo.filter((m) => m.success).length;
    const failedMongoOperations =
      totalMongoOperations - successfulMongoOperations;
    const averageMongoTime =
      mongo.length > 0
        ? mongo.reduce((sum, m) => sum + m.duration, 0) / mongo.length
        : 0;

    const totalBandwidthIn = bandwidth.reduce((sum, b) => sum + b.bytesIn, 0);
    const totalBandwidthOut = bandwidth.reduce((sum, b) => sum + b.bytesOut, 0);
    const averageRequestsPerSecond =
      bandwidth.length > 0
        ? bandwidth.reduce((sum, b) => sum + b.requestsPerSecond, 0) /
          bandwidth.length
        : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      totalMongoOperations,
      successfulMongoOperations,
      failedMongoOperations,
      averageMongoTime,
      totalBandwidthIn,
      totalBandwidthOut,
      averageRequestsPerSecond
    };
  }

  /**
   * Nettoie les anciennes métriques
   */
  private cleanupOldMetrics(): void {
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsHistory);
    }
    if (this.mongoMetrics.length > this.maxMetricsHistory) {
      this.mongoMetrics = this.mongoMetrics.slice(-this.maxMetricsHistory);
    }
    if (this.bandwidthMetrics.length > this.maxMetricsHistory) {
      this.bandwidthMetrics = this.bandwidthMetrics.slice(
        -this.maxMetricsHistory
      );
    }
  }

  /**
   * Démarre l'intervalle de nettoyage
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldMetrics();
        logger.debug("Nettoyage des anciennes métriques effectué");
      },
      5 * 60 * 1000
    ); // Toutes les 5 minutes
  }

  /**
   * Arrête le service de métriques
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export default new MetricsService();
