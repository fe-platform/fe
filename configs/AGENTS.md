# ⬡ configs/ · agent-ref
↑ /AGENTS.md for repo-wide context

## import-map.json
```json
{
  "imports": {
    "fe(@acme/mfe-a)": "./uploads/mfe-a/1.0.0/index.js",
    "fe(@acme/mfe-b)": "./uploads/mfe-b/1.0.0/index.js"
  }
}
```

## semantics
key   = fe() bare-specifier = exact string in `import … from "fe(@acme/…)"`
value = URL served at runtime
  local:   "./uploads/<slug>/<ver>/index.js"  (relative to index.html · served by cli-serve at /uploads/*)
  prod:    "https://cdn.example.com/<slug>/<ver>/index.js"

## consumers
```
cli/src/build.ts:buildShell()
  ← readImportMap()
  → inject as <script type="importmap"> into shell/dist/index.html
  (happens every `build shell` · must rebuild shell after editing this file)

browser at runtime
  → resolves fe() bare-specifiers to JS file URLs
```

## update procedure
```
1. bun cli/src/index.ts admin upload <mfe>
     prints:  "fe(@acme/mfe-x)":"./uploads/mfe-x/1.0.0/index.js"
2. edit import-map.json: add/update the printed key-value
3. bun cli/src/index.ts build shell   (re-injects updated map)
```

## invariants
- !edited by admin-upload (intentional separation: artifact≠config)
- !remove existing entries without ensuring no live shell references them
- key must exactly match import specifier in consuming source files
- value must be reachable from shell/dist/index.html at runtime
