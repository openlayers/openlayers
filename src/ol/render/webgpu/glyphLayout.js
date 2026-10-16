/**
 * @module ol/render/webgpu/glyphLayout
 */
import {asArray} from '../../color.js';
import {interpolatePoint} from '../../geom/flat/interpolate.js';
import {lineStringLength} from '../../geom/flat/length.js';
import {coordinates as reverseCoordinates} from '../../geom/flat/reverse.js';
import {drawTextOnPath, needsShaping} from '../../geom/flat/textpath.js';
import {
  measureAndCacheTextWidth,
  measureTextBaseline,
  measureTextHeight,
  measureWrappedLineHeight,
  registerFont,
} from '../canvas.js';
import {TEXT_ALIGN} from '../canvas/TextBuilder.js';

/**
 * Instance floats: position(2), offsetPx(2), sizePx(2), texCoord(4), fill(4),
 * stroke(4), hitColor(4), angle(1), rotateWithView(1), upright(2). Corner is a
 * separate vertex buffer of 4 corners.
 * Per-instance stride without corner: 26 floats.
 * @type {number}
 */
export const GLYPH_INSTANCE_STRIDE = 26;

/**
 * Text widths by font, then by text.
 * @type {Object<string, Object<string, number>>}
 */
const widthCaches = {};

/**
 * @param {string} font Font.
 * @return {Object<string, number>} Width cache for the font.
 */
function getWidthCache(font) {
  return (widthCaches[font] ??= {});
}

/**
 * Forget measured text widths, e.g. after a font has loaded and widths
 * measured with a fallback font are stale.
 */
export function clearWidthCaches() {
  for (const font in widthCaches) {
    delete widthCaches[font];
  }
}

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: 'grapheme',
});
const wordSegmenter = new Intl.Segmenter(undefined, {granularity: 'word'});

/**
 * Characters a line may end on.
 * @type {Set<number>}
 */
const breakableAfter = new Set([
  0x20, 0x26, 0x29, 0x2b, 0x2d, 0x2f, 0xad, 0xb7, 0x200b, 0x2010, 0x2013,
  0x2027,
]);

/**
 * @param {string} text Text.
 * @return {string} Text without whitespace at a line edge.
 */
function trimLine(text) {
  return text.replace(/^[\s\u200b]+|[\s\u200b]+$/gu, '');
}

/**
 * @param {string} text Text.
 * @return {Array<number>} UTF-16 offsets at which a line may end.
 */
function getLineBreakCandidates(text) {
  const candidates = new Set();
  const graphemes = Array.from(graphemeSegmenter.segment(text));
  for (let i = 0; i < graphemes.length - 1; ++i) {
    const current = graphemes[i];
    const next = graphemes[i + 1];
    const codePoint = current.segment.codePointAt(0);
    const nextCodePoint = next.segment.codePointAt(0);
    if (
      /^\s+$/u.test(current.segment) ||
      breakableAfter.has(codePoint ?? 0) ||
      nextCodePoint === 0x28 ||
      /\p{Ideographic}/u.test(current.segment)
    ) {
      candidates.add(next.index);
    }
  }

  const words = Array.from(wordSegmenter.segment(text));
  for (let i = 0; i < words.length - 1; ++i) {
    const current = words[i];
    const next = words[i + 1];
    if (
      current.isWordLike &&
      next.isWordLike &&
      current.index + current.segment.length === next.index
    ) {
      candidates.add(next.index);
    }
  }

  return Array.from(candidates).sort((a, b) => a - b);
}

/**
 * Strings stored as separate font-atlas cells.
 *
 * Simple text is split into graphemes so repeated letters share a cell and
 * combining marks stay with their base character. A line that needs shaping,
 * e.g. Arabic or Devanagari, is kept intact. Its joining forms, conjuncts and
 * visual order come from shaping the whole line, as canvas `fillText` does.
 *
 * @param {string} line Line of text.
 * @return {Array<string>} Atlas strings in logical order.
 */
function atlasSegments(line) {
  if (needsShaping(line)) {
    return [line];
  }
  return Array.from(graphemeSegmenter.segment(line), (part) => part.segment);
}

