# WebGL Text → Vector Layer Integration — Design

Date: 2026-05-29
Branch: `Reuse-Source-Management-Only`
Status: Approved design, pending implementation plan

## Problem

A WebGL text-rendering feature (`WebGLText` layer + `renderer/webgl/TextLayer.js` +
`render/webgl/GlyphAtlas.js`) currently lives **beside** the existing WebGL vector
pipeline as a parallel renderer. It duplicates source management, batching, and
buffer handling, and uses its own bespoke shader and CPU-side expression evaluation.

Goal: integrate text rendering **into** the existing WebGL vector pipeline so that a
single `WebGLVectorLayer`, given a flat style containing `text-*` properties, renders
labels on its features alongside their fills, strokes, and symbols — using the same
batching, source management, shader-builder, worker buffer-generation, and
hit-detection machinery the other geometry passes already use.

This mirrors how a Point feature is automatically routed to a dedicated symbol
(icon-sprite) render pipeline. Text becomes an analogous, geometry-agnostic pass.

## Non-goals (this spec)

- Decluttering / label collision avoidance (`renderDeclutter()` stays a no-op).
- Line-following (curved) text placement — deferred optional phase.
- Moving glyph layout off the main thread — designed-for but not implemented.

## Architecture

Text is added as a **4th batch + 4th render pass**, parallel to point/line/polygon.
Source management, dirty-tracking, async worker buffer-gen, and ref-based hit
detection are unchanged and reused.

```
WebGLVectorLayer (flat style now includes text-* props)
        │
        ▼
MixedGeometryBatch
 ├ polygonBatch    → fill   pass   (triangles)
 ├ lineStringBatch → stroke pass   (quad strips)
 ├ pointBatch      → symbol pass   (instanced quads / icon sprites)
 └ textBatch  NEW  → text   pass   (instanced glyph quads / glyph sprites)
        │
        ▼
VectorStyleRenderer
 ├ parseLiteralStyle → ShaderBuilder (fill / stroke / symbol / TEXT)
 ├ CPU: gather feature props → attributes
 │      NEW: resolve string + lay out glyphs → per-glyph instances
 ├ GlyphAtlas (main thread, Canvas2D) → texture uniform (like icon u_texture)
 └ worker: build instance/index buffers → GPU instanced draw
```

### Core properties

- A feature with a `text-*` style and a non-empty label auto-routes into `textBatch`,
  exactly as a Point auto-routes into the symbol pass. Geometry-agnostic; only the
  **anchor** is geometry-derived.
- **Styling = GPU.** Color, outline, opacity, size are GLSL expressions produced via
  ShaderBuilder — the same model the point pipeline uses (CPU gathers feature-property
  inputs into attributes; GPU runs the expression logic).
- **Layout = CPU.** String resolution, glyph shaping, line-wrapping, and atlas
  population are inherently main-thread (Canvas2D `measureText`/`fillText`). This is
  the one stage points do not have.
- Instance = **one glyph quad**, sampling its sub-rect of the glyph atlas. The atlas is
  bound as a `sampler2D` uniform like an icon sprite sheet.
- `WebGLText` layer is reduced to a deprecated thin preset over `WebGLVectorLayer`;
  the bespoke `renderer/webgl/TextLayer.js` is deleted; `GlyphAtlas.js` is kept and
  generalized.

### The expression-model boundary (document explicitly)

- The label **string** (`text-value`, e.g. `['get','name']`) is resolved **CPU-side**
  at render-instruction generation — it can never be GPU-evaluated.
- All **visual** text properties (color, outline color/width, opacity) are compiled to
  **GLSL** and evaluated on the GPU, consuming `a_prop_*` attributes and `u_var_*`
  uniforms — identical to fill/stroke/symbol.
- **`font-size` is split deliberately.** Glyphs are rasterized into the atlas at a
  fixed **reference em size**, and `GlyphLayout` computes advances/offsets at that
  reference size. The requested `font-size` is then applied as a **GPU scale** on the
  glyph quad (and proportionally to the offset). This keeps font-size data-driven and
  rebuild-free (a uniform/attribute), and keeps the atlas independent of size. Only
  **`font-family` / `font-weight` / `font-style`** select which glyphs to rasterize and
  therefore drive CPU atlas population; they are not GPU expressions.

## Components

Each unit has one responsibility, a defined interface, and is testable in isolation.

1. **`style.js` — `parseTextProperties(style, builder, uniforms, context)`** (new, beside
   `parseIconProperties`). Reads `text-*`/`font` props; emits GLSL for glyph
   color/outline/opacity/size via ShaderBuilder. `parseLiteralStyle` gains a
   `text-value` branch that calls it and flags the style as producing a text pass.

