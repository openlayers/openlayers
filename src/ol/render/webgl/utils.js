/**
 * @module ol/render/webgl/utils
 */
import earcut from 'earcut';
import {clamp} from '../../math.js';
import {apply as applyTransform} from '../../transform.js';

export const LINESTRING_ANGLE_COSINE_CUTOFF = 0.985;

/** @type {Array<number>} */
const tmpArray_ = [];

/**
 * An object holding positions both in an index and a vertex buffer.
 * @typedef {Object} BufferPositions
 * @property {number} vertexPosition Position in the vertex buffer
 * @property {number} indexPosition Position in the index buffer
 */
const bufferPositions_ = {vertexPosition: 0, indexPosition: 0};

/**
 * @param {Float32Array} buffer Buffer
 * @param {number} pos Position
 * @param {number} x X
 * @param {number} y Y
 * @param {number} index Index
 */
function writePointVertex(buffer, pos, x, y, index) {
  buffer[pos + 0] = x;
  buffer[pos + 1] = y;
  buffer[pos + 2] = index;
}

/**
 * Pushes a quad (two triangles) based on a point geometry
 * @param {Float32Array} instructions Array of render instructions for points.
 * @param {number} elementIndex Index from which render instructions will be read.
 * @param {Float32Array} vertexBuffer Buffer in the form of a typed array.
 * @param {Uint32Array} indexBuffer Buffer in the form of a typed array.
 * @param {number} customAttributesSize Amount of custom attributes for each element.
 * @param {BufferPositions} [bufferPositions] Buffer write positions; if not specified, positions will be set at 0.
 * @return {BufferPositions} New buffer positions where to write next
 * @property {number} vertexPosition New position in the vertex buffer where future writes should start.
 * @property {number} indexPosition New position in the index buffer where future writes should start.
 * @private
 */
export function writePointFeatureToBuffers(
  instructions,
  elementIndex,
  vertexBuffer,
  indexBuffer,
  customAttributesSize,
  bufferPositions,
) {
  // This is for x, y and index
  const baseVertexAttrsCount = 3;
  const baseInstructionsCount = 2;
  const stride = baseVertexAttrsCount + customAttributesSize;

  const x = instructions[elementIndex + 0];
  const y = instructions[elementIndex + 1];

  // read custom numerical attributes on the feature
  const customAttrs = tmpArray_;
  customAttrs.length = customAttributesSize;
  for (let i = 0; i < customAttrs.length; i++) {
    customAttrs[i] = instructions[elementIndex + baseInstructionsCount + i];
  }

  let vPos = bufferPositions ? bufferPositions.vertexPosition : 0;
  let iPos = bufferPositions ? bufferPositions.indexPosition : 0;
  const baseIndex = vPos / stride;

  // push vertices for each of the four quad corners (first standard then custom attributes)
  writePointVertex(vertexBuffer, vPos, x, y, 0);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, 1);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, 2);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, 3);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  indexBuffer[iPos++] = baseIndex;
  indexBuffer[iPos++] = baseIndex + 1;
  indexBuffer[iPos++] = baseIndex + 3;
  indexBuffer[iPos++] = baseIndex + 1;
  indexBuffer[iPos++] = baseIndex + 2;
  indexBuffer[iPos++] = baseIndex + 3;

  bufferPositions_.vertexPosition = vPos;
  bufferPositions_.indexPosition = iPos;

  return bufferPositions_;
}

/**
 * Pushes a single quad to form a line segment; also includes a computation for the join angles with previous and next
 * segment, in order to be able to offset the vertices correctly in the shader.
 * Join angles are between 0 and 2PI.
 * This also computes the length of the current segment and the sum of the join angle tangents in order
 * to store this information on each subsequent segment along the line. This is necessary to correctly render dashes
 * and symbols along the line.
 *
 *   pB (before)                          pA (after)
 *    X             negative             X
 *     \             offset             /
 *      \                              /
 *       \   join              join   /
 *        \ angle 0          angle 1 /
 *         \←---                ←---/      positive
 *          \   ←--          ←--   /        offset
 *           \     ↑       ↓      /
 *            X────┴───────┴─────X
 *            p0                  p1
 *
 * @param {Float32Array} instructions Array of render instructions for lines.s
 * @param {number} segmentStartIndex Index of the segment start point from which render instructions will be read.
 * @param {number} segmentEndIndex Index of the segment end point from which render instructions will be read.
 * @param {number|null} beforeSegmentIndex Index of the point right before the segment (null if none, e.g this is a line start)
 * @param {number|null} afterSegmentIndex Index of the point right after the segment (null if none, e.g this is a line end)
 * @param {Array<number>} vertexArray Array containing vertices.
 * @param {Array<number>} indexArray Array containing indices.
 * @param {Array<number>} customAttributes Array of custom attributes value
 * @param {import('../../transform.js').Transform} toWorldTransform Transform matrix used to obtain world coordinates from instructions
 * @param {number} currentLength Cumulated length of segments processed so far
 * @param {number} currentAngleTangentSum Cumulated tangents of the join angles processed so far
 * @return {{length: number, angle: number}} Cumulated length with the newly processed segment (in world units), new sum of the join angle tangents
 * @private
 */
