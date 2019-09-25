import {
  create,
  reset,
  set,
  setFromArray,
  translate,
  scale,
  makeScale,
  rotate,
  multiply,
  compose,
  invert,
  makeInverse,
  apply
} from '../../../src/ol/transform.js';


describe('ol.transform', () => {

  function assertRoughlyEqual(t1, t2) {
    t1.forEach(function(item, index) {
      expect(item).to.roughlyEqual(t2[index], 1e-8);
    });
  }

  describe('create()', () => {
    test('creates an identity transform', () => {
      expect(create()).toEqual([1, 0, 0, 1, 0, 0]);
    });
  });

  describe('reset()', () => {
    test('resets tansform to an identity transform', () => {
      const transform = [1, 2, 3, 4, 5, 6];
      expect(reset(transform)).toEqual([1, 0, 0, 1, 0, 0]);
      expect(transform).toEqual([1, 0, 0, 1, 0, 0]);
    });
  });

  describe('set()', () => {
    test('sets the given values', () => {
      const transform = create();
      expect(set(transform, 1, 2, 3, 4, 5, 6)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(transform).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('setFromArray()', () => {
    test('sets values of 2nd transform on 1st transform', () => {
      const transform1 = create();
      const transform2 = [1, 2, 3, 4, 5, 6];
      expect(setFromArray(transform1, transform2)).toEqual(transform2);
      expect(transform1).toEqual(transform2);
    });
  });

  describe('translate()', () => {
    test('applies translation to a transform', () => {
      const transform = create();
      expect(translate(transform, 3, 4)).toEqual([1, 0, 0, 1, 3, 4]);
      expect(transform).toEqual([1, 0, 0, 1, 3, 4]);
    });
  });

  describe('scale()', () => {
    test('applies scaling to a transform', () => {
      const transform = create();
      expect(scale(transform, 3, 4)).toEqual([3, 0, 0, 4, 0, 0]);
      expect(transform).toEqual([3, 0, 0, 4, 0, 0]);
    });
  });

  describe('makeScale()', () => {
    test('creates a scale transform', () => {
      const target = create();
      makeScale(target, 2, 3);
      expect(target).toEqual([2, 0, 0, 3, 0, 0]);
    });

    test('returns the target', () => {
      const target = create();
      const transform = makeScale(target, 2, 3);
      expect(transform).toBe(target);
    });
  });

  describe('rotate()', () => {
    test('applies rotation to a transform', () => {
      const transform = create();
      assertRoughlyEqual(rotate(transform, Math.PI / 2), [0, 1, -1, 0, 0, 0]);
      assertRoughlyEqual(transform, [0, 1, -1, 0, 0, 0]);
    });
  });

  describe('multiply()', () => {
    test('multiplies two transforms', () => {
      const transform1 = [1, 2, 1, 2, 1, 2];
      const transform2 = [1, 2, 1, 2, 1, 2];
      expect(multiply(transform1, transform2)).toEqual([3, 6, 3, 6, 4, 8]);
      expect(transform1).toEqual([3, 6, 3, 6, 4, 8]);
    });
  });

  describe('compose()', () => {
    test('composes a translate, scale, rotate, translate transform', () => {
      const dx1 = 3;
      const dy1 = 4;
      const sx = 1.5;
      const sy = -1.5;
      const angle = Math.PI / 3;
      const dx2 = -dx1 / 2;
      const dy2 = -dy1 / 2;

      const expected = create();
      translate(expected, dx1, dy1);
      scale(expected, sx, sy);
      rotate(expected, angle);
      translate(expected, dx2, dy2);

      const composed = create();
      const composedReturn = compose(composed, dx1, dy1, sx, sy, angle, dx2, dy2);
      expect(composed).toBe(composedReturn);
      expect(composed).toEqual(expected);
    });
  });

  describe('invert()', () => {
    test('inverts a transform', () => {
      const transform = [1, 1, 1, 2, 2, 0];
      expect(invert(transform)).toEqual([2, -1, -1, 1, -4, 2]);
    });

    test('throws if the transform cannot be inverted', () => {
      const indeterminant = [1, 0, 1, 0, 1, 0];
      expect(function() {
        invert(indeterminant);
      }).toThrow();
    });

    test('modifies the source', () => {
      const source = [1, 1, 1, 2, 2, 0];
      const inverted = invert(source);
      expect(inverted).toEqual([2, -1, -1, 1, -4, 2]);
      expect(source).toBe(inverted);
    });
  });

  describe('makeInverse()', () => {
    test('makes the target the inverse of the source', () => {
      const source = [1, 1, 1, 2, 2, 0];
      const target = [1, 0, 0, 1, 0, 0];
      makeInverse(target, source);
      expect(source).toEqual([1, 1, 1, 2, 2, 0]);
      expect(target).toEqual([2, -1, -1, 1, -4, 2]);
    });

    test('returns the target', () => {
      const source = [1, 1, 1, 2, 2, 0];
      const target = [1, 0, 0, 1, 0, 0];
      const inverted = makeInverse(target, source);
      expect(target).toBe(inverted);
    });
  });

  describe('apply()', () => {
    test('applies a transform to a 2d vector', () => {
      const transform = translate(create(), 2, 3);
      const point = [1, 2];
      expect(apply(transform, point)).toEqual([3, 5]);
      expect(point).toEqual([3, 5]);
    });
  });

});
