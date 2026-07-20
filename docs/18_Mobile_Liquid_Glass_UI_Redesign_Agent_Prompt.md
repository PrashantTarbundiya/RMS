# 18 Mobile Liquid Glass UI — Agent Execution Prompt

Companion to `17_UI_UX_Redesign_Agent_Prompt.md`. Same product, same design system, different surface (React Native + Expo SDK 54). Recommend **Gemini 3.1 Pro High** for the glass component primitives + navigation shell (§2–4), then **Gemini 3.5 Flash High** for the individual screen fixes (§6) once the primitives exist.

**Keep `theme.js` colors exactly as they are.** They already match the Linear-sourced system used for the web console (`#010102` canvas, `#5E6AD2` accent, `#27A644`/`#F87171`/`#FBBF24` semantics) — that's correct and gives you brand consistency across web and mobile for free. Nothing in this brief changes a single hex value. What changes is implementation quality.

---

## 0. Ground Truth — Bugs Visible in Current Screenshots (fix these, not optional)

These are concrete defects observed in the current build, not style opinions. No screen ships until all of these are resolved:

1. **Header/status-bar contrast:** screen titles ("Face Scanner," "Settings," "AI Models") render as pale text against a light-gray status bar strip — effectively invisible. Root cause: the header is not extending the app's dark background under the status bar, and/or title text color isn't using the theme's `ink` token. Fix: header background must be `bgPrimary` (`#010102`) all the way to the top of the safe area, title text must use `ink` (`#FFFFFF`) at proper weight.
2. **"Glass" isn't glass:** `APPLE_GLASS_STYLE` is currently a flat card with a 1px border and zero blur — it's a bordered card, not glassmorphism. See §3 for the real implementation.
3. **Bottom tab bar breaks theme:** currently a solid light/white pill sitting on a pure black app — the single largest visual inconsistency in the product. Must become a dark glass element (§3, §4).
4. **Hard-edged background orbs:** the purple/green glows have visible circular edges instead of a soft falloff — reads as an unstyled `View` with `borderRadius: 9999`, not a glow. Fix: real radial gradient with soft falloff, not a flat-opacity circle.
5. **Banner/header collision:** the "Retraining Required" banner overlaps and clips the screen title underneath it on the Dashboard. Needs proper flex stacking, not absolute positioning.
6. **Content clipped behind floating tab bar:** list content (registered subjects, trained subjects) runs behind the tab bar with no reserved bottom padding.
7. **Scan result photo has no frame:** the captured/selected image bleeds edge-to-edge in stark white with no border, rounding, or vignette tying it back into the dark theme — looks like a broken layout, not an intentional full-bleed choice.

---

## 1. Product Context

Same as the web console: enterprise security/attendance tool, but this surface is used by security personnel walking the floor or standing at a kiosk — often one-handed, often glancing quickly, sometimes in bright ambient light (near an entrance, outdoors through glass doors). Design for:
- One-thumb reachability for primary actions (scan, confirm)
- Legibility in variable lighting, not just a dim room
- Instant, unambiguous CONFIRMED/NOT FOUND/SPOOF feedback — this is a security tool, hesitation or ambiguity in the result UI is a real problem, not a cosmetic one

---

## 2. Tokens — Confirmed, No Changes

Your existing `theme.js` is correct. Restating it here only to lock it as the contract this brief builds on:

```js
bgPrimary: '#010102'     // Deep Space Black — full-bleed app background
bgSecondary: '#0F1011'   // Elevated Black — card base
bgCard: '#141516'        // Input/interactive surfaces
accentPrimary: '#5E6AD2' // MobileNetV2 / primary actions
accentSecondary: '#828FFF' // Muted/secondary (SOTA)
success: '#27A644'       // Identity Confirmed
error: '#F87171'         // No Match
warning: '#FBBF24'       // Spoof / Liveness Failed
inkPrimary: '#FFFFFF'
inkSubdued: '#A0A3AB'
```
Add (missing, needed for glass to work at all — see §3):
```js
glassOverlayDark: 'rgba(15, 16, 17, 0.55)'   // tint layer over BlurView
glassBorder: 'rgba(255, 255, 255, 0.08)'     // hairline edge on glass surfaces
glassHighlight: 'rgba(255, 255, 255, 0.04)'  // top-edge highlight for depth
```