export function writeLineSegmentToBuffers(
  instructions,
  segmentStartIndex,
  segmentEndIndex,
  beforeSegmentIndex,
  afterSegmentIndex,
  vertexArray,
  indexArray,
  customAttributes,
  toWorldTransform,
  currentLength,
  currentAngleTangentSum,
) {
  // compute the stride to determine how many vertices were already pushed
  const baseVertexAttrsCount = 10; // base attributes: x0, y0, m0, x1, y1, m1, angle0, angle1, distance, params
  const stride = baseVertexAttrsCount + customAttributes.length;
  const baseIndex = vertexArray.length / stride;

  // The segment is composed of two positions called P0[x0, y0] and P1[x1, y1]
  // Depending on whether there are points before and after the segment, its final shape
  // will be different
  const p0 = [
    instructions[segmentStartIndex + 0],
    instructions[segmentStartIndex + 1],
  ];
  const p1 = [instructions[segmentEndIndex], instructions[segmentEndIndex + 1]];

  const m0 = instructions[segmentStartIndex + 2];
  const m1 = instructions[segmentEndIndex + 2];

  // to compute join angles we need to reproject coordinates back in world units
  const p0world = applyTransform(toWorldTransform, [...p0]);
  const p1world = applyTransform(toWorldTransform, [...p1]);

  /**
   * Compute the angle between p0pA and p0pB
   * @param {import("../../coordinate.js").Coordinate} p0 Point 0
   * @param {import("../../coordinate.js").Coordinate} pA Point A
   * @param {import("../../coordinate.js").Coordinate} pB Point B
   * @return {number} a value in [0, 2PI]
   */
  function angleBetween(p0, pA, pB) {
    const lenA = Math.sqrt(
      (pA[0] - p0[0]) * (pA[0] - p0[0]) + (pA[1] - p0[1]) * (pA[1] - p0[1]),
    );
    const tangentA = [(pA[0] - p0[0]) / lenA, (pA[1] - p0[1]) / lenA];
    const orthoA = [-tangentA[1], tangentA[0]];
    const lenB = Math.sqrt(
      (pB[0] - p0[0]) * (pB[0] - p0[0]) + (pB[1] - p0[1]) * (pB[1] - p0[1]),
    );
    const tangentB = [(pB[0] - p0[0]) / lenB, (pB[1] - p0[1]) / lenB];

    // this angle can be clockwise or anticlockwise; hence the computation afterwards
    const angle =
      lenA === 0 || lenB === 0
        ? 0
        : Math.acos(
            clamp(tangentB[0] * tangentA[0] + tangentB[1] * tangentA[1], -1, 1),
          );
    const isClockwise = tangentB[0] * orthoA[0] + tangentB[1] * orthoA[1] > 0;
    return !isClockwise ? Math.PI * 2 - angle : angle;
  }

  // a negative angle indicates a line cap
  let angle0 = -1;
  let angle1 = -1;
  let newAngleTangentSum = currentAngleTangentSum;

  const joinBefore = beforeSegmentIndex !== null;
  const joinAfter = afterSegmentIndex !== null;

  // add vertices and adapt offsets for P0 in case of join
  if (joinBefore) {
    // B for before
    const pB = [
      instructions[beforeSegmentIndex],
      instructions[beforeSegmentIndex + 1],
    ];
    const pBworld = applyTransform(toWorldTransform, [...pB]);
    angle0 = angleBetween(p0world, p1world, pBworld);

    // only add to the sum if the angle isn't too close to 0 or 2PI
    if (Math.cos(angle0) <= LINESTRING_ANGLE_COSINE_CUTOFF) {
      newAngleTangentSum += Math.tan((angle0 - Math.PI) / 2);
    }
  }
  // adapt offsets for P1 in case of join; add to angle sum
  if (joinAfter) {
    // A for after
    const pA = [
      instructions[afterSegmentIndex],
      instructions[afterSegmentIndex + 1],
    ];
    const pAworld = applyTransform(toWorldTransform, [...pA]);
    angle1 = angleBetween(p1world, p0world, pAworld);

    // only add to the sum if the angle isn't too close to 0 or 2PI
    if (Math.cos(angle1) <= LINESTRING_ANGLE_COSINE_CUTOFF) {
      newAngleTangentSum += Math.tan((Math.PI - angle1) / 2);
    }
  }

  /**
   * @param {number} vertexIndex From 0 to 3, indicating position in the quad
   * @param {number} angleSum Sum of the join angles encountered so far (used to compute distance offset
   * @return {number} A float value containing both information
   */
  function computeParameters(vertexIndex, angleSum) {
    if (angleSum === 0) {
      return vertexIndex * 10000;
    }
    return Math.sign(angleSum) * (vertexIndex * 10000 + Math.abs(angleSum));
  }

  // add main segment triangles
  vertexArray.push(
    p0[0],
    p0[1],
    m0,
    p1[0],
    p1[1],
    m1,
    angle0,
    angle1,
    currentLength,
    computeParameters(0, currentAngleTangentSum),
  );
  vertexArray.push(...customAttributes);

  vertexArray.push(
    p0[0],
    p0[1],
    m0,
    p1[0],
    p1[1],
    m1,
    angle0,
    angle1,
    currentLength,
    computeParameters(1, currentAngleTangentSum),
  );
  vertexArray.push(...customAttributes);

  vertexArray.push(
    p0[0],
    p0[1],
    m0,
    p1[0],
    p1[1],
    m1,
    angle0,
    angle1,
    currentLength,
    computeParameters(2, currentAngleTangentSum),
  );
  vertexArray.push(...customAttributes);

  vertexArray.push(
    p0[0],
    p0[1],
    m0,
    p1[0],
    p1[1],
    m1,
    angle0,
    angle1,
    currentLength,
    computeParameters(3, currentAngleTangentSum),
  );
  vertexArray.push(...customAttributes);

  indexArray.push(
    baseIndex,
    baseIndex + 1,
    baseIndex + 2,
    baseIndex + 1,
    baseIndex + 3,
    baseIndex + 2,
  );

  return {
    length:
      currentLength +
      Math.sqrt(
        (p1world[0] - p0world[0]) * (p1world[0] - p0world[0]) +
          (p1world[1] - p0world[1]) * (p1world[1] - p0world[1]),
      ),
    angle: newAngleTangentSum,
  };
}

