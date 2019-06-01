import WebGLRenderTarget from '../../../../src/ol/webgl/RenderTarget.js';
import WebGLHelper from '../../../../src/ol/webgl/Helper.js';


describe('ol.webgl.RenderTarget', function() {
  let helper, testImage_4x4;

  beforeEach(function() {
    helper = new WebGLHelper();

    const canvas = document.createElement('canvas');
    testImage_4x4 = canvas.getContext('2d').createImageData(4, 4);
    for (let i = 0; i < testImage_4x4.data.length; i += 4) {
      testImage_4x4.data[i] = 100;
      testImage_4x4.data[i + 1] = 150;
      testImage_4x4.data[i + 2] = 200;
      testImage_4x4.data[i + 3] = 250;
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

  describe('#readData', function() {

    it('returns 1-pixel data with the default options', function() {
      const rt = new WebGLRenderTarget(helper);
      expect(rt.read().length).to.eql(4);
    });

    it('returns the content of the texture', function() {
      const rt = new WebGLRenderTarget(helper, [4, 4]);
      helper.createTexture([4, 4], testImage_4x4, rt.getTexture());
      const data = rt.read();

      expect(data[0]).to.eql(100);
      expect(data[1]).to.eql(150);
      expect(data[2]).to.eql(200);
      expect(data[3]).to.eql(250);
      expect(data[4]).to.eql(100);
      expect(data[5]).to.eql(150);
      expect(data[6]).to.eql(200);
      expect(data[7]).to.eql(250);
      expect(data.length).to.eql(4 * 4 * 4);
    });

  });

});