/**
 * @param {string} text Text without explicit line breaks.
 * @param {string} font Font.
 * @param {number} maxWidth Maximum scaled width.
 * @param {number} scaleX Horizontal scale.
 * @return {Array<string>} Wrapped lines.
 */
function wrapParagraph(text, font, maxWidth, scaleX) {
  const trimmed = trimLine(text);
  if (!trimmed || maxWidth <= 0) {
    return [trimmed];
  }
  const widthCache = getWidthCache(font);
  /**
   * @param {string} value Text.
   * @return {number} Scaled width.
   */
  const measure = (value) =>
    measureAndCacheTextWidth(font, trimLine(value), widthCache) *
    Math.abs(scaleX);
  const totalWidth = measure(trimmed);
  if (totalWidth <= maxWidth) {
    return [trimmed];
  }

  const candidates = getLineBreakCandidates(trimmed);
  if (!candidates.length) {
    return [trimmed];
  }
  candidates.push(trimmed.length);
  const lineCount = Math.max(1, Math.ceil(totalWidth / maxWidth));
  const targetWidth = totalWidth / lineCount;
  const offsets = [0, ...candidates];
  const costs = new Array(offsets.length).fill(Infinity);
  const prior = new Array(offsets.length).fill(-1);
  costs[0] = 0;

  for (let i = 1; i < offsets.length; ++i) {
    const last = i === offsets.length - 1;
    for (let j = 0; j < i; ++j) {
      if (!isFinite(costs[j])) {
        continue;
      }
      const width = measure(trimmed.slice(offsets[j], offsets[i]));
      const difference = width - targetWidth;
      let badness = difference * difference;
      if (last) {
        badness *= width < targetWidth ? 0.5 : 2;
      }
      const overflow = Math.max(0, width - maxWidth);
      badness += overflow * overflow;
      const cost = costs[j] + badness;
      if (cost <= costs[i]) {
        costs[i] = cost;
        prior[i] = j;
      }
    }
  }

  const lines = [];
  let index = offsets.length - 1;
  while (index > 0) {
    const previous = prior[index];
    if (previous < 0) {
      return [trimmed];
    }
    lines.push(trimLine(trimmed.slice(offsets[previous], offsets[index])));
    index = previous;
  }
  return lines.reverse();
}

/**
 * @param {string} text Text.
 * @param {string} font Font.
 * @param {number|undefined} maxWidth Maximum scaled width.
 * @param {number} scaleX Horizontal scale.
 * @return {Array<string>} Explicit and automatically wrapped lines.
 */
function wrapText(text, font, maxWidth, scaleX) {
  const paragraphs = text.split('\n');
  if (maxWidth === undefined) {
    return paragraphs;
  }
  const lines = [];
  for (const paragraph of paragraphs) {
    lines.push(...wrapParagraph(paragraph, font, maxWidth, scaleX));
  }
  return lines;
}

/**
 * @typedef {Object} GlyphInstance
 * @property {number} x Anchor x.
 * @property {number} y Anchor y.
 * @property {number} offsetX Pixel offset x.
 * @property {number} offsetY Pixel offset y.
 * @property {number} width Glyph width.
 * @property {number} height Glyph height.
 * @property {number} texX0 Left atlas texel.
 * @property {number} texY0 Top atlas texel.
 * @property {number} texX1 Right atlas texel.
 * @property {number} texY1 Bottom atlas texel.
 * @property {number} page Atlas page. Texel coordinates are local to that page.
 * @property {number} r Fill color.
 * @property {number} g Fill color.
 * @property {number} b Fill color.
 * @property {number} a Fill color.
 * @property {number} strokeR Stroke color.
 * @property {number} strokeG Stroke color.
 * @property {number} strokeB Stroke color.
 * @property {number} strokeA Stroke color.
 * @property {boolean} hasHalo Whether the glyph has visible halo coverage.
 * @property {number} hitR Hit.
 * @property {number} hitG Hit.
 * @property {number} hitB Hit.
 * @property {number} hitA Hit.
 * @property {number} angle Angle.
 * @property {boolean} [rotateWithView] Add the view rotation to `angle`.
 * @property {number} [uprightX] Reading direction x of this glyph's line-label
 * variant, in unrotated Y-down pixels. With `uprightY` zero too, the glyph is
 * always drawn.
 * @property {number} [uprightY] Reading direction y.
 */

