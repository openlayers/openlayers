import {assert} from 'chai';
import {
  VECTOR_STROKE_SHADER,
  VECTOR_STROKE_WARPED_SHADER,
  VECTOR_WARP_SHADER,
} from '../../../../src/ol/webgpu/shaders.js';

describe('ol/webgpu/shaders', () => {
  describe('vector stroke shaders', () => {
    it('transforms stroke extrusions into screen space and preserves magnitude', () => {
      for (const shader of [
        VECTOR_STROKE_SHADER,
        VECTOR_STROKE_WARPED_SHADER,
      ]) {
        assert.include(
          shader,
          'projectionMatrix * vec4(normalWidth.xy, 0.0, 0.0)',
        );
        assert.include(shader, 'extrusionPx / max(length(extrusionPx), 1e-12)');
        assert.include(shader, 'length(normalWidth.xy)');
      }
      assert.include(VECTOR_WARP_SHADER, 'warped.x / scale * extrusionLength');
      assert.include(VECTOR_WARP_SHADER, 'warped.y / scale * extrusionLength');
    });
  });
});
