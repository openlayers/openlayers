import {assert} from 'chai';
import {
  buffer as bufferSize,
  hasArea,
  scale as scaleSize,
  toSize,
} from '../../../../src/ol/size.js';

describe('ol.size', function () {
  describe('buffer()', function () {
    it('buffers a size', function () {
      const size = [50, 75];
      const bufferedSize = bufferSize(size, 20);
      assert.deepEqual(bufferedSize, [90, 115]);
    });

    it('reuses an existing array', function () {
      const reuse = [0, 0];
      const size = [50, 50];
      const bufferedSize = bufferSize(size, 20, reuse);
      assert.equal(bufferedSize, reuse);
    });
  });

  describe('hasArea()', function () {
    it('determines if a size has a positive area', function () {
      assert.equal(hasArea([50, 75]), true);
      assert.equal(hasArea([0, 75]), false);
      assert.equal(hasArea([50, 0]), false);
      assert.equal(hasArea([0, 0]), false);
      assert.equal(hasArea([-1, 75]), false);
      assert.equal(hasArea([50, -1]), false);
      assert.equal(hasArea([-1, -1]), false);
    });
  });

  describe('scale()', function () {
    it('scales a size and rounds the result', function () {
      const size = [50, 75];
      const scaledSize = scaleSize(size, 1.75);
      assert.deepEqual(scaledSize, [88, 131]);
    });

    it('reuses an existing array', function () {
      const reuse = [0, 0];
      const size = [50, 50];
      const scaledSize = scaleSize(size, 1.75, reuse);
      assert.equal(scaledSize, reuse);
    });
  });

  describe('toSize()', function () {
    it('creates a size array from a number', function () {
      const size = toSize(512);
      assert.deepEqual(size, [512, 512]);
    });

    it('reuses an existing array', function () {
      const sizeArray = [0, 0];
      const size = toSize(512, sizeArray);
      assert.equal(size, sizeArray);
    });

    it('returns a size array unaltered', function () {
      const sizeArray = [512, 256];
      let size = toSize(sizeArray);
      assert.equal(size, sizeArray);
      size = toSize(sizeArray, [0, 0]);
      assert.equal(size, sizeArray);
    });
  });
});
