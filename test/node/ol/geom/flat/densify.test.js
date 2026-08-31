import {assert} from 'chai';
import {densifyFlatCoordinates} from '../../../../../src/ol/geom/flat/densify.js';

describe('ol/geom/flat/densify', () => {
  it('inserts vertices on long segments', () => {
    const dense = densifyFlatCoordinates([0, 0, 10, 0], 4);
    assert.isAbove(dense.length, 4);
    assert.strictEqual(dense[0], 0);
    assert.strictEqual(dense[dense.length - 2], 10);
  });

  it('does not densify antimeridian-spanning chords', () => {
    const dense = densifyFlatCoordinates([170, 0, -170, 0], 4, 20);
    assert.deepEqual(dense, [170, 0, -170, 0]);
  });
});
