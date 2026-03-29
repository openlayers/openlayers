/**
 * @module ol/renderer/webgl/vectorUtil
 */

import {getHighPart, getLowPart} from '../../render/webgl/float64Util.js';
import {
  apply as applyTransform,
  compose as composeTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  setFromArray as setFromTransform,
} from '../../transform.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import {DefaultUniform} from '../../webgl/Helper.js';

export const VectorUniforms = {
  // the patterns origin is computed on the CPU; it is expressed in the same coordinate system as the geometries rendered,
  // except the rotation which is left to 0 in order to efficiently compute pattern offsets without involving sin/cos
  PATTERN_ORIGIN_X_DOUBLE: 'u_df_patternOriginX',
  PATTERN_ORIGIN_Y_DOUBLE: 'u_df_patternOriginY',

  // patterns are scaled slightly up/down to match zoom levels; this is computed on the CPU for better precision and passed as a double float
  PATTERN_SCALE_RATIO_DOUBLE: 'u_df_patternScaleRatio',

  // this is used in double-float arithmetics to prevent precision-handling logic from being compiled out
  ONE: 'u_one',
};

const tmpCoords = [0, 0];
const tmpCoords2 = [0, 0];
const tmpTransform = createTransform();
const tmpMat4 = createMat4();

/**
 * Applies uniforms used in vector rendering
 * @param {import('../../webgl/Helper.js').default} helper Helper
 * @param {import('../../transform.js').Transform} worldToViewTransform Transform
 * @param {import('../../transform.js').Transform} geometryInvertTransform Transform.
 * @param {import('../../Map.js').FrameState} frameState Frame state.
 */
export function applyVectorUniforms(
  helper,
  worldToViewTransform,
  geometryInvertTransform,
  frameState,
) {
  // world to screen matrix
  setFromTransform(tmpTransform, worldToViewTransform);
  multiplyTransform(tmpTransform, geometryInvertTransform);
  helper.setUniformMatrixValue(
    DefaultUniform.PROJECTION_MATRIX,
    mat4FromTransform(tmpMat4, tmpTransform),
  );

  // screen to world matrix
  makeInverseTransform(tmpTransform, tmpTransform);
  helper.setUniformMatrixValue(
    DefaultUniform.INVERT_PROJECTION_MATRIX,
    mat4FromTransform(tmpMat4, tmpTransform),
  );

  // pattern origin: compute pixel position of world [0,0] in pixel coordinates _without rotation_
  // these coordinates will be given as double-floats to the shader to avoid float32 precision loss
  // (see https://github.com/openlayers/openlayers/issues/16705)
  tmpCoords[0] = 0;
  tmpCoords[1] = 0;

  // compute & apply the transformation from world to pixel (without rotation)
  const size = frameState.size;
  const resolution = frameState.viewState.resolution;
  const center = frameState.viewState.center;
  composeTransform(
    tmpTransform,
    size[0] / 2,
    size[1] / 2,
    1 / resolution,
    1 / resolution,
    0,
    -center[0],
    -center[1],
  );
  applyTransform(tmpTransform, tmpCoords);

  // set uniforms
  tmpCoords2[0] = getHighPart(tmpCoords[0]);
  tmpCoords2[1] = getLowPart(tmpCoords[0]);
  helper.setUniformFloatVec2(
    VectorUniforms.PATTERN_ORIGIN_X_DOUBLE,
    tmpCoords2,
  );
  tmpCoords2[0] = getHighPart(tmpCoords[1]);
  tmpCoords2[1] = getLowPart(tmpCoords[1]);
  helper.setUniformFloatVec2(
    VectorUniforms.PATTERN_ORIGIN_Y_DOUBLE,
    tmpCoords2,
  );

  // we're also computing the scale ratio of the pattern so that we don't encounter
  // precision issues on the GPU
  const scaleRatio = Math.pow(2, ((frameState.viewState.zoom + 0.5) % 1) - 0.5);
  tmpCoords[0] = getHighPart(scaleRatio);
  tmpCoords[1] = getLowPart(scaleRatio);
  helper.setUniformFloatVec2(
    VectorUniforms.PATTERN_SCALE_RATIO_DOUBLE,
    tmpCoords,
  );
}
