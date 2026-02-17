// fe: imports are externalized at build time.
// The browser resolves them at runtime via the import map.
import { render as renderA } from "fe:@acme/mfe-a";

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "padding:12px;border:2px solid #4a90d9;border-radius:6px";

  const label = document.createElement("p");
  label.style.cssText = "margin:0 0 8px;font-size:12px;color:#4a90d9;font-weight:bold";
  label.textContent = "mfe-b wraps mfe-a:";

  wrapper.appendChild(label);
  container.appendChild(wrapper);

  const unmountA = renderA(wrapper, props);
  return () => { unmountA(); wrapper.remove(); };
}
