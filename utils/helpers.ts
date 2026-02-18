export function extractStreetName(address: string | null | undefined): string {
  if (!address) return "";
  // Remove all commas
  const cleaned = address.replace(/,/g, "");
  // Match everything up to the first digit
  const match = cleaned.match(/^[^\d]*/);
  return match ? match[0].trim() : "";
}
