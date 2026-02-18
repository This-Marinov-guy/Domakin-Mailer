import type { Request, Response, NextFunction } from "express";
import { logHttp } from "../utils/axiom-logger.js";

/**
 * Axiom logging middleware. Logs each HTTP request with timing and metadata.
 */
export function axiomLogging(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    const request: Record<string, unknown> = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query || {}).length ? req.query : undefined,
      ip: req.ip || req.headers["x-forwarded-for"] || (req.socket?.remoteAddress) || undefined,
      userAgent: req.headers["user-agent"] || undefined,
    };

    const response: Record<string, unknown> = {
      statusCode: res.statusCode,
      durationMs,
    };

    const analytics: Record<string, unknown> = {
      statusCode: res.statusCode,
      durationMs,
      method: req.method,
      path: req.path,
    };

    logHttp({ request, response, analytics });
  });

  next();
}
