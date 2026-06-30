import {assert} from 'chai';
import {
  ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER,
  STATIC_DRAW,
  STREAM_DRAW,
} from '../../../../../src/ol/webgl.js';
import WebGLArrayBuffer, {
  getArrayClassForType,
} from '../../../../../src/ol/webgl/Buffer.js';

describe('ol.webgl.Buffer', function () {
  describe('constructor', function () {
    it('sets the default usage when not specified', function () {
      const b = new WebGLArrayBuffer(ARRAY_BUFFER);
      assert.strictEqual(b.getUsage(), STATIC_DRAW);
    });

    it('sets the given usage when specified', function () {
      const b = new WebGLArrayBuffer(ARRAY_BUFFER, STREAM_DRAW);
      assert.strictEqual(b.getUsage(), STREAM_DRAW);
    });

    it('raises an error if an incorrect type is used', () =>
      new Promise((resolve, reject) => {
        try {
          new WebGLArrayBuffer(1234);
        } catch {
          resolve();
          return;
        }
        reject(new Error('expected an error to be raised'));
      }));
  });

  describe('#getArrayClassForType', function () {
    it('returns the correct typed array constructor', function () {
      assert.strictEqual(getArrayClassForType(ARRAY_BUFFER), Float32Array);
      assert.strictEqual(
        getArrayClassForType(ELEMENT_ARRAY_BUFFER),
        Uint32Array,
      );
    });
  });

  describe('populate methods', function () {
    let b;
    beforeEach(function () {
      b = new WebGLArrayBuffer(ARRAY_BUFFER);
    });

    it('initializes the array using a size', function () {
      b.ofSize(12);
      assert.strictEqual(b.getArray().length, 12);
      assert.strictEqual(b.getArray()[0], 0);
      assert.strictEqual(b.getArray()[11], 0);
    });

    it('initializes the array using an array', function () {
      b.fromArray([1, 2, 3, 4, 5]);
      assert.strictEqual(b.getArray().length, 5);
      assert.strictEqual(b.getArray()[0], 1);
      assert.strictEqual(b.getArray()[1], 2);
      assert.strictEqual(b.getArray()[2], 3);
      assert.strictEqual(b.getArray()[3], 4);
      assert.strictEqual(b.getArray()[4], 5);
    });

    it('initializes the array using a size', function () {
      const a = Float32Array.of(1, 2, 3, 4, 5);
      b.fromArrayBuffer(a.buffer);
      assert.strictEqual(b.getArray().length, 5);
      assert.strictEqual(b.getArray()[0], 1);
      assert.strictEqual(b.getArray()[1], 2);
      assert.strictEqual(b.getArray()[2], 3);
      assert.strictEqual(b.getArray()[3], 4);
      assert.strictEqual(b.getArray()[4], 5);
    });
  });

  describe('#getSize', function () {
    let b;
    beforeEach(function () {
      b = new WebGLArrayBuffer(ARRAY_BUFFER);
    });

    it('returns 0 when the buffer array is not initialized', function () {
      assert.strictEqual(b.getSize(), 0);
    });

    it('returns the size of the array otherwise', function () {
      b.ofSize(12);
      assert.strictEqual(b.getSize(), 12);
    });
  });
});
