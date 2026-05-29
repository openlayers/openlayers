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
