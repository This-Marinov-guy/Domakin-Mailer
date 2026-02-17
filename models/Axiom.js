/**
 * Shared Axiom log entry structure for use across APIs.
 * Import this in other services to keep the same request/response/analytics shape.
 */

/** Log entry types */
export const LOG_TYPES = {
  HTTP: "http",
  SCHEDULER: "scheduler",
  PROCESS: "process",
};

/** Log levels */
export const LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * Standard Axiom log entry shape.
 * Every entry should have: _time, type, source, request, response, analytics.
 *
 * @typedef {Object} AxiomLogEntry
 * @property {string} _time - ISO 8601 timestamp
 * @property {string} type - "http" | "scheduler" | "process"
 * @property {string} source - Service/app name (e.g. "mailer", "api-gateway")
 * @property {Object|null} request - Request context (method, path, jobName, etc.)
 * @property {Object|null} response - Response outcome (statusCode, durationMs, ok, error)
 * @property {Object|null} analytics - Key metrics for debugging/tracking
 * @property {string} [message] - Optional message
 * @property {string} [level] - Optional level, default "info"
 */

/**
 * Builds a base log entry with the standard structure.
 * Use in any API: pass type, source, and request/response/analytics.
 *
 * @param {string} type - LOG_TYPES.HTTP | LOG_TYPES.SCHEDULER | LOG_TYPES.PROCESS
 * @param {string} source - e.g. "mailer"
 * @param {{ request?: object, response?: object, analytics?: object, message?: string, level?: string, [key: string]: any }} payload
 * @returns {AxiomLogEntry}
 */
export function buildLogEntry(type, source, payload = {}) {
  return {
    _time: new Date().toISOString(),
    type,
    source,
    request: payload.request ?? null,
    response: payload.response ?? null,
    analytics: payload.analytics ?? null,
    message: payload.message ?? null,
    level: payload.level ?? LOG_LEVELS.INFO,
    ...payload.extra,
  };
}

/** Source identifier for this service */
export const AXIOM_SOURCE = "mailer";
