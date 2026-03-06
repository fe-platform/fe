export class FECode extends HTMLElement {
    async connectedCallback() {
        const template = this.querySelector("template");
        const content = template ? template.innerHTML : (this.textContent ?? "");
        const pre = document.createElement("pre");
        pre.className = `lang-${this.getAttribute("lang") ?? ""}`;
        pre.textContent = content.trim();
        this.innerHTML = "";
        this.appendChild(pre);
        const { highlight } = await import("@fe-platform/syntax-highlighter");
        highlight(this);
    }
}

if (!customElements.get("fe-code")) customElements.define("fe-code", FECode);