---

## 3. Real Glassmorphism Implementation (this is the core fix)

React Native has no CSS `backdrop-filter`. Real glass requires `expo-blur`'s `BlurView` — it's not currently doing anything in this app. Every "glass" surface (cards, the tab bar, modals, the status banner) must be built as:

```jsx
import { BlurView } from 'expo-blur';

<BlurView intensity={40} tint="dark" style={styles.glassSurface}>
  <View style={styles.glassOverlay} /> {/* glassOverlayDark tint, absolute fill */}
  <View style={styles.content}>{children}</View>
</BlurView>

// styles
glassSurface: {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: theme.glassBorder,
  overflow: 'hidden', // required — blur clips to border radius only with this
}
```

**Platform reality check:** Android's `BlurView` support is weaker/inconsistent across OEM skins compared to iOS. Required fallback: on Android, detect blur capability and fall back to a solid `glassOverlayDark` surface at higher opacity (~0.85) with a subtle top highlight border instead of true blur — this still reads as "glass-adjacent" and never looks broken, whereas a failed/unsupported blur can render as a solid black box or crash on some devices. Test on at least one mid-range Android device before shipping, not just an emulator.

**Where glass applies:**
- Cards (stat cards, subject cards, settings sections) — light blur (intensity 20–30), tinted with theme color, not neutral gray
- Bottom tab bar — this is the highest-priority fix, see §4
- Modals/bottom sheets — stronger blur (intensity 50+) since they sit over other content
- The connection-status banner ("Server Offline"/"Engine Online") — glass pill, not a flat rounded rect

**Where glass does NOT apply:** the scan result hero (CONFIRMED/NOT FOUND) — that surface should be a solid, saturated fill of `success`/`error`/`warning` at full confidence. Diluting the single most important moment in the app with translucency undermines the "this is a certain, binary result" purpose it serves. Glass is for chrome and containers, not for the verdict itself.

---

## 4. Bottom Tab Bar — Full Rebuild

The current light pill tab bar is the single biggest thing making this look unbranded. Rebuild as:
- Floating glass pill (per §3), `bgSecondary` tint at high opacity, positioned with margin from screen edges (not edge-to-edge), sitting above the safe-area inset.
- Active tab: icon + label in `accentPrimary`, with a soft glow (small blurred colored circle behind the icon, low opacity) — not a background fill block.
- Inactive tabs: `inkSubdued`.
- Respect `useSafeAreaInsets()` from `react-native-safe-area-context` for bottom spacing on gesture-nav Android/iOS devices — do not hardcode a fixed bottom offset.
- Every scrollable screen must add `paddingBottom` equal to tab-bar height + bottom safe-area inset, so content never runs behind it (fixes bug §0.6).

---

## 5. Background Orbs — Real Soft Gradients

Replace the current flat-opacity circles with `react-native-svg`'s `RadialGradient` (React Native doesn't support true CSS-style radial gradients through `expo-linear-gradient`, which is linear-only):

```jsx
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

<Svg style={StyleSheet.absoluteFill}>
  <Defs>
    <RadialGradient id="orbPurple" cx="50%" cy="50%" r="50%">
      <Stop offset="0%" stopColor={theme.accentSecondary} stopOpacity="0.25" />
      <Stop offset="100%" stopColor={theme.accentSecondary} stopOpacity="0" />
    </RadialGradient>
  </Defs>
  <Rect width="100%" height="100%" fill="url(#orbPurple)" />
</Svg>
```
This gives a true soft falloff instead of the hard-edged circle currently visible. Keep orbs subtle (max 0.25 opacity at center) and positioned off-canvas at the edges — they're ambient atmosphere, not a focal element.

---

## 6. Screen-by-Screen Fixes

