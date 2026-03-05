# ⚯ fe-platform · docs · agent-ref

## topology
```
docs/site/
├─ fragments/          content sections loaded dynamically
│  ├─ 01-header        (no ext) sticky top bar · png logo
│  ├─ 02-hero          (no ext) hero section · nav cards
│  └─ ...              self-contained html + <style> blocks
├─ _headers            cloudflare cache optimization rules
├─ index.html          shell · inlined assembly · global tokens · layout
└─ favicon.png         logo asset (used as img src too)
```

## dynamic assembly ⟿ `html-include`
site uses zero build steps and relies on native browser features.

### `html-include` web component (inlined in `index.html`)
- **instantiation** ⟿ `connectedCallback` sets up `IntersectionObserver`
- **lazy load** ⟿ preloads + fetches when element enters viewport (rootMargin: 400px)
- **redirect avoidance** ⟿ ALWAYS use extension-less URLs (e.g. `href="fragments/01-header"`). Component strips `.html` automatically if present.
- **rendering** ⟿ renders into `innerHTML` (Light DOM). This allows global CSS variables and syntax highlighting styles to apply naturally.
- **highlighting** ⟿ triggers `highlight(this)` from `@fe-platform/syntax-highlighter` immediately after content load.

## performance & caching
- **zero waterfalls** ⟿ all CSS and JS must be INLINED in `index.html`. Do not use external `.css` or `.js` files for the critical path.
- **preloading** ⟿ critical fragments (`01-header`, `02-hero`) are preloaded in `<head>` as `fetch` tasks.
- **esm** ⟿ uses `<script type="module">` exclusively. No IIFEs.
- **import maps** ⟿ dependencies (like the highlighter) are resolved via `importmap`.
- **edge caching** ⟿ `_headers` ensures 1-hour browser cache and 1-day edge cache for HTML/fragments, with background revalidation.

## 🎨 syntax highlighting
Standardized on `@fe-platform/syntax-highlighter` categories. Use `applyTheme` to map these to the document palette:
- **categories** ⟿ `keyword`, `string`, `comment`, `type`, `number`, `operator`, `function`, `property`, `variable`, `argument`, `constant`, `boolean`.

## 💡 fragment editing guidelines
- **self-containment** ⟿ fragment must be valid HTML with its own `<style>` block.
- **width** ⟿ assume `width: 100%` from host.
- **keyframes** ⟿ `@keyframes` MUST be top-level in `<style>` (not nested).
- **no emojis** ⟿ use descriptive text or technical UTF-8 symbols (✦, ❖, ◎, ➤, ⎔, ⧉, ۞, ✺).

## maintenance rules
- **index.html is SOURCE** ⟿ do not ignore it. It contains the master logic and styles.
- **versioning** ⟿ keep the `importmap` pointed to the latest JSR version of the highlighter.
