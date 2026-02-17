import "dotenv/config";
import { supabase } from "../utils/config.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import { FINISH_LISTING_TEMPLATE } from "../utils/templates.js";

const NL_FORMAT = {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

/**
 * Get a date in Europe/Amsterdam as YYYY-MM-DD. dayOffset 0 = today, -2 = 2 days ago.
 */
function getDateNL(dayOffset = 0) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", NL_FORMAT);
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year").value);
  const m = Number(parts.find((p) => p.type === "month").value);
  const d = Number(parts.find((p) => p.type === "day").value);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  const out = formatter.formatToParts(date);
  const y2 = out.find((p) => p.type === "year").value;
  const m2 = out.find((p) => p.type === "month").value;
  const d2 = out.find((p) => p.type === "day").value;
  return `${y2}-${m2}-${d2}`;
}

/**
 * Return the date part (YYYY-MM-DD) of a timestamp in Europe/Amsterdam.
 */
function getDateNLFromISO(isoString) {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("en-CA", NL_FORMAT);
  const parts = formatter.formatToParts(d);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${day}`;
}

/**
 * Fetch listing_applications whose created_at date (in NL) is exactly 2 days ago.
 */
async function fetchApplicationsCreatedTwoDaysAgo() {
  const twoDaysAgo = getDateNL(-2);
  const windowStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("listing_applications")
    .select("id, name, step, email, city, address, created_at")
    .gte("created_at", windowStart);

  if (error) throw new Error(error.message || "Failed to fetch listing_applications");

  return (data || []).filter((row) => getDateNLFromISO(row.created_at) === twoDaysAgo);
}

/**
 * Run the job: send finish_listing email to applications created exactly 2 days ago (NL date).
 * Template data: name, step, email, city, address.
 * @returns {{ processed: number, sent: number, errors: { id: number, email: string, error: string }[] }}
 */
export async function runFinishApplicationJob() {
  const rows = await fetchApplicationsCreatedTwoDaysAgo();
  let sent = 0;
  const errors = [];

  for (const row of rows) {
    const templateVariables = {
      name: row.name,
      step: row.step,
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
    } catch (err) {
      errors.push({ id: row.id, email: row.email, error: err?.message || String(err) });
    }
  }

  return { processed: rows.length, sent, errors };
}
