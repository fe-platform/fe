export class FEComponent extends HTMLElement {
    private _snapshot: Node[] = [];

    connectedCallback() {
        const name = this.getAttribute("name");
        if (!name) return;
        this.querySelectorAll("style").forEach((s) => {
            if (!s.innerHTML.includes(`[data-fe-id="${name}"]`)) {
                s.innerHTML = s.innerHTML.replace(/([^\r\n,{}]+)(?=[^{}]*\{)/g, (m) => {
                    if (m.trim().startsWith("@") || m.includes(":root")) return m;
                    return m.trim().split(/\s*,\s*/).map(sel => `[data-fe-id="${name}"] ${sel}`).join(", ");
                });
            }
            document.head.appendChild(s);
        });
        this.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
            document.head.appendChild(l);
        });
        this._snapshot = Array.from(this.childNodes).map(n => n.cloneNode(true));
        this.innerHTML = "";
    }

    get content(): DocumentFragment {
        const frag = document.createDocumentFragment();
        this._snapshot.forEach(n => frag.appendChild(n.cloneNode(true)));
        return frag;
    }
}

if (!customElements.get("fe-component")) customElements.define("fe-component", FEComponent);
