import "dotenv/config";
import { supabase } from "../utils/config.js";
import { sendMarketingEmail } from "../services/email-transporter.js";

/**
 * Get today's date in Europe/Amsterdam as YYYY-MM-DD.
 */
function getTodayNL() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

/**
 * Fetch rows from email_reminders where status in ('pending','failed') and scheduled_date = today (NL).
 */
async function fetchDueReminders() {
  const today = getTodayNL();
  const { data, error } = await supabase
    .from("email_reminders")
    .select("id, email, template_id, metadata, status")
    .in("status", ["pending", "failed"])
    .eq("scheduled_date", today);

  if (error) throw new Error(error.message || "Failed to fetch email_reminders");
  return data || [];
}

/**
 * Update email_reminders row status.
 */
async function updateReminderStatus(id, status) {
  const { error } = await supabase.from("email_reminders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message || "Failed to update reminder");
}

/**
 * Run the job: for each due reminder, send template email with metadata (JSON), then set status completed/failed.
 * @returns {{ processed: number, completed: number, failed: number, errors: { id: number, email: string, error: string }[] }}
 */
export async function runEmailRemindersJob() {
  const due = await fetchDueReminders();
  let completed = 0;
  const errors = [];

  for (const row of due) {
    let templateVariables = null;
    try {
      templateVariables = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    } catch (e) {
      await updateReminderStatus(row.id, "failed");
      errors.push({ id: row.id, email: row.email, error: "Invalid metadata JSON: " + (e?.message || e) });
      continue;
    }

    if (!row.template_id || !row.email) {
      await updateReminderStatus(row.id, "failed");
      errors.push({ id: row.id, email: row.email, error: "Missing template_id or email" });
      continue;
    }

    try {
      await sendMarketingEmail(
        row.template_id,
        { email: row.email, id: String(row.id) },
        templateVariables
      );
      await updateReminderStatus(row.id, "completed");
      completed += 1;
    } catch (err) {
      await updateReminderStatus(row.id, "failed");
      errors.push({ id: row.id, email: row.email, error: err?.message || String(err) });
    }
  }

  return { processed: due.length, completed, failed: errors.length, errors };
}
