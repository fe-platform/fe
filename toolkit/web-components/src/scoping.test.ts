import { test, expect } from "bun:test";

// The selector-scoping algorithm used by FEComponent.connectedCallback.
// Extracted inline because importing the class requires a DOM environment.
function scopeSelectors(css: string, name: string): string {
    return css.replace(/([^\r\n,{}]+)(?=[^{}]*\{)/g, (m) => {
        if (m.trim().startsWith("@") || m.includes(":root")) return m;
        return m.trim().split(/\s*,\s*/).map(sel => `[data-fe-id="${name}"] ${sel}`).join(", ");
    });
}

test("scopes a plain selector with data-fe-id", () => {
    // The regex consumes whitespace before { as part of the selector match.
    expect(scopeSelectors(".card { color: red }", "Card"))
        .toBe('[data-fe-id="Card"] .card{ color: red }');
});

test("scopes each comma-separated selector individually", () => {
    // The comma is not captured (excluded from [^\r\n,{}]+), so each part is matched
    // and prefixed separately; the comma between them is preserved in-place.
    expect(scopeSelectors("h1, h2 { margin: 0 }", "Card"))
        .toBe('[data-fe-id="Card"] h1,[data-fe-id="Card"] h2{ margin: 0 }');
});

test("leaves @-rules and :root selectors unchanged", () => {
    expect(scopeSelectors(":root { --color: red }", "Card")).toBe(":root { --color: red }");
    expect(scopeSelectors("@media (max-width: 600px) { .a { } }", "Card"))
        .toContain("@media");
});
