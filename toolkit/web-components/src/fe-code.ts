/**
 * `<fe-code lang="ts">` — renders a syntax-highlighted code block. Source is read from a
 * `<template>` child (recommended, prevents HTML parsing) or from `textContent`. The `lang`
 * attribute is passed to `@feo/fe-syntax-highlighter`, which is loaded lazily on first use.
 */
export class FECode extends HTMLElement {
    async connectedCallback() {
        const template = this.querySelector("template");
        const content = template ? template.innerHTML : (this.textContent ?? "");
        const pre = document.createElement("pre");
        pre.className = `lang-${this.getAttribute("lang") ?? ""}`;
        pre.textContent = content.trim();
        this.innerHTML = "";
        this.appendChild(pre);
        const { highlight } = await import("@feo/fe-syntax-highlighter");
        highlight(this);
    }
}

if (!customElements.get("fe-code")) customElements.define("fe-code", FECode);
