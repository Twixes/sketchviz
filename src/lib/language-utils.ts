export function extractFirstName(fullName: string): string {
  return fullName.split(" ").at(0) ?? "";
}