/**
 * Whether a glyph is drawn at a view rotation. A kept-upright line label has
 * one variant per reading direction, and only the one that reads left to right
 * on screen is drawn. Must match the glyph shader.
 * @param {GlyphInstance} glyph Glyph.
 * @param {number} viewRotation View rotation.
 * @return {boolean} The glyph is drawn.
 */
export function isGlyphDrawn(glyph, viewRotation) {
  const x = glyph.uprightX || 0;
  const y = glyph.uprightY || 0;
  if (!x && !y) {
    return true;
  }
  const c = Math.cos(viewRotation);
  const s = Math.sin(viewRotation);
  const dx = c * x - s * y;
  return dx > 0 || (dx === 0 && s * x + c * y >= 0);
}

/**
 * Grow `bounds` by a glyph quad drawn at a pixel position, with the same
 * rotation the glyph shader applies. Glyphs the shader hides at this view
 * rotation leave `bounds` alone.
 * @param {Array<number>} bounds `[minX, minY, maxX, maxY]`, updated in place.
 * @param {GlyphInstance} glyph Glyph.
 * @param {number} pixelX Pixel x of the glyph anchor.
 * @param {number} pixelY Pixel y of the glyph anchor.
 * @param {number} [viewRotation] View rotation.
 */
export function extendGlyphBounds(
  bounds,
  glyph,
  pixelX,
  pixelY,
  viewRotation = 0,
) {
  if (!isGlyphDrawn(glyph, viewRotation)) {
    return;
  }
  const x0 = glyph.offsetX;
  const y0 = glyph.offsetY;
  const x1 = x0 + glyph.width;
  const y1 = y0 + glyph.height;
  const angle = glyph.angle + (glyph.rotateWithView ? viewRotation : 0);
  if (!angle) {
    bounds[0] = Math.min(bounds[0], pixelX + x0);
    bounds[1] = Math.min(bounds[1], pixelY + y0);
    bounds[2] = Math.max(bounds[2], pixelX + x1);
    bounds[3] = Math.max(bounds[3], pixelY + y1);
    return;
  }
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let i = 0; i < 4; ++i) {
    const lx = i & 1 ? x1 : x0;
    const ly = i & 2 ? y1 : y0;
    const x = pixelX + c * lx - s * ly;
    const y = pixelY + s * lx + c * ly;
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  }
}

/**
 * @param {string|Array<string>} text Text.
 * @return {string} Normalized.
 */
function normalizeText(text) {
  if (Array.isArray(text)) {
    return text.join('\n');
  }
  return text || '';
}

/**
 * @param {string|Array<number>|undefined} color Color.
 * @param {Array<number>} fallback RGBA 0-1.
 * @return {Array<number>} RGBA 0-1.
 */
function toRgba(color, fallback) {
  if (!color || (typeof color === 'object' && !Array.isArray(color))) {
    return fallback;
  }
  const array = asArray(/** @type {string|Array<number>} */ (color));
  return [array[0] / 255, array[1] / 255, array[2] / 255, array[3] ?? 1];
}

/**
 * @param {import("../../style/Text.js").default} textStyle Style.
 * @return {Array<number>} RGBA 0-1.
 */
function fillColor(textStyle) {
  const fill = textStyle.getFill();
  const color = fill ? fill.getColor() : '#333';
  return toRgba(
    /** @type {string|Array<number>|undefined} */ (color),
    [0.2, 0.2, 0.2, 1],
  );
}

/**
 * @param {import("../../style/Text.js").default} textStyle Style.
 * @return {Array<number>} RGBA 0-1. Transparent if there is no stroke.
 */
function strokeColor(textStyle) {
  const stroke = textStyle.getStroke();
  if (!stroke) {
    return [0, 0, 0, 0];
  }
  return toRgba(
    /** @type {string|Array<number>|undefined} */ (stroke.getColor()),
    [0, 0, 0, 1],
  );
}

