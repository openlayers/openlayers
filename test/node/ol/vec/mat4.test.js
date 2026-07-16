import {assert} from 'chai';
import {
  create,
  fromTransform,
  reset,
  rotate,
  scale,
  translation,
} from '../../../../src/ol/vec/mat4.js';

describe('ol/vec/mat4.js', function () {
  describe('create()', function () {
    it('returns the expected matrix', function () {
      assert.deepEqual(
        create(),
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      );
    });
  });

  describe('fromTransform()', function () {
    it('sets the expected transform on the matrix', function () {
      const transform = [1, 2, 3, 4, 5, 6];
      const result = create();
      assert.deepEqual(
        fromTransform(result, transform),
        [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1],
      );
      assert.deepEqual(
        result,
        [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1],
      );
    });
  });

  describe('reset()', function () {
    it('resets the given matrix, returning the result', function () {
      const matrix = translation(12, 34, 56);
      const result = reset(matrix);
      assert.deepEqual(
        matrix,
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      );
      assert.deepEqual(
        result,
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      );
    });
  });

  describe('rotate()', function () {
    it('computes the correct matrix (no rotation)', function () {
      const matrix = translation(12, 34, 0);
      const result = rotate(matrix, 0);
      assert.deepEqual(result, translation(12, 34, 0));
    });
    it('computes the correct matrix', function () {
      const angle = 123;
      const matrix = scale(translation(12, 34, 0), 10, 20, 1);
      const result = rotate(matrix, angle);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      assert.deepEqual(result, [
        cos * 10,
        -sin * 20,
        0,
        0,
        sin * 10,
        cos * 20,
        -0,
        -0,
        0,
        0,
        1,
        0,
        12,
        34,
        0,
        1,
      ]);
    });
  });
});
