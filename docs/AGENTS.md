# ⚯ fe-platform · docs · agent-ref

## topology
```
docs/site/
├─ fragments/          content sections loaded dynamically
│  ├─ 01-header.html   sticky top bar · png logo · spring hover
│  ├─ 02-hero.html     hero section · rotating png logo · nav cards
│  ├─ 03-architecture.html
│  └─ ...              self-contained html + <style> blocks
├─ index.html          shell · dynamic loader · global tokens · layout
└─ favicon.png         logo asset (used as img src too)
```

## dynamic assembly ⟿ `html-include`
site uses zero build steps. browser handles everything via custom element.

### `html-include` web component (inline in `index.html`)
- **instantiation** ⟿ `connectedCallback` sets up `IntersectionObserver`
- **lazy load** ⟿ only preloads + fetches when element enters viewport (rootMargin: 200px)
- **isolation** ⟿ renders into **Shadow DOM** (`mode: open`)
- **slots** ⟿ supports standard `<slot>` distribution for children.
- **styling** ⟿ fragments MUST contain their own `<style>` tags. global tokens (CSS variables) leak in, but layout/base styles do not.

## navigation & deep linking
- **sidebar** ⟿ nested `<details>` elements
- **interaction** ⟿ `<a>` tags inside `<summary>` point to section IDs (e.g. `#nav-poc`)
- **sync script** ⟿ handles `hashchange` + initial load
  - traverses **Shadow DOM** to find target elements
  - recursively sets `open=true` on all parent `<details>`
  - scrolls `#main-content` into view (accounting for sticky header)

## 🎨 CSS conventions
- **nesting** ⟿ use native CSS nesting exclusively
- **variables** ⟿ defined in `index.html :root` (colors, header-height, etc)
- **sticky** ⟿ header is sticky (z-index: 100). sidebars use `position: sticky` + `::before` pseudo-element for full-height borders.
- **responsive** ⟿ grid-to-block shift at `@media (max-width: 999px)`

## 💡 fragment editing guidelines
- **self-containment** ⟿ fragment must be valid HTML with its own `<style>` block
- **width** ⟿ assume `width: 100%` from host
- **keyframes** ⟿ `@keyframes` MUST be top-level in `<style>` (not nested)
- **no emojis** ⟿ use descriptive text or technical UTF-8 symbols (✦, ❖, ◎, ➤, ⎔, ⧉, ۞, ✺)
- **branding** ⟿ "Ship independently. Compose natively." belongs in hero
- **rotation** ⟿ image rotation needs `transform-origin: center center` + `display: block`

## maintenance rules
- **index.html is SOURCE** ⟿ do not ignore it. do not overwrite it from fragments.
- **communication** ⟿ follow root `AGENTS.md` cardinal rule for clarity over grammar.
