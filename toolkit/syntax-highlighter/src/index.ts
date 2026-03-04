/**
 * @fe-platform/syntax-highlighter
 * A high-performance syntax highlighter using the CSS Custom Highlight API.
 * 
 * @module
 */

// Define categories for the Highlight API
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  ::highlight(hl-keyword) { color: var(--hl-keyword, #4338ca); font-weight: 700; }
  ::highlight(hl-argument) { color: var(--hl-argument, #f59e0b); }
  ::highlight(hl-string) { color: var(--hl-string, #10b981); }
  ::highlight(hl-comment) { color: var(--hl-comment, #4a4a48); font-style: var(--hl-comment-style, italic); opacity: 0.7; }
  ::highlight(hl-type) { color: var(--hl-type, #3b82f6); }
  ::highlight(hl-number) { color: var(--hl-number, #f59e0b); }
`);

export type Category = 'keyword' | 'argument' | 'string' | 'comment' | 'type' | 'number';

const categories: Record<Category, Highlight> = {
    keyword: new Highlight(),
    argument: new Highlight(),
    string: new Highlight(),
    comment: new Highlight(),
    type: new Highlight(),
    number: new Highlight()
};

if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
    for (const k in categories) {
        CSS.highlights.set('hl-' + k, categories[k as Category]);
    }
}

interface Rule {
    k: Category;
    re: RegExp;
}

const languages: Record<string, Rule[]> = {
    shell: [
        { k: 'comment', re: /#.*/g },
        { k: 'string', re: /"[^"]*"|'[^']*'/g },
        { k: 'keyword', re: /^(?:fe|bun|npm|yarn|node|git|npx)(?:\s+[\w-]+)?/gm },
        { k: 'type', re: /\s-\w+|--[\w-]+/g },
        { k: 'argument', re: /<[^>]+>|[\w./@:()+-]+/g }
    ],
    ts: [
        { k: 'comment', re: /\/\/.*/g },
        { k: 'string', re: /"[^"]*"|'[^']*'|`[^`]*`/g },
        { k: 'keyword', re: /\b(import|export|function|const|let|var|await|return|if|else|while|for|try|catch|throw|new|async|type|interface|satisfies|as|from|default|static)\b/g },
        { k: 'type', re: /\b[A-Z]\w*\b/g },
        { k: 'number', re: /\b\d+\b/g }
    ],
    json: [
        { k: 'keyword', re: /"[^"]*"(?=\s*:)/g },
        { k: 'string', re: /:\s*"[^"]*"/g },
        { k: 'number', re: /\b(true|false|null|\d+)\b/g },
        { k: 'comment', re: /\/\/.*/g }
    ]
};

/**
 * Applies syntax highlighting to all code blocks within the given root.
 * Targets <pre> elements with a class like `lang-ts`, `lang-shell`, or `lang-json`.
 * 
 * @param root - The root element (Document or Element) to search for code blocks.
 */
export function highlight(root: Document | Element): void {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;

    // Internal stylesheet adoption
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
            const matches: Array<{ k: Category; start: number; end: number; text: string }> = [];

            rules.forEach(({ k, re }) => {
                re.lastIndex = 0;
                let m: RegExpExecArray | null;
                while (m = re.exec(text)) {
                    matches.push({ k, start: m.index, end: m.index + m[0].length, text: m[0] });
                }
            });

            matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

            let lastEnd = 0;
            matches.forEach(m => {
                if (m.start >= lastEnd) {
                    let s = m.start;
                    let l = m.end - m.start;
                    
                    if (lang === 'json' && m.k === 'string') {
                        const cm = m.text.match(/:\s*/);
                        if (cm) {
                            s += cm[0].length;
                            l -= cm[0].length;
                        }
                    }
                    
                    try {
                        const range = new Range();
                        range.setStart(node!, s);
                        range.setEnd(node!, s + l);
                        categories[m.k].add(range);
                        lastEnd = m.end;
                    } catch (e) {}
                }
            });
        }
    });
}

/**
 * Applies a theme by setting CSS variables on the root.
 * 
 * @param theme - A map of category names to color values.
 */
export function applyTheme(theme: Partial<Record<Category | 'comment-style', string>>): void {
    const root = document.documentElement;
    for (const [prop, val] of Object.entries(theme)) {
        if (val) root.style.setProperty('--hl-' + prop, val);
    }
}
