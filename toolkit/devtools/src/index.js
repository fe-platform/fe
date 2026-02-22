import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "solid-js/jsx-runtime";
import { createSignal, createMemo, For, Show } from "solid-js";
import { render as solidRender } from "solid-js/web";
import { panelStyle, headerStyle, sectionStyle, labelStyle, rowStyle, specStyle, specNameStyle, urlTextStyle, iconBtnStyle, inputStyle, addBtnStyle, actionsStyle, actionBtnStyle, } from "./styles";
const OVERRIDES_KEY = "platform:overrides";
const PANEL_OPEN_KEY = "platform:devtools:open";
function readOverrides() {
    try {
        return JSON.parse(sessionStorage.getItem(OVERRIDES_KEY) || "{}");
    }
    catch {
        return {};
    }
}
function writeOverrides(overrides) {
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
    function removeOverride(spec) {
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
        if (!spec || !url)
            return;
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
        position: "fixed",
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
    return (_jsxs(_Fragment, { children: [_jsx("button", { style: btnStyle(), onClick: togglePanel, children: count() > 0 ? `⚡ ${count()}` : "⚙" }), _jsx(Show, { when: open(), children: _jsxs("div", { style: panelStyle, children: [_jsxs("div", { style: headerStyle, children: [_jsx("span", { children: "\u2699 Platform DevTools" }), _jsx("button", { style: iconBtnStyle, onClick: togglePanel, children: "\u2715" })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: labelStyle, children: count() > 0 ? `${count()} active override${count() !== 1 ? "s" : ""}` : "No active overrides" }), _jsx(For, { each: Object.entries(overrides()), children: ([spec, url]) => (_jsxs("div", { style: rowStyle, children: [_jsxs("div", { style: specStyle, children: [_jsx("div", { style: specNameStyle, children: spec }), _jsx("div", { style: urlTextStyle, children: url })] }), _jsx("button", { style: iconBtnStyle, title: "Remove", onClick: () => removeOverride(spec), children: "\u2715" })] })) })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("div", { style: labelStyle, children: "Add override" }), _jsx("input", { style: inputStyle, placeholder: "fe(@acme/mfe-a)", value: specInput(), onInput: (e) => setSpecInput(e.currentTarget.value) }), _jsx("input", { style: inputStyle, placeholder: "http://localhost:3000/index.js", value: urlInput(), onInput: (e) => setUrlInput(e.currentTarget.value) }), _jsx("button", { style: addBtnStyle, onClick: addOverride, children: "\uFF0B Apply & reload" })] }), _jsxs("div", { style: actionsStyle, children: [_jsx(Show, { when: count() > 0, children: _jsx("button", { style: actionBtnStyle, onClick: clearAll, children: "\uD83D\uDDD1 Clear all" }) }), _jsx("button", { style: actionBtnStyle, onClick: share, children: copied() ? "✓ Copied!" : "📋 Share URL" })] })] }) })] }));
}
export function render(container, _props) {
    return solidRender(() => _jsx(DevTools, {}), container);
}
