import {
  create,
  fromTransform,
  reset,
  rotate,
  scale,
  translation,
} from '../../../../src/ol/vec/mat4.js';
import expect from '../../expect.js';

describe('ol/vec/mat4.js', function () {
  describe('create()', function () {
    it('returns the expected matrix', function () {
      expect(create()).to.eql([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });
  });

  describe('fromTransform()', function () {
    it('sets the expected transform on the matrix', function () {
      const transform = [1, 2, 3, 4, 5, 6];
      const result = create();
      expect(fromTransform(result, transform)).to.eql([
        1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1,
      ]);
      expect(result).to.eql([1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1]);
    });
  });

  describe('reset()', function () {
    it('resets the given matrix, returning the result', function () {
      const matrix = translation(12, 34, 56);
      const result = reset(matrix);
      expect(matrix).to.eql([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      expect(result).to.eql([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });
  });

  describe('rotate()', function () {
    it('computes the correct matrix (no rotation)', function () {
      const matrix = translation(12, 34, 0);
      const result = rotate(matrix, 0);
      expect(result).to.eql(translation(12, 34, 0));
    });
    it('computes the correct matrix', function () {
      const angle = 123;
      const matrix = scale(translation(12, 34, 0), 10, 20, 1);
      const result = rotate(matrix, angle);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      expect(result).to.eql([
        cos * 10,
        -sin * 20,
        0,
        0,
        sin * 10,
        cos * 20,
        0,
        0,
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
