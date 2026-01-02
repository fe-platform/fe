# Agent Operational Protocols

## Core Directive

Execute all development tasks within the Ore/Metal/Blade architecture. Adhere strictly to the One Version Policy and the NATIVERS standard library.

## Toolchain Utilization

Utilize the provided Model Context Protocol (MCP) servers for all operations:

- **Serena**: Use for AST analysis, symbol navigation, and semantic understanding.
- **Linear/GitHub**: Use for task ingestion and status updates.
- **ast-grep**: Use for structural search and edits.

## The 5 Cardinal Rules

**STRICT ENFORCEMENT REQUIRED.**

1. **Obtain Permission**: Explicitly request user approval before committing any changes to the repository.

2. **Limit Debugging**: Halt debugging after 2 failed attempts. Report the current state and request manual guidance.

3. **Reject Stubbing**: Implement only production-ready code. Do not stub, mock, or create temporary workarounds unless explicitly instructed.

4. **Communicate Effectively**: Be Concise, Complete, Correct, Confident, and Clear. State facts; remove fluff.

5. **Enforce Length Limits**: Maintain all source files under 180 lines. Refactor immediately if this limit is exceeded.

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
