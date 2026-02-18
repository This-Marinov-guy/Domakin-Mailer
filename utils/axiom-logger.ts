import { Axiom } from "@axiomhq/js";
import {
  buildLogEntry,
  AXIOM_SOURCE,
  LOG_TYPES,
  LOG_LEVELS,
  type AxiomLogEntry,
  type LogLevel,
} from "../models/Axiom.js";

const AXIOM_LOGGING_ENABLED = process.env.AXIOM_LOGGING_ENABLED === "true";
const AXIOM_TOKEN = process.env.AXIOM_TOKEN ?? "";
const AXIOM_DATASET = process.env.AXIOM_DATASET ?? "integrations";

let client: Axiom | null = null;

function getClient(): Axiom | null {
  if (!AXIOM_LOGGING_ENABLED || !AXIOM_TOKEN) return null;
  if (!client) client = new Axiom({ token: AXIOM_TOKEN });
  return client;
}

export function log(entry: AxiomLogEntry): void {
  const axiom = getClient();
  if (!axiom) return;

  const event = {
    ...entry,
    _time: entry._time ?? new Date().toISOString(),
    type: entry.type,
    source: entry.source ?? AXIOM_SOURCE,
    request: entry.request ?? null,
    response: entry.response ?? null,
    analytics: entry.analytics ?? null,
    message: entry.message ?? null,
    level: entry.level ?? LOG_LEVELS.INFO,
  };

  try {
    axiom.ingest(AXIOM_DATASET, [event]);
  } catch (err) {
    console.error("[Axiom] ingest error:", (err as Error)?.message || err);
  }
}

export function logHttp({
  request,
  response,
  analytics,
}: {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  analytics: Record<string, unknown>;
}): void {
  log(
    buildLogEntry(LOG_TYPES.HTTP, AXIOM_SOURCE, {
      request,
      response,
      analytics,
      extra: { source: "middleware" },
    })
  );
}

export function logScheduler({
  jobName,
  request,
  response,
  analytics,
}: {
  jobName: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
}): void {
  log(
    buildLogEntry(LOG_TYPES.SCHEDULER, AXIOM_SOURCE, {
      request: request ?? { jobName },
      response,
      analytics,
      extra: { jobName, source: "scheduler" },
    })
  );
}

export function logProcess({
  processName,
  request,
  response,
  analytics,
  message,
  level,
}: {
  processName?: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  message?: string;
  level?: LogLevel;
}): void {
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

export async function flush(): Promise<void> {
  const axiom = getClient();
  if (axiom) await axiom.flush();
}

export function isAxiomEnabled(): boolean {
  return AXIOM_LOGGING_ENABLED && !!AXIOM_TOKEN;
}
