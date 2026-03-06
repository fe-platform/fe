export class HTMLInclude extends HTMLElement {
    static readonly _eagerPending = new Set<HTMLInclude>();

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
