/** Returns true for "@acme/fe.name" and "fe.name"; false for all other strings. */
export function isMfeSpecifier(key: string): boolean {
  return /^(?:@[^/]+\/)?fe\./.test(key);
}

/** Splits "@acme/fe.name@1.0.0" into { specifier: "@acme/fe.name", version: "1.0.0" }.
 *  Returns { specifier: sv, version: "" } when no version suffix is present. */
export function parseSpecVersion(sv: string): { specifier: string; version: string } {
  const at = sv.lastIndexOf("@");
  if (at <= 0) return { specifier: sv, version: "" };
  return { specifier: sv.slice(0, at), version: sv.slice(at + 1) };
}

/** Extracts the short slug: "@acme/fe.mfe-a" → "mfe-a", "fe.mfe-a" → "mfe-a". */
export function slugFromSpecifier(specifier: string): string {
  return specifier.split("/").pop()!.replace(/^fe\./, "");
}
