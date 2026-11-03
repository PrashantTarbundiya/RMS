---
name: secure-coding
description: >-
  Enforce secure coding practices in Python and JavaScript, memory safety in native CV extensions, and safe deserialization.
---

# Secure Coding Standards

## Purpose & Scope
Guides language-level defensive programming to prevent buffer overflows, unhandled exceptions, and unsafe deserialization.

## Critical Rules
1. **Safe Deserialization (CWE-502)**:
   - Never call `pickle.load()` or `pickle.loads()` on untrusted data from network requests or user uploads.
   - For internal vector indices, verify file hash or use safer formats (ONNX, JSON, Safetensors).
2. **Path Traversal Prevention (CWE-22)**:
   - Sanitize all file paths using `os.path.abspath` and verify they reside within expected base directories.
   - Reject filenames containing `..`, null bytes (`\0`), or invalid Windows characters (`:`, `*`, `?`, `<`, `>`, `|`).
3. **Native Extension Memory Bounds**:
   - Verify array shapes and types before passing NumPy arrays to OpenCV C++ extensions.

## Verification Checklist
- [ ] Code passes static analysis for dangerous function invocations (`eval`, `exec`, `pickle`).
- [ ] All file system read/write operations guarded by path boundary checks.


---

## Skill Metadata
- **Category**: Security and Privacy
- **Authoritative Reference**: SEI CERT Python & C/C++ Coding Standards; CWE Top 25 Most Dangerous Software Weaknesses
- **License**: Public Domain
- **Scope**: Workspace Agent Skill (`.agents/skills/secure-coding`)
