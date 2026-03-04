/**
 * @module
 * Dracula theme for @fe-platform/syntax-highlighter.
 */

/**
 * A dark theme inspired by the popular Dracula color scheme.
 */
export const draculaTheme: string = `
  ::highlight(hl-keyword) { color: #ff79c6; font-weight: 700; }
  ::highlight(hl-string) { color: #f1fa8c; }
  ::highlight(hl-comment) { color: #6272a4; font-style: italic; opacity: 0.8; }
  ::highlight(hl-type) { color: #8be9fd; font-style: italic; }
  ::highlight(hl-number) { color: #bd93f9; }
  ::highlight(hl-operator) { color: #ff79c6; }
  ::highlight(hl-function) { color: #50fa7b; }
  ::highlight(hl-property) { color: #66d9ef; }
  ::highlight(hl-variable) { color: #f8f8f2; }
  ::highlight(hl-argument) { color: #ffb86c; }
  ::highlight(hl-constant) { color: #bd93f9; }
  ::highlight(hl-boolean) { color: #bd93f9; font-weight: 700; }
`;
