import { highlight } from './core.ts';

export * from './core.ts';

const hideSheet = new CSSStyleSheet();
hideSheet.replaceSync('textarea[lang]{display:none}');
document.adoptedStyleSheets = [...document.adoptedStyleSheets, hideSheet];

const processed = new WeakSet<Element>();

function swapTextarea(ta: HTMLTextAreaElement): void {
    if (processed.has(ta)) return;
    processed.add(ta);
    const lang = ta.getAttribute('lang');
    if (!lang) return;
    const pre = document.createElement('pre');
    pre.className = `lang-${lang}`;
    const code = document.createElement('code');
    code.textContent = ta.value.trim();
    pre.appendChild(code);
    processed.add(pre);
    ta.replaceWith(pre);
    highlight(pre);
}

function processAdded(el: Element): void {
    if (el.matches('textarea[lang]')) {
        swapTextarea(el as HTMLTextAreaElement);
    } else if (el.matches('pre[class*="lang-"]') && !processed.has(el)) {
        processed.add(el);
        highlight(el);
    }
    el.querySelectorAll<HTMLTextAreaElement>('textarea[lang]').forEach(swapTextarea);
    el.querySelectorAll<HTMLPreElement>('pre[class*="lang-"]').forEach(pre => {
        if (!processed.has(pre)) { processed.add(pre); highlight(pre); }
    });
}

const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) processAdded(node as Element);
        }
    }
});

function init(): void {
    document.querySelectorAll<HTMLTextAreaElement>('textarea[lang]').forEach(swapTextarea);
    document.querySelectorAll<HTMLPreElement>('pre[class*="lang-"]').forEach(pre => {
        if (!processed.has(pre)) { processed.add(pre); highlight(pre); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
