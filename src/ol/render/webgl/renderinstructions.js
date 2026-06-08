/**
 * @module ol/render/webgl/renderinstructions
 */
import {UNDEFINED_PROP_VALUE} from '../../expr/gpu.js';
import {transform2D} from '../../geom/flat/transform.js';
import {apply as applyTransform} from '../../transform.js';
import layoutGlyphs from './GlyphLayout.js';

/**
 * @param {Float32Array} renderInstructions Render instructions
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attributes
 * @param {import("./MixedGeometryBatch.js").GeometryBatchItem} batchEntry Batch item
 * @param {number} currentIndex Current index
 * @return {number} The amount of values pushed
 */
function pushCustomAttributesInRenderInstructions(
  renderInstructions,
  customAttributes,
  batchEntry,
  currentIndex,
) {
  let shift = 0;
  for (const key in customAttributes) {
    const attr = customAttributes[key];
    const value = attr.callback.call(batchEntry, batchEntry.feature);
    let first = value?.[0] ?? value;
    if (first === UNDEFINED_PROP_VALUE) {
      console.warn('The "has" operator might return false positives.'); // eslint-disable-line no-console
    }
    if (first === undefined) {
      first = UNDEFINED_PROP_VALUE;
    } else if (first === null) {
      first = 0;
    }
    renderInstructions[currentIndex + shift++] = first;
    if (!attr.size || attr.size === 1) {
      continue;
    }
    renderInstructions[currentIndex + shift++] = value[1];
    if (attr.size < 3) {
      continue;
    }
    renderInstructions[currentIndex + shift++] = value[2];
    if (attr.size < 4) {
      continue;
    }
    renderInstructions[currentIndex + shift++] = value[3];
  }
  return shift;
}

/**
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attributes
 * @return {number} Cumulated size of all attributes
 */
export function getCustomAttributesSize(customAttributes) {
  return Object.keys(customAttributes).reduce(
    (prev, curr) => prev + (customAttributes[curr].size || 1),
    0,
  );
}

/**
 * Render instructions for lines are structured like so:
 * [ x0, y0, customAttr0, ... , xN, yN, customAttrN ]
 * @param {import("./MixedGeometryBatch.js").PointGeometryBatch} batch Point geometry batch
 * @param {Float32Array} renderInstructions Render instructions
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attributes
 * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
 * @return {Float32Array} Generated render instructions
 */
export function generatePointRenderInstructions(
  batch,
  renderInstructions,
  customAttributes,
  transform,
) {
  // here we anticipate the amount of render instructions for points:
  // 2 instructions per vertex for position (x and y)
  // + 1 instruction per vertex per custom attributes
  const totalInstructionsCount =
    (2 + getCustomAttributesSize(customAttributes)) * batch.geometriesCount;
  if (
    !renderInstructions ||
    renderInstructions.length !== totalInstructionsCount
  ) {
    renderInstructions = new Float32Array(totalInstructionsCount);
  }

  // loop on features to fill the render instructions
  const tmpCoords = [];
  let renderIndex = 0;
  for (const featureUid in batch.entries) {
    const batchEntry = batch.entries[featureUid];
    for (let i = 0, ii = batchEntry.flatCoordss.length; i < ii; i++) {
      tmpCoords[0] = batchEntry.flatCoordss[i][0];
      tmpCoords[1] = batchEntry.flatCoordss[i][1];
      applyTransform(transform, tmpCoords);

      renderInstructions[renderIndex++] = tmpCoords[0];
      renderInstructions[renderIndex++] = tmpCoords[1];
      renderIndex += pushCustomAttributesInRenderInstructions(
        renderInstructions,
        customAttributes,
        batchEntry,
        renderIndex,
      );
    }
  }
  return renderInstructions;
}

/**
 * Render instructions for lines are structured like so:
 * [ customAttr0, ... , customAttrN, numberOfVertices0, x0, y0, ... , xN, yN, numberOfVertices1, ... ]
 * @param {import("./MixedGeometryBatch.js").LineStringGeometryBatch} batch Line String geometry batch
 * @param {Float32Array} renderInstructions Render instructions
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attributes
 * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
 * @return {Float32Array} Generated render instructions
 */
export function generateLineStringRenderInstructions(
  batch,
  renderInstructions,
  customAttributes,
  transform,
) {
  // here we anticipate the amount of render instructions for lines:
  // 3 instructions per vertex for position (x, y and m)
  // + 1 instruction per line per custom attributes
  // + 1 instruction per line (for vertices count)
  const totalInstructionsCount =
    3 * batch.verticesCount +
    (1 + getCustomAttributesSize(customAttributes)) * batch.geometriesCount;
  if (
    !renderInstructions ||
    renderInstructions.length !== totalInstructionsCount
  ) {
    renderInstructions = new Float32Array(totalInstructionsCount);
  }

  // loop on features to fill the render instructions
  const flatCoords = [];
  let renderIndex = 0;
  for (const featureUid in batch.entries) {
    const batchEntry = batch.entries[featureUid];
    for (let i = 0, ii = batchEntry.flatCoordss.length; i < ii; i++) {
      flatCoords.length = batchEntry.flatCoordss[i].length;
      transform2D(
        batchEntry.flatCoordss[i],
        0,
        flatCoords.length,
        3,
        transform,
        flatCoords,
        3,
      );
      renderIndex += pushCustomAttributesInRenderInstructions(
        renderInstructions,
        customAttributes,
        batchEntry,
        renderIndex,
      );

      // vertices count
      renderInstructions[renderIndex++] = flatCoords.length / 3;

      // looping on points for positions
      for (let j = 0, jj = flatCoords.length; j < jj; j += 3) {
        renderInstructions[renderIndex++] = flatCoords[j];
        renderInstructions[renderIndex++] = flatCoords[j + 1];
        renderInstructions[renderIndex++] = flatCoords[j + 2];
      }
    }
  }
  return renderInstructions;
}

