# 19 Landing Page Storytelling Redesign — Agent Execution Prompt

For Antigravity, run this with **Claude Opus 4.6 (Thinking)** for the full build — this is a taste-and-pacing problem (what a visitor feels at each scroll depth), not bulk CRUD generation, so it's worth the stronger reasoning tier for the whole task, not just the foundation.

This brief builds on your established toolkit from the Vixora portfolio site (GSAP ScrollTrigger pinned scenes, Three.js, dark-mode cinematic scroll inspired by Apple product pages) — same techniques, same design instincts, applied to this product. Design tokens inherit from `17_UI_UX_Redesign_Agent_Prompt.md` (Linear-sourced: `#010102` canvas, `#5E6AD2` accent) — do not introduce new colors.

---

## 0. Ground Truth — What's Actually Wrong With the Current Page

Concrete, not stylistic opinions:

1. **The hero art is the single most cliché visual in this entire industry.** Two facing wireframe face profiles connected by neural-network dots — nearly every facial-recognition SaaS on earth uses some variant of this exact image. It reads as a stock template, not a brand, on the very first screen. Must be replaced entirely (§4).
2. **Nothing moves.** Every section is fully rendered and static — no scroll-triggered reveal, no stagger, no parallax. For a product pitching "modern startup" energy, a flat page is the opposite signal.
3. **The feature grid is visually monotonous.** Six cards (Profile Recognition, Liveness Detection, Mobile Sync, Automated Feedback, Sub-100ms, Private Tenancy) use the exact same icon-in-rounded-square treatment with no hierarchy — nothing tells the eye what matters most.
4. **The FAQ accordion has no motion** — it snaps open/closed instantly, and the chevron doesn't rotate. This is the cheapest possible fix for an easy trust signal (a well-animated accordion just feels more crafted).
5. **Dead vertical space between sections isn't doing anything.** Large gaps of plain black between sections aren't "luxury breathing room" — luxury spacing has scale, typography, and intent inside it; this is just empty.
6. **The "Biometric Node Hashing" terminal widget is a genuinely good idea, wasted.** A live-look technical readout (`[LIVENESS] PASS (99.4%)`, `[INFERENCE] 84.2ms`) is exactly the kind of detail that makes a security product feel real and engineered — but it's currently a static screenshot-like box. This should be the page's technical "wow" moment (§7.4).
7. **The CTA blocks repeat near-identical copy** ("Ready to secure your workspace?") without escalating — no narrative payoff by the time someone reaches the bottom.
8. **No proof/trust section exists at all** — no stats, no engineering commitments, nothing beyond feature claims. See §8 for how to add this honestly (do not fabricate customer logos or testimonials pre-launch — that's a real legal/trust problem, not a style note).

---

## 1. The Narrative Arc (build the page around this, not a feature list)

A landing page that "feels like a modern brand" tells a story with rising and falling tension, the way an Apple product page does — it doesn't just enumerate features top to bottom. Structure:

1. **Hero — the promise.** Not "On-Premise Face Recognition" as a dry label — lead with the outcome and stakes, then the category. (§7.1)
2. **The problem (new section, currently missing entirely).** Brief, punchy: why RFID cards, PINs, and cloud-based recognition fail companies today. This is the emotional hook the current page skips by jumping straight to "how it works" — without stakes, the solution has nothing to be a solution *to*. (§7.2)
3. **How it works — the pipeline.** Keep the 3-step structure (Enrollment → Hybrid Training → Ensemble Consensus), but make it feel like a process unfolding as you scroll, not a static card row. (§7.3)
4. **Live proof — the technical wow moment.** The terminal readout, animated and alive. This is where skepticism turns into "okay, this is real engineering." (§7.4)
5. **Capabilities — the depth.** The feature set, restructured as a bento grid with real hierarchy instead of six identical boxes. (§7.5)
6. **Security & sovereignty — the trust close.** "100% Data Sovereignty" is your strongest trust argument — give it more visual weight, not less. (§7.6)
7. **Engineering commitments — honest proof, no fake logos.** (§7.7, §8)
8. **FAQ — objection handling.** Animated, calm, confidence-building. (§7.8)
9. **Final CTA — the narrative payoff.** Should feel like the resolution of the promise made in the hero, not a repeat of it. (§7.9)

---

## 2. Animation System

Two tools, matching your portfolio precedent exactly:

- **GSAP + ScrollTrigger** for the storytelling backbone: pinned sections, scroll-scrubbed progress (an animation that plays forward/backward tied directly to scroll position, not just a one-shot trigger), and the section-to-section narrative pacing. This is what makes it feel "cinematic" rather than "things fade in as you scroll," which is table stakes, not a wow factor.
- **Framer Motion** (already in the project) for micro-interactions: button hover/press, card hover states, FAQ accordion expand/collapse (height + chevron rotation, spring physics).

Core techniques to actually use, not just fade-ins:
- **Pinned scene** for the "How It Works" pipeline — the three steps pin in place while a connecting line draws itself between them as the user scrolls, each icon/card activating in sequence.
- **Scroll-scrubbed reveal** for the terminal/proof widget — the `[INPUT]` → `[LIVENESS]` → `[VECTOR]` → `[MATCH]` → `[INFERENCE]` lines type themselves in sequence, tied to scroll position so a user scrolling slowly sees it build line by line.
- **Parallax depth** (subtle, 10–20px max offset) between foreground text and background elements in the hero — this alone does a lot of the "premium" lifting without being gimmicky.
- **Staggered entrance** for the bento grid — cards enter with a 60–80ms offset each, not all at once.

**Mandatory:** wrap all GSAP/scroll animation in a `prefers-reduced-motion` check with an instant-state fallback, and lazy-load GSAP/Three.js so they don't block the initial page render — a heavy, janky landing page contradicts "sub-100ms inference, engineered for performance" on the same page.

---

## 3. What "Luxury" Actually Means Here (not just more whitespace)

Luxury in this context means: restraint in how many things move at once, generous but *purposeful* spacing (a big gap before a big statement, not a big gap for no reason), a limited type scale used with confidence (a few very large moments, not many medium ones), and one genuinely well-crafted signature visual (§4) rather than several mediocre decorative ones. If every section has its own animation gimmick, it reads as busy, not luxurious — the discipline is picking 3–4 real moments (hero entrance, pipeline reveal, proof widget, final CTA) and making everything else quiet by comparison.

---

## 4. The Signature Visual — Replace the Face-Wireframe Hero

**Do not** recreate anything resembling two facial profiles or a generic neural-network dot mesh — this is the exact cliché to escape. Options, in order of recommendation:

1. **Procedural Three.js scene (recommended, matches your portfolio's starfield precedent):** an abstract 3D scene built from primitive geometry — e.g., a slowly rotating field of thin wireframe rings/apertures (tying directly to the reticle/bounding-box motif from the mobile/web console brief, `17_UI_UX_Redesign_Agent_Prompt.md` §3) with depth-of-field blur, reacting subtly to scroll or mouse position. This is cheap to build well (primitive geometry, no modeling skill needed) and ties the marketing site back to what the product literally does — this is your actual signature, reused across surfaces.
2. **Free pre-made 3D asset, only if you want a literal object** (e.g., a stylized security camera or edge-device kiosk): source from **Sketchfab**, filtered to CC0/downloadable models, or a free community scene from **Spline** (embed via the `spline-runtime`/`@splinetool/react-spline` package — Spline is specifically built for exactly this "drop a free 3D scene into a web page" use case). Do **not** have the agent hand-model or approximate a realistic 3D human face/head from scratch — that will look worse than not having 3D at all, and is exactly the kind of "3D of a face" cliché this brief is trying to move away from.
3. **Fallback if 3D scope creep is a risk:** a well-executed 2D animated SVG built from the reticle motif — animated corner-brackets slowly scanning across an abstract grid — delivers most of the "high-craft" feeling at a fraction of the engineering cost and risk.

Pick one, don't blend two different visual languages for the hero.

---

## 5. Section-by-Section Spec

### 5.1 Hero
Lead line reframes the promise before the label: something like "Your building already knows who belongs. Now your systems do too." (agent should iterate copy — the point is *stakes-then-category*, not the current "On-Premise Face Recognition" label-first framing). Signature 3D/visual per §4. CTA hierarchy stays (`Enter Console` primary, `Learn How It Works` secondary) — that part already works.

### 5.2 The Problem (new)
Short, three-beat section: physical cards get swapped, PINs get shared, cloud recognition leaks data and costs money at scale. Each beat can be a simple animated stat or icon-line, not a big block of text — this section's job is brevity and stakes, not explanation (explanation comes later).

### 5.3 How It Works
Keep the three-step content, rebuild as the pinned scroll-scrubbed sequence described in §2.

### 5.4 Live Proof Widget
Animate the terminal readout as a scroll-scrubbed typewriter sequence (§2). Consider cycling through 2–3 example scenarios (a PASS, then briefly a SPOOF-detected example) so it demonstrates the product's actual judgment, not just one static success case.

### 5.5 Capabilities (Bento Grid)
Restructure the six feature cards into a bento layout: 1–2 larger "hero" cards (recommend Liveness Detection and Private Tenancy — your two strongest trust arguments) with more detail/visual treatment, and the remainder smaller in a supporting grid. Uniform grids of identical cards is the generic-SaaS tell this section currently has.

### 5.6 Security & Sovereignty
"100% Data Sovereignty" gets a full-width, high-weight treatment — this is your best differentiator (genuinely on-premise, not just "we say we care about privacy" like most cloud AI vendors). Consider a simple animated diagram: a visual "air gap" showing data staying inside a boundary line versus a crossed-out cloud icon — makes the claim visually legible in half a second instead of requiring the visitor to read three sentences.

### 5.7 Engineering Commitments (see §8 for the honesty rule)
Real, verifiable-in-principle numbers presented as commitments/targets, animated as counting-up numbers on scroll-into-view: inference time, supported rotation angle, edge hardware requirements. This replaces the fake-social-proof gap without lying.

### 5.8 FAQ
Same four questions, animated expand/collapse (height transition + chevron rotation, spring physics via Framer Motion).

### 5.9 Final CTA
Should explicitly reference the hero's opening promise to close the loop narratively — not just repeat "Ready to secure your workspace?" verbatim a third time.

---

## 6. Copy Discipline

The current copy is solid and technically accurate — keep the substance, tighten the framing per §5.1/§5.2 (stakes before label). Every section needs one clear sentence a visitor could repeat back after reading it once — if a section requires two reads to get the point, it's not landing-page copy yet.

---

## 7. Honesty Guardrail — Read Before Building the Proof Section

Do not add fabricated customer logos, review quotes, user counts, or "trusted by X companies" claims. This product doesn't have paying customers yet (per your own roadmap docs) — inventing social proof is false advertising, not a design embellishment, and it's the kind of thing that actively damages trust the moment a prospect asks "wait, who are these customers?" in a sales call. Use real, defensible claims instead: engineering specs, architecture facts, and honest positioning ("built for on-premise deployment," "engineered for sub-100ms inference on standard CPUs") — all of which are already true and don't need embellishing.

---

## 8. Performance & No-Broken-Components Checklist

- [ ] GSAP and Three.js are lazy-loaded / code-split, not blocking initial paint
- [ ] `prefers-reduced-motion` respected — full instant-state fallback, not just "less" motion
- [ ] Page tested on a mid-tier laptop, not just a dev machine — scroll-scrubbed 3D scenes are the first thing to jank on lower-end hardware
- [ ] Every animated section has a valid static end-state if JS fails to load (progressive enhancement, not a blank page)
- [ ] FAQ accordion keyboard-navigable, chevron state matches expanded/collapsed reliably
- [ ] No fabricated proof/social content anywhere on the page (§7)
- [ ] Mobile scroll experience tested separately — pinned/scrubbed scenes often need a simplified mobile variant, not the same desktop timeline shrunk down
- [ ] Lighthouse performance score checked after adding 3D/GSAP — a slow "engineered for performance" page undercuts its own pitch
