---
name: integration-testing
description: >-
  Validate cross-component integrations between frontend WebRTC feeds, WebSocket events, ML inference engines, and database state.
---

# End-to-End Integration Testing Protocol

## Purpose & Scope
Validates end-to-end data flow from camera feed capture to real-time face recognition and attendance record persistence.

## Key Integration Flows
1. **Kiosk Attendance Flow**:
   - Video Frame Captured -> Client Emits `process_frame` -> Server Detects Face -> Extracts 512-d Embedding -> Matches Identity -> Emits `attendance_confirmed` -> Record Inserted in SQLite/PostgreSQL -> Live Attendance Table Updates.
2. **Offline-to-Online Sync**:
   - Verify attendance scans recorded during network outage sync cleanly upon reconnection.

## Verification Checklist
- [ ] Full kiosk attendance flow completes within $< 200\text{ms}$.
- [ ] Database record verifies accurate employee ID, timestamp, and confidence score.


---

## Skill Metadata
- **Category**: Quality Assurance
- **Authoritative Reference**: Integration Testing from the Trenches; Martin Fowler Integration Test Guide
- **License**: CC-BY-SA-4.0
- **Scope**: Workspace Agent Skill (`.agents/skills/integration-testing`)
