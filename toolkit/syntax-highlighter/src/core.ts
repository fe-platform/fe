/**
 * @module
 * The core engine of @fe-platform/syntax-highlighter.
 */
import { Category, Rule } from './types.ts';
import { ts } from './languages/ts.ts';
import { json } from './languages/json.ts';
import { shell } from './languages/shell.ts';
import { html } from './languages/html.ts';
import { autoTheme } from './themes/default.ts';

const sheet = new CSSStyleSheet();
sheet.replaceSync(autoTheme);

/**
 * Global Highlight objects for each category.
 * These are shared across all code blocks highlighted by the library.
 */
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
    for (const k in categories) {
        CSS.highlights.set('hl-' + k, categories[k as Category]);
    }
}

const languages: Record<string, Rule[]> = {
    ts,
    json,
    shell,
    html
};

/**
 * Registers a new language grammar at runtime.
 * 
 * @param name - The language identifier (e.g., 'rust', 'python').
 * @param rules - The array of tokenization rules.
 */
export function registerLanguage(name: string, rules: Rule[]): void {
    languages[name] = rules;
}

/**
 * Applies syntax highlighting to all code blocks within the given root.
 * Targets <pre> elements with a class containing `lang-<name>`.
 * 
 * @param root - The root element (Document, Element, or ShadowRoot) to search.
 */
export function highlight(root: Document | Element): void {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;

    const doc = root instanceof Document ? root : root.ownerDocument;
    if (doc && !doc.adoptedStyleSheets.includes(sheet)) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    }
    const rootNode = root.getRootNode();
    if (rootNode instanceof ShadowRoot && !rootNode.adoptedStyleSheets.includes(sheet)) {
        rootNode.adoptedStyleSheets = [...rootNode.adoptedStyleSheets, sheet];
    }

    const blocks = root.querySelectorAll<HTMLPreElement>('pre[class*="lang-"]');
    blocks.forEach(el => {
        const langMatch = el.className.match(/lang-(\w+)/);
        const lang = langMatch ? langMatch[1] : null;
        if (!lang || !languages[lang]) return;

        const rules = languages[lang];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node: Text | null;
        
        while (node = walker.nextNode() as Text | null) {
            const text = node.textContent || "";
            const matches: Array<{ category: Category; start: number; end: number; text: string }> = [];

            // Handle sub-languages for HTML
            if (lang === 'html') {
                const subLangs = [
                    { pattern: /<style\b[^>]*>([\s\S]*?)<\/style>/gi, lang: 'ts' }, // Using TS for CSS-like is better than nothing
                    { pattern: /<script\b[^>]*>([\s\S]*?)<\/script>/gi, lang: 'ts' }
                ];

                subLangs.forEach(({ pattern, lang: subLangName }) => {
                    pattern.lastIndex = 0;
                    let m: RegExpExecArray | null;
                    while (m = pattern.exec(text)) {
                        const content = m[1];
                        const offset = m.index + m[0].indexOf(content);
                        const subRules = languages[subLangName];
                        if (subRules) {
                            subRules.forEach(({ category, pattern: p }) => {
                                p.lastIndex = 0;
                                let sm: RegExpExecArray | null;
                                while (sm = p.exec(content)) {
                                    matches.push({ category, start: offset + sm.index, end: offset + sm.index + sm[0].length, text: sm[0] });
                                }
                            });
                        }
                    }
                });
            }

            rules.forEach(({ category, pattern }) => {
                pattern.lastIndex = 0;
                let m: RegExpExecArray | null;
                while (m = pattern.exec(text)) {
                    matches.push({ category, start: m.index, end: m.index + m[0].length, text: m[0] });
                }
            });

            matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

            let lastEnd = 0;
            matches.forEach(m => {
                if (m.start >= lastEnd) {
                    try {
                        const range = new Range();
                        range.setStart(node!, m.start);
                        range.setEnd(node!, m.end);
                        categories[m.category].add(range);
                        lastEnd = m.end;
                    } catch (e) {}
                }
            });
        }
    });
}

/**
 * Applies a theme by setting CSS variables on the root.
 * Useful for runtime color customization.
 * 
 * @param theme - A map of category names to color/style values.
 */
export function applyTheme(theme: Partial<Record<Category | 'comment-style', string>>): void {
    const root = document.documentElement;
    for (const [prop, val] of Object.entries(theme)) {
        if (val) root.style.setProperty('--hl-' + prop, val);
    }
}

/**
 * Replaces the current global Highlight CSS with a new stylesheet.
 * Use this to apply pre-made theme strings (e.g. from `@fe-platform/syntax-highlighter/themes/dracula`).
 * 
 * @param css - The raw CSS string containing ::highlight() rules.
 */
export function setHighlightSheet(css: string): void {
    sheet.replaceSync(css);
}
