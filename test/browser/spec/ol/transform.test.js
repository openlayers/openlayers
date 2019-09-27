import {assert} from 'chai';
import {
  apply,
  compose,
  create,
  equivalent,
  invert,
  makeInverse,
  makeScale,
  multiply,
  reset,
  rotate,
  scale,
  set,
  setFromArray,
  toString,
  translate,
} from '../../../../src/ol/transform.js';

describe('ol.transform', function () {
  function assertRoughlyEqual(t1, t2) {
    t1.forEach(function (item, index) {
      assert.approximately(item, t2[index], 1e-8);
    });
  }

  describe('create()', function () {
    it('creates an identity transform', function () {
      assert.deepEqual(create(), [1, 0, 0, 1, 0, 0]);
    });
  });

  describe('reset()', function () {
    it('resets tansform to an identity transform', function () {
      const transform = [1, 2, 3, 4, 5, 6];
      assert.deepEqual(reset(transform), [1, 0, 0, 1, 0, 0]);
      assert.deepEqual(transform, [1, 0, 0, 1, 0, 0]);
    });
  });

  describe('set()', function () {
    it('sets the given values', function () {
      const transform = create();
      assert.deepEqual(set(transform, 1, 2, 3, 4, 5, 6), [1, 2, 3, 4, 5, 6]);
      assert.deepEqual(transform, [1, 2, 3, 4, 5, 6]);
    });
  });

  describe('setFromArray()', function () {
    it('sets values of 2nd transform on 1st transform', function () {
      const transform1 = create();
      const transform2 = [1, 2, 3, 4, 5, 6];
      assert.deepEqual(setFromArray(transform1, transform2), transform2);
      assert.deepEqual(transform1, transform2);
    });
  });

  describe('translate()', function () {
    it('applies translation to a transform', function () {
      const transform = create();
      assert.deepEqual(translate(transform, 3, 4), [1, 0, 0, 1, 3, 4]);
      assert.deepEqual(transform, [1, 0, 0, 1, 3, 4]);
    });
  });

  describe('scale()', function () {
    it('applies scaling to a transform', function () {
      const transform = create();
      assert.deepEqual(scale(transform, 3, 4), [3, 0, 0, 4, 0, 0]);
      assert.deepEqual(transform, [3, 0, 0, 4, 0, 0]);
    });
  });

  describe('makeScale()', function () {
    it('creates a scale transform', function () {
      const target = create();
      makeScale(target, 2, 3);
      assert.deepEqual(target, [2, 0, 0, 3, 0, 0]);
    });

    it('returns the target', function () {
      const target = create();
      const transform = makeScale(target, 2, 3);
      assert.strictEqual(transform, target);
    });
  });

  describe('rotate()', function () {
    it('applies rotation to a transform', function () {
      const transform = create();
      assertRoughlyEqual(rotate(transform, Math.PI / 2), [0, 1, -1, 0, 0, 0]);
      assertRoughlyEqual(transform, [0, 1, -1, 0, 0, 0]);
    });
  });

  describe('multiply()', function () {
    it('multiplies two transforms', function () {
      const transform1 = [1, 2, 1, 2, 1, 2];
      const transform2 = [1, 2, 1, 2, 1, 2];
      assert.deepEqual(multiply(transform1, transform2), [3, 6, 3, 6, 4, 8]);
      assert.deepEqual(transform1, [3, 6, 3, 6, 4, 8]);
    });
  });

  describe('compose()', function () {
    it('composes a translate, scale, rotate, translate transform', function () {
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
      const composedReturn = compose(
        composed,
        dx1,
        dy1,
        sx,
        sy,
        angle,
        dx2,
        dy2,
      );
      assert.equal(composed, composedReturn);
      assert.deepEqual(composed, expected);
    });
  });

  describe('invert()', function () {
    it('inverts a transform', function () {
      const transform = [1, 1, 1, 2, 2, 0];
      assert.deepEqual(invert(transform), [2, -1, -1, 1, -4, 2]);
    });

    it('throws if the transform cannot be inverted', function () {
      const indeterminant = [1, 0, 1, 0, 1, 0];
      assert.throws(function () {
        invert(indeterminant);
      });
    });

    it('modifies the source', function () {
      const source = [1, 1, 1, 2, 2, 0];
      const inverted = invert(source);
      assert.deepEqual(inverted, [2, -1, -1, 1, -4, 2]);
      assert.strictEqual(source, inverted);
    });
  });

  describe('makeInverse()', function () {
    it('makes the target the inverse of the source', function () {
      const source = [1, 1, 1, 2, 2, 0];
      const target = [1, 0, 0, 1, 0, 0];
      makeInverse(target, source);
      assert.deepEqual(source, [1, 1, 1, 2, 2, 0]);
      assert.deepEqual(target, [2, -1, -1, 1, -4, 2]);
    });

    it('returns the target', function () {
      const source = [1, 1, 1, 2, 2, 0];
      const target = [1, 0, 0, 1, 0, 0];
      const inverted = makeInverse(target, source);
      assert.strictEqual(target, inverted);
    });
  });

  describe('apply()', function () {
    it('applies a transform to a 2d vector', function () {
      const transform = translate(create(), 2, 3);
      const point = [1, 2];
      assert.deepEqual(apply(transform, point), [3, 5]);
      assert.deepEqual(point, [3, 5]);
    });
  });
  describe('equivalent()', function () {
    it('compares with value read back from node', function () {
      const mat = toString([1 / 3, 0, 0, 1 / 3, 0, 0]);
      const node = document.createElement('div');
      node.style.transform = mat;
      assert.strictEqual(equivalent(mat, node.style.transform), true);
      const otherMat = toString([1 / 32, 0, 0, 1 / 3, 0, 1]);
      assert.strictEqual(equivalent(mat, otherMat), false);
    });
  });
});