/**
 * Pushes several triangles to form a polygon, including holes
 * @param {Float32Array} instructions Array of render instructions for lines.
 * @param {number} polygonStartIndex Index of the polygon start point from which render instructions will be read.
 * @param {Array<number>} vertexArray Array containing vertices.
 * @param {Array<number>} indexArray Array containing indices.
 * @param {number} customAttributesSize Amount of custom attributes for each element.
 * @return {number} Next polygon instructions index
 * @private
 */
export function writePolygonTrianglesToBuffers(
  instructions,
  polygonStartIndex,
  vertexArray,
  indexArray,
  customAttributesSize,
) {
  const instructionsPerVertex = 2; // x, y
  const attributesPerVertex = 2 + customAttributesSize;
  let instructionsIndex = polygonStartIndex;
  const customAttributes = instructions.slice(
    instructionsIndex,
    instructionsIndex + customAttributesSize,
  );
  instructionsIndex += customAttributesSize;
  const ringsCount = instructions[instructionsIndex++];
  let verticesCount = 0;
  const holes = new Array(ringsCount - 1);
  for (let i = 0; i < ringsCount; i++) {
    verticesCount += instructions[instructionsIndex++];
    if (i < ringsCount - 1) {
      holes[i] = verticesCount;
    }
  }
  const flatCoords = instructions.slice(
    instructionsIndex,
    instructionsIndex + verticesCount * instructionsPerVertex,
  );

  // pushing to vertices and indices!! this is where the magic happens
  const result = earcut(flatCoords, holes, instructionsPerVertex);
  for (let i = 0; i < result.length; i++) {
    indexArray.push(result[i] + vertexArray.length / attributesPerVertex);
  }
  for (let i = 0; i < flatCoords.length; i += 2) {
    vertexArray.push(flatCoords[i], flatCoords[i + 1], ...customAttributes);
  }

  return instructionsIndex + verticesCount * instructionsPerVertex;
}

