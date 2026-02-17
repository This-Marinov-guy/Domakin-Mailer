import { logHttp } from "../utils/axiom-logger.js";

/**
 * Axiom logging middleware. Logs each HTTP request with a standard entry:
 * request (method, path, query, ip, userAgent), response (statusCode, durationMs), analytics.
 */
export function axiomLogging(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    const request = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query || {}).length ? req.query : undefined,
      ip: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || undefined,
      userAgent: req.headers["user-agent"] || undefined,
    };

    const response = {
      statusCode: res.statusCode,
      durationMs,
    };

    const analytics = {
      statusCode: res.statusCode,
      durationMs,
      method: req.method,
      path: req.path,
    };

    logHttp({ request, response, analytics });
  });

  next();
}
