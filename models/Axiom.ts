/**
 * Shared Axiom log entry structure for use across APIs.
 */

export const LOG_TYPES = {
  HTTP: "http",
  SCHEDULER: "scheduler",
  PROCESS: "process",
} as const;

export const LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES];
export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

export interface AxiomLogEntry {
  _time: string;
  type: LogType;
  source: string;
  request: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  analytics: Record<string, unknown> | null;
  message?: string | null;
  level?: LogLevel;
  [key: string]: unknown;
}

export interface BuildLogEntryPayload {
  request?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  analytics?: Record<string, unknown> | null;
  message?: string;
  level?: LogLevel;
  extra?: Record<string, unknown>;
}

/**
 * Builds a base log entry with the standard structure.
 */
export function buildLogEntry(
  type: LogType,
  source: string,
  payload: BuildLogEntryPayload = {}
): AxiomLogEntry {
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
