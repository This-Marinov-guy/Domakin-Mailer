export function extractStreetName(address: string | null | undefined): string {
  if (!address) return "";
  // Remove all commas
  const cleaned = address.replace(/,/g, "");
  // Match everything up to the first digit
  const match = cleaned.match(/^[^\d]*/);
  return match ? match[0].trim() : "";
}

/** progress_percent = 100 * step / 6, capped at 99 if 100. */
export function progressPercentFromStep(step: number): number {
  const p = Math.round((100 * step - 1) / 6);
  return p >= 100 ? 99 : p;
}

const DEFAULT_FINISH_LISTING_URL = "https://domakin.nl/services/add-listing";

export function resolveFinishListingUrl(link: unknown, referenceId?: unknown): string {
  if (typeof link === "string" && link.trim()) {
    return link.trim();
  }

  if (typeof referenceId === "string" && referenceId.trim()) {
    return `${DEFAULT_FINISH_LISTING_URL}?reference_id=${encodeURIComponent(referenceId.trim())}`;
  }

  return "";
}
