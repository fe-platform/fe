# @feo/fe-syntax-highlighter

Syntax highlighting via the [CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API). Styles text ranges in place rather than wrapping tokens in `<span>` elements, so the DOM stays clean and copy-paste works naturally.

## Credits

Based on techniques from **[Ivo Culic](https://ivoculic.dev/)**: [CSS Custom Highlight API for Syntax Highlighting](https://front-end.tips/css-highlights-api-for-syntax-highlighting/).

## Usage

```js
import { highlight } from "@feo/fe-syntax-highlighter";

// highlights every <pre class="lang-*"> inside the element
highlight(document);
highlight(myContainer);
```

The default theme (`autoTheme`) switches between light and dark based on `prefers-color-scheme`. It is applied to `document.adoptedStyleSheets` on first call.

### Languages

Built-in: `ts`, `json`, `shell`, `html`. Pass the name as a class on `<pre>`:

```html
<pre class="lang-ts">const x = 42;</pre>
```

Register additional languages at runtime:

```js
import { registerLanguage } from "@feo/fe-syntax-highlighter";

registerLanguage("rust", [
    { category: "keyword", pattern: /\b(fn|let|mut|pub|use|mod)\b/g },
    { category: "comment", pattern: /\/\/.*/g }
]);
```

### Themes

Five themes ship as importable CSS strings:

| Export | Path |
|---|---|
| `autoTheme` | `@feo/fe-syntax-highlighter/themes/auto` |
| `lightTheme` | `@feo/fe-syntax-highlighter/themes/light` |
| `darkTheme` | `@feo/fe-syntax-highlighter/themes/dark` |
| `draculaTheme` | `@feo/fe-syntax-highlighter/themes/dracula` |
| `githubLightTheme` | `@feo/fe-syntax-highlighter/themes/github-light` |

Switch themes by passing the string to `setHighlightSheet`:

```js
import { setHighlightSheet } from "@feo/fe-syntax-highlighter";
import { draculaTheme } from "@feo/fe-syntax-highlighter/themes/dracula";

setHighlightSheet(draculaTheme);
```

Override individual colors with CSS custom properties:

```css
:root {
    --hl-keyword: #4338ca;
    --hl-string: #10b981;
}
```

Available properties: `--hl-keyword`, `--hl-string`, `--hl-comment`, `--hl-type`, `--hl-number`, `--hl-operator`, `--hl-function`, `--hl-property`, `--hl-variable`, `--hl-argument`, `--hl-constant`, `--hl-boolean`.

## Browser support

Requires the CSS Custom Highlight API. Supported in Chrome 105+, Safari 17.2+, Firefox 135+. `highlight()` is a no-op in unsupported browsers.

## License

MIT