/**
 * Nearest whole px/pt size.
 *
 * Styles evaluate text size at the view zoom, so a zoom animation would
 * otherwise rasterize a new atlas cell for every fractional size. Snapping
 * here keeps measurement, wrapping, and the atlas cell on one font.
 * @param {string} font CSS font.
 * @return {string} Font with sizes snapped to whole pixels.
 */
function quantizeFont(font) {
  return font.replace(/([\d.]+)(px|pt)/g, (_, value, unit) => {
    const size = Math.round(Number(value));
    return `${size > 0 ? size : 1}${unit}`;
  });
}

/**
 * @param {number} width Stroke width in CSS pixels.
 * @return {number} Width snapped to a whole CSS pixel.
 */
function quantizeStrokeWidth(width) {
  const snapped = Math.round(width);
  return snapped > 0 ? snapped : 0;
}

/**
 * Layout a point (or polygon-interior) label.
 *
 * @param {Array<GlyphInstance>} out Instances.
 * @param {import("../../style/Text.js").default} textStyle Style.
 * @param {import("../../coordinate.js").Coordinate} anchor Anchor.
 * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
 * @param {Array<number>} hitColor Hit color 0-1.
 * @param {number} [pixelRatio] Device pixel ratio for glyph rasterization.
 * @return {{minX: number, minY: number, maxX: number, maxY: number}|null} Pixel AABB around the anchor, or null.
 */
export function layoutPointLabel(
  out,
  textStyle,
  anchor,
  atlas,
  hitColor,
  pixelRatio = 1,
) {
  const text = normalizeText(textStyle.getText() || '');
  if (!text) {
    return null;
  }
  const font = quantizeFont(textStyle.getFont() || '10px sans-serif');
  registerFont(font);
  const scale = textStyle.getScaleArray?.() || [1, 1];
  const scaleX = Array.isArray(scale) ? scale[0] : 1;
  const scaleY = Array.isArray(scale) ? scale[1] : 1;
  const maxWidth =
    textStyle.getPlacement() === 'point' ? textStyle.getMaxWidth() : undefined;
  const lines = wrapText(text, font, maxWidth, scaleX);
  const alignKey = textStyle.getTextAlign() || 'center';
  const align = /** @type {number} */ (
    /** @type {any} */ (TEXT_ALIGN)[alignKey] ?? 0.5
  );
  const justifyKey = textStyle.getJustify() || alignKey;
  const justify = /** @type {number} */ (
    /** @type {any} */ (TEXT_ALIGN)[justifyKey] ?? align
  );
  const baselineKey = textStyle.getTextBaseline() || 'middle';
  const baseline = /** @type {number} */ (
    /** @type {any} */ (TEXT_ALIGN)[baselineKey] ?? 0.5
  );
  const offsetX = textStyle.getOffsetX() || 0;
  const offsetY = textStyle.getOffsetY() || 0;
  const rotation = textStyle.getRotation() || 0;
  const rotateWithView = !!textStyle.getRotateWithView();
  const stroke = textStyle.getStroke();
  const strokeWidth = quantizeStrokeWidth(stroke ? stroke.getWidth() || 0 : 0);
  const color = fillColor(textStyle);
  const halo = strokeColor(textStyle);
  const hasHalo = strokeWidth > 0 && halo[3] > 0;

  // Atlas cells include halo padding, so they are not the line height.
  // An explicit line-height is the CSS line box; the default `normal` is
  // the font's ink extent, without the empty lead some faces add.
  const lineHeight = measureWrappedLineHeight(font) * scaleY;
  const baselineOffset = measureTextBaseline(font) * scaleY;
  const lineWidths = [];
  const lineGlyphs = [];
  for (const line of lines) {
    /** @type {Array<import("../../webgpu/FontAtlas.js").GlyphMetrics>} */
    const glyphs = [];
    for (const segment of atlasSegments(line)) {
      glyphs.push(atlas.getGlyph(font, segment, strokeWidth, pixelRatio));
    }
    lineGlyphs.push(glyphs);
    lineWidths.push(
      measureAndCacheTextWidth(font, line, getWidthCache(font)) * scaleX,
    );
  }

  const totalHeight = lines.length * lineHeight;
  let lineCenter = -totalHeight * baseline + lineHeight / 2 + offsetY;
  const blockWidth = Math.max(...lineWidths);
  const blockLeft = -blockWidth * align + offsetX;
  const start = out.length;
  for (let i = 0; i < lines.length; ++i) {
    let x = blockLeft + (blockWidth - lineWidths[i]) * justify;
    const alphabetic = lineCenter + baselineOffset;
    for (const glyph of lineGlyphs[i]) {
      const w = glyph.width * scaleX;
      const h = glyph.height * scaleY;
      out.push({
        x: anchor[0],
        y: anchor[1],
        offsetX: x,
        offsetY: alphabetic - glyph.ascent * scaleY,
        width: w,
        height: h,
        texX0: glyph.texX0,
        texY0: glyph.texY0,
        texX1: glyph.texX1,
        texY1: glyph.texY1,
        page: glyph.page,
        r: color[0],
        g: color[1],
        b: color[2],
        a: color[3],
        strokeR: halo[0],
        strokeG: halo[1],
        strokeB: halo[2],
        strokeA: halo[3],
        hasHalo,
        hitR: hitColor[0],
        hitG: hitColor[1],
        hitB: hitColor[2],
        hitA: hitColor[3],
        angle: rotation,
        rotateWithView,
      });
      x += glyph.advance * scaleX;
    }
    lineCenter += lineHeight;
  }
  if (out.length === start) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = start; i < out.length; ++i) {
    const glyph = out[i];
    minX = Math.min(minX, glyph.offsetX);
    minY = Math.min(minY, glyph.offsetY);
    maxX = Math.max(maxX, glyph.offsetX + glyph.width);
    maxY = Math.max(maxY, glyph.offsetY + glyph.height);
  }
  const padding = textStyle.getPadding() || [0, 0, 0, 0];
  return {
    minX: minX - padding[3],
    minY: minY - padding[0],
    maxX: maxX + padding[1],
    maxY: maxY + padding[2],
  };
}

