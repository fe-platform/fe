# ⚯ fe-platform · docs · agent-ref

This guide defines the structure and build system for the documentation site.

## Topology
```
docs/site/
├─ fragments/          Content sections as HTML fragments
│  ├─ 01-header.html   Header with version dropdown
│  ├─ 02-hero.html     Hero section with tagline
│  ├─ 03-architecture.html
│  └─ ...              Other content sections
├─ styles/             Modular CSS files (concatenated by build.ts)
│  ├─ 00-tokens.css    Color variables and dark mode
│  ├─ 01-base.css      Resets and body styles
│  └─ ...              Other style modules
├─ index.template.html Skeleton HTML (Head, Scripts, Layout)
├─ build.ts            Bun script to compose fragments and styles
├─ index.html          Generated output (!committed · in .gitignore)
└─ style.css           Generated output (!committed · in .gitignore)
```

## Toolchain
- **Bun**: Used for the build script.
- **Vanilla HTML/CSS**: No framework used for the docs site itself.

## Build Process
The site is built by composing HTML fragments into `index.template.html` and concatenating CSS files from `styles/` into `style.css`.
```bash
# To build the site:
bun run build.ts
```
The generated `index.html` and `style.css` are ignored by Git. Always edit the `fragments/` or `styles/` directly.

## Guidelines
- **No Emojis**: Do not use emojis in any documentation content.
- **TypeScript Foundation**: Always mention that the platform is TypeScript-based.
- **Source-First**: Emphasize that MFEs are shipped as raw source, not bundles.
- **ES Modules**: Highlight that MFEs can export anything; `render()` is only for routes.
- **Branding**: The tagline "Ship independently. Compose natively." belongs in the Hero section.
- **Versioning**: The version dropdown in the header points to `<version>/` routes.
