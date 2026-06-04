import { sendMarketingEmail } from "./email-transporter.js";
import { fetchUnsubscribedEmailSet, isUnsubscribed } from "./unsubscribed-service.js";
import {
  getAllSearchRentingEmails,
  getSearchRentingEmailsCreatedBefore,
  getRentingEmailsCreatedBefore,
  getNewsletterEmailsBeforeYear,
  getAllAuthUserEmails,
} from "../utils/database.js";
import { DOMAKIN_LIST_ROOM_EN, REMOTE_VIEWING_EN } from "../utils/templates.js";
import type { BroadcastResult, EmailReceiver } from "../types/index.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function collectUnique(
  rows: Array<{ id: string | number; email: string }>,
  byEmail: Map<string, EmailReceiver>
): void {
  for (const row of rows) {
    if (!row?.email || typeof row.email !== "string") continue;
    const normalized = normalizeEmail(row.email);
    if (!normalized) continue;
    if (byEmail.has(normalized)) continue;
    byEmail.set(normalized, { email: row.email.trim(), id: String(row.id) });
  }
}

async function sendBroadcast(
  templateId: string,
  recipients: EmailReceiver[],
  label: string
): Promise<BroadcastResult> {
  const unsubscribedSet = await fetchUnsubscribedEmailSet();
  let sent = 0;
  let skippedUnsubscribed = 0;
  const errors: { email: string; error: string }[] = [];
  let index = 0;

  for (const receiver of recipients) {
    index += 1;
    const progress = `[${index}/${recipients.length}]`;

    if (isUnsubscribed(receiver.email, unsubscribedSet)) {
      skippedUnsubscribed += 1;
      console.log(`[Broadcast:${label}] ${progress} SKIP unsubscribed`, {
        email: receiver.email,
        id: receiver.id,
      });
      continue;
    }

    console.log(`[Broadcast:${label}] ${progress} SEND attempt`, {
      email: receiver.email,
      id: receiver.id,
    });

    try {
      await sendMarketingEmail(templateId, receiver, null);
      sent += 1;
      console.log(`[Broadcast:${label}] ${progress} SEND success`, {
        email: receiver.email,
        id: receiver.id,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ email: receiver.email, error: message });
      console.error(`[Broadcast:${label}] ${progress} SEND failed`, {
        email: receiver.email,
        id: receiver.id,
        error: message,
      });
    }
  }

  console.log(`[Broadcast:${label}] DONE`, {
    sent,
    skipped_unsubscribed: skippedUnsubscribed,
    total_recipients: recipients.length,
    errors_count: errors.length,
  });

  return {
    sent,
    skipped_unsubscribed: skippedUnsubscribed,
    total_recipients: recipients.length,
    errors,
  };
}

export async function sendRemoteViewingToSearchRentings(): Promise<BroadcastResult> {
  const rows = await getAllSearchRentingEmails();
  const byEmail = new Map<string, EmailReceiver>();
  collectUnique(rows, byEmail);
  const recipients = Array.from(byEmail.values());

  console.log("[Broadcast] sendRemoteViewingToSearchRentings", {
    totalRecipients: recipients.length,
  });

  return sendBroadcast(REMOTE_VIEWING_EN, recipients, "remote-viewing");
}

export async function sendRemoteViewingToUsers(
  templateId: string = REMOTE_VIEWING_EN
): Promise<BroadcastResult> {
  const rows = await getAllAuthUserEmails();
  const byEmail = new Map<string, EmailReceiver>();
  collectUnique(rows, byEmail);
  const recipients = Array.from(byEmail.values());

  console.log("[Broadcast] sendRemoteViewingToUsers", {
    templateId,
    totalRecipients: recipients.length,
  });

  return sendBroadcast(templateId, recipients, "all-auth-users");
}

export async function sendListRoomToPreCurrentYear(): Promise<BroadcastResult> {
  const currentYear = new Date().getUTCFullYear();
  const firstOfCurrentYearIso = `${currentYear}-01-01T00:00:00.000Z`;

  const [searchRentingRows, rentingRows, newsletterRows] = await Promise.all([
    getSearchRentingEmailsCreatedBefore(firstOfCurrentYearIso),
    getRentingEmailsCreatedBefore(firstOfCurrentYearIso),
    getNewsletterEmailsBeforeYear(currentYear),
  ]);

  const byEmail = new Map<string, EmailReceiver>();
  collectUnique(searchRentingRows, byEmail);
  collectUnique(rentingRows, byEmail);
  collectUnique(newsletterRows, byEmail);
  const recipients = Array.from(byEmail.values());

  console.log("[Broadcast] sendListRoomToPreCurrentYear", {
    currentYear,
    cutoff: firstOfCurrentYearIso,
    fromSearchRentings: searchRentingRows.length,
    fromRentings: rentingRows.length,
    fromNewsletters: newsletterRows.length,
    totalRecipients: recipients.length,
  });

  return sendBroadcast(DOMAKIN_LIST_ROOM_EN, recipients, "list-room");
}
