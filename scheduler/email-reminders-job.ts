import "dotenv/config";
import { supabase } from "../utils/config.js";
import { sendMarketingEmail } from "../services/email-transporter.js";
import type { EmailRemindersJobResult } from "../types/index.js";

function getTodayNL(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${d}`;
}

interface EmailReminderRow {
  id: number;
  email: string;
  template_id: string;
  metadata: string | Record<string, unknown>;
  status: string;
}

async function fetchDueReminders(): Promise<EmailReminderRow[]> {
  const today = getTodayNL();
  const { data, error } = await supabase
    .from("email_reminders")
    .select("id, email, template_id, metadata, status")
    .in("status", ["pending", "failed"])
    .lte("scheduled_date", today);

  if (error) throw new Error(error.message || "Failed to fetch email_reminders");
  return (data as EmailReminderRow[]) ?? [];
}

async function updateReminderStatus(id: number, status: string): Promise<void> {
  const { error } = await supabase.from("email_reminders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message || "Failed to update reminder");
}

export async function runEmailRemindersJob(): Promise<EmailRemindersJobResult> {
  const due = await fetchDueReminders();
  let completed = 0;
  const errors: { id: number; email: string; error: string }[] = [];

  for (const row of due) {
    let templateVariables: Record<string, unknown> | null = null;
    try {
      templateVariables =
        typeof row.metadata === "string" ? (JSON.parse(row.metadata) as Record<string, unknown>) : (row.metadata as Record<string, unknown>);
    } catch (e: unknown) {
      await updateReminderStatus(row.id, "failed");
      errors.push({
        id: row.id,
        email: row.email,
        error: "Invalid metadata JSON: " + (e instanceof Error ? e.message : String(e)),
      });
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
    } catch (err: unknown) {
      await updateReminderStatus(row.id, "failed");
      errors.push({
        id: row.id,
        email: row.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { processed: due.length, completed, failed: errors.length, errors };
}
