import { createSignal, createMemo, For, Show } from "solid-js";
import { render as solidRender } from "solid-js/web";

// --- Storage keys ---

const OVERRIDES_KEY = "platform:overrides";
const PANEL_OPEN_KEY = "platform:devtools:open";

// --- Storage helpers ---

function readOverrides(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(OVERRIDES_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, string>): void {
  sessionStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

// --- App component ---

function DevTools() {
  const [overrides, setOverrides] = createSignal(readOverrides());
  const [open, setOpen] = createSignal(sessionStorage.getItem(PANEL_OPEN_KEY) === "1");
  const [specInput, setSpecInput] = createSignal("");
  const [urlInput, setUrlInput] = createSignal("");
  const [copied, setCopied] = createSignal(false);

  const count = createMemo(() => Object.keys(overrides()).length);

  function togglePanel() {
    const next = !open();
    setOpen(next);
    sessionStorage.setItem(PANEL_OPEN_KEY, next ? "1" : "0");
  }

  function removeOverride(spec: string) {
    const next = { ...overrides() };
    delete next[spec];
    writeOverrides(next);
    location.reload();
  }

  function clearAll() {
    sessionStorage.removeItem(OVERRIDES_KEY);
    location.reload();
  }

  function addOverride() {
    const spec = specInput().trim();
    const url = urlInput().trim();
    if (!spec || !url) return;
    writeOverrides({ ...overrides(), [spec]: url });
    location.reload();
  }

  function share() {
    const url = new URL(location.href);
    url.searchParams.set("platform:overrides", JSON.stringify(overrides()));
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // --- Styles ---

  const btnStyle = createMemo(() => ({
    position: "fixed" as const,
    bottom: "16px",
    right: "16px",
    "z-index": "2147483647",
    padding: "8px 14px",
    "border-radius": "20px",
    border: "none",
    background: count() > 0 ? "#d97706" : "#4f46e5",
    color: "#fff",
    "font-size": "13px",
    "font-family": "monospace",
    "font-weight": "bold",
    cursor: "pointer",
    "box-shadow": "0 2px 12px rgba(0,0,0,.35)",
    "line-height": "1",
    transition: "background .15s",
  }));

  const panelStyle: Record<string, string> = {
    position: "fixed",
    bottom: "58px",
    right: "16px",
    "z-index": "2147483647",
    width: "420px",
    "max-height": "80vh",
    "overflow-y": "auto",
    background: "#1e1e2e",
    color: "#cdd6f4",
    "border-radius": "12px",
    "box-shadow": "0 8px 32px rgba(0,0,0,.5)",
    "font-family": "monospace",
    "font-size": "13px",
    padding: "0",
  };

  const headerStyle: Record<string, string> = {
    display: "flex",
    "align-items": "center",
    "justify-content": "space-between",
    padding: "12px 16px",
    "border-bottom": "1px solid #313244",
    "font-weight": "bold",
    "font-size": "13px",
    color: "#cba6f7",
  };

  const sectionStyle: Record<string, string> = {
    padding: "12px 16px",
    "border-bottom": "1px solid #313244",
  };

  const labelStyle: Record<string, string> = {
    "font-size": "11px",
    color: "#6c7086",
    "text-transform": "uppercase",
    "letter-spacing": "0.06em",
    "margin-bottom": "8px",
  };

  const rowStyle: Record<string, string> = {
    display: "flex",
    "align-items": "flex-start",
    gap: "8px",
    "margin-bottom": "6px",
    background: "#181825",
    "border-radius": "6px",
    padding: "8px 10px",
  };

  const specStyle: Record<string, string> = {
    flex: "1",
    "min-width": "0",
    "overflow-wrap": "break-word" as const,
  };

  const specNameStyle: Record<string, string> = {
    color: "#89b4fa",
    "font-weight": "bold",
    "font-size": "12px",
    "margin-bottom": "2px",
  };

  const urlTextStyle: Record<string, string> = {
    color: "#a6e3a1",
    "font-size": "11px",
    "word-break": "break-all" as const,
  };

  const iconBtnStyle: Record<string, string> = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6c7086",
    "font-size": "14px",
    padding: "0",
    "line-height": "1",
    "flex-shrink": "0",
    "margin-top": "1px",
  };

  const inputStyle: Record<string, string> = {
    width: "100%",
    background: "#181825",
    border: "1px solid #313244",
    "border-radius": "6px",
    color: "#cdd6f4",
    "font-family": "monospace",
    "font-size": "12px",
    padding: "6px 8px",
    "box-sizing": "border-box" as const,
    "margin-bottom": "6px",
  };

  const addBtnStyle: Record<string, string> = {
    background: "#4f46e5",
    border: "none",
    "border-radius": "6px",
    color: "#fff",
    "font-family": "monospace",
    "font-size": "12px",
    "font-weight": "bold",
    padding: "6px 12px",
    cursor: "pointer",
    width: "100%",
  };

  const actionsStyle: Record<string, string> = {
    display: "flex",
    gap: "8px",
    padding: "12px 16px",
  };

  const actionBtnStyle: Record<string, string> = {
    flex: "1",
    background: "#313244",
    border: "none",
    "border-radius": "6px",
    color: "#cdd6f4",
    "font-family": "monospace",
    "font-size": "12px",
    padding: "7px 10px",
    cursor: "pointer",
  };

  return (
    <>
      {/* Toggle button */}
      <button style={btnStyle()} onClick={togglePanel}>
        {count() > 0 ? `⚡ ${count()}` : "⚙"}
      </button>

      {/* Panel */}
      <Show when={open()}>
        <div style={panelStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <span>⚙ Platform DevTools</span>
            <button style={iconBtnStyle} onClick={togglePanel}>✕</button>
          </div>

          {/* Active overrides */}
          <div style={sectionStyle}>
            <div style={labelStyle}>
              {count() > 0 ? `${count()} active override${count() !== 1 ? "s" : ""}` : "No active overrides"}
            </div>
            <For each={Object.entries(overrides())}>
              {([spec, url]) => (
                <div style={rowStyle}>
                  <div style={specStyle}>
                    <div style={specNameStyle}>{spec}</div>
                    <div style={urlTextStyle}>{url}</div>
                  </div>
                  <button style={iconBtnStyle} title="Remove" onClick={() => removeOverride(spec)}>✕</button>
                </div>
              )}
            </For>
          </div>

          {/* Add override */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Add override</div>
            <input
              style={inputStyle}
              placeholder="fe(@acme/mfe-a)"
              value={specInput()}
              onInput={(e) => setSpecInput(e.currentTarget.value)}
            />
            <input
              style={inputStyle}
              placeholder="http://localhost:3000/index.js"
              value={urlInput()}
              onInput={(e) => setUrlInput(e.currentTarget.value)}
            />
            <button style={addBtnStyle} onClick={addOverride}>＋ Apply &amp; reload</button>
          </div>

          {/* Actions */}
          <div style={actionsStyle}>
            <Show when={count() > 0}>
              <button style={actionBtnStyle} onClick={clearAll}>🗑 Clear all</button>
            </Show>
            <button style={actionBtnStyle} onClick={share}>
              {copied() ? "✓ Copied!" : "📋 Share URL"}
            </button>
          </div>
        </div>
      </Show>
    </>
  );
}

// --- MFE interface ---

export function render(container: HTMLElement, _props: Record<string, unknown>): () => void {
  return solidRender(() => <DevTools />, container);
}
