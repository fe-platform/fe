/**
 * `<html-include href="path/to/fragment">` — fetches an HTML fragment and replaces its
 * own content with the response body. The `.html` extension is stripped before fetching.
 *
 * `loading="eager"` fetches immediately; the element otherwise lazy-loads via
 * `IntersectionObserver` with a 400 px root margin. Set `state="loaded"` to prevent
 * re-fetching after a DOM reconnect.
 *
 * Fires a `load` event (bubbles) on each successful fetch, and a `fragments-ready`
 * event on `document.body` once all eager fragments have loaded. At that moment
 * `body.classList` also receives `ready`, which triggers a CSS fade-in.
 */
export class HTMLInclude extends HTMLElement {
    static readonly _eagerPending: Set<HTMLInclude> = new Set<HTMLInclude>();

    static {
        if (!document.getElementById('html-include-styles')) {
            const s = document.createElement('style');
            s.id = 'html-include-styles';
            s.textContent = 'html-include:not(:defined){display:none}html-include{display:block;width:100%;content-visibility:auto;contain-intrinsic-size:1px 500px}body{opacity:0;transition:opacity .25s}body.ready{opacity:1}';
            document.head.appendChild(s);
        }
    }

    private _observer: IntersectionObserver | null = null;
    private _fetching = false;

    connectedCallback() {
        const href = this.getAttribute("href");
        if (!href) return;
        if (this.getAttribute("loading") === "eager") {
            if (this.getAttribute("state") !== "loaded") HTMLInclude._eagerPending.add(this);
            this._load(href);
        } else {
            const rect = this.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                this._load(href);
            } else {
                this._observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) { this._cleanupObserver(); this._load(href); }
                }, { rootMargin: "400px" });
                this._observer.observe(this);
            }
        }
    }

    private _cleanupObserver() {
        if (this._observer) { this._observer.disconnect(); this._observer = null; }
    }

    disconnectedCallback() { this._cleanupObserver(); }

    private async _load(href: string) {
        if (this.getAttribute("state") === "loaded" || this._fetching) return;
        this._fetching = true;
        try {
            const r = await fetch(href.replace(/\.html$/, ""));
            this.innerHTML = await r.text();
            this.setAttribute("state", "loaded");
            this.dispatchEvent(new CustomEvent("load", { bubbles: true }));
            HTMLInclude._eagerPending.delete(this);
            if (HTMLInclude._eagerPending.size === 0) {
                document.body.classList.add("ready");
                document.body.dispatchEvent(new CustomEvent("fragments-ready", { bubbles: false }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            this._fetching = false;
        }
    }
}

if (!customElements.get("html-include")) customElements.define("html-include", HTMLInclude);
