import {assert} from 'chai';
import {
  VECTOR_STROKE_SHADER,
  VECTOR_STROKE_WARPED_SHADER,
} from '../../../../src/ol/webgpu/shaders.js';

describe('ol/webgpu/shaders', () => {
  describe('vector stroke shaders', () => {
    it('transforms stroke normals into screen space', () => {
      for (const shader of [
        VECTOR_STROKE_SHADER,
        VECTOR_STROKE_WARPED_SHADER,
      ]) {
        assert.include(
          shader,
          'projectionMatrix * vec4(normalWidth.xy, 0.0, 0.0)',
        );
        assert.include(
          shader,
          'normalize(clipNormal.xy * uniforms.viewportSizePx)',
        );
        assert.notInclude(shader, 'offset = normalWidth.xy');
      }
    });
  });
});
