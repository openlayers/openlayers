import {deduplicateCoordinates} from '../../../../../src/ol/geom/flat/deduplicate.js';
import expect from '../../../expect.js';

describe('ol/geom/flat/deduplicate.js', () => {
  describe('deduplicateCoordinates', () => {
    it('removes duplicate consecutive coordinates inside of the line string', () => {
      const flatCoords = [0, 10, 5, 10, 5, 10, 5, 10, 10, 10];
      const result = deduplicateCoordinates(flatCoords, 2);

      // Duplicate consecutive coordinates should have been removed
      expect(result).to.eql([0, 10, 5, 10, 10, 10]);
    });

    it('handles line with duplicate at start', () => {
      const flatCoords = [0, 0, 0, 0, 10, 0, 10, 10];
      const result = deduplicateCoordinates(flatCoords, 2);
      expect(result).to.eql([0, 0, 10, 0, 10, 10]);
    });

    it('handles line with duplicate at end', () => {
      const flatCoords = [0, 0, 10, 0, 10, 10, 10, 10];
      const result = deduplicateCoordinates(flatCoords, 2);
      expect(result).to.eql([0, 0, 10, 0, 10, 10]);
    });

    it('handles line string with all duplicate coordinates', () => {
      const flatCoords = [5, 5, 5, 5, 5, 5];
      const result = deduplicateCoordinates(flatCoords, 2);

      // Just one point should be left
      expect(result).to.eql([5, 5]);
    });

    it('handles an empty line', () => {
      const flatCoords = [];
      const result = deduplicateCoordinates(flatCoords, 2);

      expect(result.length).to.be(0);
    });

    it('can write the result in the same array as the provided source coordinates array', () => {
      const flatCoords = [0, 0, 0, 0, 10, 0, 10, 10];
      const result = deduplicateCoordinates(flatCoords, 2, flatCoords);

      // Just one point should be left
      expect(result).to.eql([0, 0, 10, 0, 10, 10]);
      expect(flatCoords).to.eql([0, 0, 10, 0, 10, 10]);
    });

    it('handles a line string with no duplicates', () => {
      const flatCoords = [0, 0, 1, 1, 2, 2, 3, 3];
      const result = deduplicateCoordinates(flatCoords, 2);

      // Nothing should be removed
      expect(result).to.eql([0, 0, 1, 1, 2, 2, 3, 3]);
    });

    it('handles a single coordinate', () => {
      const flatCoords = [5, 5];
      const result = deduplicateCoordinates(flatCoords, 2);

      // A single coordinate should be returned as-is
      expect(result).to.eql([5, 5]);
    });

    it('handles two identical coordinates', () => {
      const flatCoords = [3, 7, 3, 7];
      const result = deduplicateCoordinates(flatCoords, 2);

      expect(result).to.eql([3, 7]);
    });

    it('handles two different coordinates', () => {
      const flatCoords = [0, 0, 1, 1];
      const result = deduplicateCoordinates(flatCoords, 2);

      expect(result).to.eql([0, 0, 1, 1]);
    });

    it('only removes consecutive duplicates, not non-consecutive ones', () => {
      // (0,0) appears at start and end but should NOT be removed since they are not consecutive
      const flatCoords = [0, 0, 5, 5, 0, 0];
      const result = deduplicateCoordinates(flatCoords, 2);

      expect(result).to.eql([0, 0, 5, 5, 0, 0]);
    });

    it('handles 3D coordinates with stride 3', () => {
      const flatCoords = [0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2];
      const result = deduplicateCoordinates(flatCoords, 3);

      expect(result).to.eql([0, 0, 0, 1, 1, 1, 2, 2, 2]);
    });

    it('does not consider coordinates duplicate if only some components match (stride 3)', () => {
      // Second and third tuples differ only in z - should not be treated as duplicates
      const flatCoords = [0, 0, 0, 1, 1, 1, 1, 1, 2];
      const result = deduplicateCoordinates(flatCoords, 3);

      expect(result).to.eql([0, 0, 0, 1, 1, 1, 1, 1, 2]);
    });

    it('handles multiple separate runs of duplicates', () => {
      const flatCoords = [0, 0, 0, 0, 5, 5, 5, 5, 10, 10, 10, 10];
      const result = deduplicateCoordinates(flatCoords, 2);

      expect(result).to.eql([0, 0, 5, 5, 10, 10]);
    });

    it('writes result into a provided destination array', () => {
      const flatCoords = [0, 0, 0, 0, 10, 10];
      const dest = [];
      const result = deduplicateCoordinates(flatCoords, 2, dest);

      expect(result).to.eql([0, 0, 10, 10]);
      // result and dest should be the same object
      expect(result).to.be(dest);
    });

    it('trims the destination array to the correct length when dest is longer than the result', () => {
      const flatCoords = [1, 2, 1, 2, 3, 4];
      const dest = [9, 9, 9, 9, 9, 9, 9, 9]; // pre-populated with extra values
      deduplicateCoordinates(flatCoords, 2, dest);

      // dest should be trimmed to only contain the deduplicated result
      expect(dest).to.eql([1, 2, 3, 4]);
    });
  });
});