2. **`ShaderBuilder.js` — text shader path** (`setTextColorExpression`,
   `getTextVertexShader`/`getTextFragmentShader`). Vertex shader expands a glyph quad
   around `anchor + glyphOffset` and applies size/rotation; fragment samples the atlas
   coverage/SDF and applies color+outline GLSL. Mirrors the symbol shader path.

3. **`GlyphLayout` (new module) — `layoutLabel(text, fontStyle) → Array<GlyphInstance>`**.
   Pure CPU, no WebGL. Produces glyph instances `{atlasRect, offsetPx, advance}`,
   handling multi-line, alignment, (later) bidi. Pulls metrics from `GlyphAtlas`.

4. **`GlyphAtlas.js` — generalize existing.** `(char, font, size) → subRect`; lazily
   rasterizes glyphs into a Canvas2D-backed texture; exposes the texture + a
   "dirty-since-last-upload" flag. Decoupled from the old renderer.

5. **`MixedGeometryBatch.js` — `textBatch` + anchor derivation.** Populated in
   `addGeometry_`. Anchor: Point → coord (Phase 1); Polygon → interior point, Line →
   midpoint (Phase 2). Entry = `{feature, anchor, ref}`, sharing the feature's existing
   ref. add/change/remove/clear update `textBatch`. The **string value is not stored** —
   only anchor + ref; the string is resolved later from the live feature + style.

6. **`renderinstructions.js` — `generateTextRenderInstructions`.** Walks `textBatch`,
   runs `GlyphLayout` per entry, packs one instance per glyph plus CPU-gathered
   `a_prop_*` values into a `Float32Array` for the worker. Parallels
   `generatePointRenderInstructions`.

7. **`VectorStyleRenderer.js` — text render pass.** Adds `hasText_`, a `textRenderPass`
   (instanced glyph quads), binds the atlas texture uniform, routes a new
   `GENERATE_TEXT_BUFFERS` worker message.

8. **`WebGLVectorLayer` renderer.** Supplies the atlas texture as a uniform each frame
   and re-uploads when the atlas dirty flag is set. Otherwise unchanged.

9. **`WebGLText.js` layer.** Reduced to a deprecated thin preset over
   `WebGLVectorLayer`. Old `renderer/webgl/TextLayer.js` deleted.

## Data flow

### A. Feature enters the source
1. `MixedGeometryBatch.addGeometry_` routes geometry into polygon/line/point batch as
   today.
2. NEW: if the style produces a text pass, derive the label **anchor** from the
   geometry and push `{feature, anchor, ref}` into `textBatch` (shared ref → consistent
   hit detection). The string value is **not** stored here.

### B. `prepareFrameInternal` decides to rebuild
(unchanged trigger: view still + extent or source changed)
3. Atlas pre-pass (main thread): for each text entry, `GlyphLayout` requests each
   glyph's rect from `GlyphAtlas`; missing glyphs are rasterized into the atlas canvas;
   atlas marked dirty.
4. `generateTextRenderInstructions` emits one instance per glyph:
   `[anchorX, anchorY, glyphOffsetX, glyphOffsetY, atlasRectX, atlasRectY, atlasRectW,
   atlasRectH, ...a_prop_* gathered values]`. Visual props are **not** baked — only
   feature-property inputs are gathered (same as points).
5. Instructions handed to the **worker** → builds index + instance buffers. Uses a
   dedicated `GENERATE_TEXT_BUFFERS` message (text has a distinct attribute layout from
   points; reusing the point path would overload it). Same worker, same machinery.
6. On worker resolve: flush buffers to GPU, set `ready`, `layer.changed()` — same async
   pattern as `VectorStyleRenderer.generateBuffers`.

### C. `renderFrame` / `renderWorlds`
(per-world loop unchanged)
7. If atlas dirty → upload atlas canvas to its texture; clear dirty.
8. Bind atlas as `sampler2D`; run the text pass: instanced draw, one glyph quad per
   instance. Vertex shader expands quad around `anchor + glyphOffset`, applies GLSL
   size/rotation; fragment samples the atlas sub-rect and applies GLSL color/outline.
   Drawn alongside the fill/stroke/symbol passes.
9. Hit detection: glyph instances carry the feature's `hitColor` ref like any other
   pass → `forEachFeatureAtCoordinate` works with no special-casing.

### Preserved invariants
Two-transform render/buffer sync, the "view not moving" rebuild gate, ref-based hit
detection, and async worker buffers all behave exactly as in the point pipeline. Text
adds only: (a) the anchor field, (b) the CPU atlas+layout pre-pass, (c) one worker
message type.

## Testing

