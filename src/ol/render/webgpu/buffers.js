/**
 * @module ol/render/webgpu/buffers
 */
import {asArray} from '../../color.js';
import {getPatternImage} from '../../colorlike.js';
import {warn} from '../../console.js';
import {
  createEmpty,
  extend as extendExtent,
  intersects,
  isEmpty,
} from '../../extent.js';
import {lineChunk} from '../../geom/flat/linechunk.js';
import {inflateEnds} from '../../geom/flat/orient.js';
import {matchingChunk} from '../../geom/flat/straightchunk.js';
import {fromCircle} from '../../geom/Polygon.js';
import ImageState from '../../ImageState.js';
import {
  defaultLineCap,
  defaultLineJoin,
  defaultMiterLimit,
} from '../../render/canvas.js';
import RenderFeature from '../../render/Feature.js';
import {getImageStyleData} from '../../render/ImageStyle.js';
import CircleStyle from '../../style/Circle.js';
import {getUid} from '../../util.js';
import {
  CLASS_CIRCLE,
  CLASS_IMAGE,
  CLASS_LINE,
  CLASS_POLYGON,
  CLASS_TEXT,
  compareDraw,
} from './drawOrder.js';
import {buildGeometryBuffers, worldShift} from './geometryBuffers.js';
import {layoutLineLabel, layoutPointLabel} from './glyphLayout.js';

/**
 * @typedef {Object} FilterExtentOptions
 * @property {import("../../extent.js").Extent} [filterExtent] Only build geometries that intersect this extent.
 */

/**
 * @typedef {import("./tessellate.js").TessellateOptions & FilterExtentOptions} VectorReprojOptions
 */

/**
 * @typedef {Object} ResolvedStyleGeometry
 * @property {import("../../style/Style.js").default} style Style snapshot.
 * @property {import("../../geom/Geometry.js").default|import("../../render/Feature.js").default} geometry Resolved geometry.
 * @property {string} key Style/geometry key within the feature.
 */

/**
 * Resolve a feature's function styles and alternate geometries once.
 *
 * @param {import("../../Feature.js").FeatureLike} feature Feature.
 * @param {import("./style.js").StyleFunction} styleFunction Style function.
 * @param {number} resolution Resolution.
 * @param {number} zoom View zoom.
 * @param {boolean} [snapshot] Clone mutable style instances, and the geometries
 * they carry, for reuse. Style functions may rewrite a shared style geometry
 * in place for every feature they style.
 * @return {Array<ResolvedStyleGeometry>} Resolved style geometries.
 */
export function resolveFeatureStyles(
  feature,
  styleFunction,
  resolution,
  zoom,
  snapshot = false,
) {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return [];
  }
  const styles = styleFunction(feature, resolution, zoom);
  if (!styles) {
    return [];
  }
  const styleArray = Array.isArray(styles) ? styles : [styles];
  /** @type {Array<ResolvedStyleGeometry>} */
  const resolved = [];
  for (let s = 0; s < styleArray.length; ++s) {
    const style = snapshot ? styleArray[s].clone() : styleArray[s];
    const styledGeometry = style.getGeometryFunction()(feature) || geometry;
    if (!styledGeometry) {
      continue;
    }
    if (styledGeometry.getType() !== 'GeometryCollection') {
      resolved.push({style, geometry: styledGeometry, key: String(s)});
      continue;
    }
    const members =
      /** @type {import("../../geom/GeometryCollection.js").default} */ (
        styledGeometry
      ).getGeometriesArrayRecursive();
    for (let m = 0; m < members.length; ++m) {
      resolved.push({style, geometry: members[m], key: `${s}.${m}`});
    }
  }
  return resolved;
}

/**
 * Floats per point symbol instance: anchor (2), pixel offset (2), size (2),
 * fill color (4), hit color (4), stroke color (4), stroke width (1), and
 * radius (1). The hit color stays at offset 10.
 * @type {number}
 */
export const SYMBOL_STRIDE = 20;

/**
 * Floats per textured image instance: anchor (2), pixel offset (2), size (2),
 * atlas rectangle (4), hit color (4), opacity, rotation, and rotate-with-view.
 * @type {number}
 */
export const ICON_STRIDE = 17;

/**
 * @param {number} id Feature ref.
 * @return {Array<number>} RGBA 0-1.
 */
export function encodeHitColor(id) {
  return [
    (id & 255) / 255,
    ((id >> 8) & 255) / 255,
    ((id >> 16) & 255) / 255,
    1,
  ];
}

/**
 * @param {Array<number>} color RGBA 0-1 (or 0-255 from readPixels).
 * @return {number} Id.
 */
export function decodeHitColor(color) {
  const r = color[0] > 1 ? color[0] : color[0] * 255;
  const g = color[1] > 1 ? color[1] : color[1] * 255;
  const b = color[2] > 1 ? color[2] : color[2] * 255;
  return (Math.round(r) | (Math.round(g) << 8) | (Math.round(b) << 16)) >>> 0;
}

/**
 * Warn only once, because a pattern is usually used by many features.
 * @type {boolean}
 */
let patternWarned = false;

/**
 * Half of one 8-bit alpha step. A smaller alpha is stored as 0, which is what
 * the framebuffer would hold, and the fill and stroke builders then skip the
 * geometry instead of tessellating something that cannot be seen.
 * @type {number}
 */
const MIN_VISIBLE_ALPHA = 0.5 / 255;

/**
 * @param {import("../../color.js").Color|import("../../colorlike.js").ColorLike|import("../../colorlike.js").PatternDescriptor|null|undefined} color Color.
 * @return {Array<number>} RGBA 0-1. Canvas patterns and gradients cannot be
 * drawn and come out transparent.
 */
function toRgba(color) {
  if (typeof color !== 'string' && !Array.isArray(color)) {
    if (color && !patternWarned) {
      patternWarned = true;
      warn(
        'The WebGPU renderer cannot draw CanvasPattern or CanvasGradient colors, and draws them transparent. Use a PatternDescriptor for polygon fill patterns.',
      );
    }
    return [0, 0, 0, 0];
  }
  const array = asArray(color);
  let alpha = array[3] ?? 1;
  if (!(alpha >= MIN_VISIBLE_ALPHA)) {
    alpha = 0;
  }
  return [array[0] / 255, array[1] / 255, array[2] / 255, alpha];
}

/**
 * @typedef {import("./geometryBuffers.js").LocalGrid} LocalGrid
 */

/**
 * @typedef {Object} VectorBuffers
 * @property {Int16Array} fillPositions Fill positions in grid units.
 * @property {Uint32Array} fillStyles Style index per fill vertex.
 * @property {Uint32Array} fillIndices Fill indices.
 * @property {Int16Array} strokePositions Stroke positions in grid units.
 * @property {Float32Array} strokeAttributes Normal x, normal y, width signed
 *     by the side of the line, and distance along the line in drawn map units,
 *     per stroke vertex.
 * @property {Uint32Array} strokeStyles Style index per stroke vertex.
 * @property {Uint32Array} strokeIndices Stroke indices.
 * @property {Float32Array} styles Styles, `STYLE_STRIDE` floats each.
 * @property {LocalGrid} grid Grid the positions are expressed in.
 * @property {Float32Array} symbolInstances Symbol instances.
 * @property {Float32Array} iconInstances Icon instances.
 * @property {Array<import("./glyphLayout.js").GlyphInstance>} glyphs Glyphs.
 * @property {Array<import("./declutter.js").Label>} labels Declutter labels.
 * @property {Object<number, import("../../Feature.js").FeatureLike>} featuresByRef Hit refs.
 * @property {Array<import("../../webgpu/ImageAtlas.js").ImageAtlasEntry>} imageEntries Image atlas entries the icons and pattern fills are drawn from.
 * @property {Array<import("./drawOrder.js").DrawCommand>} commands Paint order.
 */

