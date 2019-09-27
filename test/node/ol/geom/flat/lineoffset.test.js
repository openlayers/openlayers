import {assert} from 'chai';
import {
  offsetLineString,
  removeOffsetCycles,
} from '../../../../../src/ol/geom/flat/lineoffset.js';

describe('ol/geom/flat/lineoffset.js', function () {
  describe('offsetLineString', () => {
    it('offsets a simple square', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10, 0, 10];
      const offset = 2;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        2,
        offset,
        false,
      );

      assert.strictEqual(result.length, 8);
      assert.approximately(result[0], 0, 1e-6);
      assert.approximately(result[1], 2, 1e-6);
    });

    it('offsets a closed ring', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0];
      const offset = 2;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        2,
        offset,
        true,
      );

      assert.strictEqual(result.length, 10);
      assert.approximately(result[0], 2, 1e-6);
      assert.approximately(result[1], 2, 1e-6);
      assert.approximately(result[8], 2, 1e-6);
      assert.approximately(result[9], 2, 1e-6);
    });

    it('handles negative offset', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10];
      const offset = -2;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        2,
        offset,
        false,
      );

      assert.strictEqual(result.length, 6);
      assert.strictEqual(result[1], -2);
    });

    it('preserves additional dimensions with stride > 2', () => {
      const flatCoords = [0, 0, 100, 10, 0, 200, 10, 10, 300];
      const offset = 2;
      const stride = 3;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        stride,
        offset,
        false,
      );

      assert.strictEqual(result.length, 9);
      assert.strictEqual(result[2], 100);
      assert.strictEqual(result[5], 200);
      assert.strictEqual(result[8], 300);
    });

    it('uses provided destination array', () => {
      const flatCoords = [0, 0, 10, 0];
      const offset = 2;
      const stride = 2;
      const dest = [];
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        stride,
        offset,
        false,
        dest,
      );

      assert.strictEqual(result, dest);
      assert.strictEqual(dest.length, 4);
    });

    it('handles different destination stride', () => {
      const flatCoords = [0, 0, 10, 0];
      const offset = 2;
      const stride = 2;
      const dest = [];
      const destinationStride = 3;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        stride,
        offset,
        false,
        dest,
        destinationStride,
      );

      assert.strictEqual(result.length, 6);
      assert.strictEqual(result[0], 0);
      assert.strictEqual(result[1], 2);
      assert.strictEqual(result[3], 10);
      assert.strictEqual(result[4], 2);
    });

    it('handles empty line string', () => {
      const flatCoords = [];
      const offset = 2;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        2,
        offset,
        false,
      );

      assert.strictEqual(result.length, 0);
    });

    it('handles single point', () => {
      const flatCoords = [5, 5];
      const offset = 2;
      const stride = 2;
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        stride,
        offset,
        false,
      );

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0], 5);
      assert.strictEqual(result[1], 7);
    });
  });

  describe('removeOffsetCycles', () => {
    it('returns empty array unchanged', () => {
      const coords = [];
      const result = removeOffsetCycles(coords, 2);

      assert.strictEqual(result.length, 0);
      assert.strictEqual(result, coords);
    });

    it('returns line without intersections unchanged', () => {
      // Simple line: (0,0) -> (10,0) -> (10,10) -> (0,10)
      const coords = [0, 0, 10, 0, 10, 10, 0, 10];
      const original = [...coords];
      const result = removeOffsetCycles(coords, 2);

      assert.deepEqual(result, original);
    });

    it('handles minimal input with insufficient points', () => {
      // Only 2 points - can't form a loop
      const coords = [0, 0, 10, 10];
      const result = removeOffsetCycles(coords, 2);

      assert.deepEqual(result, coords);
    });

    it('removes actual self-intersecting loop (bowtie shape)', () => {
      // Create a bowtie/figure-8 shape where two segments intersect
      // Segment 1: (0,0) to (10,10)
      // Segment 2: (10,0) to (0,10)
      // These intersect at (5,5) with t=0.5, u=0.5 - valid intersection
      const coords = [0, 0, 10, 10, 10, 0, 0, 10];
      const result = removeOffsetCycles(coords, 2);

      assert.strictEqual(result, coords);
      assert.strictEqual(result.length, 6);
      assert.strictEqual(result[0], 0);
      assert.strictEqual(result[1], 0);
      assert.strictEqual(result[2], 5);
      assert.strictEqual(result[3], 5);
      assert.strictEqual(result[4], 0);
      assert.strictEqual(result[5], 10);
    });

    it('preserves additional dimensions with stride > 2', () => {
      // 3D coordinates: (0,0,100) -> (10,10,200) -> (10,0,300) -> (0,10,400)
      const coords = [0, 0, 100, 10, 10, 200, 10, 0, 300, 0, 10, 400];
      const result = removeOffsetCycles(coords, 3);

      assert.strictEqual(result[2], 100);
    });

    it('removes two separate self-intersecting loops in longer path', () => {
      // Create a path with two figure-8 loops separated by a transition point
      // First bowtie: (0,0) → (10,10) → (10,0) → (0,10) [intersects]
      // Transition point: (5,15)
      // Second bowtie: (0,20) → (10,30) → (10,20) → (0,30) [intersects]
      const coords = [
        0, 0, 10, 10, 10, 0, 0, 10, 5, 15, 0, 20, 10, 30, 10, 20, 0, 30,
      ];
      const result = removeOffsetCycles(coords, 2);

      assert.strictEqual(result, coords);
      assert.strictEqual(result.length, 14);

      assert.strictEqual(result[0], 0);
      assert.strictEqual(result[1], 0);
      assert.strictEqual(result[2], 5);
      assert.strictEqual(result[3], 5);

      assert.strictEqual(result[8], 0);
      assert.strictEqual(result[9], 20);
      assert.strictEqual(result[10], 5);
      assert.strictEqual(result[11], 25);
      assert.strictEqual(result[12], 0);
      assert.strictEqual(result[13], 30);
    });
  });
});
