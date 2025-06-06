export function extractStreetName(address) {
  if (!address) return '';
  // Remove all commas
  address = address.replace(/,/g, '');

  // Match everything up to the first digit
  const match = address.match(/^[^\d]*/);
  return match ? match[0].trim() : '';
}