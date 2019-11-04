import WebGLRenderTarget from '../../../../src/ol/webgl/RenderTarget.js';
import WebGLHelper from '../../../../src/ol/webgl/Helper.js';


describe('ol.webgl.RenderTarget', function() {
  let helper, testImage_4x4;

  beforeEach(function() {
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

  describe('constructor', function() {

    it('creates a target of size 1x1', function() {
      const rt = new WebGLRenderTarget(helper);
      expect(rt.getSize()).to.eql([1, 1]);
    });

    it('creates a target of specified size', function() {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      expect(rt.getSize()).to.eql([12, 34]);
    });

  });

  describe('#setSize', function() {

    it('updates the target size', function() {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      expect(rt.getSize()).to.eql([12, 34]);
      rt.setSize([45, 67]);
      expect(rt.getSize()).to.eql([45, 67]);
    });

    it('does nothing if the size has not changed', function() {
      const rt = new WebGLRenderTarget(helper, [12, 34]);
      const spy = sinon.spy(rt, 'updateSize_');
      rt.setSize([12, 34]);
      expect(spy.called).to.be(false);
      rt.setSize([12, 345]);
      expect(spy.called).to.be(true);
    });

  });

  describe('#readAll', function() {

    it('returns 1-pixel data with the default options', function() {
      const rt = new WebGLRenderTarget(helper);
      expect(rt.readAll().length).to.eql(4);
    });

    it('returns the content of the texture', function() {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const data = rt.readAll();

      expect(data[0]).to.eql(100);
      expect(data[1]).to.eql(100);
      expect(data[2]).to.eql(200);
      expect(data[3]).to.eql(200);
      expect(data[4]).to.eql(101);
      expect(data[5]).to.eql(101);
      expect(data[6]).to.eql(201);
      expect(data[7]).to.eql(201);
      expect(data.length).to.eql(4 * 4 * 4);
    });

    it('does not call gl.readPixels again when #clearCachedData is not called', function() {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const spy = sinon.spy(rt.helper_.getGL(), 'readPixels');
      rt.readAll();
      expect(spy.callCount).to.eql(1);
      rt.readAll();
      expect(spy.callCount).to.eql(1);
      rt.clearCachedData();
      rt.readAll();
      expect(spy.callCount).to.eql(2);
    });

  });

  describe('#readPixel', function() {

    it('returns the content of one pixel', function() {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());

      let data = rt.readPixel(0, 0);
      expect(data[0]).to.eql(112);
      expect(data[1]).to.eql(112);
      expect(data[2]).to.eql(212);
      expect(data[3]).to.eql(212);

      data = rt.readPixel(3, 3);
      expect(data[0]).to.eql(103);
      expect(data[1]).to.eql(103);
      expect(data[2]).to.eql(203);
      expect(data[3]).to.eql(203);
      expect(data.length).to.eql(4);
    });

    it('does not call gl.readPixels again when #clearCachedData is not called', function() {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const spy = sinon.spy(rt.helper_.getGL(), 'readPixels');
      rt.readPixel(0, 0);
      expect(spy.callCount).to.eql(1);
      rt.readPixel(1, 1);
      expect(spy.callCount).to.eql(1);
      rt.clearCachedData();
      rt.readPixel(2, 2);
      expect(spy.callCount).to.eql(2);
    });

    it('returns an array filled with 0 if outside of range', function() {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());

      let data = rt.readPixel(-1, 0);
      expect(data).to.eql([0, 0, 0, 0]);

      data = rt.readPixel(3, -1);
      expect(data).to.eql([0, 0, 0, 0]);

      data = rt.readPixel(6, 2);
      expect(data).to.eql([0, 0, 0, 0]);

      data = rt.readPixel(2, 7);
      expect(data).to.eql([0, 0, 0, 0]);

      data = rt.readPixel(2, 3);
      expect(data).not.to.eql([0, 0, 0, 0]);
    });

  });

});
