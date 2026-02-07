import {
  offsetLineString,
  offsetLineVertex,
} from '../../../../../src/ol/geom/flat/lineoffset.js';
import expect from '../../../expect.js';

describe('ol/geom/flat/lineoffset.js', () => {
  describe('offsetLineVertex', () => {
    // With "to the right" we mean visually to the right. This function is mostly meant to work with pixel values, and pixel y axis goes from top to bottom, so visually to the right means technically to the left.
    it('offsets straight vertical line to the right when called with a positive offset value', () => {
      const [x, y] = offsetLineVertex(10, 10, 10, 20, 10, 0, 5);
      expect(x).to.be(15);
      expect(y).to.be(10);
    });

    it('offsets straight vertical line to the left when called with a negative offset value', () => {
      const [x, y] = offsetLineVertex(10, 10, 10, 20, 10, 0, -5);
      expect(x).to.be(5);
      expect(y).to.be(10);
    });

    it('offsets a vertex in the direction of the bisector between 2 segments', () => {
      const [x, y] = offsetLineVertex(10, 10, 0, 20, 20, 20, 5);
      expect(x).to.be(10);
      expect(y).to.roughlyEqual(10 + Math.sqrt(5 * 5 + 5 * 5), 1e-6);
    });

    it('offsets a vertex with only next vertex given', () => {
      const [x, y] = offsetLineVertex(10, 10, undefined, undefined, 20, 10, 5);
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('offsets a vertex with only previous vertex given', () => {
      const [x, y] = offsetLineVertex(10, 10, 0, 10, undefined, undefined, 5);
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('handles horizontal line offset', () => {
      const [x, y] = offsetLineVertex(10, 10, 0, 10, 20, 10, 5);
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('handles diagonal line offset', () => {
      const [x, y] = offsetLineVertex(10, 10, 0, 0, 20, 20, 5);
      const expectedOffset = 5 / Math.sqrt(2);
      expect(x).to.roughlyEqual(10 - expectedOffset, 1e-6);
      expect(y).to.roughlyEqual(10 + expectedOffset, 1e-6);
    });

    it('handles 90 degree corner', () => {
      const [x, y] = offsetLineVertex(10, 10, 0, 10, 10, 20, 5);
      expect(x).to.roughlyEqual(5, 1e-6);
      expect(y).to.roughlyEqual(15, 1e-6);
    });

    it('handles sharp angle by falling back to segment direction with just offset distance', () => {
      // Nearly 360 degree turn - should use segment direction fallback
      const [x, y] = offsetLineVertex(10, 10, 0, 10, 0, 10.01, 5);
      expect(x).to.be.roughlyEqual(15, 1e-6);
      expect(y).to.be.roughlyEqual(10, 1e-6);
    });

    it('handles join angle near 0° (straight line continuation)', () => {
      // Three points in a straight line - join angle should be ~0°
      // This tests potential division by zero when sin(angle/2) ≈ 0
      const [x, y] = offsetLineVertex(10, 10, 0, 10, 20, 10, 5);
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('handles vertex with same coordinates as previous vertex', () => {
      // When prevX/prevY equal current x/y, should use next vertex for direction
      const [x, y] = offsetLineVertex(10, 10, 10, 10, 20, 10, 5);
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('handles vertex with same coordinates as next vertex', () => {
      // When nextX/nextY equal current x/y, should use previous vertex for direction
      const [x, y] = offsetLineVertex(10, 10, 0, 10, 10, 10, 5);
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('handles vertex with no valid neighbors (defaults to horizontal)', () => {
      const [x, y] = offsetLineVertex(
        10,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        5,
      );
      // Default direction is horizontal (1,0), rotated 90° gives normal (0,1)
      // So offset goes perpendicular: downward in standard coords
      expect(x).to.be(10);
      expect(y).to.be(15);
    });

    it('handles zero offset', () => {
      const [x, y] = offsetLineVertex(10, 10, 0, 10, 20, 10, 0);
      expect(x).to.be(10);
      expect(y).to.be(10);
    });
  });

  describe('offsetLineString', () => {
    it('offsets a simple square', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10, 0, 10];
      const offset = 2;
      const result = offsetLineString(flatCoords, 2, offset, false);

      expect(result.length).to.be(8);
      // First point should be offset perpendicular to first segment
      expect(result[0]).to.roughlyEqual(0, 1e-6);
      expect(result[1]).to.roughlyEqual(2, 1e-6);
    });

    it('offsets a closed ring', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0];
      const offset = 2;
      const result = offsetLineString(flatCoords, 2, offset, true);

      expect(result.length).to.be(10);
      // For closed ring, each vertex is offset considering its neighbors in the ring
      // First point should be offset from (0,0)
      expect(result[0]).to.roughlyEqual(2, 1e-6);
      expect(result[1]).to.roughlyEqual(2, 1e-6);
      // Last point is also (0,0), should be offset same as the first point as it closes the ring
      expect(result[8]).to.roughlyEqual(2, 1e-6);
      expect(result[9]).to.roughlyEqual(2, 1e-6);
    });

    it('handles line string with duplicate consecutive coordinates', () => {
      // This tests that the algorithm doesn't crash with equal coordinates
      const flatCoords = [0, 10, 5, 10, 5, 10, 5, 10, 10, 10];
      const offset = 2;
      const result = offsetLineString(flatCoords, 2, offset, false);

      expect(result.length).to.be(6);
      // Duplicate consecutive coordinates should have been removed
      expect(result[0]).to.be(0);
      expect(result[1]).to.be(12);
      expect(result[2]).to.be(5);
      expect(result[3]).to.be(12);
      expect(result[4]).to.be(10);
      expect(result[5]).to.be(12);
    });

    it('handles line string with all duplicate coordinates', () => {
      const flatCoords = [5, 5, 5, 5, 5, 5];
      const offset = 2;
      const result = offsetLineString(flatCoords, 2, offset, false);

      expect(result.length).to.be(2);
      // All points should have same offset (default horizontal direction)
      expect(result[0]).to.be(5);
      expect(result[1]).to.be(7);
    });

    it('handles negative offset', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10];
      const offset = -2;
      const result = offsetLineString(flatCoords, 2, offset, false);

      expect(result.length).to.be(6);
      expect(result[1]).to.be(-2);
    });

    it('preserves additional dimensions with stride > 2', () => {
      const flatCoords = [0, 0, 100, 10, 0, 200, 10, 10, 300];
      const offset = 2;
      const stride = 3;
      const result = offsetLineString(flatCoords, stride, offset, false);

      expect(result.length).to.be(9);
      // Check that Z values are preserved
      expect(result[2]).to.be(100);
      expect(result[5]).to.be(200);
      expect(result[8]).to.be(300);
    });

    it('uses provided destination array', () => {
      const flatCoords = [0, 0, 10, 0];
      const offset = 2;
      const stride = 2;
      const dest = [];
      const result = offsetLineString(flatCoords, stride, offset, false, dest);

      expect(result).to.be(dest);
      expect(dest.length).to.be(4);
    });

    it('handles different destination stride', () => {
      const flatCoords = [0, 0, 10, 0];
      const offset = 2;
      const stride = 2;
      const dest = [];
      const destinationStride = 3;
      const result = offsetLineString(
        flatCoords,
        stride,
        offset,
        false,
        dest,
        destinationStride,
      );

      expect(result.length).to.be(6);
      // X, Y coordinates should be offset
      expect(result[0]).to.be(0);
      expect(result[1]).to.be(2);
      expect(result[3]).to.be(10);
      expect(result[4]).to.be(2);
    });

    it('handles empty line string', () => {
      const flatCoords = [];
      const offset = 2;
      const result = offsetLineString(flatCoords, 2, offset, false);

      expect(result.length).to.be(0);
    });

    it('handles single point', () => {
      const flatCoords = [5, 5];
      const offset = 2;
      const stride = 2;
      const result = offsetLineString(flatCoords, stride, offset, false);

      expect(result.length).to.be(2);
      expect(result[0]).to.be(5);
      expect(result[1]).to.be(7);
    });

    it('handles line with duplicate at start', () => {
      const flatCoords = [0, 0, 0, 0, 10, 0, 10, 10];
      const offset = 5;
      const stride = 2;
      const result = offsetLineString(flatCoords, stride, offset, false);

      expect(result.length).to.be(6);
      expect(result[0]).to.roughlyEqual(0, 1e-6);
      expect(result[1]).to.roughlyEqual(5, 1e-6);
      expect(result[2]).to.roughlyEqual(5, 1e-6);
      expect(result[3]).to.roughlyEqual(5, 1e-6);
      expect(result[4]).to.roughlyEqual(5, 1e-6);
      expect(result[5]).to.roughlyEqual(10, 1e-6);
    });

    it('handles line with duplicate at end', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10, 10, 10];
      const offset = 5;
      const stride = 2;
      const result = offsetLineString(flatCoords, stride, offset, false);

      expect(result.length).to.be(6);
      expect(result[0]).to.roughlyEqual(0, 1e-6);
      expect(result[1]).to.roughlyEqual(5, 1e-6);
      expect(result[2]).to.roughlyEqual(5, 1e-6);
      expect(result[3]).to.roughlyEqual(5, 1e-6);
      expect(result[4]).to.roughlyEqual(5, 1e-6);
      expect(result[5]).to.roughlyEqual(10, 1e-6);
    });
  });
});
