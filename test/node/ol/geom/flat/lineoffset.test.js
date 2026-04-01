import {
  offsetLineString,
  removeOffsetCycles,
} from '../../../../../src/ol/geom/flat/lineoffset.js';
import expect from '../../../expect.js';

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

      expect(result.length).to.be(8);
      // First point should be offset perpendicular to first segment
      expect(result[0]).to.roughlyEqual(0, 1e-6);
      expect(result[1]).to.roughlyEqual(2, 1e-6);
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

      expect(result.length).to.be(10);
      // For closed ring, each vertex is offset considering its neighbors in the ring
      // First point should be offset from (0,0)
      expect(result[0]).to.roughlyEqual(2, 1e-6);
      expect(result[1]).to.roughlyEqual(2, 1e-6);
      // Last point is also (0,0), should be offset same as the first point as it closes the ring
      expect(result[8]).to.roughlyEqual(2, 1e-6);
      expect(result[9]).to.roughlyEqual(2, 1e-6);
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

      expect(result.length).to.be(6);
      expect(result[1]).to.be(-2);
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
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        stride,
        offset,
        false,
        dest,
      );

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
        0,
        flatCoords.length,
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
      const result = offsetLineString(
        flatCoords,
        0,
        flatCoords.length,
        2,
        offset,
        false,
      );

      expect(result.length).to.be(0);
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

      expect(result.length).to.be(2);
      expect(result[0]).to.be(5);
      expect(result[1]).to.be(7);
    });
  });

  describe('removeOffsetCycles', () => {
    it('returns empty array unchanged', () => {
      const coords = [];
      const result = removeOffsetCycles(coords, 2);

      expect(result.length).to.be(0);
      expect(result).to.be(coords);
    });

    it('returns line without intersections unchanged', () => {
      // Simple line: (0,0) -> (10,0) -> (10,10) -> (0,10)
      const coords = [0, 0, 10, 0, 10, 10, 0, 10];
      const original = [...coords];
      const result = removeOffsetCycles(coords, 2);

      expect(result).to.eql(original);
    });

    it('handles minimal input with insufficient points', () => {
      // Only 2 points - can't form a loop
      const coords = [0, 0, 10, 10];
      const result = removeOffsetCycles(coords, 2);

      expect(result).to.eql(coords);
    });

    it('removes actual self-intersecting loop (bowtie shape)', () => {
      // Create a bowtie/figure-8 shape where two segments intersect
      // Segment 1: (0,0) to (10,10)
      // Segment 2: (10,0) to (0,10)
      // These intersect at (5,5) with t=0.5, u=0.5 - valid intersection
      const coords = [0, 0, 10, 10, 10, 0, 0, 10];
      const result = removeOffsetCycles(coords, 2);

      // The function modifies the array in-place
      expect(result).to.be(coords);
      // After cycle removal, both segments should meet at intersection point (5,5)
      // Result should be: [0, 0, 5, 5, 0, 10]
      expect(result.length).to.be(6);
      expect(result[0]).to.be(0); // First point x
      expect(result[1]).to.be(0); // First point y
      expect(result[2]).to.be(5); // Second point x (intersection)
      expect(result[3]).to.be(5); // Second point y (intersection)
      expect(result[4]).to.be(0); // Third point x
      expect(result[5]).to.be(10); // Third point y
    });

    it('preserves additional dimensions with stride > 2', () => {
      // 3D coordinates: (0,0,100) -> (10,10,200) -> (10,0,300) -> (0,10,400)
      const coords = [0, 0, 100, 10, 10, 200, 10, 0, 300, 0, 10, 400];
      const result = removeOffsetCycles(coords, 3);

      // Should preserve Z values of remaining points
      expect(result[2]).to.be(100); // Z of first point
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

      // Verify both loops are removed: reduced from 9 to 7 coordinates (2 points removed, 1 intersection point added per loop)
      expect(result).to.be(coords);
      expect(result.length).to.be(14);

      expect(result[0]).to.be(0); // First point: x (origin)
      expect(result[1]).to.be(0); // First point: y (origin)
      expect(result[2]).to.be(5); // First loop intersection point x
      expect(result[3]).to.be(5); // First loop intersection point y

      expect(result[8]).to.be(0); // Start of second loop region: x
      expect(result[9]).to.be(20); // Start of second loop region: y
      expect(result[10]).to.be(5); // Second loop intersection point x
      expect(result[11]).to.be(25); // Second loop intersection point y
      expect(result[12]).to.be(0); // Last segment x
      expect(result[13]).to.be(30); // Last segment y
    });
  });
});
