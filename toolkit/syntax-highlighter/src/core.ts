import { Category, Rule } from './types.ts';
import { ts } from './languages/ts.ts';
import { json } from './languages/json.ts';
import { shell } from './languages/shell.ts';
import { html } from './languages/html.ts';
import { autoTheme } from './themes/default.ts';

const sheet = new CSSStyleSheet();
sheet.replaceSync(autoTheme);

/** One `Highlight` object per token category, registered in `CSS.highlights` as `hl-<category>`. */
export const categories: Record<Category, Highlight> = {
    keyword: new Highlight(),
    string: new Highlight(),
    comment: new Highlight(),
    type: new Highlight(),
    number: new Highlight(),
    operator: new Highlight(),
    function: new Highlight(),
    property: new Highlight(),
    variable: new Highlight(),
    argument: new Highlight(),
    constant: new Highlight(),
    boolean: new Highlight()
};

if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
    for (const k in categories) CSS.highlights.set('hl-' + k, categories[k as Category]);
}

const languages: Record<string, Rule[]> = { ts, json, shell, html };

/**
 * Registers a language grammar at runtime.
 * @param name - Language identifier matched against `lang-<name>` class names.
 * @param rules - Tokenization rules applied in order; earlier rules win on overlap.
 */
export function registerLanguage(name: string, rules: Rule[]): void {
    languages[name] = rules;
}

function highlightPre(el: HTMLPreElement): void {
    const langMatch = el.className.match(/lang-(\w+)/);
    const lang = langMatch ? langMatch[1] : null;
    if (!lang || !languages[lang]) return;

    const rules = languages[lang];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node: Text | null;

    while (node = walker.nextNode() as Text | null) {
        const text = node.textContent || '';
        const matches: Array<{ category: Category; start: number; end: number }> = [];

        if (lang === 'html') {
            const subLangs = [
                { pattern: /<style\b[^>]*>([\s\S]*?)<\/style>/gi, lang: 'ts' },
                { pattern: /<script\b[^>]*>([\s\S]*?)<\/script>/gi, lang: 'ts' }
            ];
            subLangs.forEach(({ pattern, lang: sub }) => {
                pattern.lastIndex = 0;
                let m: RegExpExecArray | null;
                while (m = pattern.exec(text)) {
                    const offset = m.index + m[0].indexOf(m[1]);
                    languages[sub]?.forEach(({ category, pattern: p }) => {
                        p.lastIndex = 0;
                        let sm: RegExpExecArray | null;
                        while (sm = p.exec(m![1])) {
                            matches.push({ category, start: offset + sm.index, end: offset + sm.index + sm[0].length });
                        }
                    });
                }
            });
        }

        rules.forEach(({ category, pattern }) => {
            pattern.lastIndex = 0;
            let m: RegExpExecArray | null;
            while (m = pattern.exec(text)) {
                matches.push({ category, start: m.index, end: m.index + m[0].length });
            }
        });

        matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

        let lastEnd = 0;
        for (const m of matches) {
            if (m.start >= lastEnd) {
                try {
                    const range = new Range();
                    range.setStart(node!, m.start);
                    range.setEnd(node!, m.end);
                    categories[m.category].add(range);
                    lastEnd = m.end;
                } catch (_) {}
            }
        }
    }
}

function applySheet(root: Document | Element): void {
    const doc = root instanceof Document ? root : root.ownerDocument;
    if (doc && !doc.adoptedStyleSheets.includes(sheet)) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    }
    const rootNode = root.getRootNode();
    if (rootNode instanceof ShadowRoot && !rootNode.adoptedStyleSheets.includes(sheet)) {
        rootNode.adoptedStyleSheets = [...rootNode.adoptedStyleSheets, sheet];
    }
}

/**
 * Applies syntax highlighting to all `<pre class="lang-*">` elements inside `root`,
 * or to `root` itself if it is a matching `<pre>`. Adds the default stylesheet to
 * `root.ownerDocument.adoptedStyleSheets` on first call.
 */
export function highlight(root: Document | Element): void {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
    applySheet(root);
    const blocks = root instanceof Element && root.matches('pre[class*="lang-"]')
        ? [root as HTMLPreElement]
        : [...root.querySelectorAll<HTMLPreElement>('pre[class*="lang-"]')];
    blocks.forEach(highlightPre);
}

/**
 * Sets CSS custom properties on `document.documentElement` to override individual token colors.
 * Property names map to `--hl-<key>` (e.g. `{ keyword: "#ff0" }` sets `--hl-keyword: #ff0`).
 */
export function applyTheme(theme: Partial<Record<Category | 'comment-style', string>>): void {
    for (const [prop, val] of Object.entries(theme)) {
        if (val) document.documentElement.style.setProperty('--hl-' + prop, val);
    }
}

/**
 * Replaces the active theme stylesheet. Pass any theme string from the `themes/*` exports,
 * or supply raw `::highlight()` CSS rules to define a fully custom theme.
 */
export function setHighlightSheet(css: string): void {
    sheet.replaceSync(css);
}