/**
 * Floats per style table entry: color (4), hit color (4), up to eight dash
 * lengths (8), and dash offset, dash pattern length, dash count, and padding
 * (4), matching the `Style` struct of the vector shaders. A fill has no dashes,
 * so its first four dash lengths hold the atlas rectangle of its pattern
 * instead, with a zero width when there is none, the fifth holds the pattern's
 * scale, and the final four values hold displacement x, displacement y,
 * displacement anchor, and padding.
 * @type {number}
 */
export const STYLE_STRIDE = 20;

/**
 * Most dash lengths a style table entry holds. Longer patterns are truncated.
 * @type {number}
 */
const MAX_DASHES = 8;

/**
 * Normalizes a line dash the way Canvas does: an odd number of lengths is
 * repeated to make it even, and a pattern with a negative or non-finite length,
 * or only zero lengths, means a solid line.
 *
 * @param {Array<number>|null|undefined} lineDash Line dash, in CSS pixels.
 * @return {Array<number>} Dash lengths, empty for a solid line.
 */
export function normalizeLineDash(lineDash) {
  if (!lineDash || lineDash.length === 0) {
    return [];
  }
  let total = 0;
  for (const length of lineDash) {
    if (!(length >= 0) || !isFinite(length)) {
      return [];
    }
    total += length;
  }
  if (total === 0) {
    return [];
  }
  const dashes =
    lineDash.length % 2 === 1 ? lineDash.concat(lineDash) : lineDash.slice();
  return dashes.slice(0, MAX_DASHES);
}

/**
 * @classdesc
 * Collects the distinct styles of a batch, so vertices only carry an index
 * instead of the `STYLE_STRIDE` floats of a style.
 */
class StyleTable {
  constructor() {
    /**
     * @type {Array<number>}
     */
    this.values = [];

    /**
     * @private
     * @type {Map<string, number>}
     */
    this.indices_ = new Map();
  }

  /**
   * @param {Array<number>} color RGBA 0-1.
   * @param {Array<number>} hit Hit color RGBA 0-1.
   * @param {Array<number>} [lineDash] Dash lengths in CSS pixels, as returned
   * by `normalizeLineDash`. Empty or omitted for a solid line.
   * @param {number} [lineDashOffset] Dash offset in CSS pixels.
   * @param {import("../../coordinate.js").Coordinate} [fillDisplacement] Fill
   * displacement in CSS pixels. Omitted for strokes.
   * @param {'map'|'viewport'} [fillDisplacementAnchor] Fill displacement anchor.
   * @return {number} Style index.
   */
  add(
    color,
    hit,
    lineDash = [],
    lineDashOffset = 0,
    fillDisplacement,
    fillDisplacementAnchor = 'map',
  ) {
    const displacementKey = fillDisplacement
      ? `|${fillDisplacement.join(',')}|${fillDisplacementAnchor}`
      : '';
    const key =
      color.join(',') +
      '|' +
      hit.join(',') +
      '|' +
      lineDash.join(',') +
      '|' +
      (lineDash.length ? lineDashOffset : 0) +
      displacementKey;
    const existing = this.indices_.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const index = this.values.length / STYLE_STRIDE;
    this.values.push(...color, ...hit);
    let total = 0;
    for (let i = 0; i < MAX_DASHES; ++i) {
      const length = lineDash[i] ?? 0;
      total += length;
      this.values.push(length);
    }
    if (fillDisplacement) {
      this.values.push(
        fillDisplacement[0],
        fillDisplacement[1],
        fillDisplacementAnchor === 'map' ? 1 : 0,
        0,
      );
    } else {
      this.values.push(
        lineDash.length ? lineDashOffset : 0,
        total,
        lineDash.length,
        0,
      );
    }
    this.indices_.set(key, index);
    return index;
  }

  /**
   * @param {Array<number>} rect Pattern rectangle in the image atlas: x, y,
   * width, and height in texels.
   * @param {number} scale Pattern scale.
   * @param {Array<number>} hit Hit color RGBA 0-1.
   * @param {import("../../coordinate.js").Coordinate} fillDisplacement Fill
   * displacement in CSS pixels.
   * @param {'map'|'viewport'} fillDisplacementAnchor Fill displacement anchor.
   * @return {number} Style index.
   */
  addPattern(rect, scale, hit, fillDisplacement, fillDisplacementAnchor) {
    const key =
      'pattern|' +
      rect.join(',') +
      '|' +
      scale +
      '|' +
      hit.join(',') +
      '|' +
      fillDisplacement.join(',') +
      '|' +
      fillDisplacementAnchor;
    const existing = this.indices_.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const index = this.values.length / STYLE_STRIDE;
    this.values.push(
      1,
      1,
      1,
      1,
      ...hit,
      ...rect,
      scale,
      0,
      0,
      0,
      fillDisplacement[0],
      fillDisplacement[1],
      fillDisplacementAnchor === 'map' ? 1 : 0,
      0,
    );
    this.indices_.set(key, index);
    return index;
  }
}

/**
 * Fallback extent for the local grid when the caller has no clip extent.
 *
 * @param {Array<import("../../Feature.js").FeatureLike>} features Features.
 * @return {import("../../extent.js").Extent} Extent.
 */
function boundsOf(features) {
  const extent = createEmpty();
  for (const feature of features) {
    const geometry = feature.getGeometry();
    if (geometry) {
      extendExtent(extent, geometry.getExtent());
    }
  }
  return isEmpty(extent) ? [0, 0, 0, 0] : extent;
}

/**
 * Labels, symbols, and hit references. These stay on the main thread because
 * they need the font atlas and the feature objects.
 *
 * @typedef {Object} LabelData
 * @property {Float32Array} symbolInstances Symbol instances.
 * @property {Float32Array} iconInstances Icon instances.
 * @property {Array<import("./glyphLayout.js").GlyphInstance>} glyphs Glyphs.
 * @property {Array<import("./declutter.js").Label>} labels Declutter labels.
 * @property {Object<number, import("../../Feature.js").FeatureLike>} featuresByRef Hit refs.
 * @property {Array<import("../../style/Image.js").default|import("../../style/Fill.js").default>} pendingImageStyles Images and pattern fills being loaded.
 * @property {Array<import("../../webgpu/ImageAtlas.js").ImageAtlasEntry>} imageEntries Image atlas entries the icons and pattern fills are drawn from.
 */

