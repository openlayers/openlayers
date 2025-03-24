/**
 * @module ol/render/webgl/renderinstructions
 */
import {UNDEFINED_PROP_VALUE} from '../../expr/gpu.js';
import {transform2D} from '../../geom/flat/transform.js';
import {apply as applyTransform} from '../../transform.js';

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
