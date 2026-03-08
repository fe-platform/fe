import React from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const el = document.createElement("div");
  container.appendChild(el);
  const root: Root = createRoot(el);
  
  root.render(
    <div style={{ padding: "8px", border: "1px solid #aaa", borderRadius: "4px" }}>
      mfe-a says: Hello, {(props.name as string) ?? "world"}!
    </div>
  );
  
  return () => {
    root.unmount();
    el.remove();
  };
}
