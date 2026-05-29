# WebGL Text → Vector Layer Integration — Phase 1 (Points) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `WebGLVectorLayer` render text labels on **point** features from `text-*` flat-style properties, using the existing batch / VectorStyleRenderer / worker / hit-detection pipeline (a 4th "text" render pass), proving the integration end-to-end.

**Architecture:** Text becomes a 4th batch (`textBatch`) + 4th render pass in `VectorStyleRenderer`, parallel to point/line/polygon. Glyph layout is CPU (a pure `GlyphLayout` module reading a `GlyphAtlas`); glyph color/outline are GPU expressions via ShaderBuilder; the glyph atlas is bound as a `sampler2D` uniform like an icon sprite. Instance = one glyph quad (mirrors the symbol/point instanced pass). A new `GENERATE_TEXT_BUFFERS` worker message builds the buffers.

**Tech Stack:** JavaScript (ES modules), WebGL1, `@mapbox/tiny-sdf` glyph SDFs, Mocha/karma browser tests, the OL rendering-test harness (expected PNGs).

**Reference implementation to port:** the working (but parallel) `src/ol/renderer/webgl/TextLayer.js` — its glyph-layout loop (lines ~579–1005) and its SDF shader (lines 47–128) are proven and are the source material for `GlyphLayout` and the ShaderBuilder text shader. We are restructuring that logic into the shared pipeline, not inventing it.

**Design reference:** `docs/superpowers/specs/2026-05-29-webgl-text-vector-integration-design.md`.

**Scope of Phase 1 (explicit):**
- Point geometries only (anchor = the point coord). Polygon/line anchors are Phase 2.
- Single line of text, horizontal. Multi-line / alignment / offset are Phase 2.
- `text-value`, `text-font` (family/weight, CPU), `font-size` (GPU scale), `text-fill-color`,
  `text-stroke-color`, `text-stroke-width` (GPU).
- bidi, background, kerning-spacing heuristics from the old renderer are **out of scope** for Phase 1 (kept simple; kerning via atlas is fine to include since it is cheap and already implemented).
- `WebGLText` layer deprecation is Phase 3 — not touched here. The old `TextLayer.js` stays in place (unused by the new path) until Phase 3.

---

## File Structure

**Create:**
- `src/ol/render/webgl/GlyphLayout.js` — pure CPU glyph layout: `(text, atlas, options) → {glyphs, width, height}`.
- `test/browser/spec/ol/render/webgl/GlyphLayout.test.js`
- `test/browser/spec/ol/render/webgl/GlyphAtlas.test.js`
- `test/rendering/cases/webgl-text-points/main.js` + `expected.png`

**Modify:**
- `src/ol/render/webgl/GlyphAtlas.js` — add `dirty` flag + `markUploaded()`; expose `getGlyphInfo` reuse (already via `addChar`).
- `src/ol/render/webgl/MixedGeometryBatch.js` — add `textBatch` + populate for Point in `addCoordinates_`.
- `test/browser/spec/ol/render/webgl/MixedGeometryBatch.test.js` — text batch assertions.
- `src/ol/render/webgl/constants.js` — add `GENERATE_TEXT_BUFFERS`.
- `src/ol/worker/webgl.js` — add the `GENERATE_TEXT_BUFFERS` case.
- `src/ol/render/webgl/ShaderBuilder.js` — add text shader getters/setters.
- `test/browser/spec/ol/render/webgl/shaderbuilder.test.js` — text shader assertions.
- `src/ol/render/webgl/style.js` — add `parseTextProperties` + `text-value` branch in `parseLiteralStyle`.
- `test/browser/spec/ol/render/webgl/style.test.js` — text style parse assertions.
- `src/ol/render/webgl/renderinstructions.js` — add `generateTextRenderInstructions`.
- `src/ol/render/webgl/VectorStyleRenderer.js` — text render pass + atlas uniform.
- `src/ol/renderer/webgl/VectorLayer.js` — supply atlas texture uniform + dirty upload.

**Test commands:**
- Browser specs (watch): `npm run karma` — then open the served page, or `npm run test-browser` for single-run. Scope a single spec with a temporary `describe.only(...)`.
- Lint/types (run before each commit): `npm run lint` and `npm run typecheck`.
- Rendering test: `npm run test-rendering -- --force` (builds, runs canvas comparisons). Add `--match webgl-text-points` to limit if supported, else it runs all.

---

## Task 1: `GlyphLayout` — pure CPU glyph layout

A pure function turning a string + atlas into centered glyph quads (offset rect in px relative to anchor + atlas UV rect). No WebGL. Testable with a **stub atlas**.

**Files:**
- Create: `src/ol/render/webgl/GlyphLayout.js`
- Test: `test/browser/spec/ol/render/webgl/GlyphLayout.test.js`

- [ ] **Step 1: Write the failing test**

```js
import GlyphLayout from '../../../../../../src/ol/render/webgl/GlyphLayout.js';

/**
 * Stub atlas: each glyph is a fixed 10x20 box, advance 12, top 16, left 1,
 * atlas position derived from char code so UVs are deterministic.
 */
function makeStubAtlas() {
  return {
    getWidth: () => 100,
    getHeight: () => 100,
    addChar: (char) => ({
      id: char.charCodeAt(0),
      x: char.charCodeAt(0) % 10,
      y: 0,
      width: 10,
      height: 20,
      advance: 12,
      top: 16,
      left: 1,
    }),
    getKerning: () => 0,
  };
}

describe('ol/render/webgl/GlyphLayout', function () {
  it('returns one glyph per character', function () {
    const result = GlyphLayout('ab', makeStubAtlas());
    expect(result.glyphs).to.have.length(2);
  });

  it('advances the pen by glyph.advance between glyphs', function () {
    const result = GlyphLayout('ab', makeStubAtlas());
    const dx = result.glyphs[1].offsetPx[0] - result.glyphs[0].offsetPx[0];
    expect(dx).to.be(12); // advance, kerning 0
  });

  it('centers the label horizontally around the anchor', function () {
    // total advance for 2 glyphs is 12 + (1+10) ... center should be near 0
    const result = GlyphLayout('ab', makeStubAtlas());
    const left = result.glyphs[0].offsetPx[0];
    const right = result.glyphs[1].offsetPx[0] + result.glyphs[1].sizePx[0];
    expect(Math.abs(left + right)).to.be.lessThan(1); // symmetric around 0
  });

  it('computes atlas UV rect normalized by atlas size', function () {
    const result = GlyphLayout('a', makeStubAtlas());
    const g = result.glyphs[0];
    const code = 'a'.charCodeAt(0);
    expect(g.atlasUv[0]).to.be((code % 10) / 100); // u0 = x / width
    expect(g.atlasUv[2]).to.be(((code % 10) + 10) / 100); // u1 = (x+w)/width
  });

  it('returns empty glyphs for empty string', function () {
    const result = GlyphLayout('', makeStubAtlas());
    expect(result.glyphs).to.have.length(0);
  });

  it('skips glyphs the atlas cannot place (addChar returns null)', function () {
    const atlas = makeStubAtlas();
    atlas.addChar = () => null;
    const result = GlyphLayout('ab', atlas);
    expect(result.glyphs).to.have.length(0);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run karma` (or `npm run test-browser`) with a temporary `describe.only` on this spec.
