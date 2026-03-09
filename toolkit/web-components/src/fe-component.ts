/**
 * `<fe-component name="Name">` — declares a reusable template. On upgrade, all child
 * `<style>` elements are moved to `document.head` with selectors scoped to
 * `[data-fe-id="Name"]`. The remaining children are snapshotted and the element is
 * emptied; it stays in the DOM as a registry entry for `<fe-compose>` to look up by name.
 *
 * The `content` getter returns a fresh `DocumentFragment` clone on each call, so multiple
 * `<fe-compose>` instances can reference the same component independently.
 */
export class FEComponent extends HTMLElement {
    private _snapshot: Node[] = [];

    static {
        if (!document.getElementById('fe-component-styles')) {
            const s = document.createElement('style');
            s.id = 'fe-component-styles';
            s.textContent = 'fe-component{display:none;opacity:0;transition:opacity .5s}body.ready fe-component{opacity:1}';
            document.head.appendChild(s);
        }
    }

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