/**
 * Render instructions for polygons are structured like so:
 * [ customAttr0, ..., customAttrN, numberOfRings, numberOfVerticesInRing0, ..., numberOfVerticesInRingN, x0, y0, ..., xN, yN, numberOfRings,... ]
 * @param {import("./MixedGeometryBatch.js").PolygonGeometryBatch} batch Polygon geometry batch
 * @param {Float32Array} renderInstructions Render instructions
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attributes
 * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
 * @return {Float32Array} Generated render instructions
 */
export function generatePolygonRenderInstructions(
  batch,
  renderInstructions,
  customAttributes,
  transform,
) {
  // here we anticipate the amount of render instructions for polygons:
  // 2 instructions per vertex for position (x and y)
  // + 1 instruction per polygon per custom attributes
  // + 1 instruction per polygon (for vertices count in polygon)
  // + 1 instruction per ring (for vertices count in ring)
  const totalInstructionsCount =
    2 * batch.verticesCount +
    (1 + getCustomAttributesSize(customAttributes)) * batch.geometriesCount +
    batch.ringsCount;
  if (
    !renderInstructions ||
    renderInstructions.length !== totalInstructionsCount
  ) {
    renderInstructions = new Float32Array(totalInstructionsCount);
  }

  // loop on features to fill the render instructions
  const flatCoords = [];
  let renderIndex = 0;
  for (const featureUid in batch.entries) {
    const batchEntry = batch.entries[featureUid];
    for (let i = 0, ii = batchEntry.flatCoordss.length; i < ii; i++) {
      flatCoords.length = batchEntry.flatCoordss[i].length;
      transform2D(
        batchEntry.flatCoordss[i],
        0,
        flatCoords.length,
        2,
        transform,
        flatCoords,
      );
      renderIndex += pushCustomAttributesInRenderInstructions(
        renderInstructions,
        customAttributes,
        batchEntry,
        renderIndex,
      );

      // ring count
      renderInstructions[renderIndex++] =
        batchEntry.ringsVerticesCounts[i].length;

      // vertices count in each ring
      for (
        let j = 0, jj = batchEntry.ringsVerticesCounts[i].length;
        j < jj;
        j++
      ) {
        renderInstructions[renderIndex++] =
          batchEntry.ringsVerticesCounts[i][j];
      }

      // looping on points for positions
      for (let j = 0, jj = flatCoords.length; j < jj; j += 2) {
        renderInstructions[renderIndex++] = flatCoords[j];
        renderInstructions[renderIndex++] = flatCoords[j + 1];
      }
    }
  }
  return renderInstructions;
}

/**
 * Generate render instructions for text labels: one record per glyph.
 * Record layout: [anchorX, anchorY, offX, offY, sizeW, sizeH, u0, v0, u1, v1, ...custom].
 * The anchor is transformed by `transform` (like points); glyph offset/size/uv are not.
 * @param {import('./MixedGeometryBatch.js').PointGeometryBatch} textBatch Text batch.
 * @param {import('./GlyphLayout.js').GlyphSource} atlas Glyph atlas.
 * @param {function(import('../../Feature.js').FeatureLike): string} resolveText Resolves the label string for a feature.
 * @param {import('./VectorStyleRenderer.js').AttributeDefinitions} customAttributes Custom attribute definitions.
 * @param {import('../../transform.js').Transform} transform Transform applied to the anchor coords.
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
  /** @type {Array<number>} */
  const out = [];
  const tmpAnchor = [];

  for (const uid in textBatch.entries) {
    const entry = textBatch.entries[uid];
    const feature = entry.feature;
    const text = resolveText(feature);
    if (!text) {
      continue;
    }
    const flatCoords = entry.flatCoordss[0];
    tmpAnchor[0] = flatCoords[0];
    tmpAnchor[1] = flatCoords[1];
    applyTransform(transform, tmpAnchor);
    const anchorX = tmpAnchor[0];
    const anchorY = tmpAnchor[1];

    // gather custom attribute values once per feature
    // This mirrors the coercion done by pushCustomAttributesInRenderInstructions
    // (used by the point/line/polygon paths): undefined -> UNDEFINED_PROP_VALUE,
    // null -> 0, and scalar returns are padded with zeros up to the attribute's
    // declared `size`, so that the per-glyph record stays aligned with the GPU
    // attribute layout.
    /** @type {Array<number>} */
    const customValues = [];
    for (let n = 0; n < customAttrNames.length; n++) {
      const def = customAttributes[customAttrNames[n]];
      const size = def.size || 1;
      const value = def.callback.call(entry, feature);
      for (let k = 0; k < size; k++) {
        let component = Array.isArray(value) ? value[k] : k === 0 ? value : 0;
        if (component === undefined) {
          component = UNDEFINED_PROP_VALUE;
        } else if (component === null) {
          component = 0;
        }
        customValues.push(component);
      }
    }

    const layout = layoutGlyphs(text, atlas);
    for (let g = 0; g < layout.glyphs.length; g++) {
      const glyph = layout.glyphs[g];
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