/**
 * Layout text along a linestring. Coordinates are already in pixels along the path helper.
 *
 * @param {Array<GlyphInstance>} out Instances.
 * @param {import("../../style/Text.js").default} textStyle Style.
 * @param {Array<number>} flatCoords Flat path in map units.
 * @param {number} resolution Resolution.
 * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
 * @param {Array<number>} hitColor Hit color.
 * @param {number} [pixelRatio] Device pixel ratio for glyph rasterization.
 * @return {{minX: number, minY: number, maxX: number, maxY: number}|null} Pixel AABB around the
 *     shared label anchor, or null.
 */
export function layoutLineLabel(
  out,
  textStyle,
  flatCoords,
  resolution,
  atlas,
  hitColor,
  pixelRatio = 1,
) {
  const text = normalizeText(textStyle.getText() || '');
  if (!text) {
    return null;
  }
  const font = quantizeFont(textStyle.getFont() || '10px sans-serif');
  registerFont(font);
  const pixelCoords = new Array(flatCoords.length);
  for (let i = 0; i < flatCoords.length; i += 2) {
    pixelCoords[i] = flatCoords[i] / resolution;
    pixelCoords[i + 1] = -flatCoords[i + 1] / resolution;
  }
  const length = lineStringLength(pixelCoords, 0, pixelCoords.length, 2);
  const widthCache = getWidthCache(font);
  const width = measureAndCacheTextWidth(font, text, widthCache);
  const startM = (length - width) / 2;
  const maxAngle = textStyle.getMaxAngle
    ? textStyle.getMaxAngle()
    : Math.PI / 4;
  const overflow = textStyle.getOverflow ? textStyle.getOverflow() : false;
  if (!overflow && width > length) {
    return null;
  }
  /**
   * @param {Array<number>} path Pixel path.
   * @return {Array<Array<*>>|null} Chunks reading along `path`.
   */
  const placeOnPath = (path) =>
    drawTextOnPath(
      path,
      0,
      path.length,
      2,
      text,
      startM,
      maxAngle,
      1,
      measureAndCacheTextWidth,
      font,
      widthCache,
      0,
      false,
    );
  const forward = placeOnPath(pixelCoords);
  if (!forward) {
    return null;
  }
  // A tile's layout outlives view rotations, so a kept-upright label carries
  // both reading directions and the shader draws the one that reads left to
  // right on screen.
  const variants = [{parts: forward, uprightX: 0, uprightY: 0}];
  if (textStyle.getKeepUpright() ?? true) {
    const first = forward[0];
    const last = forward[forward.length - 1];
    const directionX =
      last[0] +
      Math.cos(last[3]) * last[2] -
      (first[0] - Math.cos(first[3]) * first[2]);
    const directionY =
      last[1] +
      Math.sin(last[3]) * last[2] -
      (first[1] - Math.sin(first[3]) * first[2]);
    const directionLength = Math.hypot(directionX, directionY);
    const reversedCoords = pixelCoords.slice();
    reverseCoordinates(reversedCoords, 0, reversedCoords.length, 2);
    const reversed = directionLength ? placeOnPath(reversedCoords) : null;
    if (reversed) {
      const uprightX = directionX / directionLength;
      const uprightY = directionY / directionLength;
      variants[0].uprightX = uprightX;
      variants[0].uprightY = uprightY;
      variants.push({
        parts: reversed,
        uprightX: -uprightX,
        uprightY: -uprightY,
      });
    }
  }
  const stroke = textStyle.getStroke();
  const strokeWidth = quantizeStrokeWidth(stroke ? stroke.getWidth() || 0 : 0);
  const color = fillColor(textStyle);
  const halo = strokeColor(textStyle);
  const hasHalo = strokeWidth > 0 && halo[3] > 0;
  const baselineKey = textStyle.getTextBaseline() || 'middle';
  const baseline = /** @type {number} */ (
    /** @type {any} */ (TEXT_ALIGN)[baselineKey] ?? 0.5
  );
  const baselineOffset =
    measureTextBaseline(font) +
    (0.5 - baseline) * measureTextHeight(font) +
    (textStyle.getOffsetY() || 0);
  // All chunks share the label's middle as their map anchor and keep their
  // place along the path as a pixel offset. The label then stays in one piece
  // when the view resolution drifts from the layout resolution.
  const middle = interpolatePoint(pixelCoords, 0, pixelCoords.length, 2, 0.5);
  const anchorPixelX = middle[0];
  const anchorPixelY = middle[1];
  // Chunks depend on the path, so atlas cells for them would pile up with
  // every street name and bend. Unless the text needs shaping, it is drawn
  // from grapheme cells, as point labels are. Shaped text is rasterized once,
  // and the cell is cut where the chunks meet on the path, so joining forms
  // continue across chunks. Cuts fall between characters, except in text that
  // mixes reading directions.
  const shaped = needsShaping(text);
  const dpr = pixelRatio > 0 ? pixelRatio : 1;
  const whole = shaped
    ? atlas.getGlyph(font, text, strokeWidth, pixelRatio)
    : null;
  const startIndex = out.length;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const {parts, uprightX, uprightY} of variants) {
    // Chunks come in path order, so their lengths add up to positions in
    // `whole`, from its left edge.
    let beforeWidth = 0;
    for (let p = 0; p < parts.length; ++p) {
      const entry = parts[p];
      const gx = /** @type {number} */ (entry[0]);
      const gy = /** @type {number} */ (entry[1]);
      // The path point is the center of this chunk's advance, not its left edge.
      const anchorX = /** @type {number} */ (entry[2]);
      const angle = /** @type {number} */ (entry[3]);
      const chunk = /** @type {string} */ (entry[4]);
      // The shader rotates the offset by `angle`, so unrotate the shift from
      // the shared anchor to this chunk's path point.
      const dx = gx - anchorPixelX;
      const dy = gy - anchorPixelY;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      /** @type {Array<{glyph: import("../../webgpu/FontAtlas.js").GlyphMetrics, left: number, width: number, texX0: number, texX1: number}>} */
      const cells = [];
      if (whole) {
        const beforeEnd = beforeWidth + 2 * anchorX;
        // Slices meet at the chunk boundary. Ink that crosses it is part of the
        // neighboring slice, so only the label's ends include the cell padding
        // for the halo.
        const first = p === 0;
        const last = p === parts.length - 1;
        const texX0 = first
          ? whole.texX0
          : whole.texX0 + (beforeWidth + whole.pad) * dpr;
        const texX1 = last
          ? whole.texX1
          : whole.texX0 + (beforeEnd + whole.pad) * dpr;
        cells.push({
          glyph: whole,
          left: -(beforeEnd - beforeWidth) / 2 - (first ? whole.pad : 0),
          width: (texX1 - texX0) / dpr,
          texX0,
          texX1,
        });
        beforeWidth = beforeEnd;
      } else {
        // Advance origin of the next cell, relative to the chunk's path point.
        let left = -anchorX;
        for (const segment of atlasSegments(chunk)) {
          const glyph = atlas.getGlyph(font, segment, strokeWidth, pixelRatio);
          cells.push({
            glyph,
            left: left - glyph.pad,
            width: glyph.width,
            texX0: glyph.texX0,
            texX1: glyph.texX1,
          });
          left += glyph.advance;
        }
      }
      for (const {glyph, left, width, texX0, texX1} of cells) {
        const instance = {
          x: anchorPixelX * resolution,
          y: -anchorPixelY * resolution,
          offsetX: c * dx + s * dy + left,
          offsetY: -s * dx + c * dy + baselineOffset - glyph.ascent,
          width,
          height: glyph.height,
          texX0,
          texY0: glyph.texY0,
          texX1,
          texY1: glyph.texY1,
          page: glyph.page,
          r: color[0],
          g: color[1],
          b: color[2],
          a: color[3],
          strokeR: halo[0],
          strokeG: halo[1],
          strokeB: halo[2],
          strokeA: halo[3],
          hasHalo,
          hitR: hitColor[0],
          hitG: hitColor[1],
          hitB: hitColor[2],
          hitA: hitColor[3],
          angle,
          rotateWithView: true,
          uprightX,
          uprightY,
        };
        out.push(instance);
        extendGlyphBounds(bounds, instance, 0, 0);
      }
    }
  }
  if (out.length === startIndex) {
    return null;
  }
  const padding = textStyle.getPadding() || [0, 0, 0, 0];
  return {
    minX: bounds[0] - padding[3],
    minY: bounds[1] - padding[0],
    maxX: bounds[2] + padding[1],
    maxY: bounds[3] + padding[2],
  };
}

