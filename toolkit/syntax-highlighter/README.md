# @fe-platform/syntax-highlighter

A high-performance, modular syntax highlighter using the **CSS Custom Highlight API**.

It styles text ranges directly without adding any extra DOM nodes (spans), resulting in 2-3x faster rendering and cleaner copy-pasting.

## Credits
This project was inspired by and based on the techniques described by **[Ivo Culic](https://ivoculic.dev/)** in [CSS Custom Highlight API for Syntax Highlighting](https://front-end.tips/css-highlights-api-for-syntax-highlighting/).

## Features
- **Zero DOM Overhead:** Styles text nodes directly using `::highlight()`.
- **Priority-Based Engine:** Resolves overlapping tokens (e.g., keywords inside strings) with a "best-match-wins" strategy.
- **Modular Architecture:** Easily add new languages and themes as plugins.
- **Language Support:**
  - **TypeScript:** Comprehensive keywords, types, strings (including template literals), comments (inline & multiline), numbers, operators, function names, and properties.
  - **JSON:** Properties (keys), string values, numeric/boolean/null literals, and punctuation.
  - **Shell:** Common commands, variables (`$VAR`), flags, arguments, and operators.
- **Theme Plugins:** Decoupled from logic via CSS variables or raw CSS Highlight API styles.
- **Vanilla ESM:** Distributed as `.ts` for direct use via `esm.sh` or JSR.

## Usage

### Direct Browser Usage (via esm.sh)
```html
<script type="module">
  import { highlight } from 'https://esm.sh/jsr/@fe-platform/syntax-highlighter';
  
  // Highlight everything on the page using autoTheme (prefers-color-scheme)
  highlight(document);
</script>
```

### Programmatic Usage
```javascript
import { highlight } from "@fe-platform/syntax-highlighter";

// Highlight a specific container or shadow root
highlight(myContainer);
```

## Plugin System

### Adding a Language
You can register new languages by providing a name and an array of regex rules:

```javascript
import { highlight, registerLanguage } from "@fe-platform/syntax-highlighter";

registerLanguage('my-lang', [
  { category: 'keyword', pattern: /\b(foo|bar)\b/g },
  { category: 'comment', pattern: /\/\/.*/g }
]);
```

### Applying Themes
The highlighter comes with several built-in themes that can be applied dynamically.

#### Available Themes:
- `autoTheme` (Default): System-aware switching between light/dark.
- `lightTheme`: Modern light theme.
- `darkTheme`: Modern dark theme.
- `draculaTheme`: Classic Dracula dark mode.
- `githubLightTheme`: GitHub-inspired light mode.

#### Example: Switching to Dracula
```javascript
import { setHighlightSheet } from "@fe-platform/syntax-highlighter";
import { draculaTheme } from "@fe-platform/syntax-highlighter/themes/dracula";

// Apply the theme globally
setHighlightSheet(draculaTheme);
```

#### Option 2: Fine-tuning with CSS Variables
You can also override specific colors using CSS variables:

```css
:root {
  --hl-keyword: #4338ca;
  --hl-string: #10b981;
}
```

## Theming Categories
The following categories are available for styling:
- `keyword`, `string`, `comment`, `type`, `number`, `operator`, `function`, `property`, `variable`, `argument`, `constant`, `boolean`

## License
MIT
