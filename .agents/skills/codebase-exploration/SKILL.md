---
name: codebase-exploration
description: >-
  Explore, navigate, index, and build structured context representations of the codebase using AST parsing, targeted ripgrep, and Repomix bundling.
---

# Codebase Exploration Standard

## Purpose & Scope
Provides efficient, low-overhead navigation and mental mapping of large codebases without polluting LLM context windows.

## Operational Procedures
1. **Targeted Subtree Scanning**:
   - Use `Get-ChildItem` with depth filters rather than recursive dumps.
   - Use `Select-String` with `-Context` to inspect specific function signatures and docstrings.
2. **Repomix Context Bundling**:
   - When preparing context for deep analysis, generate a focused pack using Repomix:
     ```bash
     npx repomix --include "backend/routes/**/*.py,backend/database/**/*.py" --ignore "**/*.pickle,**/*.pth"
     ```
   - Inspect token count and structure before feeding to subagents.
3. **AST Symbol Mapping**:
   - Map class definitions, decorator chains, and route registries via Python's `ast` module.

## Verification Checklist
- [ ] Context files respect `.gitignore` rules (no `.env`, `.pickle`, or `.db` files packed).
- [ ] Generated repository maps remain under token budget thresholds (< 15,000 tokens).
- [ ] Symbol relationships are verified against actual imported definitions.


---

## Skill Metadata
- **Category**: Core Engineering
- **Authoritative Reference**: yamadashy/repomix; Antigravity Codebase Exploration Standard
- **License**: MIT
- **Scope**: Workspace Agent Skill (`.agents/skills/codebase-exploration`)
