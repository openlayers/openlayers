/**
 * @module ol/render/webgl/GlyphLayout
 */
import bidiFactory from 'bidi-js';

/**
 * Matches characters from right-to-left scripts (Hebrew, Arabic, Syriac, Thaana,
 * NKo and their presentation forms). Used as a fast-path so left-to-right text
 * skips bidi processing entirely.
 */
const RTL_CHARS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** @type {ReturnType<typeof bidiFactory>|null} */
let bidiInstance = null;

/**
 * Reorder a string from logical to visual order for display, so right-to-left
 * runs (Hebrew, Arabic) render in the correct direction. Left-to-right-only
 * strings are returned unchanged without invoking bidi.
 * @param {string} text Logical-order text.
 * @return {string} Visual-order text.
 */
function reorderForDisplay(text) {
  if (!RTL_CHARS.test(text)) {
    return text;
  }
  try {
    if (!bidiInstance) {
      bidiInstance = bidiFactory();
    }
    const levels = bidiInstance.getEmbeddingLevels(text);
    const flips = bidiInstance.getReorderSegments(text, levels);
    if (flips.length === 0) {
      return text;
    }
    const chars = text.split('');
    flips.forEach((range) => {
      const [start, end] = range;
      const segment = chars.slice(start, end + 1).reverse();
      for (let i = 0; i < segment.length; i++) {
        chars[start + i] = segment[i];
      }
    });
    return chars.join('');
  } catch {
    return text;
  }
}

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
 * the caller applies font-size as a scale at render time. Right-to-left runs are
 * reordered from logical to visual order before layout.
 *
 * Ported from the proven layout loop in renderer/webgl/TextLayer.js.
 *
 * @param {string} text The label string.
 * @param {GlyphSource} atlas Glyph atlas.
 * @param {GlyphLayoutOptions} [options] Options.
 * @return {GlyphLayoutResult} Laid-out glyphs + measured size.
 */
export default function layoutGlyphs(text, atlas, options = {}) {
  const letterSpacing = options.letterSpacing ?? 0;
  const atlasWidth = atlas.getWidth();
  const atlasHeight = atlas.getHeight();

  // reorder right-to-left runs from logical to visual order before layout
  text = reorderForDisplay(text);

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
      // reset kerning context across an unplaceable glyph (genuine gap)
      prevChar = null;
      continue;
    }
    if (prevChar) {
      cursorX += atlas.getKerning(prevChar, char);
    }
    const left = cursorX + glyph.left;
    const right = left + glyph.width;
    // bounds tracked in y-down atlas space; output offsetPx is y-up
    const yDownTop = -glyph.top;
    const yDownBottom = yDownTop + glyph.height;
    if (left < minX) {
      minX = left;
    }
    if (right > maxX) {
      maxX = right;
    }
    if (yDownTop < minY) {
      minY = yDownTop;
    }
    if (yDownBottom > maxY) {
      maxY = yDownBottom;
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
