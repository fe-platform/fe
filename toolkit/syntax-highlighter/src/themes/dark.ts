/**
 * @module
 * Dark theme for @fe-platform/syntax-highlighter.
 */

/**
 * A modern dark theme for syntax highlighting.
 */
export const darkTheme: string = `
  ::highlight(hl-keyword) { color: var(--hl-keyword, #818cf8); font-weight: 700; }
  ::highlight(hl-string) { color: var(--hl-string, #34d399); }
  ::highlight(hl-comment) { color: var(--hl-comment, #9ca3af); font-style: var(--hl-comment-style, italic); opacity: 0.8; }
  ::highlight(hl-type) { color: var(--hl-type, #60a5fa); }
  ::highlight(hl-number) { color: var(--hl-number, #fbbf24); }
  ::highlight(hl-operator) { color: var(--hl-operator, #64748b); }
  ::highlight(hl-function) { color: var(--hl-function, #818cf8); }
  ::highlight(hl-property) { color: var(--hl-property, #f472b6); }
  ::highlight(hl-variable) { color: var(--hl-variable, #fbbf24); }
  ::highlight(hl-argument) { color: var(--hl-argument, #94a3b8); }
  ::highlight(hl-constant) { color: var(--hl-constant, #a78bfa); }
  ::highlight(hl-boolean) { color: var(--hl-boolean, #818cf8); font-weight: 700; }
`;
