import expect from '../../expect.js';
import {create, fromTransform} from '../../../../src/ol/vec/mat4.js';

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
});
