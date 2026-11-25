import {assert} from 'chai';
import WebGLHelper from '../../../../../src/ol/webgl/Helper.js';
import WebGLRenderTarget from '../../../../../src/ol/webgl/RenderTarget.js';
import {assertArrayLikeEqual} from '../../../../util/equal.js';

describe('ol.webgl.RenderTarget', function () {
  let helper, testImage_4x4;

  beforeEach(function () {
    helper = new WebGLHelper();

    const canvas = document.createElement('canvas');
    testImage_4x4 = canvas.getContext('2d').createImageData(4, 4);
    for (let i = 0; i < testImage_4x4.data.length; i += 4) {
      testImage_4x4.data[i] = 100 + i / 4;
      testImage_4x4.data[i + 1] = 100 + i / 4;
      testImage_4x4.data[i + 2] = 200 + i / 4;
      testImage_4x4.data[i + 3] = 200 + i / 4;
    }
  });

  afterEach(function () {
    helper.dispose();
  });

  describe('constructor', function () {
    it('creates a target of size 1x1', function () {
      const rt = new WebGLRenderTarget(helper);
      assert.deepEqual(rt.getSize(), [1, 1]);
    });

    it('creates a target of specified size', function () {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      assert.deepEqual(rt.getSize(), [12, 34]);
    });
  });

  describe('#setSize', function () {
    it('updates the target size', function () {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      assert.deepEqual(rt.getSize(), [12, 34]);
      rt.setSize([45, 67]);
      assert.deepEqual(rt.getSize(), [45, 67]);
    });

    it('does nothing if the size has not changed', function () {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      const spy = vi.spyOn(rt, 'updateSize_');
      rt.setSize([12, 34]);
      assert.strictEqual(spy.mock.calls.length, 0);
      rt.setSize([12, 345]);
      assert.isAbove(spy.mock.calls.length, 0);
    });
  });

  describe('#readAll', function () {
    it('returns 1-pixel data with the default options', function () {
      const rt = new WebGLRenderTarget(helper);
      assert.deepEqual(rt.readAll().length, 4);
    });

    it('returns the content of the texture', function () {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const data = rt.readAll();

      assert.deepEqual(data[0], 100);
      assert.deepEqual(data[1], 100);
      assert.deepEqual(data[2], 200);
      assert.deepEqual(data[3], 200);
      assert.deepEqual(data[4], 101);
      assert.deepEqual(data[5], 101);
      assert.deepEqual(data[6], 201);
      assert.deepEqual(data[7], 201);
      assert.deepEqual(data.length, 4 * 4 * 4);
    });

    it('does not call gl.readPixels again when #clearCachedData is not called', function () {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const spy = vi.spyOn(rt.helper_.getGL(), 'readPixels');
      rt.readAll();
      assert.deepEqual(spy.mock.calls.length, 1);
      rt.readAll();
      assert.deepEqual(spy.mock.calls.length, 1);
      rt.clearCachedData();
      rt.readAll();
      assert.deepEqual(spy.mock.calls.length, 2);
    });
  });

  describe('#readPixel', function () {
    it('returns the content of one pixel', function () {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());

      let data = rt.readPixel(0, 0);
      assert.deepEqual(data[0], 112);
      assert.deepEqual(data[1], 112);
      assert.deepEqual(data[2], 212);
      assert.deepEqual(data[3], 212);

      data = rt.readPixel(3, 3);
      assert.deepEqual(data[0], 103);
      assert.deepEqual(data[1], 103);
      assert.deepEqual(data[2], 203);
      assert.deepEqual(data[3], 203);
      assert.deepEqual(data.length, 4);
    });

    it('does not call gl.readPixels again when #clearCachedData is not called', function () {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const spy = vi.spyOn(rt.helper_.getGL(), 'readPixels');
      rt.readPixel(0, 0);
      assert.deepEqual(spy.mock.calls.length, 1);
      rt.readPixel(1, 1);
      assert.deepEqual(spy.mock.calls.length, 1);
      rt.clearCachedData();
      rt.readPixel(2, 2);
      assert.deepEqual(spy.mock.calls.length, 2);
    });

    it('returns an array filled with 0 if outside of range', function () {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());

      let data = rt.readPixel(-1, 0);
      assertArrayLikeEqual(data, [0, 0, 0, 0]);

      data = rt.readPixel(3, -1);
      assertArrayLikeEqual(data, [0, 0, 0, 0]);

      data = rt.readPixel(6, 2);
      assertArrayLikeEqual(data, [0, 0, 0, 0]);

      data = rt.readPixel(2, 7);
      assertArrayLikeEqual(data, [0, 0, 0, 0]);

      data = rt.readPixel(4, 2);
      assertArrayLikeEqual(data, [0, 0, 0, 0]);

      data = rt.readPixel(2, 4);
      assertArrayLikeEqual(data, [0, 0, 0, 0]);

      data = rt.readPixel(2, 3);
      assert.notDeepEqual(data, [0, 0, 0, 0]);
    });

    it('reads the correct pixel for fractional coordinates', function () {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());

      // readPixel returns a shared array, so copy before reading again
      const expected = Array.from(rt.readPixel(3, 1));
      const data = Array.from(rt.readPixel(3.5, 1.5));
      assert.deepEqual(data, expected);

      assert.notDeepEqual(Array.from(rt.readPixel(3.5, 3.5)), [0, 0, 0, 0]);
    });
  });
});
