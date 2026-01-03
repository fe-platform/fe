# Agent Operational Protocols

## Core Directive

Execute all development tasks within the Ore/Metal/Blade architecture. Adhere strictly to the One Version Policy and the NATIVERS standard library.

## Toolchain Utilization

Utilize the provided Model Context Protocol (MCP) servers for all operations:

- **Serena**: Use for AST analysis, symbol navigation, and semantic understanding (Tools: `find_symbol`, `find_referencing_symbols`, `insert_after_symbol`).
- **mcp-advisor**: Use for MCP configuration compliance advisory and specification understanding (Tools: `explain`, `evaluate_server_compliance`).
- **bun-doc-mcp**: Use for GitHub-focused Bun tooling documentation lookup (bunx-powered).
- **context7**: Use for context-aware code reasoning and fetching up-to-date library documentation (Tools: `resolve-library-id`, `get-library-docs`).
- **vibe-check-mcp**: Use for metacognitive oversight, preventing tunnel vision, and protocol alignment validation (Tools: `vibe_check`, `vibe_distill`, `vibe_learn`).
- **taskmanager**: Use for queue-based task planning, execution, and tracking (Tools: `request_planning`, `get_next_task`, `mark_task_done`).
- **sequential-thinking**: Use for structured, step-by-step problem solving and hypothesis generation (Tool: `sequential_thinking`).
- **ESLint**: Use for MCP-integrated ESLint rule enforcement and code quality checks.

## The 7 Cardinal Rules

**STRICT ENFORCEMENT REQUIRED.**

1. **Obtain Permission**: Explicitly request user approval before committing any changes to the repository.

2. **Limit Debugging**: Halt debugging after 2 failed attempts. Report the current state and request manual guidance.

3. **Reject Stubbing**: Implement only production-ready code. Do not stub, mock, or create temporary workarounds unless explicitly instructed.

4. **Communicate Effectively (CRITICAL)**: Be Concise, Complete, Correct, Confident, and Clear. State facts; remove fluff. DO NOT REPEAT. Avoid restating edits (e.g., quoting edited content in text after making file changes) — the IDE displays edits directly, so repetition is unnecessary. Do not print verbose summaries after each turn in the agent chat. Keep all chat summaries clean, clear, correct, complete, concise, and confident-neutral in tone.

5. **Enforce Length Limits**: Maintain all source files under 180 lines. Refactor immediately if this limit is exceeded.

6. **Functions Over Classes**: Use functions and composition. Only use classes when there is a special high-impact benefit. Default to functional programming patterns.

7. **Use Bun Tooling**: Always use `bun-tasks` to run scripts in parallel. Use Bun to bundle (via `scripts/build.ts`). Use `tsc` only to generate `.d.ts` files for packages.

## Execution Workflow

### 1. Ingestion

- Retrieve task details via the Task Manager MCP.
- Map relevant symbols using Serena to understand the dependency graph.
- **Constraint**: Do not read full files unnecessarily; rely on symbol maps.

### 2. Implementation

- Validate whether changes belong to Ore (Core), Metal (Config), or Blade (Product).
- Use ast-grep for structural edits to ensure syntax integrity.
- Ensure all imports utilize the `fe:` scheme.

### 3. Verification

- Execute `fe:test` on the specific module.
- Check file length (< 180 lines).
- **Stop**: Request commit approval.
