---
name: face-anti-spoofing
description: >-
  Implement multi-cue biometric liveness detection combining texture analysis, frequency spectrum, color distortion, and CNN liveness voting.
---

# Face Anti-Spoofing & Liveness Protocol

## Purpose & Scope
Prevents presentation attacks using printed photos, video replays, and digital displays.

## Multi-Cue Defense Architecture
1. **Color & Chrominance Distortion**:
   - Compute standard deviation and Fourier spectrum in YCrCb and HSV color spaces. Printed paper and screens exhibit spectral banding (Moiré patterns).
2. **Eye Blink & Dynamic Motion**:
   - Track Eye Aspect Ratio (EAR): $\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$.
   - Detect natural blink dynamics over a $1.5\text{s}$ video buffer.
3. **Deep CNN Anti-Spoofing Classifier**:
   - MobileNetV2 binary classifier trained on genuine vs. spoof presentations.

## Verification Checklist
- [ ] Screen replay attack (iPad/phone display) triggers `SPOOF DETECTED` with confidence $\ge 90\%$.
- [ ] High-resolution color photo printout fails texture analysis.
- [ ] Genuine users experience zero latency degradation ($\le 20\text{ms}$ overhead).


---

## Skill Metadata
- **Category**: AI and Computer Vision
- **Authoritative Reference**: Boulkenafet et al., Face Spoofing Detection Using Colour Texture Analysis (TIFS 2016)
- **License**: IEEE / Open Research
- **Scope**: Workspace Agent Skill (`.agents/skills/face-anti-spoofing`)
