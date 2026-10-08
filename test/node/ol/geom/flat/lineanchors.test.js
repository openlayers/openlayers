import {assert} from 'chai';
import {lineAnchors} from '../../../../../src/ol/geom/flat/lineanchors.js';

describe('ol/geom/flat/lineanchors.js', function () {
  it('computes anchors with rotation for an exact multiple of the chunk length', function () {
    const flatCoordinates = [0, 0, 20, 0];
    const result = lineAnchors(
      10,
      flatCoordinates,
      0,
      flatCoordinates.length,
      2,
      true,
    );
    assert.deepEqual(result, [5, 0, 0, 15, 0, 0]);
  });

  it('computes anchors without rotation when withRotation is false', function () {
    const flatCoordinates = [0, 0, 20, 0];
    const result = lineAnchors(
      10,
      flatCoordinates,
      0,
      flatCoordinates.length,
      2,
      false,
    );
    assert.deepEqual(result, [5, 0, 15, 0]);
  });

  it('evens out the spacing when the length is not an exact multiple of the chunk length', function () {
    const flatCoordinates = [0, 0, 25, 0];
    const result = lineAnchors(
      10,
      flatCoordinates,
      0,
      flatCoordinates.length,
      2,
      false,
    );
    assert.lengthOf(result, 6);
    const expected = [25 / 6, 0, 25 / 2, 0, (25 * 5) / 6, 0];
    result.forEach((value, i) => assert.closeTo(value, expected[i], 1e-9));
  });

  it('returns a single anchor at the midpoint for an infinite chunk length', function () {
    const flatCoordinates = [0, 0, 0, 10];
    const result = lineAnchors(
      Infinity,
      flatCoordinates,
      0,
      flatCoordinates.length,
      2,
      true,
    );
    // the y axis is flipped between map coordinates and canvas pixels
    assert.deepEqual(result, [0, 5, -Math.PI / 2]);
  });

  it('computes one anchor per edge for a closed ring', function () {
    const flatCoordinates = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0];
    const result = lineAnchors(
      10,
      flatCoordinates,
      0,
      flatCoordinates.length,
      2,
      true,
    );
    assert.deepEqual(result, [
      5,
      0,
      0,
      10,
      5,
      -Math.PI / 2,
      5,
      10,
      Math.PI,
      0,
      5,
      Math.PI / 2,
    ]);
  });

  it('follows the tangent of a chunk spanning multiple original vertices', function () {
    const flatCoordinates = [0, 0, 10, 0, 10, 10];
    const result = lineAnchors(
      10,
      flatCoordinates,
      0,
      flatCoordinates.length,
      2,
      true,
    );
    assert.deepEqual(result, [5, 0, 0, 10, 5, -Math.PI / 2]);
  });
});
