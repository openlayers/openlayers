/**
 * @module ol/renderer/webgl/vectorUtil
 */

import {getHighPart, getLowPart} from '../../render/webgl/float64Util.js';
import {
  apply as applyTransform,
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
  PATTERN_ORIGIN_X_DOUBLE: 'u_dp_patternOriginX',
  PATTERN_ORIGIN_Y_DOUBLE: 'u_dp_patternOriginY',
  PATTERN_SCALE_RATIO_DOUBLE: 'u_dp_patternScaleRatio',
  ONE: 'u_one', // this is used in double-float arithmetics to prevent precision-handling logic from being compiled out
};

const tmpCoords = [0, 0];
const tmpCoords2 = [0, 0];
const tmpTransform = createTransform();
const tmpMat4 = createMat4();

/**
 * Applies uniforms used in vector rendering
 * @param {import('../../webgl/Helper.js').default} helper Helper
 * @param {import('../../transform.js').Transform} currentFrameStateTransform Transform
 * @param {import('../../transform.js').Transform} geometryInvertTransform Transform.
 * @param {import('../../Map.js').FrameState} frameState Frame state.
 */
export function applyVectorUniforms(
  helper,
  currentFrameStateTransform,
  geometryInvertTransform,
  frameState,
) {
  // world to screen matrix
  setFromTransform(tmpTransform, currentFrameStateTransform);
  multiplyTransform(tmpTransform, geometryInvertTransform);
  helper.setUniformMatrixValue(
    DefaultUniform.PROJECTION_MATRIX,
    mat4FromTransform(tmpMat4, tmpTransform),
  );

  // screen to world matrix
  makeInverseTransform(tmpTransform, currentFrameStateTransform);
  helper.setUniformMatrixValue(
    DefaultUniform.SCREEN_TO_WORLD_MATRIX,
    mat4FromTransform(tmpMat4, tmpTransform),
  );

  // pattern origin: compute pixel position of world [0,0] using double
  // precision on the CPU to avoid float32 precision loss in the shader
  // (see https://github.com/openlayers/openlayers/issues/16705)

  tmpCoords[0] = 0;
  tmpCoords[1] = 0;

  // convert to px coords
  applyTransform(currentFrameStateTransform, tmpCoords);
  tmpCoords[0] = (0.5 * tmpCoords[0] + 0.5) * frameState.size[0];
  tmpCoords[1] = (0.5 * tmpCoords[1] + 0.5) * frameState.size[1];

  tmpCoords2[0] = getHighPart(tmpCoords[0]);
  tmpCoords2[1] = getLowPart(tmpCoords[0]);
  tmpCoords[0] = getHighPart(tmpCoords[1]);
  tmpCoords[1] = getLowPart(tmpCoords[1]);

  helper.setUniformFloatVec2(
    VectorUniforms.PATTERN_ORIGIN_X_DOUBLE,
    tmpCoords2,
  );
  helper.setUniformFloatVec2(VectorUniforms.PATTERN_ORIGIN_Y_DOUBLE, tmpCoords);

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
