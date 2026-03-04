/**
 * @module
 * GitHub Light theme for @fe-platform/syntax-highlighter.
 */

/**
 * A light theme inspired by GitHub's light theme.
 */
export const githubLightTheme: string = `
  ::highlight(hl-keyword) { color: #cf222e; font-weight: 700; }
  ::highlight(hl-string) { color: #0a3069; }
  ::highlight(hl-comment) { color: #6e7781; font-style: italic; opacity: 0.8; }
  ::highlight(hl-type) { color: #953800; }
  ::highlight(hl-number) { color: #0550ae; }
  ::highlight(hl-operator) { color: #cf222e; }
  ::highlight(hl-function) { color: #8250df; }
  ::highlight(hl-property) { color: #0550ae; }
  ::highlight(hl-variable) { color: #24292f; }
  ::highlight(hl-argument) { color: #953800; }
  ::highlight(hl-constant) { color: #0550ae; }
  ::highlight(hl-boolean) { color: #0550ae; font-weight: 700; }
`;