/**
 * Returns a texture of 1x1 pixel, white
 * @private
 * @return {ImageData} Image data.
 */
export function getBlankImageData() {
  const canvas = document.createElement('canvas');
  const image = canvas.getContext('2d').createImageData(1, 1);
  image.data[0] = 255;
  image.data[1] = 255;
  image.data[2] = 255;
  image.data[3] = 255;
  return image;
}

/**
 * Generates a color array based on a numerical id
 * Note: the range for each component is 0 to 1 with 256 steps
 * @param {number} id Id
 * @param {Array<number>} [array] Reusable array
 * @return {Array<number>} Color array containing the encoded id
 */
export function colorEncodeId(id, array) {
  array = array || [];
  const radix = 256;
  const divide = radix - 1;
  array[0] = Math.floor(id / radix / radix / radix) / divide;
  array[1] = (Math.floor(id / radix / radix) % radix) / divide;
  array[2] = (Math.floor(id / radix) % radix) / divide;
  array[3] = (id % radix) / divide;
  return array;
}

/**
 * Reads an id from a color-encoded array
 * Note: the expected range for each component is 0 to 1 with 256 steps.
 * @param {Array<number>} color Color array containing the encoded id
 * @return {number} Decoded id
 */
export function colorDecodeId(color) {
  let id = 0;
  const radix = 256;
  const mult = radix - 1;
  id += Math.round(color[0] * radix * radix * radix * mult);
  id += Math.round(color[1] * radix * radix * mult);
  id += Math.round(color[2] * radix * mult);
  id += Math.round(color[3] * mult);
  return id;
}

/**
 * @typedef {import('./VectorStyleRenderer.js').AsShaders} StyleAsShaders
 */
/**
 * @typedef {import('./VectorStyleRenderer.js').AsRule} StyleAsRule
 */

/**
 * Takes in either a Flat Style or an array of shaders (used as input for the webgl vector layer classes)
 * and breaks it down into separate styles to be used by the VectorStyleRenderer class.
 * @param {import('../../style/flat.js').FlatStyleLike | Array<StyleAsShaders> | StyleAsShaders} style Flat style or shaders
 * @return {Array<StyleAsShaders | StyleAsRule>} Separate styles as shaders or rules with a single flat style and a filter
 */
export function breakDownFlatStyle(style) {
  // possible cases:
  // - single shader
  // - multiple shaders
  // - single style
  // - multiple styles
  // - multiple rules
  const asArray = Array.isArray(style) ? style : [style];

  // if array of rules: break rules into separate styles, compute "else" filters
  if ('style' in asArray[0]) {
    /** @type {Array<StyleAsRule>} */
    const styles = [];
    const rules = /** @type {Array<import('../../style/flat.js').Rule>} */ (
      asArray
    );
    const previousFilters = [];
    for (const rule of rules) {
      const ruleStyles = Array.isArray(rule.style) ? rule.style : [rule.style];
      /** @type {import("../../expr/expression.js").EncodedExpression} */
      let currentFilter = rule.filter;
      if (rule.else && previousFilters.length) {
        currentFilter = [
          'all',
          ...previousFilters.map((filter) => ['!', filter]),
        ];
        if (rule.filter) {
          currentFilter.push(rule.filter);
        }
        if (currentFilter.length < 3) {
          currentFilter = currentFilter[1];
        }
      }
      if (rule.filter) {
        previousFilters.push(rule.filter);
      }
      /** @type {Array<StyleAsRule>} */
      const stylesWithFilters = ruleStyles.map((style) => ({
        style,
        ...(currentFilter && {filter: currentFilter}),
      }));
      styles.push(...stylesWithFilters);
    }
    return styles;
  }

  // if array of shaders: return as is
  if ('builder' in asArray[0]) {
    return /** @type {Array<StyleAsShaders>} */ (asArray);
  }

  return asArray.map(
    (style) =>
      /** @type {StyleAsRule} */ ({
        style,
      }),
  );
}
