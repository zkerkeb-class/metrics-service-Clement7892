import { Request, Response, NextFunction } from "express";
import metricsService from "../services/metrics.service";

/**
 * Middleware pour collecter les métriques de performance des requêtes
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Intercepter la réponse pour mesurer la taille
  let responseSize = 0;
  let responseBody: any = null;

  res.send = function (body: any) {
    responseSize = Buffer.byteLength(body, "utf8");
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.json = function (body: any) {
    responseSize = Buffer.byteLength(JSON.stringify(body), "utf8");
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Capturer la fin de la requête
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const userAgent = req.get("User-Agent");
    const ip =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // Enregistrer la métrique
    metricsService.recordRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      responseSize,
      userAgent,
      ip: ip as string
    });
  });

  next();
};

/**
 * Middleware pour collecter les métriques de bande passante
 */
export const bandwidthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  let bytesIn = 0;
  let bytesOut = 0;

  // Mesurer les données entrantes
  if (req.headers["content-length"]) {
    bytesIn = parseInt(req.headers["content-length"] as string, 10);
  }

  // Intercepter la réponse pour mesurer les données sortantes
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function (body: any) {
    bytesOut = Buffer.byteLength(body, "utf8");
    return originalSend.call(this, body);
  };

  res.json = function (body: any) {
    bytesOut = Buffer.byteLength(JSON.stringify(body), "utf8");
    return originalJson.call(this, body);
  };

  // Capturer la fin de la requête
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const requestsPerSecond = 1 / (duration / 1000); // Approximation

    // Enregistrer la métrique de bande passante
    metricsService.recordBandwidth({
      bytesIn,
      bytesOut,
      requestsPerSecond
    });
  });

  next();
};

/**
 * Middleware pour collecter les métriques MongoDB (à utiliser dans les services qui utilisent MongoDB)
 */
export const mongoMetricsMiddleware = (
  operation: string,
  collection: string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Intercepter la fin de la requête pour enregistrer la métrique MongoDB
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 400;

      metricsService.recordMongoOperation({
        operation,
        collection,
        duration,
        success,
        error: success ? undefined : `HTTP ${res.statusCode}`
      });
    });

    next();
  };
};
