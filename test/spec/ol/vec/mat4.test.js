import {create, fromTransform} from '../../../../src/ol/vec/mat4.js';


describe('mat4', () => {

  describe('mat4.create()', () => {
    test('returns the expected matrix', () => {
      expect(create()).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    });
  });

  describe('mat4.fromTransform()', () => {
    test('sets the expected transform on the matrix', () => {
      const transform = [1, 2, 3, 4, 5, 6];
      const result = create();
      expect(fromTransform(result, transform)).toEqual([1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1]);
      expect(result).toEqual([1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1]);
    });
  });

});
