import { createSignal, createMemo, For, Show } from "solid-js";
import { render as solidRender } from "solid-js/web";
import {
  panelStyle, headerStyle, sectionStyle, labelStyle,
  rowStyle, specStyle, specNameStyle, urlTextStyle,
  iconBtnStyle, inputStyle, addBtnStyle, actionsStyle, actionBtnStyle,
} from "./styles";

const OVERRIDES_KEY = "platform:overrides";
const PANEL_OPEN_KEY = "platform:devtools:open";

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

  return (
    <>
      <button style={btnStyle()} onClick={togglePanel}>
        {count() > 0 ? `⚡ ${count()}` : "⚙"}
      </button>

      <Show when={open()}>
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span>⚙ Platform DevTools</span>
            <button style={iconBtnStyle} onClick={togglePanel}>✕</button>
          </div>

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

export function render(container: HTMLElement, _props: Record<string, unknown>): () => void {
  return solidRender(() => <DevTools />, container);
}
