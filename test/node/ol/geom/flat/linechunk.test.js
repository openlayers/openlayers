import {lineChunk} from '../../../../../src/ol/geom/flat/linechunk.js';
import expect from '../../../expect.js';

describe('ol/geom/flat/linechunk.js', function () {
  it('works with a single segment geometry longer than the desired chunks', function () {
    const flatCoordinates = [0, 0, 10, 0];
    const result = lineChunk(3, flatCoordinates, 0, flatCoordinates.length, 2);
    expect(result).to.eql([
      [0, 0, 3, 0],
      [3, 0, 6, 0],
      [6, 0, 9, 0],
      [9, 0, 10, 0],
    ]);
  });
  it('works with a single segment geometry shorter than the desired chunks', function () {
    const flatCoordinates = [0, 0, 2, 0];
    const result = lineChunk(3, flatCoordinates, 0, flatCoordinates.length, 2);
    expect(result).to.eql([[0, 0, 2, 0]]);
  });
  it('works with an arbitrary geometry', function () {
    const flatCoordinates = [
      0, 0, 0, 2, 2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 6, 8, 10, 8,
    ];
    const result = lineChunk(3, flatCoordinates, 0, flatCoordinates.length, 2);
    expect(result).to.eql([
      [0, 0, 0, 2, 1, 2],
      [1, 2, 2, 2, 2, 4],
      [2, 4, 4, 4, 4, 5],
      [4, 5, 4, 6, 6, 6],
      [6, 6, 6, 8, 7, 8],
      [7, 8, 10, 8],
    ]);
  });
});