### Unit (node, no WebGL)
- **GlyphLayout** — single line, multi-line (`\n`), alignment, empty string,
  whitespace-only, unknown-glyph fallback, letter-spacing. Stub atlas with fixed
  metrics; assert offsets/advances.
- **GlyphAtlas** — stable rect per `(char,font,size)`; repeat reuses rect; new char
  grows atlas + sets dirty; rects do not overlap.
- **MixedGeometryBatch** — label feature adds `textBatch` entry with correct anchor
  (Point→coord, Polygon→interior point, Line→midpoint, Multi*→per-geometry);
  change/remove/clear update it; ref shared with the feature's other entries.
- **style.js `parseTextProperties`** — snapshot of generated GLSL/uniforms/attributes
  (as in existing `style.test.js`).

### Browser / render (`test/rendering/cases`, expected PNGs)
- `webgl-text-points` — point labels, fill + outline.
- `webgl-text-on-vector` — one layer rendering polygons **and** their labels from a
  single style (headline integration proof).
- `webgl-text-polygon-anchor`, `webgl-text-line-anchor` (Phase 2).
- Expression-driven: `text-value: ['get',...]`, `font-size` via `['interpolate',...]`,
  color via a style **variable** changing with **no rebuild** (proves GPU styling).
- Hit-detection: click a glyph → `forEachFeatureAtCoordinate` returns the feature.

### Migration
- Existing `WebGLText` examples still render via the deprecated wrapper.

### Edge cases pinned
- Feature with geometry but no label → no `textBatch` entry, zero glyph instances, no
  empty draws.
- Atlas overflow → grow texture (or page) + full re-upload; rebuild tolerates atlas
  resize mid-session (treat a grow like a source change → force full rebuild).
- Missing feature property → empty label, no crash.
- Source swap / layer dispose → `textBatch` cleared, atlas texture released, listeners
  removed (fixes the listener/batch leak in the current TextLayer).
- `disableHitDetection: true` → text pass omits the hitColor attribute, like other
  passes.
- Reprojection / user projection → anchor runs through the existing
  `projectionTransform` path used for point coords.

## Phases

### Phase 1 — Points, end-to-end (the proof)
- `textBatch` (anchor = point coord) + add/change/remove/clear + ref wiring.
- Generalize `GlyphAtlas`; new `GlyphLayout` (single-line first).
- `parseTextProperties` + `text-value` branch; text shader path in `ShaderBuilder`.
- `generateTextRenderInstructions` + `GENERATE_TEXT_BUFFERS` worker message.
- `text` render pass in `VectorStyleRenderer`; atlas uniform + dirty-upload in the
  vector renderer.
- Tests: GlyphLayout/GlyphAtlas/style units + `webgl-text-points` + hit detection.
- **Exit:** a `WebGLVectorLayer` with `{'text-value': ['get','name'], 'text-fill-color':
  ...}` labels point features; color via variable changes without rebuild.

### Phase 2 — All geometries (point-anchor, horizontal)
- Polygon → interior point, Line → midpoint anchor derivation (copy canvas helpers);
  multi-geometry handling.
- Multi-line layout + alignment + `text-offset`/`text-align`/`text-baseline`.
- `webgl-text-on-vector` render case.
- **Exit:** any vector feature labels correctly from one flat style.

### Phase 3 — Deprecate old layer
- `WebGLText.js` → deprecated thin preset over `WebGLVectorLayer`; delete
  `renderer/webgl/TextLayer.js`; port examples; changelog migration note.

### Phase 4 — Deferred / optional
- Line-following placement (per-glyph along path).
- Decluttering / label collision (only if explicitly requested).

## Risks & mitigations

- **ShaderBuilder/VectorStyleRenderer are core** — changes can regress
  fill/stroke/symbol. → Additive only (new pass type + new methods); run the full
  existing render suite each phase.
- **Atlas resize mid-session** — buffers reference stale rects after a grow. → On grow,
  force a full rebuild; covered by a test.
- **Main-thread layout jank** at high label counts. → Layout output is a plain instance
  array, designed to move to the worker later without batch changes.
- **Expression-model split** (string=CPU, visuals=GPU) may confuse maintainers. →
  Document the boundary here and in code; `parseTextProperties` mirrors
  `parseIconProperties` structure.
- **Per-glyph hit detection** could over-count. → Glyphs share the feature ref; first
  hit returns the feature, like multi-vertex symbols.

## Open micro-decisions (resolved)

- Worker message: dedicated `GENERATE_TEXT_BUFFERS` (chosen) vs. reuse point path —
  chose dedicated for a clean attribute layout and zero risk to the point path.
- Layout location: main thread (chosen), buffers in worker — atlas is main-thread-bound;
  worker layout deferred.
- `WebGLText` fate: deprecated thin wrapper for one release, then removed.
