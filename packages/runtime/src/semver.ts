function parseSemver(v: string): [number, number, number] {
  const parts = v.split(".").map(Number);
  return [parts[0], parts[1], parts[2]];
}

export function satisfies(version: string, range: string): boolean {
  if (!range.startsWith("^")) return version === range;
  const [vMaj, vMin, vPatch] = parseSemver(version);
  const [rMaj, rMin, rPatch] = parseSemver(range.slice(1));
  if (rMaj > 0) {
    if (vMaj !== rMaj) return false;
    if (vMin < rMin) return false;
    if (vMin === rMin && vPatch < rPatch) return false;
    return true;
  }
  if (rMin > 0) {
    if (vMaj !== 0 || vMin !== rMin) return false;
    return vPatch >= rPatch;
  }
  return vMaj === 0 && vMin === 0 && vPatch === rPatch;
}

export function resolveVersion(versions: string[], range: string): string | null {
  const matching = versions.filter((v) => satisfies(v, range));
  if (matching.length === 0) return null;
  matching.sort((a, b) => {
    const [aMaj, aMin, aPatch] = parseSemver(a);
    const [bMaj, bMin, bPatch] = parseSemver(b);
    return bMaj - aMaj || bMin - aMin || bPatch - aPatch;
  });
  return matching[0];
}
