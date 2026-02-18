import "dotenv/config";
import { supabase } from "../utils/config.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { fetchUnsubscribedEmailSet, isUnsubscribed } from "../services/unsubscribed-service.js";
import { FINISH_LISTING_TEMPLATE } from "../utils/templates.js";
import type { FinishApplicationJobResult } from "../types/index.js";
import { progressPercentFromStep } from "../utils/helpers.js";

const NL_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

function getDateNL(dayOffset = 0): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", NL_FORMAT);
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  const out = formatter.formatToParts(date);
  const y2 = out.find((p) => p.type === "year")?.value ?? "";
  const m2 = out.find((p) => p.type === "month")?.value ?? "";
  const d2 = out.find((p) => p.type === "day")?.value ?? "";
  return `${y2}-${m2}-${d2}`;
}

function getDateNLFromISO(isoString: string): string {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("en-CA", NL_FORMAT);
  const parts = formatter.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${day}`;
}

interface ListingApplicationRow {
  id: number;
  name: string;
  step: string;
  email: string;
  city: string;
  address: string;
  created_at: string;
}

async function fetchApplicationsCreatedTwoDaysAgo(): Promise<ListingApplicationRow[]> {
  const twoDaysAgo = getDateNL(-2);
  const windowStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("listing_applications")
    .select("id, name, step, email, city, address, created_at")
    .gte("created_at", windowStart);

  if (error) throw new Error(error.message || "Failed to fetch listing_applications");

  return ((data as ListingApplicationRow[]) || []).filter(
    (row) => getDateNLFromISO(row.created_at) === twoDaysAgo
  );
}

export async function runFinishApplicationJob(): Promise<FinishApplicationJobResult> {
  const [rows, unsubscribedSet] = await Promise.all([
    fetchApplicationsCreatedTwoDaysAgo(),
    fetchUnsubscribedEmailSet(),
  ]);
  let sent = 0;
  const errors: { id: number; email: string; error: string }[] = [];

  for (const row of rows) {
    if (isUnsubscribed(row.email, unsubscribedSet)) continue;

    const templateVariables = {
      name: row.name,
      progress_percent: progressPercentFromStep(Number(row.step)),
      email: row.email,
      city: row.city,
      address: row.address,
    };

    try {
      await sendMarketingEmail(
        FINISH_LISTING_TEMPLATE,
        { email: row.email, id: String(row.id) },
        templateVariables
      );
      sent += 1;
    } catch (err: unknown) {
      errors.push({
        id: row.id,
        email: row.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { processed: rows.length, sent, errors };
}