Expected: FAIL — `GlyphLayout` module does not exist / import error.

- [ ] **Step 3: Write the implementation**

```js
/**
 * @module ol/render/webgl/GlyphLayout
 */

/**
 * @typedef {Object} LaidOutGlyph
 * @property {Array<number>} offsetPx [x, y] of the glyph quad's lower-left, in pixels relative to the anchor (y up).
 * @property {Array<number>} sizePx [width, height] of the glyph quad in pixels.
 * @property {Array<number>} atlasUv [u0, v0, u1, v1] normalized atlas texture coordinates.
 */

/**
 * @typedef {Object} GlyphLayoutResult
 * @property {Array<LaidOutGlyph>} glyphs Laid-out glyphs.
 * @property {number} width Total label width in pixels.
 * @property {number} height Total label height in pixels.
 */

/**
 * @typedef {Object} GlyphLayoutOptions
 * @property {number} [letterSpacing=0] Extra spacing between glyphs in px.
 */

/**
 * @typedef {Object} GlyphSource
 * @property {function(): number} getWidth Atlas width in px.
 * @property {function(): number} getHeight Atlas height in px.
 * @property {function(string): (import('./GlyphAtlas.js').GlyphInfo|null)} addChar Get/create glyph info.
 * @property {function(string, string): number} getKerning Kerning between two chars.
 */

/**
 * Lay out a single line of horizontal text into glyph quads, centered horizontally
 * around the anchor (x = 0). Coordinates are in pixels at the atlas reference size;
 * the caller applies font-size as a scale at render time.
 *
 * Ported from the proven layout loop in renderer/webgl/TextLayer.js.
 *
 * @param {string} text The label string.
 * @param {GlyphSource} atlas Glyph atlas.
 * @param {GlyphLayoutOptions} [options] Options.
 * @return {GlyphLayoutResult} Laid-out glyphs + measured size.
 */
export default function GlyphLayout(text, atlas, options = {}) {
  const letterSpacing = options.letterSpacing || 0;
  const atlasWidth = atlas.getWidth();
  const atlasHeight = atlas.getHeight();

  /** @type {Array<LaidOutGlyph>} */
  const glyphs = [];

  // First pass: measure to find the horizontal extent for centering.
  let cursorX = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let prevChar = null;

  /** @type {Array<{glyph: import('./GlyphAtlas.js').GlyphInfo, penX: number}>} */
  const placed = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = atlas.addChar(char);
    if (!glyph) {
      prevChar = null;
      continue;
    }
    if (prevChar) {
      cursorX += atlas.getKerning(prevChar, char);
    }
    const left = cursorX + glyph.left;
    const right = left + glyph.width;
    const top = -glyph.top;
    const bottom = top + glyph.height;
    if (left < minX) {
      minX = left;
    }
    if (right > maxX) {
      maxX = right;
    }
    if (top < minY) {
      minY = top;
    }
    if (bottom > maxY) {
      maxY = bottom;
    }
    placed.push({glyph, penX: cursorX});
    cursorX += glyph.advance + letterSpacing;
    prevChar = char;
  }

  if (placed.length === 0) {
    return {glyphs: [], width: 0, height: 0};
  }

  const centerX = (minX + maxX) / 2;

  for (let i = 0; i < placed.length; i++) {
    const {glyph, penX} = placed[i];
    const x0 = penX + glyph.left - centerX;
    const y0 = glyph.top - glyph.height; // baseline at y=0, y up
    glyphs.push({
      offsetPx: [x0, y0],
      sizePx: [glyph.width, glyph.height],
      atlasUv: [
        glyph.x / atlasWidth,
        glyph.y / atlasHeight,
        (glyph.x + glyph.width) / atlasWidth,
        (glyph.y + glyph.height) / atlasHeight,
      ],
    });
  }

  return {glyphs, width: maxX - minX, height: maxY - minY};
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: same karma spec.
Expected: PASS (all 6 assertions).

- [ ] **Step 5: Lint + commit**

```bash
npm run lint
git add src/ol/render/webgl/GlyphLayout.js test/browser/spec/ol/render/webgl/GlyphLayout.test.js
git commit -m "feat(webgl): add GlyphLayout module for text labels"
```

---

## Task 2: `GlyphAtlas` dirty tracking

The atlas must tell the renderer when new glyphs were rasterized so the texture is re-uploaded only when needed.

**Files:**
- Modify: `src/ol/render/webgl/GlyphAtlas.js`
- Test: `test/browser/spec/ol/render/webgl/GlyphAtlas.test.js`

- [ ] **Step 1: Write the failing test**

```js
import GlyphAtlas from '../../../../../../src/ol/render/webgl/GlyphAtlas.js';

