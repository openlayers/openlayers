import expect from '../../../expect.js';
import {matchingChunk} from '../../../../../src/ol/geom/flat/straightchunk.js';

describe('ol/geom/flat/straightchunk.js', function () {
  describe('matchingChunk', function () {
    describe('single segment with stride == 3', function () {
      const flatCoords = [0, 0, 42, 1, 1, 42];
      const stride = 3;

      it('returns whole line with angle delta', function () {
        const got = matchingChunk(Math.PI / 4, flatCoords, 0, 6, stride);
        expect(got).to.eql([0, 6]);
      });

      it('returns whole line with zero angle delta', function () {
        const got = matchingChunk(0, flatCoords, 0, 6, stride);
        expect(got).to.eql([0, 6]);
      });
    });

    describe('short line string', function () {
      const flatCoords = [0, 0, 1, 0, 1, 1, 0, 1];
      const stride = 2;

      it('returns whole line if straight enough', function () {
        const got = matchingChunk(Math.PI, flatCoords, 0, 8, stride);
        expect(got).to.eql([0, 8]);
      });

      it('returns first matching chunk if all chunk lengths are the same', function () {
        const got = matchingChunk(Math.PI / 4, flatCoords, 0, 8, stride);
        expect(got).to.eql([0, 4]);
      });
    });

    describe('longer line string', function () {
      const flatCoords = [
        0, 0, 1, 0, 1, 1, 0, 1, 0, -1, -1, -1, -1, 0, -1, 2, -2, 4,
      ];
      const stride = 2;

      it('returns stright chunk from within the linestring', function () {
        const got = matchingChunk(0, flatCoords, 0, 18, stride);
        expect(got).to.eql([10, 16]);
      });

      it('returns long chunk at the end if angle and length within threshold', function () {
        const got = matchingChunk(Math.PI / 4, flatCoords, 0, 18, stride);
        expect(got).to.eql([10, 18]);
      });
    });
  });
});
