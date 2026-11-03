---
name: user-experience-review
description: >-
  Execute cognitive walkthroughs, Nielsen-Norman heuristic audits, error-prevention assessments, and user onboarding flow optimization.
---

# User Experience Review Protocol

## Purpose & Scope
Systematic evaluation of usability, task completion efficiency, cognitive friction, and error recovery.

## 10 Usability Heuristics Applied
1. **Visibility of System Status**: Real-time feedback for camera connection, frame processing, and face matching.
2. **Match Between System and Real World**: Use human terminology (e.g., "Present", "On Time", "Late") rather than raw embedding distances.
3. **User Control and Freedom**: Clear emergency exits, undo actions, and modal close buttons.
4. **Consistency and Standards**: Identical interaction patterns across Dashboard, Attendance, and Settings.
5. **Error Prevention**: Confirmation dialogs for high-impact actions (deleting employee, resetting AI weights).

## Verification Checklist
- [ ] Empty states provide clear guidance on how to populate data.
- [ ] Form validation errors pinpoint the exact field with actionable recovery text.
- [ ] Onboarding wizard seamlessly guides first-time administrators.


---

## Skill Metadata
- **Category**: Product and Frontend
- **Authoritative Reference**: Nielsen Norman Group 10 Usability Heuristics; The Design of Everyday Things (Don Norman)
- **License**: Public Domain
- **Scope**: Workspace Agent Skill (`.agents/skills/user-experience-review`)
