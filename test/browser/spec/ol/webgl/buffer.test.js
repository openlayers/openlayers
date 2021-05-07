import WebGLArrayBuffer, {
  getArrayClassForType,
} from '../../../../../src/ol/webgl/Buffer.js';
import {
  ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER,
  STATIC_DRAW,
  STREAM_DRAW,
} from '../../../../../src/ol/webgl.js';

describe('ol.webgl.Buffer', function () {
  describe('constructor', function () {
    it('sets the default usage when not specified', function () {
      const b = new WebGLArrayBuffer(ARRAY_BUFFER);
      expect(b.getUsage()).to.be(STATIC_DRAW);
    });

    it('sets the given usage when specified', function () {
      const b = new WebGLArrayBuffer(ARRAY_BUFFER, STREAM_DRAW);
      expect(b.getUsage()).to.be(STREAM_DRAW);
    });

    it('raises an error if an incorrect type is used', function (done) {
      try {
        new WebGLArrayBuffer(1234);
      } catch (e) {
        done();
      }
      done(true);
    });
  });

  describe('#getArrayClassForType', function () {
    it('returns the correct typed array constructor', function () {
      expect(getArrayClassForType(ARRAY_BUFFER)).to.be(Float32Array);
      expect(getArrayClassForType(ELEMENT_ARRAY_BUFFER)).to.be(Uint32Array);
    });
  });

  describe('populate methods', function () {
    let b;
    beforeEach(function () {
      b = new WebGLArrayBuffer(ARRAY_BUFFER);
    });

    it('initializes the array using a size', function () {
      b.ofSize(12);
      expect(b.getArray().length).to.be(12);
      expect(b.getArray()[0]).to.be(0);
      expect(b.getArray()[11]).to.be(0);
    });

    it('initializes the array using an array', function () {
      b.fromArray([1, 2, 3, 4, 5]);
      expect(b.getArray().length).to.be(5);
      expect(b.getArray()[0]).to.be(1);
      expect(b.getArray()[1]).to.be(2);
      expect(b.getArray()[2]).to.be(3);
      expect(b.getArray()[3]).to.be(4);
      expect(b.getArray()[4]).to.be(5);
    });

    it('initializes the array using a size', function () {
      const a = Float32Array.of(1, 2, 3, 4, 5);
      b.fromArrayBuffer(a.buffer);
      expect(b.getArray().length).to.be(5);
      expect(b.getArray()[0]).to.be(1);
      expect(b.getArray()[1]).to.be(2);
      expect(b.getArray()[2]).to.be(3);
      expect(b.getArray()[3]).to.be(4);
      expect(b.getArray()[4]).to.be(5);
    });
  });

  describe('#getSize', function () {
    let b;
    beforeEach(function () {
      b = new WebGLArrayBuffer(ARRAY_BUFFER);
    });

    it('returns 0 when the buffer array is not initialized', function () {
      expect(b.getSize()).to.be(0);
    });

    it('returns the size of the array otherwise', function () {
      b.ofSize(12);
      expect(b.getSize()).to.be(12);
    });
  });
});
