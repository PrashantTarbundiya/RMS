import os

SKILLS_DIR = os.path.abspath(".agents/skills")
os.makedirs(SKILLS_DIR, exist_ok=True)

skills_data = [
    # ─── CORE ENGINEERING ───
    {
        "name": "project-architecture",
        "description": "Examine, document, and enforce system-wide component architecture, module boundaries, and multi-tier data flow across Flask, Gevent, SQLite/PostgreSQL, and React 19.",
        "category": "Core Engineering",
        "reference": "Martin Fowler, Patterns of Enterprise Application Architecture; IEEE 42010 Architecture Standard",
        "license": "Apache-2.0",
        "content": """# Project Architecture Standard

## Purpose & Scope
Governs the end-to-end multi-tier system topology of AuraPass Enterprise, ensuring clean separation of concerns, process isolation, and scalable data flow.

## Architecture Topology
- **Edge / Client Tier**: React 19 SPA + Vite + Tailwind CSS + WebRTC camera stream.
- **Application Server Tier**: Flask 3.1 + Gevent WSGI server handling RESTful APIs and real-time WebSocket events.
- **Compute / Inference Tier**: DeepFace (Facenet512), InsightFace (ArcFace), GhostFaceNet ONNX, and PyTorch MobileNetV2 anti-spoofing.
- **Persistence Tier**: Dual-mode database (local sovereign SQLite `backend/data/rms.db` and cloud PostgreSQL via SQLAlchemy 2.0).
- **Asynchronous Task Tier**: Celery worker queue + Redis broker for background retraining and snapshot backups.

## Operational Procedures
1. **Module Boundary Verification**:
   - Ensure `backend/server.py` delegates business logic to `backend/services/` and database queries to `backend/database/`.
   - Ensure frontend components in `frontend/src/pages/` consume domain context via `AuthContext`, `ToastContext`, and `PwaContext`.
2. **Process Lifecycle Management**:
   - Master Gevent process handles socket listeners.
   - Workers dispose inherited SQLAlchemy connection pools (`_engine.dispose(close=False)`) upon fork to prevent deadlock.
3. **Data Flow Validation**:
   - Client Frame (Base64 JPEG) -> WebSocket/REST -> `face_detection.py` -> Landmark Alignment -> CNN Feature Extraction -> 512-d KNN Search -> Multi-Model Consensus -> Attendance Record Persistence.

## Verification Checklist
- [ ] No circular imports between `backend/routes/`, `backend/database/`, and `backend/services/`.
- [ ] Database session scopes are properly managed with `with get_db_session() as db:`.
- [ ] Frontend state changes do not cause unnecessary full-page DOM remounts.
"""
    },
    {
        "name": "codebase-exploration",
        "description": "Explore, navigate, index, and build structured context representations of the codebase using AST parsing, targeted ripgrep, and Repomix bundling.",
        "category": "Core Engineering",
        "reference": "yamadashy/repomix; Antigravity Codebase Exploration Standard",
        "license": "MIT",
        "content": """# Codebase Exploration Standard

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
"""
    },
    {
        "name": "reverse-engineering",
        "description": "Analyze compiled binary artifacts, legacy serialization formats (.pickle, .onnx, .pth), undocumented internal APIs, and network protocols.",
        "category": "Core Engineering",
        "reference": "Reverse Engineering for Beginners (Dennis Yurichev); ONNX Runtime Model Inspector",
        "license": "Apache-2.0",
        "content": """# Reverse Engineering & Artifact Inspection

## Purpose & Scope
Inspects and validates opaque binary artifacts, neural network weights, vector indices, and serialized state to prevent regressions and unauthorized changes.

## Operational Procedures
1. **Serialized Pickle Inspection**:
   - Inspect dictionary keys and array dimensions safely without executing arbitrary bytecode:
     ```python
     import pickle, io
     # Inspect metadata and vector shapes
     ```
2. **ONNX Model Graph Analysis**:
   - Verify input and output tensors, data types, and node operations using `onnx.load`:
     ```python
     import onnx
     model = onnx.load("backend/models/edge/ghostnet.onnx")
     onnx.checker.check_model(model)
     print([input.name for input in model.graph.input])
     ```
3. **PyTorch Weights Inspection**:
   - Inspect state dictionaries without loading untrusted classes using `torch.load(..., weights_only=True)`.

## Verification Checklist
- [ ] No unvetted pickle files loaded from untrusted network sources.
- [ ] ONNX model tensor dimensions match expected facial input shape (e.g., `(1, 3, 112, 112)`).
- [ ] API routes match actual registered blueprint handlers in `server.py`.
"""
    },
    {
        "name": "software-design-review",
        "description": "Conduct structural software design reviews evaluating SOLID principles, coupling, cyclomatic complexity, concurrency safety, and modularity.",
        "category": "Core Engineering",
        "reference": "ISO/IEC 25010 Systems and Software Quality Requirements; Clean Architecture (Robert C. Martin)",
        "license": "Apache-2.0",
        "content": """# Software Design Review Standard

## Purpose & Scope
Evaluates architectural health, code maintainability, and design patterns across frontend and backend components.

## Evaluation Dimensions
1. **Single Responsibility**: Classes and route modules must have one reason to change.
2. **Interface Segregation**: Clients should not be forced to depend upon interfaces they do not use.
3. **Concurrency Safety**: Gevent greenlets sharing memory must avoid non-thread-safe global state.
4. **Idempotence**: Critical mutating operations (attendance logging, employee creation) must support idempotency keys.

## Verification Checklist
- [ ] Functions have a cyclomatic complexity $\le 15$.
- [ ] Database access is isolated behind repository / service layers.
- [ ] React components separate presentation from asynchronous data fetching.
"""
    },
    {
        "name": "code-review",
        "description": "Execute structured peer code reviews assessing correctness, security, performance, regression risk, test coverage, and documentation.",
        "category": "Core Engineering",
        "reference": "Google Engineering Practices — Code Review Developer Guide",
        "license": "CC-BY-4.0",
        "content": """# Code Review Protocol

## Purpose & Scope
Mandatory review protocol before approving or merging code modifications into the engineering workspace.

## Review Stages
1. **Intent & Architecture**: Does the change solve the actual user problem without architectural debt?
2. **Correctness & Edge Cases**: Are null/undefined values, network timeouts, and zero-length arrays handled?
3. **Security & Data Safety**: Are credentials, personal data, or raw biometrics exposed?
4. **Performance**: Does the change introduce $O(N^2)$ loops, N+1 database queries, or UI layout thrashing?
5. **Testing**: Are automated regression tests included and passing?

## Verification Checklist
- [ ] All new functions include docstrings explaining parameters and return types.
- [ ] No commented-out dead code or orphaned debugging logs (`console.log`, `print`).
- [ ] Breaking changes are explicitly identified and backwards-compatible fallbacks provided.
"""
    },
    {
        "name": "debugging",
        "description": "Systematic root-cause diagnosis, stack trace dissection, socket/HTTP connection tracking, and state reproduction.",
        "category": "Core Engineering",
        "reference": "Why Programs Fail: A Guide to Systematic Debugging (Andreas Zeller)",
        "license": "Apache-2.0",
        "content": """# Systematic Debugging Protocol

## Purpose & Scope
Standardized workflow for rapidly isolating, reproducing, and fixing runtime defects without introducing secondary bugs.

## Debugging Phases
1. **Observation & Minimal Reproduction**:
   - Capture exact error code, stack trace, and execution context.
   - Formulate minimal reproducible curl request or unit test.
2. **Hypothesis Formulation**:
   - State testable hypotheses explaining the root cause.
3. **Instrument & Validate**:
   - Add structured debug logs or breakpoints at boundary conditions.
   - Verify hypothesis against runtime evidence before editing source code.
4. **Targeted Fix & Regression Test**:
   - Apply minimal surgical fix.
   - Write automated regression test asserting the failure mode is eradicated.

## Verification Checklist
- [ ] Root cause identified and explained in technical terms.
- [ ] Fix verified with actual runtime command execution.
- [ ] No unrelated files or formatting altered during debugging.
"""
    },
    {
        "name": "refactoring",
        "description": "Perform safe, step-by-step refactoring of legacy code with zero functional regression and full test coverage.",
        "category": "Core Engineering",
        "reference": "Refactoring: Improving the Design of Existing Code (Martin Fowler)",
        "license": "MIT",
        "content": """# Safe Refactoring Standard

## Purpose & Scope
Guides code restructuring to improve readability, maintainability, and extensibility without changing external behavior.

## Rules of Refactoring
1. **Pre-Refactor Baseline**: Ensure automated test suite is green before touching code.
2. **Micro-Steps**: Make small, incremental changes (rename symbol, extract function, inline variable).
3. **Run Tests After Every Step**: Execute unit tests immediately after each transformation.
4. **No Simultaneous Feature Work**: Never mix new feature implementation with refactoring passes.

## Verification Checklist
- [ ] All existing automated tests continue to pass.
- [ ] Public API contracts and database schemas remain 100% backward-compatible.
- [ ] Code complexity metrics show measurable reduction.
"""
    },
    {
        "name": "technical-documentation",
        "description": "Author, validate, and maintain engineering specifications, Architecture Decision Records (ADRs), API guides, and runbooks.",
        "category": "Core Engineering",
        "reference": "Write the Docs Documentation Guide; ADR Standard (Michael Nygard)",
        "license": "CC-BY-SA-4.0",
        "content": """# Technical Documentation Standard

## Purpose & Scope
Standardizes engineering documentation format, technical accuracy, and synchronization with source code.

## Documentation Types
1. **Architecture Decision Records (ADR)**: Capture context, options considered, decisions, and consequences.
2. **API Documentation**: OpenAPI / Swagger compliant route descriptions, request schemas, status codes, and error models.
3. **Runbooks**: Step-by-step operational instructions for deployment, backup restoration, and incident response.

## Style Guidelines
- Use clear, active voice and precise terminology.
- Provide runnable code snippets and realistic examples.
- Include clickable `file://` links for referenced files and symbols.

## Verification Checklist
- [ ] Documentation accurately reflects current source code implementation.
- [ ] All code blocks use appropriate syntax highlighting tags.
- [ ] Diagrams use standard Mermaid flowchart or sequence formats.
"""
    }
]

for skill in skills_data:
    s_dir = os.path.join(SKILLS_DIR, skill["name"])
    os.makedirs(s_dir, exist_ok=True)
    skill_md = os.path.join(s_dir, "SKILL.md")
    content = f"""---
name: {skill["name"]}
description: >-
  {skill["description"]}
---

{skill["content"]}

---

## Skill Metadata
- **Category**: {skill["category"]}
- **Authoritative Reference**: {skill["reference"]}
- **License**: {skill["license"]}
- **Scope**: Workspace Agent Skill (`.agents/skills/{skill["name"]}`)
"""
    with open(skill_md, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated {len(skills_data)} Core Engineering skills successfully.")

