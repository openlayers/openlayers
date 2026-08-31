import {assert} from 'chai';
import {
  clipFlatRingToExtent,
  clipFlatTriangleToExtent,
} from '../../../../../src/ol/geom/flat/clip.js';

describe('ol/geom/flat/clip', () => {
  describe('clipFlatRingToExtent', () => {
    it('clips a ring that extends past one side of the extent', () => {
      const ring = [0, 0, 1, 0, 1, 1, 0, 1];
      const clipped = clipFlatRingToExtent(ring, [0, 0.5, 1, 1]);
      assert.isAtLeast(clipped.length / 2, 3);
      for (let i = 0; i < clipped.length; i += 2) {
        assert.isAtLeast(clipped[i + 1], 0.5);
      }
    });

    it('returns empty when the ring is outside the extent', () => {
      const ring = [0, 0, 1, 0, 1, 1, 0, 1];
      assert.deepEqual(clipFlatRingToExtent(ring, [2, 2, 3, 3]), []);
    });
  });

  describe('clipFlatTriangleToExtent', () => {
    it('fan-triangulates the clipped convex polygon', () => {
      const tris = clipFlatTriangleToExtent(0, 0, 10, 0, 5, 10, [0, 2, 10, 10]);
      assert.isAbove(tris.length, 0);
      assert.strictEqual(tris.length % 6, 0);
      for (let i = 0; i < tris.length; i += 2) {
        assert.isAtLeast(tris[i + 1], 2);
      }
    });

    it('returns empty when the triangle is outside', () => {
      assert.deepEqual(
        clipFlatTriangleToExtent(0, 0, 1, 0, 0, 1, [5, 5, 6, 6]),
        [],
      );
    });
  });
});
