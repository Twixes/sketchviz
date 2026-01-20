export function extractFirstName(fullName: string): string {
  const nameSplit = fullName.split(" ");
  if (nameSplit[0] === "Studio" && nameSplit.length > 1) {
    return nameSplit.slice(1).join(" ");
  }
  return nameSplit[0] ?? "";
}