/**
 * Style evaluation and geometry extraction, with the resulting tessellation
 * work described as plain data so it can run here or on a worker.
 *
 * @param {Array<import("../../Feature.js").FeatureLike>} features Features.
 * @param {import("./style.js").StyleFunction} styleFunction Style function.
 * @param {number} resolution Resolution.
 * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
 * @param {VectorReprojOptions} [reproj] Reprojection options.
 * @param {number} [pixelRatio] Device pixel ratio for glyph rasterization.
 * @param {number} [zoom] View zoom level, for `['zoom']` expressions.
 * @param {import("../../render.js").OrderFunction|null} [renderOrder] Feature order. The default is uid order.
 * @param {import("../../webgpu/ImageAtlas.js").default} [imageAtlas] Image atlas.
 * @param {WeakMap<import("../../Feature.js").FeatureLike, Array<ResolvedStyleGeometry>>} [styleCache] Resolved style cache.
 * @return {{request: import("./geometryBuffers.js").GeometryRequest, labelData: LabelData}} Work and labels.
 */
export function buildVectorRequest(
  features,
  styleFunction,
  resolution,
  atlas,
  reproj,
  pixelRatio = 1,
  zoom = NaN,
  renderOrder,
  imageAtlas,
  styleCache,
) {
  const styleTable = new StyleTable();
  /** @type {Array<import("./geometryBuffers.js").GeometryJob>} */
  const jobs = [];
  /** @type {Array<number>} */
  const coordinates = [];
  /** @type {Array<number>} */
  const symbolInstances = [];
  /** @type {Array<number>} */
  const iconInstances = [];
  /** @type {Array<import("./glyphLayout.js").GlyphInstance>} */
  const glyphs = [];
  /** @type {Array<import("./declutter.js").Label>} */
  const labels = [];
  /** @type {Object<number, import("../../Feature.js").FeatureLike>} */
  const featuresByRef = {};
  /** @type {Set<import("../../style/Image.js").default>} */
  const pendingImageStyles = new Set();
  /** @type {Set<import("../../webgpu/ImageAtlas.js").ImageAtlasEntry>} */
  const imageEntries = new Set();

  /** @type {BuildState} */
  const state = {
    jobs,
    coordinates,
    symbolInstances,
    iconInstances,
    glyphs,
    labels,
    styleTable,
    atlas,
    imageAtlas,
    pendingImageStyles,
    imageEntries,
    reproj,
    resolution,
    pixelRatio,
    nextPairId: 1,
    nextSequence: 0,
  };

  let featureIndex = 0;
  const sorted = features.slice();
  if (renderOrder) {
    sorted.sort(renderOrder);
  } else {
    sorted.sort((a, b) => Number(getUid(a)) - Number(getUid(b)));
  }

  for (const feature of sorted) {
    let resolved = styleCache?.get(feature);
    if (!resolved) {
      resolved = resolveFeatureStyles(
        feature,
        styleFunction,
        resolution,
        zoom,
        !!styleCache,
      );
      styleCache?.set(feature, resolved);
    }
    if (!resolved.length) {
      continue;
    }
    const ref = ++featureIndex;
    featuresByRef[ref] = feature;
    const hit = encodeHitColor(ref);
    const labelId = Number(getUid(feature));

    for (const item of resolved) {
      if (
        reproj?.filterExtent &&
        !intersects(item.geometry.getExtent(), reproj.filterExtent)
      ) {
        continue;
      }
      appendStyledGeometry(
        state,
        item.geometry,
        item.style,
        item.key,
        hit,
        labelId,
        ref,
      );
    }
  }

  // The GPU stores anchors as float32. An absolute web mercator coordinate is
  // only good to about a metre there, which is several pixels once the view is
  // past zoom 16, and the error changes with the view matrix — labels shake
  // while the local-grid geometry stays still. Keep the anchor relative to the
  // same origin the grid uses; the label matrix adds it back in float64.
  // Glyph instances stay absolute until they are packed, because declutter
  // still projects them on the CPU.
  packLabelsInDrawOrder(labels, glyphs, symbolInstances, iconInstances);

  const gridExtent = reproj?.clipExtent || boundsOf(features);
  const originX = gridExtent[0];
  const originY = gridExtent[1];
  for (let i = 0; i < symbolInstances.length; i += SYMBOL_STRIDE) {
    symbolInstances[i] -= originX;
    symbolInstances[i + 1] -= originY;
  }
  for (let i = 0; i < iconInstances.length; i += ICON_STRIDE) {
    iconInstances[i] -= originX;
    iconInstances[i + 1] -= originY;
  }

  return {
    request: {
      jobs,
      coordinates: new Float64Array(coordinates),
      styles: new Float32Array(styleTable.values),
      gridExtent,
      clipExtent: reproj?.clipExtent,
      maxSegmentLength: reproj?.maxSegmentLength,
      maxSpanX: reproj?.maxSpanX,
      worldWidth: reproj?.worldWidth,
      warpGrid: reproj?.warpGrid,
      warpExtent: reproj?.warpExtent,
      maxTargetError: reproj?.maxTargetError,
      maxTargetEdge: reproj?.maxTargetEdge,
      projectToTarget: reproj?.projectToTarget,
    },
    labelData: {
      symbolInstances: new Float32Array(symbolInstances),
      iconInstances: new Float32Array(iconInstances),
      glyphs,
      labels,
      featuresByRef,
      pendingImageStyles: Array.from(pendingImageStyles),
      imageEntries: Array.from(imageEntries),
    },
  };
}

/**
 * What one `buildVectorRequest()` call accumulates, shared by every geometry it
 * draws.
 *
 * @typedef {Object} BuildState
 * @property {Array<import("./geometryBuffers.js").GeometryJob>} jobs Fill and stroke jobs.
 * @property {Array<number>} coordinates Shared x/y pairs the jobs refer to.
 * @property {Array<number>} symbolInstances Point symbol instances, `SYMBOL_STRIDE` floats each.
 * @property {Array<number>} iconInstances Icon instances, `ICON_STRIDE` floats each.
 * @property {Array<import("./glyphLayout.js").GlyphInstance>} glyphs Glyphs.
 * @property {Array<import("./declutter.js").Label>} labels Declutter labels.
 * @property {StyleTable} styleTable Style table.
 * @property {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
 * @property {import("../../webgpu/ImageAtlas.js").default|undefined} imageAtlas Image atlas.
 * @property {Set<import("../../style/Image.js").default|import("../../style/Fill.js").default>} pendingImageStyles Images and pattern fills being loaded.
 * @property {Set<import("../../webgpu/ImageAtlas.js").ImageAtlasEntry>} imageEntries Image atlas entries drawn from.
 * @property {VectorReprojOptions|undefined} reproj Reprojection options.
 * @property {number} resolution Resolution.
 * @property {number} pixelRatio Device pixel ratio for glyph rasterization.
 * @property {number} nextPairId Next image and text pair id.
 * @property {number} nextSequence Next render sequence.
 */

/**
 * Sides for drawing a circle as a regular polygon, so the straight edges stay
 * within half a pixel of the arc.
 *
 * @param {number} radius Radius in map units.
 * @param {number} resolution Map units per pixel.
 * @return {number} Side count, from 32 to 128.
 */
function circleSides(radius, resolution) {
  if (!(radius > 0) || !(resolution > 0)) {
    return 32;
  }
  const sides = Math.ceil(Math.PI * Math.sqrt(radius / resolution));
  return Math.max(32, Math.min(128, sides));
}