1. **Global — Header:** background `bgPrimary` extended under the status bar via `useSafeAreaInsets`, title in `inkPrimary`, weight 600. Fixes §0.1 everywhere at once — do this first, it's the highest-leverage single fix.
2. **Global — Tab bar:** per §4.
3. **Dashboard:** fix the Retraining banner to sit in normal document flow above the greeting card, not absolutely positioned over it (fixes §0.5). Stat cards get the light-glass treatment (§3). The `0% Accuracy` badge showing a green checkmark is a content/logic mismatch worth flagging to your backend team — a 0% figure should never render with a "success" visual treatment regardless of what's driving that number.
4. **Face Scanner (Scan):** the empty state (reticle icon + "Select an image or take a photo") is already close to right — keep that pattern, just give the container real glass. The result view: frame the captured photo with rounded corners + a 1px `glassBorder` + a subtle bottom gradient scrim so the CONFIRMED banner has contrast to sit on, instead of bleeding to stark edge-to-edge white (fixes §0.7).
5. **Server Unreachable / Offline states:** good copy and structure already — just needs the glass treatment on the card and the orb softened (§5). Keep the retry button solid `accentPrimary`, not glass — actionable buttons stay solid, only containers get glass.
6. **Add Subject:** stepper (1 Name → 2 Photos → 3 Upload) is a strong pattern, keep it. Fix the "Upload & Train (0 photos)" button — it currently reads as permanently disabled-looking navy even before interaction; give it a clear disabled state (lower opacity, muted text) versus enabled state (full `accentPrimary`, white text) so the two are visually distinct at a glance.
7. **AI Models / Trained Subjects:** the pill list is solid — good density for a long list. Just needs bottom padding fix (§0.6) and glass treatment on the section cards.
8. **Settings:** solid structure and copy. Fix contrast/header per §6.1, apply glass to the connection-status card and info cards.

---

## 7. Motion (react-native-reanimated — already on your roadmap in `14_Future_Roadmap.md`)

- Tab switch: icon scale-bounce (spring) on press, not just a color change.
- CONFIRMED result: the result banner should spring in with a slight overshoot, plus a brief scale-pulse on the checkmark icon — mirror the web console's confirm interaction (`17_UI_UX_Redesign_Agent_Prompt.md` §4) so the product feels like one system across surfaces.
- SPOOF/liveness failure: a sharper, faster shake/flash (150ms) — deliberately different rhythm from CONFIRMED and NOT FOUND, since this is the highest-stakes result (someone may be actively spoofing the system).
- Pull-to-refresh: tint the refresh spinner `accentPrimary`, not the platform default color.
- Respect reduced-motion accessibility settings on both platforms — check `AccessibilityInfo.isReduceMotionEnabled()` and fall back to instant transitions.

---

## 8. No Broken Components — Required State Coverage

Same discipline as the web brief. Every component needs: Default / Pressed / Disabled / Loading (skeleton, not spinner-in-empty-space) / Empty / Error (specific message) / Success confirmation. A component missing its disabled or error state is not done, even if the happy path looks polished — this is exactly the class of bug visible in the current "Upload & Train (0 photos)" button (§6.6).

---

## 9. Acceptance Checklist

- [ ] Every screen title is clearly legible against its header background (fixes the #1 bug)
- [ ] Every "glass" surface uses `BlurView` with a working Android fallback, not just a bordered flat card
- [ ] Tab bar is dark/glass, never a light pill floating on a black app
- [ ] No content is ever clipped behind the floating tab bar — test with a long list (68+ subjects)
- [ ] Background orbs have soft falloff, no visible hard edge
- [ ] Banners never overlap or clip screen titles
- [ ] CONFIRMED / NOT FOUND / SPOOF each have a visually and motion-distinct rhythm, tested back-to-back
- [ ] Disabled vs. enabled button states are distinguishable without reading the label
- [ ] Tested on a real mid-range Android device, not only iOS/emulator
- [ ] `AccessibilityInfo.isReduceMotionEnabled()` respected
