import {matchingChunk} from '../../../../../src/ol/geom/flat/straightchunk.js';


describe('ol.geom.flat.straightchunk', () => {

  describe('ol.geom.flat.straightchunk.matchingChunk', () => {

    describe('single segment with stride == 3', () => {
      const flatCoords = [0, 0, 42, 1, 1, 42];
      const stride = 3;

      test('returns whole line with angle delta', () => {
        const got = matchingChunk(Math.PI / 4, flatCoords, 0, 6, stride);
        expect(got).toEqual([0, 6]);
      });

      test('returns whole line with zero angle delta', () => {
        const got = matchingChunk(0, flatCoords, 0, 6, stride);
        expect(got).toEqual([0, 6]);
      });

    });

    describe('short line string', () => {
      const flatCoords = [0, 0, 1, 0, 1, 1, 0, 1];
      const stride = 2;

      test('returns whole line if straight enough', () => {
        const got = matchingChunk(Math.PI, flatCoords, 0, 8, stride);
        expect(got).toEqual([0, 8]);
      });

      test(
        'returns first matching chunk if all chunk lengths are the same',
        () => {
          const got = matchingChunk(Math.PI / 4, flatCoords, 0, 8, stride);
          expect(got).toEqual([0, 4]);
        }
      );

    });

    describe('longer line string', () => {
      const flatCoords = [0, 0, 1, 0, 1, 1, 0, 1, 0, -1, -1, -1, -1, 0, -1, 2, -2, 4];
      const stride = 2;

      test('returns stright chunk from within the linestring', () => {
        const got = matchingChunk(0, flatCoords, 0, 18, stride);
        expect(got).toEqual([10, 16]);
      });

      test(
        'returns long chunk at the end if angle and length within threshold',
        () => {
          const got = matchingChunk(Math.PI / 4, flatCoords, 0, 18, stride);
          expect(got).toEqual([10, 18]);
        }
      );

    });

  });

});
