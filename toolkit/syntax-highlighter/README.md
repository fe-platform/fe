# @fe-platform/syntax-highlighter

A high-performance syntax highlighter using the **CSS Custom Highlight API**.

It styles text ranges directly without adding any extra DOM nodes (spans), resulting in 2-3x faster rendering and cleaner copy-pasting.

## Credits
This project was inspired by and based on the techniques described by **[Ivo Culic](https://ivoculic.dev/)** in [CSS Custom Highlight API for Syntax Highlighting](https://front-end.tips/css-highlights-api-for-syntax-highlighting/).

## Features
- **Zero DOM Overhead:** Styles text nodes directly using `::highlight()`.
- **Priority-Based Engine:** Resolves overlapping tokens (e.g., keywords inside strings) with a "best-match-wins" strategy.
- **Language Support:**
  - **TypeScript:** Keywords, types, strings, and comments.
  - **JSON:** Keys, string values, and numeric/boolean literals.
  - **Shell:** Command + Subcommand pairs, flags, and arguments.
- **Theme Plugins:** Decoupled from logic via CSS variables (`--hl-k`, `--hl-s`, etc.).
- **Vanilla ESM:** Distributed as `.mjs` for direct use via `esm.sh` or JSR.

## Usage

### Direct Browser Usage (via esm.sh)
```html
<script type="module">
  import { highlight } from 'https://esm.sh/jsr/@fe-platform/syntax-highlighter';
  
  // Highlight everything on the page
  highlight(document);
</script>
```

### Programmatic Usage
```javascript
import { highlight } from "@fe-platform/syntax-highlighter";

// Highlight a specific container or shadow root
highlight(myContainer);
```

## Theming
The highlighter uses CSS variables for all colors. You can override them in your global CSS:

```css
:root {
  --hl-k: #4338ca; /* Keywords */
  --hl-s: #10b981; /* Strings */
  --hl-c: #4a4a48; /* Comments */
  --hl-c-style: italic;
}
```

## License
MIT
