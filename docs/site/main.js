import { highlight, applyTheme } from "@fe-platform/syntax-highlighter";

// 1. Configure and apply syntax highlighting
applyTheme({
    keyword: "var(--accent)",
    argument: "var(--card-a)",
    string: "var(--card-c)",
    comment: "var(--mid)",
    "comment-style": "italic",
    type: "var(--card-b)",
    number: "var(--card-a)",
    operator: "var(--mid)",
    function: "var(--accent)",
    property: "var(--card-d)",
    variable: "var(--card-a)",
    boolean: "var(--accent)",
    constant: "var(--card-b)"
});

highlight(document);

// 2. Navigation Synchronization Logic
export function getTarget(root, id) {
    if (!root) return null;
    const el = root.getElementById
        ? root.getElementById(id)
        : root.querySelector('[id="' + id + '"]');
    if (el) return el;

    const includes = root.querySelectorAll("html-include");
    for (const inc of includes) {
        const found = getTarget(inc, id);
        if (found) return found;
    }
    return null;
}

export function sync() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = hash.slice(1);

    const target = getTarget(document, id);
    if (target && target.tagName === "DETAILS") {
        let current = target;
        while (current) {
            if (current.tagName === "DETAILS") current.open = true;
            current = current.parentElement;
        }
        document.getElementById("main-content").scrollIntoView();
    }
}

window.addEventListener("hashchange", sync);

// 3. Custom Element: html-include
customElements.define(
    "html-include",
    class extends HTMLElement {
        connectedCallback() {
            const href = this.getAttribute("href");
            if (!href) return;
            if (this.getAttribute("loading") === "eager") {
                this._load(href);
            } else {
                new IntersectionObserver(
                    (entries, observer) => {
                        if (entries[0].isIntersecting) {
                            this._load(href);
                            observer.disconnect();
                        }
                    },
                    { rootMargin: "400px" },
                ).observe(this);
            }
        }
        async _load(href) {
            try {
                const r = await fetch(href);
                this.innerHTML = await r.text();
                highlight(this);
                if (window.location.hash) {
                    setTimeout(sync, 10);
                }
            } catch (err) {
                console.error(err);
            }
        }
    },
);

// Initial sync
sync();