/**
 * Pack glyph instances into a float array (without per-vertex corners).
 *
 * `originX` and `originY` are subtracted in float64 before the values are
 * stored. The instances themselves stay in map coordinates for declutter.
 * @param {Array<GlyphInstance>} instances Instances.
 * @param {Array<number>} [opacities] Per-instance fade in `[0, 1]`.
 * @param {number} [originX] Origin x subtracted from each anchor.
 * @param {number} [originY] Origin y subtracted from each anchor.
 * @return {Float32Array} Packed instances.
 */
export function packGlyphInstances(
  instances,
  opacities,
  originX = 0,
  originY = 0,
) {
  const data = new Float32Array(instances.length * GLYPH_INSTANCE_STRIDE);
  let o = 0;
  for (let i = 0; i < instances.length; ++i) {
    const inst = instances[i];
    const fade = opacities ? opacities[i] : 1;
    data[o++] = inst.x - originX;
    data[o++] = inst.y - originY;
    data[o++] = inst.offsetX;
    data[o++] = inst.offsetY;
    data[o++] = inst.width;
    data[o++] = inst.height;
    data[o++] = inst.texX0;
    data[o++] = inst.texY0;
    data[o++] = inst.texX1;
    data[o++] = inst.texY1;
    data[o++] = inst.r;
    data[o++] = inst.g;
    data[o++] = inst.b;
    data[o++] = inst.a * fade;
    data[o++] = inst.strokeR;
    data[o++] = inst.strokeG;
    data[o++] = inst.strokeB;
    data[o++] = inst.strokeA * fade;
    data[o++] = inst.hitR;
    data[o++] = inst.hitG;
    data[o++] = inst.hitB;
    data[o++] = inst.hitA;
    data[o++] = inst.angle;
    data[o++] = inst.rotateWithView ? 1 : 0;
    data[o++] = inst.uprightX || 0;
    data[o++] = inst.uprightY || 0;
  }
  return data;
}