/**
 * Append the fills, strokes, symbols, and labels that one style gives one
 * geometry. A geometry collection is drawn by calling this once per member,
 * each with its own `styleKey` so their labels keep distinct identities.
 *
 * @param {BuildState} state Build state.
 * @param {import("../../geom/Geometry.js").default|import("../../render/Feature.js").default} geom Geometry, never a collection.
 * @param {import("../../style/Style.js").default} style Style.
 * @param {string} styleKey Style index, plus member index for a collection member.
 * @param {Array<number>} hit Hit color of the feature.
 * @param {number} labelId Stable label id of the feature.
 * @param {number} featureRef Feature ref.
 */
function appendStyledGeometry(
  state,
  geom,
  style,
  styleKey,
  hit,
  labelId,
  featureRef,
) {
  const {jobs, coordinates, glyphs, labels, styleTable, atlas, reproj} = state;
  const zIndex = style.getZIndex() || 0;
  const type = geom.getType();
  const sequence = state.nextSequence++;
  /** @type {import("./drawOrder.js").DrawStamp} */
  const stamp = {
    zIndex,
    classRank: classRankFor(type),
    sequence,
    featureRef,
  };
  const fill = style.getFill();
  const stroke = style.getStroke();
  const image = style.getImage();
  const text = style.getText();
  const rawText = text?.getText();
  const textKey = Array.isArray(rawText) ? rawText.join('\n') : rawText || '';
  // Not the feature id: vector tile ids are only unique within one tile, so
  // the same label from a neighbor or another zoom level would never match.
  const featureKey = type + '|' + textKey;

  if (type === 'Circle' && (fill || stroke)) {
    const circle = /** @type {import("../../geom/Circle.js").default} */ (geom);
    const polygon = fromCircle(
      circle,
      circleSides(circle.getRadius(), state.resolution),
    );
    if (fill) {
      appendFills(
        polygon,
        fill,
        hit,
        jobs,
        coordinates,
        styleTable,
        state,
        stamp,
      );
    }
    if (stroke) {
      appendStrokes(polygon, stroke, hit, jobs, coordinates, styleTable, stamp);
    }
  } else if (fill && (type === 'Polygon' || type === 'MultiPolygon')) {
    appendFills(
      /** @type {any} */ (geom),
      fill,
      hit,
      jobs,
      coordinates,
      styleTable,
      state,
      stamp,
    );
  }
  if (
    stroke &&
    type !== 'Point' &&
    type !== 'MultiPoint' &&
    type !== 'Circle'
  ) {
    appendStrokes(
      /** @type {any} */ (geom),
      stroke,
      hit,
      jobs,
      coordinates,
      styleTable,
      stamp,
    );
  }

  const placement = text?.getPlacement ? text.getPlacement() : 'point';
  const linePlacement =
    text &&
    placement === 'line' &&
    (type === 'LineString' || type === 'MultiLineString');
  const imageAnchors =
    image && (type === 'Point' || type === 'MultiPoint')
      ? getAnchors(/** @type {any} */ (geom), reproj)
      : [];
  const textAnchors =
    text && !linePlacement ? getAnchors(/** @type {any} */ (geom), reproj) : [];
  const maxAnchors = Math.max(imageAnchors.length, textAnchors.length);
  for (let a = 0; a < maxAnchors; ++a) {
    const pid =
      imageAnchors[a] && textAnchors[a] ? state.nextPairId++ : undefined;
    if (image && imageAnchors[a]) {
      const anchor = imageAnchors[a];
      if (image instanceof CircleStyle) {
        const size = image.getSize() || [16, 16];
        const symbolIndex = appendSymbolInstance(
          state.symbolInstances,
          image,
          anchor,
          hit,
        );
        labels.push({
          minX: -size[0] / 2,
          minY: -size[1] / 2,
          maxX: size[0] / 2,
          maxY: size[1] / 2,
          priority: -zIndex,
          zIndex,
          classRank: CLASS_IMAGE,
          sequence,
          featureRef,
          id: labelId,
          mode: image.getDeclutterMode?.() || 'declutter',
          pairId: pid,
          glyphStart: 0,
          glyphCount: 0,
          symbolIndex,
          _anchor: anchor,
          _identityKey: `${featureKey}|${styleKey}|${a}|${pid ? 'pair' : 'image'}`,
        });
      } else {
        appendIconLabel(state, image, anchor, hit, {
          priority: -zIndex,
          zIndex,
          classRank: CLASS_IMAGE,
          sequence,
          featureRef,
          id: labelId,
          pairId: pid,
          identityKey: `${featureKey}|${styleKey}|${a}|${pid ? 'pair' : 'image'}`,
        });
      }
    }
    if (!text || !textAnchors[a]) {
      continue;
    }
    const start = glyphs.length;
    const box = layoutPointLabel(
      glyphs,
      text,
      textAnchors[a],
      atlas,
      hit,
      state.pixelRatio,
    );
    if (!box) {
      continue;
    }
    labels.push({
      minX: box.minX,
      minY: box.minY,
      maxX: box.maxX,
      maxY: box.maxY,
      priority: -zIndex,
      zIndex,
      classRank: CLASS_TEXT,
      sequence,
      featureRef,
      id: labelId,
      mode: text.getDeclutterMode?.() || 'declutter',
      pairId: pid,
      padding: text.getPadding() || [0, 0, 0, 0],
      glyphStart: start,
      glyphCount: glyphs.length - start,
      text: textKey,
      _anchor: textAnchors[a],
      _identityKey: `${featureKey}|${styleKey}|${a}|${pid ? 'pair' : 'text'}`,
    });
  }
  if (!linePlacement) {
    return;
  }
  const flat = /** @type {any} */ (geom).getFlatCoordinates();
  const ends =
    type === 'MultiLineString'
      ? /** @type {any} */ (geom).getEnds()
      : [flat.length];
  const stride = /** @type {any} */ (geom).getStride();
  const repeat = text.getRepeat?.();
  const maxAngle = text.getMaxAngle?.() ?? Math.PI / 4;
  const gridCenterX = wrapGridCenterX(reproj);
  let offset = 0;
  let pathIndex = 0;
  for (const end of ends) {
    const line = [];
    for (let i = offset; i < end; i += stride) {
      line.push(flat[i], flat[i + 1]);
    }
    offset = end;
    if (gridCenterX !== undefined) {
      wrapLine(line, gridCenterX, /** @type {number} */ (reproj?.worldWidth));
    }
    const chunks = repeat
      ? lineChunk(repeat * state.resolution, line, 0, line.length, 2)
      : [line];
    for (let chunk of chunks) {
      if (text.getTextAlign() === undefined) {
        const range = matchingChunk(maxAngle, chunk, 0, chunk.length, 2);
        chunk = chunk.slice(range[0], range[1]);
      }
      const start = glyphs.length;
      const box = layoutLineLabel(
        glyphs,
        text,
        chunk,
        state.resolution,
        atlas,
        hit,
        state.pixelRatio,
      );
      if (!box) {
        ++pathIndex;
        continue;
      }
      const count = glyphs.length - start;
      const middle = glyphs[start + Math.floor(count / 2)];
      labels.push({
        minX: box.minX,
        minY: box.minY,
        maxX: box.maxX,
        maxY: box.maxY,
        priority: -zIndex,
        zIndex,
        classRank: CLASS_TEXT,
        sequence,
        featureRef,
        id: labelId,
        mode: text.getDeclutterMode?.() || 'declutter',
        padding: text.getPadding() || [0, 0, 0, 0],
        glyphStart: start,
        glyphCount: count,
        text: textKey,
        _anchor: middle ? [middle.x, middle.y] : undefined,
        _identityKey: `${featureKey}|${styleKey}|line|${pathIndex}`,
      });
      ++pathIndex;
    }
  }
}

