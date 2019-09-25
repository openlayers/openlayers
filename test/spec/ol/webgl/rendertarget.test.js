import WebGLRenderTarget from '../../../../src/ol/webgl/RenderTarget.js';
import WebGLHelper from '../../../../src/ol/webgl/Helper.js';


describe('ol.webgl.RenderTarget', () => {
  let helper, testImage_4x4;

  beforeEach(() => {
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

  describe('constructor', () => {

    test('creates a target of size 1x1', () => {
      const rt = new WebGLRenderTarget(helper);
      expect(rt.getSize()).toEqual([1, 1]);
    });

    test('creates a target of specified size', () => {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      expect(rt.getSize()).toEqual([12, 34]);
    });

  });

  describe('#setSize', () => {

    test('updates the target size', () => {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      expect(rt.getSize()).toEqual([12, 34]);
      rt.setSize([45, 67]);
      expect(rt.getSize()).toEqual([45, 67]);
    });

    test('does nothing if the size has not changed', () => {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      const spy = sinon.spy(rt, 'updateSize_');
      rt.setSize([12, 34]);
      expect(spy.called).toBe(false);
      rt.setSize([12, 345]);
      expect(spy.called).toBe(true);
    });

  });

  describe('#readAll', () => {

    test('returns 1-pixel data with the default options', () => {
      const rt = new WebGLRenderTarget(helper);
      expect(rt.readAll().length).toEqual(4);
    });

    test('returns the content of the texture', () => {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const data = rt.readAll();

      expect(data[0]).toEqual(100);
      expect(data[1]).toEqual(100);
      expect(data[2]).toEqual(200);
      expect(data[3]).toEqual(200);
      expect(data[4]).toEqual(101);
      expect(data[5]).toEqual(101);
      expect(data[6]).toEqual(201);
      expect(data[7]).toEqual(201);
      expect(data.length).toEqual(4 * 4 * 4);
    });

    test(
      'does not call gl.readPixels again when #clearCachedData is not called',
      () => {
        const rt = new WebGLRenderTarget(helper, [4, 4]);
        helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
        const spy = sinon.spy(rt.helper_.getGL(), 'readPixels');
        rt.readAll();
        expect(spy.callCount).toEqual(1);
        rt.readAll();
        expect(spy.callCount).toEqual(1);
        rt.clearCachedData();
        rt.readAll();
        expect(spy.callCount).toEqual(2);
      }
    );

  });

  describe('#readPixel', () => {

    test('returns the content of one pixel', () => {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());

      let data = rt.readPixel(0, 0);
      expect(data[0]).toEqual(112);
      expect(data[1]).toEqual(112);
      expect(data[2]).toEqual(212);
      expect(data[3]).toEqual(212);

      data = rt.readPixel(3, 3);
      expect(data[0]).toEqual(103);
      expect(data[1]).toEqual(103);
      expect(data[2]).toEqual(203);
      expect(data[3]).toEqual(203);
      expect(data.length).toEqual(4);
    });

    test(
      'does not call gl.readPixels again when #clearCachedData is not called',
      () => {
        const rt = new WebGLRenderTarget(helper, [4, 4]);
        helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
        const spy = sinon.spy(rt.helper_.getGL(), 'readPixels');
        rt.readPixel(0, 0);
        expect(spy.callCount).toEqual(1);
        rt.readPixel(1, 1);
        expect(spy.callCount).toEqual(1);
        rt.clearCachedData();
        rt.readPixel(2, 2);
        expect(spy.callCount).toEqual(2);
      }
    );

  });

});
