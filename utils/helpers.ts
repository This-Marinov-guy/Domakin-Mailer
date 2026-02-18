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