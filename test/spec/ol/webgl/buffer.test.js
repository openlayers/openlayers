import WebGLArrayBuffer, {getArrayClassForType} from '../../../../src/ol/webgl/Buffer.js';
import {
  ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER,
  STATIC_DRAW,
  STREAM_DRAW
} from '../../../../src/ol/webgl.js';


describe('ol.webgl.Buffer', () => {

  describe('constructor', () => {

    test('sets the default usage when not specified', () => {
      const b = new WebGLArrayBuffer(ARRAY_BUFFER);
      expect(b.getUsage()).toBe(STATIC_DRAW);
    });

    test('sets the given usage when specified', () => {
      const b = new WebGLArrayBuffer(ARRAY_BUFFER, STREAM_DRAW);
      expect(b.getUsage()).toBe(STREAM_DRAW);
    });

    test('raises an error if an incorrect type is used', done => {
      try {
        new WebGLArrayBuffer(1234);
      } catch (e) {
        done();
      }
      done(true);
    });
  });

  describe('#getArrayClassForType', () => {
    test('returns the correct typed array constructor', () => {
      expect(getArrayClassForType(ARRAY_BUFFER)).toBe(Float32Array);
      expect(getArrayClassForType(ELEMENT_ARRAY_BUFFER)).toBe(Uint32Array);
    });
  });

  describe('populate methods', () => {

    let b;
    beforeEach(() => {
      b = new WebGLArrayBuffer(ARRAY_BUFFER);
    });

    test('initializes the array using a size', () => {
      b.ofSize(12);
      expect(b.getArray().length).toBe(12);
      expect(b.getArray()[0]).toBe(0);
      expect(b.getArray()[11]).toBe(0);
    });

    test('initializes the array using an array', () => {
      b.fromArray([1, 2, 3, 4, 5]);
      expect(b.getArray().length).toBe(5);
      expect(b.getArray()[0]).toBe(1);
      expect(b.getArray()[1]).toBe(2);
      expect(b.getArray()[2]).toBe(3);
      expect(b.getArray()[3]).toBe(4);
      expect(b.getArray()[4]).toBe(5);
    });

    test('initializes the array using a size', () => {
      const a = Float32Array.of(1, 2, 3, 4, 5);
      b.fromArrayBuffer(a.buffer);
      expect(b.getArray().length).toBe(5);
      expect(b.getArray()[0]).toBe(1);
      expect(b.getArray()[1]).toBe(2);
      expect(b.getArray()[2]).toBe(3);
      expect(b.getArray()[3]).toBe(4);
      expect(b.getArray()[4]).toBe(5);
    });

  });

  describe('#getSize', () => {
    let b;
    beforeEach(() => {
      b = new WebGLArrayBuffer(ARRAY_BUFFER);
    });

    test('returns 0 when the buffer array is not initialized', () => {
      expect(b.getSize()).toBe(0);
    });

    test('returns the size of the array otherwise', () => {
      b.ofSize(12);
      expect(b.getSize()).toBe(12);
    });

  });

});