/**
 * Append one point symbol instance, laid out as `SYMBOL_STRIDE` describes.
 *
 * A circle style is drawn as Canvas draws it: a fill inside a stroke centred on
 * the radius, with no fill at all when the style has none. Any other image is
 * drawn as a disc filling its size, in its fill color or a placeholder orange.
 *
 * @param {Array<number>} symbolInstances Symbol instances.
 * @param {import("../../style/Image.js").default} image Image style.
 * @param {import("../../coordinate.js").Coordinate} anchor Anchor.
 * @param {Array<number>} hit Hit color.
 * @return {number} Index of the new instance.
 */
function appendSymbolInstance(symbolInstances, image, anchor, hit) {
  const size = image.getSize() || [16, 16];
  const scaleArray = image.getScaleArray?.() || [1, 1];
  const scaleX = Array.isArray(scaleArray) ? scaleArray[0] : 1;
  const scaleY = Array.isArray(scaleArray) ? scaleArray[1] : 1;
  const shape = /** @type {any} */ (image);
  const isCircle = typeof shape.getRadius === 'function';
  const fillColor = shape.getFill?.()?.getColor?.();
  const fill = toRgba(fillColor || (isCircle ? undefined : [255, 153, 0, 1]));
  const stroke = isCircle ? shape.getStroke?.() : null;
  const strokeColor = stroke
    ? toRgba(stroke.getColor() || '#000')
    : [0, 0, 0, 0];
  const strokeWidth = stroke ? (stroke.getWidth() ?? 1) * scaleX : 0;
  const radius = isCircle
    ? shape.getRadius() * scaleX
    : Math.min(size[0] * scaleX, size[1] * scaleY) / 2;
  const symbolIndex = symbolInstances.length / SYMBOL_STRIDE;
  symbolInstances.push(
    anchor[0],
    anchor[1],
    0,
    0,
    size[0] * scaleX,
    size[1] * scaleY,
    fill[0],
    fill[1],
    fill[2],
    fill[3],
    hit[0],
    hit[1],
    hit[2],
    hit[3],
    strokeColor[0],
    strokeColor[1],
    strokeColor[2],
    strokeColor[3],
    strokeWidth,
    radius,
  );
  return symbolIndex;
}

/**
 * Append a textured image label when its image is ready.
 *
 * @param {BuildState} state Build state.
 * @param {import("../../style/Image.js").default} image Image style.
 * @param {import("../../coordinate.js").Coordinate} anchor Anchor.
 * @param {Array<number>} hit Hit color.
 * @param {{priority:number,zIndex:number,classRank:number,sequence:number,featureRef:number,id:number,pairId:(number|undefined),identityKey:string}} stamp Label values.
 */
function appendIconLabel(state, image, anchor, hit, stamp) {
  let imageState = image.getImageState();
  if (imageState === ImageState.IDLE) {
    image.load();
    imageState = image.getImageState();
  }
  if (imageState !== ImageState.LOADED) {
    if (imageState !== ImageState.ERROR) {
      state.pendingImageStyles.add(image);
    }
    return;
  }
  if (!state.imageAtlas) {
    return;
  }
  const data = getImageStyleData(image, state.pixelRatio, false);
  if (!data) {
    return;
  }
  const atlas = state.imageAtlas.add(data);
  state.imageEntries.add(atlas);
  const scaleX = data.scale[0];
  const scaleY = data.scale[1];
  const anchorX = data.anchorX / data.imagePixelRatio;
  const anchorY = data.anchorY / data.imagePixelRatio;
  const offsetX = -anchorX * scaleX;
  const offsetY = -anchorY * scaleY;
  const width = data.width * scaleX;
  const height = data.height * scaleY;
  const iconIndex = state.iconInstances.length / ICON_STRIDE;
  state.iconInstances.push(
    anchor[0],
    anchor[1],
    offsetX,
    offsetY,
    width,
    height,
    atlas.texX0,
    atlas.texY0,
    atlas.texX1,
    atlas.texY1,
    hit[0],
    hit[1],
    hit[2],
    hit[3],
    data.opacity,
    data.rotation,
    data.rotateWithView ? 1 : 0,
  );
  const x2 = offsetX + width;
  const y2 = offsetY + height;
  state.labels.push({
    minX: Math.min(offsetX, x2),
    minY: Math.min(offsetY, y2),
    maxX: Math.max(offsetX, x2),
    maxY: Math.max(offsetY, y2),
    priority: stamp.priority,
    zIndex: stamp.zIndex,
    classRank: stamp.classRank,
    sequence: stamp.sequence,
    featureRef: stamp.featureRef,
    id: stamp.id,
    mode: data.declutterMode || 'declutter',
    pairId: stamp.pairId,
    glyphStart: 0,
    glyphCount: 0,
    iconIndex,
    _anchor: anchor,
    _corners: [offsetX, offsetY, x2, offsetY, x2, y2, offsetX, y2],
    _rotation: data.rotation,
    _rotateWithView: data.rotateWithView,
    _identityKey: stamp.identityKey,
  });
}

/**
 * @param {import("./geometryBuffers.js").GeometryBuffers} geometry Geometry.
 * @param {LabelData} labelData Labels.
 * @return {VectorBuffers} Buffers.
 */
export function combineVectorBuffers(geometry, labelData) {
  const commands = (geometry.ranges || []).concat(
    labelCommands(labelData.labels),
  );
  commands.sort(compareDraw);
  return {
    fillPositions: geometry.fillPositions,
    fillStyles: geometry.fillStyles,
    fillIndices: geometry.fillIndices,
    strokePositions: geometry.strokePositions,
    strokeAttributes: geometry.strokeAttributes,
    strokeStyles: geometry.strokeStyles,
    strokeIndices: geometry.strokeIndices,
    styles: geometry.styles,
    grid: geometry.grid,
    symbolInstances: labelData.symbolInstances,
    iconInstances: labelData.iconInstances,
    glyphs: labelData.glyphs,
    labels: labelData.labels,
    featuresByRef: labelData.featuresByRef,
    imageEntries: labelData.imageEntries,
    commands,
  };
}

/**
 * Build everything on the calling thread.
 *
 * @param {Array<import("../../Feature.js").FeatureLike>} features Features.
 * @param {import("../../style/Style.js").StyleFunction} styleFunction Style function.
 * @param {number} resolution Resolution.
 * @param {import("../../webgpu/FontAtlas.js").default} atlas Atlas.
 * @param {VectorReprojOptions} [reproj] Reprojection options.
 * @param {number} [pixelRatio] Device pixel ratio for glyph rasterization.
 * @param {number} [zoom] View zoom level.
 * @param {import("../../render.js").OrderFunction|null} [renderOrder] Feature order.
 * @param {import("../../webgpu/ImageAtlas.js").default} [imageAtlas] Image atlas.
 * @return {VectorBuffers} Buffers.
 */
