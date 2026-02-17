import { Axiom } from "@axiomhq/js";
import { buildLogEntry, AXIOM_SOURCE, LOG_TYPES, LOG_LEVELS } from "../models/Axiom.js";

// Env: AXIOM_LOGGING_ENABLED=true | false, AXIOM_TOKEN=<token>, AXIOM_DATASET=integrations
const AXIOM_LOGGING_ENABLED = process.env.AXIOM_LOGGING_ENABLED === "true";
const AXIOM_TOKEN = process.env.AXIOM_TOKEN ?? "";
const AXIOM_DATASET = process.env.AXIOM_DATASET ?? "integrations";

let client = null;

function getClient() {
  if (!AXIOM_LOGGING_ENABLED || !AXIOM_TOKEN) return null;
  if (!client) client = new Axiom({ token: AXIOM_TOKEN });
  return client;
}

/**
 * Log an event to Axiom. No-op if logging is disabled or token missing.
 * @param {object} entry - Must include type, request, response, analytics (can be null).
 */
export function log(entry) {
  const axiom = getClient();
  if (!axiom) return;

  const event = {
    _time: entry._time ?? new Date().toISOString(),
    type: entry.type,
    source: entry.source ?? AXIOM_SOURCE,
    request: entry.request ?? null,
    response: entry.response ?? null,
    analytics: entry.analytics ?? null,
    message: entry.message ?? null,
    level: entry.level ?? LOG_LEVELS.INFO,
    ...entry,
  };

  try {
    axiom.ingest(AXIOM_DATASET, [event]);
  } catch (err) {
    console.error("[Axiom] ingest error:", err?.message || err);
  }
}

/**
 * Log HTTP request/response. Use from middleware.
 */
export function logHttp({ request, response, analytics }) {
  log(
    buildLogEntry(LOG_TYPES.HTTP, AXIOM_SOURCE, {
      request,
      response,
      analytics,
      extra: { source: "middleware" },
    })
  );
}

/**
 * Log a scheduler/cron job run.
 */
export function logScheduler({ jobName, request, response, analytics }) {
  log(
    buildLogEntry(LOG_TYPES.SCHEDULER, AXIOM_SOURCE, {
      request: request ?? { jobName },
      response,
      analytics,
      extra: { jobName, source: "scheduler" },
    })
  );
}

/**
 * Log a generic process (scripts, background tasks, etc.).
 */
export function logProcess({ processName, request, response, analytics, message, level }) {
  log(
    buildLogEntry(LOG_TYPES.PROCESS, AXIOM_SOURCE, {
      request: request ?? (processName ? { processName } : null),
      response,
      analytics,
      message,
      level: level ?? LOG_LEVELS.INFO,
      extra: processName ? { processName } : {},
    })
  );
}

/**
 * Flush queued events to Axiom. Call before process exit if needed.
 */
export async function flush() {
  const axiom = getClient();
  if (axiom) await axiom.flush();
}

export function isAxiomEnabled() {
  return AXIOM_LOGGING_ENABLED && !!AXIOM_TOKEN;
}
