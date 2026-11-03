---
name: ml-data-quality
description: >-
  Audit and sanitize employee photo training datasets, eliminate duplicates, balance class samples, and enforce resolution standards.
---

# Machine Learning Data Quality Standard

## Purpose & Scope
Ensures training datasets in `dataset_cleaned/` are pristine, properly labeled, and free of synthetic or corrupted samples.

## Dataset Curation Rules
1. **Sample Quantity per Person**:
   - Minimum: 3 diverse photos (frontal, left $20^\circ$, right $20^\circ$).
   - Recommended: 5 - 15 photos under varied natural office lighting.
2. **Resolution & Crop Requirements**:
   - Minimum resolution: $250 \times 250$ pixels per face region.
   - Sharpness score $\ge 120.0$.
3. **Deduplication & Hygiene**:
   - MD5 hash check prevents duplicate image uploads.
   - Background celebrity benchmark datasets (LFW) must remain strictly segregated from enterprise tenant rosters.

## Verification Checklist
- [ ] Every enrolled person folder contains only validated photos of that single individual.
- [ ] Zero synthetic, duplicate, or corrupted image files in training directories.
- [ ] Directory names strictly match canonical database employee names.


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Data-Centric AI (Andrew Ng); ISO/IEC 19794-5 Biometric Data Interchange Formats
- **License**: Apache-2.0
- **Scope**: Workspace Agent Skill (`.agents/skills/ml-data-quality`)
