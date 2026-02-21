const OVERRIDES_KEY = "platform:overrides";

export function readOverrides(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function processUrlParams(): void {
  const params = new URLSearchParams(location.search);

  if (params.has("platform:clear-overrides")) {
    sessionStorage.removeItem(OVERRIDES_KEY);
    params.delete("platform:clear-overrides");
    const qs = params.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
    return;
  }

  const raw = params.get("platform:overrides");
  if (!raw) return;
  try {
    const incoming = JSON.parse(raw) as Record<string, string>;
    const merged = { ...readOverrides(), ...incoming };
    sessionStorage.setItem(OVERRIDES_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
  params.delete("platform:overrides");
  const qs = params.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
}
