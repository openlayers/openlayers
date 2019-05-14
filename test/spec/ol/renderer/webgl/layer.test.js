import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import WebGLLayerRenderer, {getBlankTexture} from '../../../../../src/ol/renderer/webgl/Layer';


describe('ol.renderer.webgl.Layer', function() {

  describe('constructor', function() {

    let target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function () {
      document.body.removeChild(target);
    });

    it('creates a new instance', function () {
      const layer = new VectorLayer({
        source: new VectorSource()
      });
      const renderer = new WebGLLayerRenderer(layer);
      expect(renderer).to.be.a(WebGLLayerRenderer);
    });

  });

  describe('getBlankTexture', function() {
    it('creates a 1x1 white texture', function() {
      const texture = getBlankTexture();
      expect(texture.height).to.eql(1);
      expect(texture.width).to.eql(1);
      expect(texture.data[0]).to.eql(255);
      expect(texture.data[1]).to.eql(255);
      expect(texture.data[2]).to.eql(255);
      expect(texture.data[3]).to.eql(255);
    });
  });

});
