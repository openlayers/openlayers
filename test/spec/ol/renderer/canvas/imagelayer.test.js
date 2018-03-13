import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import CanvasImageLayerRenderer from '../../../../../src/ol/renderer/canvas/ImageLayer.js';
import CanvasVectorLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorLayer.js';


describe('ol.renderer.canvas.ImageLayer', function() {

  describe('#dispose()', function() {
    let layer, imageRenderer, vectorRenderer;

    beforeEach(function() {
      layer = new VectorLayer({
        renderMode: 'image',
        source: new VectorSource()
      });
      imageRenderer = new CanvasImageLayerRenderer(layer);
      vectorRenderer = new CanvasVectorLayerRenderer(layer);
    });

    afterEach(function() {
      vectorRenderer.dispose();
      imageRenderer.dispose();
      layer.dispose();
    });

    it('cleans up CanvasVectorRenderer', function() {
      const spy = sinon.spy(vectorRenderer, 'dispose');
      imageRenderer.setVectorRenderer(vectorRenderer);
      imageRenderer.dispose();
      expect(spy.called).to.be(true);
    });
  });

  describe('#forEachLayerAtCoordinate', function() {

    let map, target, source;
    beforeEach(function(done) {
      const projection = new Projection({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200]
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new Static({
        url: 'spec/ol/data/dot.png',
        projection: projection,
        imageExtent: [0, 0, 20, 20]
      });
      map = new Map({
        pixelRatio: 1,
        target: target,
        layers: [new ImageLayer({
          source: source
        })],
        view: new View({
          projection: projection,
          center: [10, 10],
          zoom: 2,
          maxZoom: 8
        })
      });
      source.on('imageloadend', function() {
        done();
      });
    });

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('properly detects pixels', function() {
      map.renderSync();
      let has = false;
      function hasLayer() {
        has = true;
      }
      map.forEachLayerAtPixel([20, 80], hasLayer);
      expect(has).to.be(true);
      has = false;
      map.forEachLayerAtPixel([10, 90], hasLayer);
      expect(has).to.be(false);
    });
  });

  describe('#setVectorRenderer()', function() {
    let layer, imageRenderer, vectorRenderer1, vectorRenderer2;

    beforeEach(function() {
      layer = new VectorLayer({
        renderMode: 'image',
        source: new VectorSource()
      });
      imageRenderer = new CanvasImageLayerRenderer(layer);
      vectorRenderer1 = new CanvasVectorLayerRenderer(layer);
      vectorRenderer2 = new CanvasVectorLayerRenderer(layer);
    });

    afterEach(function() {
      vectorRenderer1.dispose();
      vectorRenderer2.dispose();
      imageRenderer.dispose();
      layer.dispose();
    });

    it('cleans up an existing vectorRenderer', function() {
      const spy = sinon.spy(vectorRenderer1, 'dispose');
      imageRenderer.setVectorRenderer(vectorRenderer1);
      expect(spy.called).to.be(false);
      imageRenderer.setVectorRenderer(vectorRenderer2);
      expect(spy.called).to.be(true);
    });
  });

});
