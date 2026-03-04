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
├─ index.template.html Skeleton HTML (Head, Scripts, Layout)
├─ style.css           Sitewide styles
├─ build.ts            Bun script to compose fragments into index.html
└─ index.html          Generated output (!committed · in .gitignore)
```

## Toolchain
- **Bun**: Used for the build script.
- **Vanilla HTML/CSS**: No framework used for the docs site itself.

## Build Process
The site is built by composing HTML fragments from `fragments/` into the `index.template.html` file.
```bash
# To build the site:
npx bun run build.ts
```
The generated `index.html` is ignored by Git. Always edit the `fragments/` or `style.css` directly.

## Guidelines
- **No Emojis**: Do not use emojis in any documentation content.
- **TypeScript Foundation**: Always mention that the platform is TypeScript-based.
- **Source-First**: Emphasize that MFEs are shipped as raw source, not bundles.
- **ES Modules**: Highlight that MFEs can export anything; `render()` is only for routes.
- **Branding**: The tagline "Ship independently. Compose natively." belongs in the Hero section.
- **Versioning**: The version dropdown in the header points to `<version>/` routes.
