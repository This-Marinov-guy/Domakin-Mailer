import { supabase } from "../utils/config.js";

/**
 * Fetches all emails from unsubscribed_emails and returns a Set of lowercased emails
 * for O(1) lookup. Call once per operation and reuse the Set for all recipients.
 */
export async function fetchUnsubscribedEmailSet(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("unsubscribed_emails")
    .select("email");

  if (error) throw new Error(error.message || "Failed to fetch unsubscribed_emails");

  const set = new Set<string>();
  for (const row of data ?? []) {
    const email = (row as { email?: string }).email;
    if (email && typeof email === "string") set.add(email.trim().toLowerCase());
  }
  return set;
}

/**
 * Returns true if the email is in the unsubscribed set (case-insensitive).
 */
export function isUnsubscribed(email: string, unsubscribedSet: Set<string>): boolean {
  return unsubscribedSet.has(email.trim().toLowerCase());
}
