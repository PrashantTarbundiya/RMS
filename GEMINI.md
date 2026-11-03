# AuraPass™ Enterprise — AI Engineering Governance & Permanent Workspace Rules

> **Authority**: Root-level Antigravity engineering rules for `e:\RMS`.
> **Scope**: Enforced across all AI pair programming, autonomous subagents, and automated developer workflows.

---

## RULE A: Understand Before Modifying
1. **Explore Existing Implementations First**: Always inspect the existing code, architecture documents in `docs/`, and runtime behavior before proposing or creating new components.
2. **Never Assume a Feature is Missing**: Search the codebase (`Select-String` / AST inspection) before declaring something unimplemented.
3. **Preserve Legacy Functionality**: Never replace an existing implementation with a newly generated abstraction without documented technical justification and an explicit deprecation plan.

---

## RULE B: Research Before Technical Decisions
1. **Consult Authoritative Documentation**: For unfamiliar libraries, APIs, or frameworks (e.g., React 19, Vite 8, SQLAlchemy 2.0, DeepFace, InsightFace, Gevent), retrieve current documentation via Context7 or official source repositories.
2. **Distinguish Facts from Hypotheses**: Clearly separate empirically verified capabilities from assumptions or training priors.
3. **Peer-Reviewed Scientific Foundations**: Biometric algorithms, distance thresholds, face alignment techniques, and anti-spoofing heuristics must reference verified academic benchmarks (LFW, CFP-FP, AgeDB-30, CASIA-SURF) or official project standards.

---

## RULE C: Plan Before Executing
For non-trivial tasks (spanning multiple files or architectural boundaries):
1. **Understand Requirements**: Extract constraints and acceptance criteria.
2. **Inspect Current State**: Map files, functions, and database models involved.
3. **Formulate Step-by-Step Plan**: Document planned modifications and file boundaries.
4. **Identify Risks & Regressions**: Explicitly evaluate impacts on authentication, database integrity, latency, and mobile viewport rendering.
5. **Execute in Controlled Phases**: Make targeted, contiguous edits and verify between steps.
6. **Verify and Document**: Confirm unit tests pass and update relevant engineering documentation.

---

## RULE D: Independent Verification
1. **Never Trust Unverified Code**: Code is not done merely because it was generated or compiled without syntax errors.
2. **Mandatory Runtime & Automated Verification**: Execute unit tests, integration scripts, and browser layout checks.
3. **Zero False Assertions**: Never claim a test passed, a server responded, or a layout was verified without running the command and inspecting the output. If a test cannot be executed, explicitly state it as unverified.

---

## RULE E: No Unnecessary Modifications
1. **Minimal Surface Area**: Confine changes strictly to the task scope.
2. **Preserve Surrounding Code**: Retain existing docstrings, type annotations, and comments unrelated to the task.
3. **No Silent Refactoring**: Do not modify public API contracts, database schemas, model architectures, or utility signatures unless explicitly requested.
4. **No Dependency Bloat**: Do not add new external libraries (`npm` packages or `pip` modules) when the functionality can be cleanly implemented using existing project dependencies.

---

## RULE F: Security-First Development & Biometric Protection
1. **Zero Secret Leakage**: Never hardcode, commit, log, or print passwords, JWT secrets, database connection strings, API keys, or private certificates.
2. **Least Privilege**: Grant minimum necessary permissions to processes, database users, and MCP integrations.
3. **Strict Biometric Data Sovereignty**:
   - Biometric face embeddings and raw face crops are sensitive personal data.
   - Never transmit biometric data or raw images to third-party cloud APIs.
   - Keep embeddings isolated per organization tenant with strict cryptographic separation.
4. **Sanitize Data Before Testing**: Never use real customer biometric data or production records for destructive testing. Always use synthetic mocks or authorized test datasets.

---

## RULE G: Documentation Integrity
1. **Synchronized Documentation**: Whenever an architecture, database model, API endpoint, or configuration changes, update corresponding documents in `docs/` and `docs/ai-engineering/`.
2. **Truthful & Precise**: Documentation must describe the actual implemented code, not aspirational or hypothetical states.

---

## RULE H: Desktop and Mobile Verification
1. **Responsive First-Class Status**: Frontend components must be tested and verified at both desktop ($\ge 1024\text{px}$) and mobile viewports ($320\text{px}$ to $480\text{px}$).
2. **No Blind CSS Overflows**: Do not mask layout bugs with arbitrary `overflow: hidden`. Address root layout causes (flex wrapping, min-width zero, responsive grids).
3. **Visual & DOM Inspection**: Confirm that sticky headers, navigation drawers, modals, tables, and camera viewports render without horizontal scrolling or touch-target collisions.

---

## RULE I: Honest & Objective Reporting
1. **Structured Finding Categories**: Reports must cleanly distinguish:
   - **Verified Findings**: Empirically tested and confirmed with command output.
   - **Potential Problems**: Inconsistencies or risks identified by static analysis.
   - **Assumptions**: Operating premises that require user or external confirmation.
   - **Recommendations**: Technical proposals backed by benchmarks or standards.
   - **Unresolved Questions**: Open architectural decisions.
2. **Zero Fabrication**: Never fabricate test metrics, model accuracy percentages, or benchmark figures.