export function buildVectorBuffers(
  features,
  styleFunction,
  resolution,
  atlas,
  reproj,
  pixelRatio = 1,
  zoom = NaN,
  renderOrder,
  imageAtlas,
) {
  const {request, labelData} = buildVectorRequest(
    features,
    styleFunction,
    resolution,
    atlas,
    reproj,
    pixelRatio,
    zoom,
    renderOrder,
    imageAtlas,
  );
  const geometry = buildGeometryBuffers(request);
  return combineVectorBuffers(geometry, labelData);
}

/**
 * Point / RenderFeature-compatible coordinate.
 *
 * @param {import("../../geom/Geometry.js").default|import("../../render/Feature.js").default} geometry Geometry.
 * @return {import("../../coordinate.js").Coordinate} Coordinate.
 */
function pointCoordinate(geometry) {
  const withCoords = /** @type {any} */ (geometry);
  if (typeof withCoords.getCoordinates === 'function') {
    const coordinates = withCoords.getCoordinates();
    if (coordinates) {
      return coordinates;
    }
  }
  const flat = withCoords.getFlatCoordinates();
  return [flat[0], flat[1]];
}

/**
 * MultiPoint / RenderFeature-compatible coordinates.
 *
 * @param {import("../../geom/Geometry.js").default|import("../../render/Feature.js").default} geometry Geometry.
 * @return {Array<import("../../coordinate.js").Coordinate>} Coordinates.
 */
function multiPointCoordinates(geometry) {
  const withCoords = /** @type {any} */ (geometry);
  if (typeof withCoords.getCoordinates === 'function') {
    const coordinates = withCoords.getCoordinates();
    if (coordinates) {
      return coordinates;
    }
  }
  const flat = withCoords.getFlatCoordinates();
  const stride = withCoords.getStride?.() || 2;
  /** @type {Array<import("../../coordinate.js").Coordinate>} */
  const anchors = [];
  for (let i = 0; i < flat.length; i += stride) {
    anchors.push([flat[i], flat[i + 1]]);
  }
  return anchors;
}

/**
 * Polygon label/symbol anchor. RenderFeature has no `getInteriorPoint()`.
 *
 * @param {import("../../geom/Geometry.js").default|import("../../render/Feature.js").default} geometry Geometry.
 * @return {import("../../coordinate.js").Coordinate} Anchor.
 */
function polygonAnchor(geometry) {
  const withInterior = /** @type {any} */ (geometry);
  if (typeof withInterior.getInteriorPoint === 'function') {
    return withInterior.getInteriorPoint().getCoordinates().slice(0, 2);
  }
  if (typeof withInterior.getFlatInteriorPoint === 'function') {
    const interior = withInterior.getFlatInteriorPoint();
    return [interior[0], interior[1]];
  }
  const extent = geometry.getExtent();
  return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
}

/**
 * Move a line label path into the world copy its stroke is drawn in, by the
 * center of its extent like the stroke (see `worldShift()`).
 *
 * @param {Array<number>} line Flat x/y pairs, shifted in place.
 * @param {number} gridCenterX Grid center x, in source units.
 * @param {number} worldWidth Source world width.
 */
function wrapLine(line, gridCenterX, worldWidth) {
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < line.length; i += 2) {
    minX = Math.min(minX, line[i]);
    maxX = Math.max(maxX, line[i]);
  }
  const shift = worldShift((minX + maxX) / 2, gridCenterX, worldWidth);
  if (shift === 0) {
    return;
  }
  for (let i = 0; i < line.length; i += 2) {
    line[i] += shift;
  }
}

/**
 * The center of the grid that geometry wraps into, when the source wraps.
 *
 * @param {VectorReprojOptions} [reproj] Reprojection.
 * @return {number|undefined} Grid center x, in source units.
 */
function wrapGridCenterX(reproj) {
  const clipExtent = reproj?.clipExtent;
  if (!reproj?.worldWidth || !clipExtent) {
    return undefined;
  }
  return (clipExtent[0] + clipExtent[2]) / 2;
}

/**
 * Move symbol and label anchors into the world copy their geometry is drawn
 * in (see `worldShift()`). The anchor of a single line or polygon moves with
 * the extent of the geometry, as its fill and stroke do; the anchors of points
 * and of the parts of a multi-geometry, each drawn on its own, move on their
 * own.
 *
 * @param {import("../../geom/Geometry.js").default} geometry Geometry.
 * @param {Array<import("../../coordinate.js").Coordinate>} anchors Anchors, not modified.
 * @param {VectorReprojOptions} [reproj] Reprojection.
 * @return {Array<import("../../coordinate.js").Coordinate>} Anchors in the drawn world.
 */
function wrapAnchors(geometry, anchors, reproj) {
  const gridCenterX = wrapGridCenterX(reproj);
  if (gridCenterX === undefined) {
    return anchors;
  }
  const worldWidth = /** @type {number} */ (reproj?.worldWidth);
  const type = geometry.getType();
  /** @type {number|undefined} */
  let geometryShift;
  if (type === 'LineString' || type === 'Polygon' || type === 'Circle') {
    const extent = geometry.getExtent();
    geometryShift = worldShift(
      (extent[0] + extent[2]) / 2,
      gridCenterX,
      worldWidth,
    );
  }
  return anchors.map((anchor) => {
    const shift =
      geometryShift ?? worldShift(anchor[0], gridCenterX, worldWidth);
    return shift ? [anchor[0] + shift, anchor[1]] : anchor;
  });
}

/**
 * @param {import("../../geom/Geometry.js").default} geometry Geometry.
 * @param {VectorReprojOptions} [reproj] Reprojection.
 * @return {Array<import("../../coordinate.js").Coordinate>} Anchors.
 */