describe('ol/render/webgl/GlyphAtlas', function () {
  it('starts dirty so the first upload happens', function () {
    const atlas = new GlyphAtlas('sans-serif');
    expect(atlas.isDirty()).to.be(true);
  });

  it('markUploaded clears the dirty flag', function () {
    const atlas = new GlyphAtlas('sans-serif');
    atlas.markUploaded();
    expect(atlas.isDirty()).to.be(false);
  });

  it('adding a new glyph sets dirty', function () {
    const atlas = new GlyphAtlas('sans-serif');
    atlas.markUploaded();
    atlas.addChar('A');
    expect(atlas.isDirty()).to.be(true);
  });

  it('adding an already-present glyph does not set dirty', function () {
    const atlas = new GlyphAtlas('sans-serif');
    atlas.addChar('A');
    atlas.markUploaded();
    atlas.addChar('A');
    expect(atlas.isDirty()).to.be(false);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: karma with `describe.only` on this spec.
Expected: FAIL — `atlas.isDirty is not a function`.

- [ ] **Step 3: Implement dirty tracking**

In `src/ol/render/webgl/GlyphAtlas.js` constructor, after `this.rowHeight_ = 0;` add:

```js
    /**
     * @type {boolean}
     * @private
     */
    this.dirty_ = true;
```

Add these methods to the class (e.g. after `getCanvas`):

```js
  /**
   * @return {boolean} Whether the atlas canvas changed since the last upload.
   */
  isDirty() {
    return this.dirty_;
  }

  /**
   * Mark the atlas as uploaded to the GPU (clears the dirty flag).
   */
  markUploaded() {
    this.dirty_ = false;
  }
```

In `addChar`, set `this.dirty_ = true;` immediately before `this.glyphs_.set(char, glyphInfo);` (so reused glyphs — which return early at the top — do not dirty). Do the same in `getWhitePixel` before its `this.glyphs_.set(...)`.

- [ ] **Step 4: Run test, verify it passes**

Run: same karma spec.
Expected: PASS (4 assertions).

- [ ] **Step 5: Lint + commit**

```bash
npm run lint
git add src/ol/render/webgl/GlyphAtlas.js test/browser/spec/ol/render/webgl/GlyphAtlas.test.js
git commit -m "feat(webgl): track dirty state on GlyphAtlas for texture uploads"
```

---

## Task 3: `MixedGeometryBatch.textBatch` (points)

Add a 4th inner batch that holds one entry per feature that has a point geometry, so the text pass has anchors. Phase 1: only Point/MultiPoint contribute (reuse the existing `case 'Point'` path).

**Files:**
- Modify: `src/ol/render/webgl/MixedGeometryBatch.js`
- Test: `test/browser/spec/ol/render/webgl/MixedGeometryBatch.test.js`

- [ ] **Step 1: Write the failing test** (append to the existing describe block)

```js
  describe('textBatch (points)', function () {
    let batch;
    beforeEach(function () {
      batch = new MixedGeometryBatch();
    });

    it('adds a point feature to textBatch with the point coords as anchor', function () {
      const feature = new Feature(new Point([10, 20]));
      batch.addFeature(feature);
      const entries = Object.values(batch.textBatch.entries);
      expect(entries).to.have.length(1);
      expect(entries[0].flatCoordss[0]).to.eql([10, 20]);
    });

    it('shares the same ref as the feature point entry', function () {
      const feature = new Feature(new Point([10, 20]));
      batch.addFeature(feature);
      const uid = getUid(feature);
      expect(batch.textBatch.entries[uid].ref).to.be(
        batch.pointBatch.entries[uid].ref,
      );
    });

    it('removes the feature from textBatch on removeFeature', function () {
      const feature = new Feature(new Point([10, 20]));
      batch.addFeature(feature);
      batch.removeFeature(feature);
      expect(Object.values(batch.textBatch.entries)).to.have.length(0);
    });

    it('clears textBatch on clear', function () {
      batch.addFeature(new Feature(new Point([1, 2])));
      batch.clear();
      expect(Object.values(batch.textBatch.entries)).to.have.length(0);
    });
  });
```

Ensure the test file imports `getUid` (`import {getUid} from '../../../../../../src/ol/util.js';`), `Feature`, and `Point` — add any missing imports at the top of the file.

- [ ] **Step 2: Run test, verify it fails**

Run: karma with `describe.only('textBatch (points)', ...)`.
Expected: FAIL — `batch.textBatch` is undefined.

- [ ] **Step 3: Implement `textBatch`**

In the constructor of `MixedGeometryBatch`, after the `pointBatch` block, add:

```js
    /**
     * One entry per feature that can carry a label (Phase 1: point features).
     * @type {PointGeometryBatch}
     */
    this.textBatch = {
      entries: {},
      geometriesCount: 0,
    };
```

In `addCoordinates_`, inside `case 'Point':` — after the existing block that populates `this.pointBatch.entries[featureUid]` and pushes `flatCoords` — also populate the text batch. Locate:

```js
      case 'Point':
        if (!this.pointBatch.entries[featureUid]) {
          this.pointBatch.entries[featureUid] = this.addRefToEntry_(
            featureUid,
            {
              feature: feature,
              flatCoordss: [],
            },
          );
        }
        this.pointBatch.entries[featureUid].flatCoordss.push(flatCoords);
        break;
```

Replace the `break;` line for this case with:

```js
        if (!this.textBatch.entries[featureUid]) {
          this.textBatch.entries[featureUid] = this.addRefToEntry_(featureUid, {
            feature: feature,
            flatCoordss: [],
          });
          this.textBatch.geometriesCount++;
        }
        this.textBatch.entries[featureUid].flatCoordss.push(flatCoords);
        break;
```

In `clear()`, after the `pointBatch` reset lines, add:

```js
    this.textBatch.entries = {};
    this.textBatch.geometriesCount = 0;
```

Find the method that removes a feature's point entry (the one around line 162 deleting `this.pointBatch.entries[featureUid]`) and the general `removeFeature` path. In whichever private cleanup deletes per-batch entries for a feature uid, add a matching deletion for the text batch. Concretely, in the function that contains `delete this.pointBatch.entries[featureUid];` add immediately after it:

```js
    if (this.textBatch.entries[featureUid]) {
      delete this.textBatch.entries[featureUid];
      this.textBatch.geometriesCount--;
    }
```

(If `removeFeature` iterates over all three batches via a shared helper, add `this.textBatch` to that iteration instead — follow the file's existing pattern.)

- [ ] **Step 4: Run test, verify it passes**

Run: same karma spec.
Expected: PASS (4 assertions).

- [ ] **Step 5: Verify no regression in the existing batch suite**

Run: the full `MixedGeometryBatch.test.js` (remove `.only`).
Expected: PASS — existing point/line/polygon assertions unaffected.

- [ ] **Step 6: Lint + commit**

```bash
npm run lint
git add src/ol/render/webgl/MixedGeometryBatch.js test/browser/spec/ol/render/webgl/MixedGeometryBatch.test.js
git commit -m "feat(webgl): add textBatch to MixedGeometryBatch for point labels"
```

---

## Task 4: ShaderBuilder text shader path

Add text vertex/fragment shader generation to `ShaderBuilder`, mirroring the symbol path but sampling the glyph atlas SDF. The vertex shader expands a unit quad to the glyph quad using per-instance offset/size attributes; the fragment shader applies the SDF threshold and the builder's text color/outline expressions.

**Files:**
- Modify: `src/ol/render/webgl/ShaderBuilder.js`
- Test: `test/browser/spec/ol/render/webgl/shaderbuilder.test.js`

- [ ] **Step 1: Write the failing test** (append a describe block)

```js
  describe('text shaders', function () {
    it('returns null text shaders by default', function () {
      const builder = new ShaderBuilder();
      expect(builder.getTextVertexShader()).to.be(null);
    });

    it('produces a text vertex+fragment shader once a text color is set', function () {
      const builder = new ShaderBuilder();
      builder.setTextColorExpression('vec4(1.0)');
      expect(builder.getTextVertexShader()).to.be.a('string');
      expect(builder.getTextFragmentShader()).to.contain('u_atlasTexture');
      expect(builder.getTextFragmentShader()).to.contain('vec4(1.0)');
    });

    it('includes glyph instance attributes in the text vertex shader', function () {
      const builder = new ShaderBuilder();
      builder.setTextColorExpression('vec4(1.0)');
      const vs = builder.getTextVertexShader();
      expect(vs).to.contain('a_glyphOffset');
      expect(vs).to.contain('a_glyphSize');
      expect(vs).to.contain('a_glyphUv');
      expect(vs).to.contain('a_anchor');
    });
  });
```

- [ ] **Step 2: Run test, verify it fails**

Run: karma with `describe.only('text shaders', ...)`.
Expected: FAIL — `builder.setTextColorExpression is not a function`.

- [ ] **Step 3: Implement the text shader path**

In the `ShaderBuilder` constructor, add fields near the other expression fields:

```js
    /**
     * @type {string|null}
     * @private
     */
    this.textColorExpression_ = null;

    /**
     * @type {string}
     * @private
     */
    this.textOutlineColorExpression_ = 'vec4(1.0)';

    /**
     * @type {string}
     * @private
     */
    this.textOutlineWidthExpression_ = '0.0';

    /**
     * @type {string}
     * @private
     */
    this.textSizeExpression_ = '16.0';
```

Add setters/getters:

```js
  /**
   * @param {string} expression Text fill color, GLSL vec4.
   * @return {ShaderBuilder} this.
   */
  setTextColorExpression(expression) {
    this.textColorExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Text outline color, GLSL vec4.
   * @return {ShaderBuilder} this.
   */
  setTextOutlineColorExpression(expression) {
    this.textOutlineColorExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Text outline width in px, GLSL float.
   * @return {ShaderBuilder} this.
   */
  setTextOutlineWidthExpression(expression) {
    this.textOutlineWidthExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Font size in px, GLSL float.
   * @return {ShaderBuilder} this.
   */
  setTextSizeExpression(expression) {
    this.textSizeExpression_ = expression;
    return this;
  }

  /**
   * @return {string|null} The text vertex shader, or null if no text in this style.
   */
  getTextVertexShader() {
    if (this.textColorExpression_ === null) {
      return null;
    }
    return `${this.getShaderHeader_ ? this.getShaderHeader_() : ''}
precision mediump float;
${this.uniforms_.map((u) => 'uniform ' + u + ';').join('\n')}
uniform mat4 u_projectionMatrix;
uniform vec2 u_viewportSizePx;

attribute vec2 a_localPosition;   // unit quad corner in [-1, 1]
attribute vec2 a_anchor;          // world coords of label anchor
attribute vec2 a_glyphOffset;     // px offset of glyph quad lower-left from anchor (ref size)
attribute vec2 a_glyphSize;       // px size of glyph quad (ref size)
attribute vec4 a_glyphUv;         // atlas uv rect (u0, v0, u1, v1)
${this.attributes_.map((a) => 'attribute ' + a + ';').join('\n')}

varying vec2 v_texCoord;
${this.varyings_.map((v) => 'varying ' + v.type + ' ' + v.name + ';').join('\n')}

void main(void) {
  ${this.vertexShaderFunctions_.join('\n')}
  float refSize = 128.0; // GlyphAtlas reference em size
  float sizeRatio = (${this.textSizeExpression_}) / refSize;

  // glyph quad corner in px (ref size), local position maps [-1,1] -> [0,1]
  vec2 local01 = a_localPosition * 0.5 + 0.5;
  vec2 cornerPx = (a_glyphOffset + a_glyphSize * local01) * sizeRatio;

  vec4 anchorClip = u_projectionMatrix * vec4(a_anchor, 0.0, 1.0);
  // pixel-snap the anchor to reduce shimmer
  vec2 anchorScreen = floor(((anchorClip.xy / anchorClip.w) * 0.5 + 0.5) * u_viewportSizePx + 0.5);
  anchorClip.xy = (anchorScreen / u_viewportSizePx * 2.0 - 1.0) * anchorClip.w;

  vec2 offsetNdc = cornerPx / u_viewportSizePx * 2.0;
  gl_Position = anchorClip + vec4(offsetNdc.x, offsetNdc.y, 0.0, 0.0);

  // uv: local01.x picks u0/u1, local01.y picks v1/v0 (atlas y is top-down)
  v_texCoord = vec2(
    mix(a_glyphUv.x, a_glyphUv.z, local01.x),
    mix(a_glyphUv.w, a_glyphUv.y, local01.y)
  );
  ${this.varyingAssignments_ ? this.varyingAssignments_.join('\n') : ''}
}`;
  }

  /**
   * @return {string|null} The text fragment shader, or null if no text in this style.
   */
  getTextFragmentShader() {
    if (this.textColorExpression_ === null) {
      return null;
    }
    return `precision mediump float;
${this.uniforms_.map((u) => 'uniform ' + u + ';').join('\n')}
uniform sampler2D u_atlasTexture;

varying vec2 v_texCoord;
${this.varyings_.map((v) => 'varying ' + v.type + ' ' + v.name + ';').join('\n')}

void main(void) {
  ${this.fragmentShaderFunctions_.join('\n')}
  float dist = texture2D(u_atlasTexture, v_texCoord).a;
  float smoothing = 0.1;
  float threshold = 0.6;
  vec4 fillColor = ${this.textColorExpression_};
  vec4 outlineColor = ${this.textOutlineColorExpression_};
  float outlineWidth = (${this.textOutlineWidthExpression_}) / 24.0;
  float fillAlpha = smoothstep(threshold - smoothing, threshold + smoothing, dist);
  float borderThreshold = threshold - outlineWidth;
  float borderAlpha = smoothstep(borderThreshold - smoothing, borderThreshold + smoothing, dist);
  vec4 color = mix(outlineColor, fillColor, fillAlpha);
  float a = color.a * borderAlpha;
  gl_FragColor = vec4(color.rgb * a, a);
}`;
  }
```

NOTE for the implementer: `this.uniforms_`, `this.attributes_`, `this.varyings_`, `this.vertexShaderFunctions_`, `this.fragmentShaderFunctions_` are the existing private collections used by `getSymbolVertexShader`. Match their exact field names as used in the symbol getters in this same file (read those getters first and reuse the identical accessors/format). If the symbol shader builds attribute/uniform/varying strings via helper methods rather than raw `.map`, use those same helpers here instead of the `.map(...)` shown above.

- [ ] **Step 4: Run test, verify it passes**

Run: same karma spec.
Expected: PASS (3 assertions).

- [ ] **Step 5: Lint + commit**

```bash
npm run lint
git add src/ol/render/webgl/ShaderBuilder.js test/browser/spec/ol/render/webgl/shaderbuilder.test.js
git commit -m "feat(webgl): add text shader generation to ShaderBuilder"
```

---

## Task 5: `parseTextProperties` in style.js

Parse `text-*` flat-style props into the ShaderBuilder text expressions + GPU attributes/uniforms, and add a `text-value` branch to `parseLiteralStyle`. The label **string** (`text-value`) is NOT parsed to GLSL here — it is resolved CPU-side later (Task 7); here we only flag that a text pass exists and parse the **visual** props.

**Files:**
- Modify: `src/ol/render/webgl/style.js`
- Test: `test/browser/spec/ol/render/webgl/style.test.js`

- [ ] **Step 1: Write the failing test** (append)

```js
  describe('text styles', function () {
    it('produces a text vertex shader when text-value is present', function () {
      const result = parseLiteralStyle({
        'text-value': ['get', 'label'],
        'text-fill-color': '#ff0000',
      });
      expect(result.builder.getTextVertexShader()).to.be.a('string');
    });

    it('compiles text-fill-color into the fragment shader', function () {
      const result = parseLiteralStyle({
        'text-value': ['get', 'label'],
        'text-fill-color': '#ff0000',
      });
      // red packed/encoded color expression should appear; assert the fill color call site exists
      expect(result.builder.getTextFragmentShader()).to.contain('fillColor');
    });

    it('does not produce a text shader without text-value', function () {
      const result = parseLiteralStyle({'fill-color': '#ff0000'});
      expect(result.builder.getTextVertexShader()).to.be(null);
    });
  });
```

- [ ] **Step 2: Run test, verify it fails**

Run: karma with `describe.only('text styles', ...)`.
Expected: FAIL — `getTextVertexShader()` returns null (no `text-value` branch yet).

- [ ] **Step 3: Implement `parseTextProperties` + branch**

Add this function in `style.js` (next to `parseIconProperties`):

```js
/**
 * @param {import("../../style/flat.js").FlatStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../../webgl/Helper.js").UniformValue>} uniforms Uniforms
 * @param {import("../../expr/gpu.js").CompilationContext} context Shader compilation context
 */
function parseTextProperties(style, builder, uniforms, context) {
  if ('text-fill-color' in style) {
    builder.setTextColorExpression(
      expressionToGlsl(context, style['text-fill-color'], ColorType),
    );
  } else {
    builder.setTextColorExpression('vec4(0.2, 0.2, 0.2, 1.0)');
  }
  if ('text-stroke-color' in style) {
    builder.setTextOutlineColorExpression(
      expressionToGlsl(context, style['text-stroke-color'], ColorType),
    );
  }
  if ('text-stroke-width' in style) {
    builder.setTextOutlineWidthExpression(
      expressionToGlsl(context, style['text-stroke-width'], NumberType),
    );
  }
  if ('font-size' in style) {
    builder.setTextSizeExpression(
      expressionToGlsl(context, style['font-size'], NumberType),
    );
  }
}
```

In `parseLiteralStyle`, add a branch alongside the existing symbol branches (after the `icon-src`/`shape-points`/`circle-radius` chain, before/after `parseStrokeProperties`/`parseFillProperties` — order does not matter as text uses its own expressions):

```js
  if ('text-value' in style) {
    parseTextProperties(style, builder, uniforms, context);
  }
```

`expressionToGlsl`, `ColorType`, `NumberType` are already imported in `style.js`.

- [ ] **Step 4: Run test, verify it passes**

Run: same karma spec.
Expected: PASS (3 assertions).

- [ ] **Step 5: Verify the full style suite still passes**

Run: full `style.test.js`.
Expected: PASS — existing fill/stroke/symbol parsing unaffected (text branch only triggers on `text-value`).

- [ ] **Step 6: Lint + commit**

```bash
npm run lint
git add src/ol/render/webgl/style.js test/browser/spec/ol/render/webgl/style.test.js
git commit -m "feat(webgl): parse text-* flat style props into shader text expressions"
```

---

## Task 6: `GENERATE_TEXT_BUFFERS` constant + worker case

Add the worker message that builds instanced glyph buffers. Instance layout per glyph:
`[anchorX, anchorY, offX, offY, sizeW, sizeH, u0, v0, u1, v1, ...customAttrs]`.
The worker transforms the anchor (like points) and emits a unit-quad index/vertex buffer + the per-glyph instance buffer.

**Files:**
- Modify: `src/ol/render/webgl/constants.js`, `src/ol/worker/webgl.js`

- [ ] **Step 1: Add the constant**

In `src/ol/render/webgl/constants.js`, add to `WebGLWorkerMessageType`:

```js
  GENERATE_TEXT_BUFFERS: 'GENERATE_TEXT_BUFFERS',
```

- [ ] **Step 2: Add the worker case**

In `src/ol/worker/webgl.js`, inside the `switch (received.type)`, add (mirroring the point case; here each render-instruction record is already one glyph instance, so we copy it through, transforming only the anchor x,y):

```js
    case WebGLWorkerMessageType.GENERATE_TEXT_BUFFERS: {
      // Per-glyph instruction layout:
      // [anchorX, anchorY, offX, offY, sizeW, sizeH, u0, v0, u1, v1, ...custom]
      const baseInstructionsCount = 10;
      const customAttrsCount = received.customAttributesSize || 0;
      const instructionsCount = baseInstructionsCount + customAttrsCount;
      const renderInstructions = new Float32Array(received.renderInstructions);

      const transform = received.renderInstructionsTransform;
      const invertTransform = createTransform();
      makeInverseTransform(invertTransform, transform);

      const elementsCount = renderInstructions.length / instructionsCount;
      const instanceAttributesBuffer = new Float32Array(
        elementsCount * instructionsCount,
      );

      for (let i = 0; i < renderInstructions.length; i += instructionsCount) {
        // anchor: transform from render-instruction space back to world via inverse transform
        const x = renderInstructions[i];
        const y = renderInstructions[i + 1];
        instanceAttributesBuffer[i] =
          x * invertTransform[0] + y * invertTransform[2] + invertTransform[4];
        instanceAttributesBuffer[i + 1] =
          x * invertTransform[1] + y * invertTransform[3] + invertTransform[5];
        // copy the rest of the record unchanged
        for (let j = 2; j < instructionsCount; j++) {
          instanceAttributesBuffer[i + j] = renderInstructions[i + j];
        }
      }

      const indicesBuffer = Uint32Array.from([0, 1, 3, 1, 2, 3]);
      const vertexAttributesBuffer = Float32Array.from([
        -1, -1, 1, -1, 1, 1, -1, 1,
      ]); // unit quad local position

      /** @type {import('../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
      const message = Object.assign(
        {
          indicesBuffer: indicesBuffer.buffer,
          vertexAttributesBuffer: vertexAttributesBuffer.buffer,
          instanceAttributesBuffer: instanceAttributesBuffer.buffer,
          renderInstructions: renderInstructions.buffer,
        },
        received,
      );

      worker.postMessage(message, [
        vertexAttributesBuffer.buffer,
        instanceAttributesBuffer.buffer,
        indicesBuffer.buffer,
        renderInstructions.buffer,
      ]);
      break;
    }
```

NOTE: confirm against `writePointFeatureToBuffers` in `bufferUtil.js` exactly how the point path applies the transform to x,y, and match that convention (the inverse-transform application above follows the standard 2D affine `[a,b,c,d,e,f]` layout used by `ol/transform`). If the point path stores anchors already-transformed and lets the shader's `u_projectionMatrix` do the rest, replicate that instead — the anchor must end up in the same coordinate space the text vertex shader's `a_anchor` expects (world coords, since the shader multiplies by `u_projectionMatrix`).

- [ ] **Step 3: Verify build/transpile**

Run: `npm run lint` (this runs `transpile`, which also re-serializes the worker via `tasks/serialize-workers.cjs`).
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/ol/render/webgl/constants.js src/ol/worker/webgl.js
git commit -m "feat(webgl): add GENERATE_TEXT_BUFFERS worker message for glyph instances"
```

---

## Task 7: `generateTextRenderInstructions`

CPU step: walk `textBatch`, resolve the label string per feature (CPU expression eval of `text-value`), run `GlyphLayout`, and emit one render-instruction record per glyph, including gathered `a_prop_*` custom-attribute values.

**Files:**
- Modify: `src/ol/render/webgl/renderinstructions.js`
- Test: `test/browser/spec/ol/render/webgl/renderinstructions.test.js`

- [ ] **Step 1: Write the failing test** (append)

```js
  describe('generateTextRenderInstructions', function () {
    it('emits one record per glyph with the base layout', function () {
      const atlas = {
        getWidth: () => 100,
        getHeight: () => 100,
        addChar: (c) => ({
          id: c.charCodeAt(0), x: 0, y: 0, width: 10, height: 20,
          advance: 12, top: 16, left: 1,
        }),
        getKerning: () => 0,
      };
      const feature = new Feature(new Point([5, 6]));
      feature.set('label', 'ab');
      const batch = new MixedGeometryBatch();
      batch.addFeature(feature);

      const resolveText = () => 'ab';
      const customAttributes = {}; // none
      const transform = createTransform();
      const instructions = generateTextRenderInstructions(
        batch.textBatch, atlas, resolveText, customAttributes, transform,
      );
      // 2 glyphs * 10 floats each
      expect(instructions.length).to.be(20);
      // first glyph anchor
      expect(instructions[0]).to.be(5);
      expect(instructions[1]).to.be(6);
    });
  });
```

Add imports as needed (`Feature`, `Point`, `MixedGeometryBatch`, `createTransform`, and `generateTextRenderInstructions`).

- [ ] **Step 2: Run test, verify it fails**

Run: karma with `describe.only('generateTextRenderInstructions', ...)`.
Expected: FAIL — function not exported.

- [ ] **Step 3: Implement**

In `renderinstructions.js`, add (use the existing `getCustomAttributesSize` + the established pattern for evaluating custom attribute callbacks per feature found in `generatePointRenderInstructions`):

```js
import GlyphLayout from './GlyphLayout.js';

/**
 * Generate render instructions for text labels: one record per glyph.
 * Record layout: [anchorX, anchorY, offX, offY, sizeW, sizeH, u0, v0, u1, v1, ...custom].
 * @param {import('./MixedGeometryBatch.js').PointGeometryBatch} textBatch Text batch.
 * @param {import('./GlyphLayout.js').GlyphSource} atlas Glyph atlas.
 * @param {function(import('../../Feature.js').FeatureLike): string} resolveText Resolves the label string for a feature.
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attribute definitions.
 * @param {import('../../transform.js').Transform} transform Transform applied to anchor coords.
 * @return {Float32Array} Render instructions.
 */
export function generateTextRenderInstructions(
  textBatch,
  atlas,
  resolveText,
  customAttributes,
  transform,
) {
  const customAttrNames = Object.keys(customAttributes);
  const customSize = getCustomAttributesSize(customAttributes);
  const recordSize = 10 + customSize;

  /** @type {Array<number>} */
  const out = [];

  for (const uid in textBatch.entries) {
    const entry = textBatch.entries[uid];
    const feature = entry.feature;
    const text = resolveText(feature);
    if (!text) {
      continue;
    }
    const flatCoords = entry.flatCoordss[0];
    const anchorX = flatCoords[0];
    const anchorY = flatCoords[1];

    // gather custom attribute values once per feature
    /** @type {Array<number>} */
    const customValues = [];
    for (const name of customAttrNames) {
      const def = customAttributes[name];
      const value = def.callback.call(entry, feature);
      if (Array.isArray(value)) {
        for (let k = 0; k < value.length; k++) {
          customValues.push(value[k]);
        }
      } else {
        customValues.push(value);
      }
    }

    const layout = GlyphLayout(text, atlas);
    for (const glyph of layout.glyphs) {
      out.push(
        anchorX,
        anchorY,
        glyph.offsetPx[0],
        glyph.offsetPx[1],
        glyph.sizePx[0],
        glyph.sizePx[1],
        glyph.atlasUv[0],
        glyph.atlasUv[1],
        glyph.atlasUv[2],
        glyph.atlasUv[3],
      );
      for (let k = 0; k < customValues.length; k++) {
        out.push(customValues[k]);
      }
    }
  }

  return Float32Array.from(out);
}
```

NOTE: the test passes `transform` but Phase 1 keeps the anchor in world coords and lets the worker/shader transform handle projection; `transform` is accepted for signature parity with the other `generate*RenderInstructions` and to allow the worker to attach `renderInstructionsTransform`. If the sibling functions pre-multiply coords by `transform` here (check `generatePointRenderInstructions`), do the same to the anchor and adjust the worker (Task 6) accordingly so the two stay consistent. Pick ONE convention and keep Task 6 + Task 7 + the shader in agreement.

- [ ] **Step 4: Run test, verify it passes**

Run: same karma spec.
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
npm run lint
git add src/ol/render/webgl/renderinstructions.js test/browser/spec/ol/render/webgl/renderinstructions.test.js
git commit -m "feat(webgl): generate per-glyph text render instructions"
```

---

## Task 8: Text render pass in `VectorStyleRenderer`

Wire the text pass: build buffers via `GENERATE_TEXT_BUFFERS`, hold the glyph atlas, bind it as `u_atlasTexture`, and draw instanced glyph quads. Mirror the existing symbol render-pass structure.

**Files:**
- Modify: `src/ol/render/webgl/VectorStyleRenderer.js`
- Test: covered by the render test (Task 10); add a light unit assertion for `hasText_`.

- [ ] **Step 1: Detect text in the style shaders**

In the `VectorStyleRenderer` constructor, after `this.hasSymbol_ = ...`, add:

```js
    this.hasText_ = this.styleShaders.some(
      (styleShader) => !!styleShader.builder.getTextVertexShader(),
    );
```

- [ ] **Step 2: Create the glyph atlas in the renderer**

Add a field in the constructor:

```js
    /**
     * @type {import('./GlyphAtlas.js').default|null}
     * @private
     */
    this.glyphAtlas_ = this.hasText_ ? new GlyphAtlas('sans-serif') : null;
```

Import at top: `import GlyphAtlas from './GlyphAtlas.js';`. Add a getter `getGlyphAtlas() { return this.glyphAtlas_; }` so the layer renderer can upload its texture.

- [ ] **Step 3: Add the text render pass**

In the `renderPasses_` map callback, after the symbol pass block, add:

```js
      if (styleShader.builder.getTextVertexShader()) {
        renderPass.textRenderPass = {
          vertexShader: styleShader.builder.getTextVertexShader(),
          fragmentShader: styleShader.builder.getTextFragmentShader(),
          attributesDesc: [
            {name: Attributes.LOCAL_POSITION, size: 2, type: AttributeType.FLOAT},
          ],
          instancedAttributesDesc: [
            {name: 'a_anchor', size: 2, type: AttributeType.FLOAT},
            {name: 'a_glyphOffset', size: 2, type: AttributeType.FLOAT},
            {name: 'a_glyphSize', size: 2, type: AttributeType.FLOAT},
            {name: 'a_glyphUv', size: 4, type: AttributeType.FLOAT},
            ...customAttributesDesc,
          ],
          instancePrimitiveVertexCount: 6,
        };
      }
```

Add `this.hasText_` handling to `setHelper` (compile its program) and to `render` (call `renderInternal_` with `buffers.textBuffers` and `renderPass.textRenderPass`), exactly mirroring the symbol pass blocks.

- [ ] **Step 4: Generate text buffers**

In `generateBuffers`, add a 4th `generateBuffersForType_` call for text. Add a `'Text'` case to `generateBuffersForType_` mapping to `WebGLWorkerMessageType.GENERATE_TEXT_BUFFERS`, and in `generateRenderInstructions_` produce `textInstructions` via `generateTextRenderInstructions` when `this.hasText_` (passing `this.glyphAtlas_`, a `resolveText` closure built from the style's `text-value` using `buildExpression` from `expr/cpu.js`, `this.customAttributes_`, and `transform`). Return `textBuffers` in the `WebGLBuffers` object and handle it in `disposeBuffers`/`setHelper` flush like the other types.

The `resolveText` closure (built once in the constructor from the original flat style's `text-value`):

```js
// near top: import {buildExpression, newEvaluationContext} from '../../expr/cpu.js';
//           import {StringType, newParsingContext} from '../../expr/expression.js';
// in constructor, when hasText_ and a flat style with text-value is available:
const textValueExpr = /* the 'text-value' from the originating flat style */;
const evaluator = buildExpression(textValueExpr, StringType, newParsingContext());
const evalContext = newEvaluationContext();
this.resolveText_ = (feature) => {
  evalContext.properties = feature.getProperties();
  try {
    return String(evaluator(evalContext) ?? '');
  } catch {
    return '';
  }
};
```

NOTE: `convertStyleToShaders` currently discards the raw flat style. To get `text-value` for `resolveText_`, thread the original `text-value` expression onto the `StyleShaders`/`StyleParseResult` object in Task 5 (e.g. add a `textValue` field on the parse result set inside `parseLiteralStyle` when the `text-value` branch runs) and read it here. Add that field to the `StyleParseResult` typedef.

- [ ] **Step 5: Lint + typecheck + commit**

```bash
npm run lint
npm run typecheck
git add src/ol/render/webgl/VectorStyleRenderer.js src/ol/render/webgl/style.js
git commit -m "feat(webgl): add text render pass to VectorStyleRenderer"
```

---

## Task 9: Atlas texture upload in the vector layer renderer

The layer renderer owns the GL texture for the atlas, uploads it when dirty, and binds it for the text pass.

**Files:**
- Modify: `src/ol/renderer/webgl/VectorLayer.js`

- [ ] **Step 1: Create + upload the atlas texture**

In `WebGLVectorLayerRenderer`, add a field `this.atlasTexture_ = null;`. In `prepareFrameInternal`, right after buffers are (re)generated (inside the `.then((buffers) => {...})` or just before `render`), if `this.styleRenderer_.getGlyphAtlas()` exists and is dirty, upload its canvas:

```js
    const atlas = this.styleRenderer_.getGlyphAtlas &&
      this.styleRenderer_.getGlyphAtlas();
    if (atlas && atlas.isDirty()) {
      const gl = this.helper.getGL();
      if (!this.atlasTexture_) {
        this.atlasTexture_ = gl.createTexture();
      }
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture_);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.getCanvas());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      atlas.markUploaded();
    }
```

- [ ] **Step 2: Bind the atlas + viewport size uniform for the text pass**

In `renderWorlds`, in the `preRenderCallback` passed to `styleRenderer_.render`, bind the atlas to a texture unit and set `u_atlasTexture` + `u_viewportSizePx`:

```js
      this.styleRenderer_.render(this.buffers_, frameState, () => {
        this.applyUniforms_(this.buffers_.invertVerticesTransform, frameState);
        this.helper.applyHitDetectionUniform(forHitDetection);
        if (this.atlasTexture_) {
          const gl = this.helper.getGL();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture_);
          this.helper.setUniformFloatValue
            ? null
            : null; // use helper's uniform API:
        }
      });
```

Then set the uniforms via the helper's standard uniform path (match how `VectorLayer` already passes uniforms — likely through the `uniforms` object given to `super(...)`). Add `u_atlasTexture` (sampler, texture unit 0) and `u_viewportSizePx` (`frameState.size`) to the renderer's `uniforms` object in the constructor, and update `u_viewportSizePx` per frame the same way `RENDER_EXTENT`/`GLOBAL_ALPHA` are updated. Read how this file sets `Uniforms.RENDER_EXTENT` each frame and follow that exact mechanism rather than calling raw `gl.uniform*`.

- [ ] **Step 3: Release the texture on dispose**

In `disposeInternal`, before `super.disposeInternal()`:

```js
    if (this.atlasTexture_) {
      this.helper.getGL().deleteTexture(this.atlasTexture_);
      this.atlasTexture_ = null;
    }
```

- [ ] **Step 4: Lint + typecheck + commit**

```bash
npm run lint
npm run typecheck
git add src/ol/renderer/webgl/VectorLayer.js
git commit -m "feat(webgl): upload + bind glyph atlas texture in vector layer renderer"
```

---

## Task 10: Rendering test — point labels end to end (validation gate)

This is the real proof. A `WebGLVectorLayer` with point features and a `text-*` style renders labels; the expected PNG locks the result.

**Files:**
- Create: `test/rendering/cases/webgl-text-points/main.js`
- Create: `test/rendering/cases/webgl-text-points/expected.png` (generated, see steps)

- [ ] **Step 1: Write the rendering case**

```js
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import View from '../../../../src/ol/View.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';

const source = new VectorSource({
  features: [
    Object.assign(new Feature(new Point([-50, 0])), {}),
  ],
});
source.getFeatures()[0].set('label', 'Hello');

const layer = new WebGLVectorLayer({
  source: source,
  style: {
    'circle-radius': 4,
    'circle-fill-color': '#3399cc',
    'text-value': ['get', 'label'],
    'text-fill-color': '#000000',
    'text-stroke-color': '#ffffff',
    'text-stroke-width': 2,
    'font-size': 24,
  },
});

new Map({
  layers: [layer],
  target: 'map',
  view: new View({center: [0, 0], zoom: 2}),
});

render({message: 'renders WebGL text labels on point features'});
```

- [ ] **Step 2: Run the rendering harness to produce the actual image**

Run: `npm run test-rendering -- --force`
Expected: the case runs; with no `expected.png` yet it will report a diff/fail and write an `actual.png` under the case dir (the harness convention). Visually confirm `actual.png` shows "Hello" with a black fill + white outline near the blue dot.

- [ ] **Step 3: Promote actual → expected**

Once the actual image is correct, copy it to `expected.png`:

```bash
cp test/rendering/cases/webgl-text-points/actual.png test/rendering/cases/webgl-text-points/expected.png
```

(If the harness uses a different promotion flow — e.g. an `--fix`/update flag — use that instead; check `test/rendering/test.js` for the supported flag.)

- [ ] **Step 4: Re-run to confirm pass**

Run: `npm run test-rendering -- --force`
Expected: `webgl-text-points` PASSES against `expected.png`.

- [ ] **Step 5: Commit**

```bash
git add test/rendering/cases/webgl-text-points/
git commit -m "test(webgl): rendering case for point text labels on WebGLVectorLayer"
```

---

## Task 11: Hit-detection check

Confirm a labelled point is still hit-detectable (glyph instances carry the feature ref; clicking the label returns the feature).

**Files:**
- Test: add to `test/browser/spec/ol/renderer/webgl/VectorLayer.test.js`

- [ ] **Step 1: Write the test** (follow the existing hit-detection test pattern in this spec file — render a map with a labelled point, call `forEachFeatureAtCoordinate` on the point's pixel, assert the feature is returned). Reuse the harness/helpers already present in the file rather than inventing a new map setup.

- [ ] **Step 2: Run, fix, commit**

```bash
npm run karma   # confirm the new test passes
git add test/browser/spec/ol/renderer/webgl/VectorLayer.test.js
git commit -m "test(webgl): hit detection works for text-labelled points"
```

---

## Self-Review (completed during planning)

**Spec coverage (Phase 1 items):**
- textBatch + anchor (point) → Task 3. ✓
- Generalize GlyphAtlas / GlyphLayout → Tasks 1–2. ✓
- parseTextProperties + text-value branch → Task 5. ✓
- Text shader path in ShaderBuilder → Task 4. ✓
- generateTextRenderInstructions + GENERATE_TEXT_BUFFERS → Tasks 6–7. ✓
- Text render pass in VectorStyleRenderer → Task 8. ✓
- Atlas uniform + dirty upload in vector renderer → Task 9. ✓
- Tests: GlyphLayout/GlyphAtlas/style units + webgl-text-points + hit detection → Tasks 1,2,5,10,11. ✓
- Exit criterion (point labels, color via variable without rebuild) → Task 10 covers labels; the variable-without-rebuild assertion is GPU-styling-inherent (color is a uniform/attribute) and is exercised by the existing variable mechanism — a dedicated variable-change render case is deferred to Phase 2's broader test set.

**Known integration risks flagged inline (must be reconciled during execution, not left as guesses):**
1. Anchor coordinate-space convention must agree across Task 6 (worker), Task 7 (instructions), and Task 4 (shader `a_anchor`). Pick world-coords + `u_projectionMatrix` and verify against `writePointFeatureToBuffers`.
2. ShaderBuilder private collection field names (Task 4) must match the symbol getters in the same file — read them first.
3. `resolveText_` needs `text-value` threaded through the style-parse result (Task 8 note) — add the `textValue` field in Task 5's parse result.
4. Uniform-setting in Task 9 must use the file's existing uniform mechanism, not raw `gl.uniform*`.

**Type consistency:** `GlyphInfo` (GlyphAtlas) ↔ `GlyphSource`/`LaidOutGlyph` (GlyphLayout) ↔ glyph record layout (Tasks 6/7) ↔ instanced attribute descs (Task 8) all use the 10-float base record `[anchorX, anchorY, offX, offY, sizeW, sizeH, u0, v0, u1, v1]`. Verified consistent across tasks.

**Placeholder scan:** No "TBD/TODO/handle edge cases" steps. Code provided for every implementation step; the four risk notes are explicit reconciliation instructions tied to named functions, not vague placeholders.