function getAnchors(geometry, reproj) {
  const type = geometry.getType();
  /** @type {Array<import("../../coordinate.js").Coordinate>} */
  let anchors;
  if (type === 'Point') {
    anchors = [pointCoordinate(geometry)];
  } else if (type === 'MultiPoint') {
    anchors = multiPointCoordinates(geometry);
  } else if (type === 'Polygon') {
    anchors = [polygonAnchor(geometry)];
  } else {
    const extent = geometry.getExtent();
    anchors = [[(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]];
  }
  anchors = wrapAnchors(geometry, anchors, reproj);
  // Labels are drawn in view coordinates, so their anchors are projected here
  // even when the geometry is left in the source projection for a GPU warp.
  const projectToTarget =
    reproj?.projectAnchorsToTarget || reproj?.projectToTarget;
  if (!projectToTarget) {
    return anchors;
  }
  /** @type {Array<import("../../coordinate.js").Coordinate>} */
  const projected = [];
  for (const anchor of anchors) {
    const p = projectToTarget(anchor);
    if (p && isFinite(p[0]) && isFinite(p[1])) {
      projected.push(p);
    }
  }
  return projected;
}

/**
 * @param {import("../../geom/Geometry.js").default} geometry Geometry.
 * @param {import("../../style/Fill.js").default} fill Fill.
 * @param {Array<number>} hit Hit color.
 * @param {Array<import("./geometryBuffers.js").GeometryJob>} jobs Jobs.
 * @param {Array<number>} coordinates Shared coordinates.
 * @param {StyleTable} styleTable Style table.
 * @param {BuildState} state Build state, for the image atlas.
 * @param {import("./drawOrder.js").DrawStamp} stamp Draw stamp.
 */
function appendFills(
  geometry,
  fill,
  hit,
  jobs,
  coordinates,
  styleTable,
  state,
  stamp,
) {
  const fillColor = fill.getColor();
  const displacement = fill.getDisplacement?.() || [0, 0];
  const displacementAnchor = fill.getDisplacementAnchor?.() || 'map';
  let styleIndex;
  if (
    state.imageAtlas &&
    fillColor &&
    typeof fillColor === 'object' &&
    'src' in fillColor
  ) {
    const patternImage = getPatternImage(fillColor);
    if (!patternImage) {
      // Like Canvas, draw nothing until the pattern image has loaded.
      if (fill.loading()) {
        state.pendingImageStyles.add(fill);
      }
      return;
    }
    const image = patternImage.getImage(1);
    const entry = state.imageAtlas.add(
      /** @type {import("../ImageStyle.js").ImageStyleData} */ ({
        image,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: image.width,
        sourceHeight: image.height,
      }),
    );
    state.imageEntries.add(entry);
    const width = entry.texX1 - entry.texX0;
    styleIndex = styleTable.addPattern(
      [entry.texX0, entry.texY0, width, entry.texY1 - entry.texY0],
      // The pattern repeats at its atlas size times this scale, so an image
      // that was scaled down to fit the atlas needs a larger scale.
      (fillColor.scale ?? 1) * (width > 0 ? image.width / width : 1),
      hit,
      displacement,
      displacementAnchor,
    );
  } else {
    const color = toRgba(fillColor);
    if (color[3] === 0) {
      return;
    }
    styleIndex = styleTable.add(
      color,
      hit,
      undefined,
      undefined,
      displacement,
      displacementAnchor,
    );
  }
  const type = geometry.getType();
  if (type === 'Polygon') {
    appendPolygon(
      /** @type {import("../../geom/Polygon.js").default} */ (geometry),
      styleIndex,
      jobs,
      coordinates,
      stamp,
    );
  } else if (type === 'MultiPolygon') {
    const polygons =
      /** @type {import("../../geom/MultiPolygon.js").default} */ (
        geometry
      ).getPolygons();
    for (const polygon of polygons) {
      appendPolygon(polygon, styleIndex, jobs, coordinates, stamp);
    }
  }
}

/**
 * Split MVT Polygon rings by winding before earcut (same as the WebGL path).
 *
 * @param {import("../../geom/Polygon.js").default|import("../../render/Feature.js").default} polygon Polygon.
 * @param {number} styleIndex Style index.
 * @param {Array<import("./geometryBuffers.js").GeometryJob>} jobs Jobs.
 * @param {Array<number>} coordinates Shared coordinates.
 * @param {import("./drawOrder.js").DrawStamp} stamp Draw stamp.
 */
function appendPolygon(polygon, styleIndex, jobs, coordinates, stamp) {
  const stride = polygon.getStride();
  const flat = polygon.getOrientedFlatCoordinates();
  const ends = polygon.getEnds();
  if (!ends || ends.length === 0) {
    return;
  }
  const endss =
    polygon instanceof RenderFeature && ends.length > 1
      ? inflateEnds(flat, /** @type {Array<number>} */ (ends))
      : [/** @type {Array<number>} */ (ends)];
  const groups =
    endss.length > 0 ? endss : [/** @type {Array<number>} */ (ends)];
  for (let p = 0; p < groups.length; ++p) {
    const polyEnds = groups[p];
    const startIndex = p > 0 ? groups[p - 1][groups[p - 1].length - 1] : 0;
    const start = coordinates.length / 2;
    /** @type {Array<number>} */
    const holes = [];
    let offset = startIndex;
    for (let r = 0; r < polyEnds.length; ++r) {
      const end = polyEnds[r];
      if (r > 0) {
        holes.push(coordinates.length / 2 - start);
      }
      for (let i = offset; i < end; i += stride) {
        coordinates.push(flat[i], flat[i + 1]);
      }
      offset = end;
    }
    const count = coordinates.length / 2 - start;
    if (count < 3) {
      coordinates.length = start * 2;
      continue;
    }
    jobs.push(
      withStamp({kind: 'fill', start, count, holes, styleIndex}, stamp),
    );
  }
}

/**
 * @param {import("../../geom/Geometry.js").default} geometry Geometry.
 * @param {import("../../style/Stroke.js").default} stroke Stroke.
 * @param {Array<number>} hit Hit.
 * @param {Array<import("./geometryBuffers.js").GeometryJob>} jobs Jobs.
 * @param {Array<number>} coordinates Shared coordinates.
 * @param {StyleTable} styleTable Style table.
 * @param {import("./drawOrder.js").DrawStamp} stamp Draw stamp.
 */
function appendStrokes(
  geometry,
  stroke,
  hit,
  jobs,
  coordinates,
  styleTable,
  stamp,
) {
  const color = toRgba(
    /** @type {string|Array<number>} */ (stroke.getColor() || '#000'),
  );
  if (color[3] === 0) {
    return;
  }
  const styleIndex = styleTable.add(
    color,
    hit,
    normalizeLineDash(stroke.getLineDash()),
    stroke.getLineDashOffset() || 0,
  );
  const width = stroke.getWidth() || 1;
  const lineCap = stroke.getLineCap() || defaultLineCap;
  const lineJoin = stroke.getLineJoin() || defaultLineJoin;
  const miterLimit = stroke.getMiterLimit() ?? defaultMiterLimit;
  const type = geometry.getType();
  if (type === 'LineString' || type === 'LinearRing') {
    addLineJob(
      /** @type {any} */ (geometry).getFlatCoordinates(),
      0,
      /** @type {any} */ (geometry).getFlatCoordinates().length,
      /** @type {any} */ (geometry).getStride(),
      styleIndex,
      width,
      lineCap,
      lineJoin,
      miterLimit,
      type === 'LinearRing',
      false,
      jobs,
      coordinates,
      stamp,
    );
  } else if (type === 'MultiLineString') {
    const ends =
      /** @type {import("../../geom/MultiLineString.js").default} */ (
        geometry
      ).getEnds();
    const flat = /** @type {any} */ (geometry).getFlatCoordinates();
    const stride = /** @type {any} */ (geometry).getStride();
    let offset = 0;
    for (const end of ends) {
      addLineJob(
        flat,
        offset,
        end,
        stride,
        styleIndex,
        width,
        lineCap,
        lineJoin,
        miterLimit,
        false,
        false,
        jobs,
        coordinates,
        stamp,
      );
      offset = end;
    }
  } else if (type === 'Polygon' || type === 'MultiPolygon') {
    const rings =
      type === 'Polygon'
        ? [/** @type {import("../../geom/Polygon.js").default} */ (geometry)]
        : /** @type {import("../../geom/MultiPolygon.js").default} */ (
            geometry
          ).getPolygons();
    for (const polygon of rings) {
      const flat = polygon.getOrientedFlatCoordinates();
      const ends = polygon.getEnds();
      const stride = polygon.getStride();
      let offset = 0;
      for (const end of ends) {
        addLineJob(
          flat,
          offset,
          end,
          stride,
          styleIndex,
          width,
          lineCap,
          lineJoin,
          miterLimit,
          true,
          true,
          jobs,
          coordinates,
          stamp,
        );
        offset = end;
      }
    }
  }
}

/**
 * @param {Array<number>} flat Flat coordinates.
 * @param {number} from Start index into `flat`.
 * @param {number} to End index into `flat`.
 * @param {number} stride Stride.
 * @param {number} styleIndex Style index.
 * @param {number} width Stroke width.
 * @param {CanvasLineCap} lineCap Line cap.
 * @param {CanvasLineJoin} lineJoin Line join.
 * @param {number} miterLimit Miter limit.
 * @param {boolean} closed Whether the line is a closed ring.
 * @param {boolean} skipClipEdges Drop segments lying on the clip extent.
 * @param {Array<import("./geometryBuffers.js").GeometryJob>} jobs Jobs.
 * @param {Array<number>} coordinates Shared coordinates.
 * @param {import("./drawOrder.js").DrawStamp} stamp Draw stamp.
 */
function addLineJob(
  flat,
  from,
  to,
  stride,
  styleIndex,
  width,
  lineCap,
  lineJoin,
  miterLimit,
  closed,
  skipClipEdges,
  jobs,
  coordinates,
  stamp,
) {
  const start = coordinates.length / 2;
  for (let i = from; i < to; i += stride) {
    coordinates.push(flat[i], flat[i + 1]);
  }
  const count = coordinates.length / 2 - start;
  if (count < 2) {
    coordinates.length = start * 2;
    return;
  }
  jobs.push(
    withStamp(
      {
        kind: 'stroke',
        start,
        count,
        styleIndex,
        width,
        lineCap,
        lineJoin,
        miterLimit,
        closed,
        skipClipEdges,
      },
      stamp,
    ),
  );
}

/**
 * @param {string} type Geometry type.
 * @return {number} Canvas class rank.
 */
function classRankFor(type) {
  if (type === 'Circle') {
    return CLASS_CIRCLE;
  }
  if (
    type === 'LineString' ||
    type === 'MultiLineString' ||
    type === 'LinearRing'
  ) {
    return CLASS_LINE;
  }
  return CLASS_POLYGON;
}

/**
 * @param {import("./geometryBuffers.js").GeometryJob} job Job.
 * @param {import("./drawOrder.js").DrawStamp} stamp Draw stamp.
 * @return {import("./geometryBuffers.js").GeometryJob} Stamped job.
 */
function withStamp(job, stamp) {
  job.zIndex = stamp.zIndex;
  job.classRank = stamp.classRank;
  job.sequence = stamp.sequence;
  job.featureRef = stamp.featureRef;
  return job;
}

/**
 * Pack glyph, symbol, and icon instances into draw order. The labels array itself
 * stays in creation order so declutter visibility indices do not move.
 *
 * @param {Array<import("./declutter.js").Label>} labels Labels.
 * @param {Array<import("./glyphLayout.js").GlyphInstance>} glyphs Glyphs.
 * @param {Array<number>} symbolInstances Symbol instances.
 * @param {Array<number>} iconInstances Icon instances.
 */
function packLabelsInDrawOrder(labels, glyphs, symbolInstances, iconInstances) {
  /** @type {Array<import("./declutter.js").Label>} */
  const glyphLabels = [];
  /** @type {Array<import("./declutter.js").Label>} */
  const symbolLabels = [];
  /** @type {Array<import("./declutter.js").Label>} */
  const iconLabels = [];
  for (let i = 0; i < labels.length; ++i) {
    const label = labels[i];
    if (label.glyphCount) {
      glyphLabels.push(label);
    } else if (label.symbolIndex !== undefined) {
      symbolLabels.push(label);
    } else if (label.iconIndex !== undefined) {
      iconLabels.push(label);
    }
  }
  glyphLabels.sort((a, b) =>
    compareDraw(labelKey(a, 'glyph'), labelKey(b, 'glyph')),
  );
  /** @type {Array<import("./glyphLayout.js").GlyphInstance>} */
  const nextGlyphs = [];
  for (let i = 0; i < glyphLabels.length; ++i) {
    const label = glyphLabels[i];
    const start = label.glyphStart || 0;
    const count = label.glyphCount || 0;
    label.glyphStart = nextGlyphs.length;
    for (let g = 0; g < count; ++g) {
      nextGlyphs.push(glyphs[start + g]);
    }
  }
  glyphs.length = 0;
  for (let i = 0; i < nextGlyphs.length; ++i) {
    glyphs.push(nextGlyphs[i]);
  }

  symbolLabels.sort((a, b) =>
    compareDraw(labelKey(a, 'symbol'), labelKey(b, 'symbol')),
  );
  const nextSymbols = new Array(symbolInstances.length);
  let cursor = 0;
  for (let i = 0; i < symbolLabels.length; ++i) {
    const label = symbolLabels[i];
    const from = /** @type {number} */ (label.symbolIndex) * SYMBOL_STRIDE;
    label.symbolIndex = cursor;
    for (let k = 0; k < SYMBOL_STRIDE; ++k) {
      nextSymbols[cursor * SYMBOL_STRIDE + k] = symbolInstances[from + k];
    }
    ++cursor;
  }
  for (let i = 0; i < nextSymbols.length; ++i) {
    symbolInstances[i] = nextSymbols[i];
  }

  iconLabels.sort((a, b) =>
    compareDraw(labelKey(a, 'icon'), labelKey(b, 'icon')),
  );
  const nextIcons = new Array(iconInstances.length);
  cursor = 0;
  for (let i = 0; i < iconLabels.length; ++i) {
    const label = iconLabels[i];
    const from = /** @type {number} */ (label.iconIndex) * ICON_STRIDE;
    label.iconIndex = cursor;
    for (let k = 0; k < ICON_STRIDE; ++k) {
      nextIcons[cursor * ICON_STRIDE + k] = iconInstances[from + k];
    }
    ++cursor;
  }
  for (let i = 0; i < nextIcons.length; ++i) {
    iconInstances[i] = nextIcons[i];
  }
}

/**
 * @param {import("./declutter.js").Label} label Label.
 * @param {import("./drawOrder.js").DrawPipeline} pipeline Pipeline.
 * @return {import("./drawOrder.js").DrawCommand} Sort key.
 */
function labelKey(label, pipeline) {
  return {
    zIndex: label.zIndex || 0,
    classRank: label.classRank || 0,
    sequence: label.sequence || 0,
    pipeline,
    start: 0,
    count: 0,
    featureRef: label.featureRef || 0,
  };
}

/**
 * @param {Array<import("./declutter.js").Label>} labels Labels.
 * @return {Array<import("./drawOrder.js").DrawCommand>} Label commands.
 */
function labelCommands(labels) {
  /** @type {Array<import("./drawOrder.js").DrawCommand>} */
  const commands = [];
  for (let i = 0; i < labels.length; ++i) {
    const label = labels[i];
    const key = label.glyphCount
      ? labelKey(label, 'glyph')
      : label.symbolIndex !== undefined
        ? labelKey(label, 'symbol')
        : label.iconIndex !== undefined
          ? labelKey(label, 'icon')
          : null;
    if (!key) {
      continue;
    }
    commands.push({
      zIndex: key.zIndex,
      classRank: key.classRank,
      sequence: key.sequence,
      pipeline: key.pipeline,
      start: label.glyphCount
        ? label.glyphStart || 0
        : (label.symbolIndex ?? label.iconIndex ?? 0),
      count: label.glyphCount || 1,
      featureRef: key.featureRef,
      labelIndex: i,
    });
  }
  return commands;
}
