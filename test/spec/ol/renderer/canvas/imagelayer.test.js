import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import Feature from '../../../../../src/ol/Feature.js';
import Point from '../../../../../src/ol/geom/Point.js';
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
      imageRenderer.vectorRenderer_ = vectorRenderer;
    });

    afterEach(function() {
      imageRenderer.dispose();
      vectorRenderer.dispose();
      layer.dispose();
    });

    it('cleans up CanvasVectorRenderer', function() {
      const vectorRenderer = imageRenderer.vectorRenderer_;
      const spy = sinon.spy(vectorRenderer, 'dispose');
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

  describe('Vector image rendering', function() {
    let map, div, layer;

    beforeEach(function() {
      layer = new VectorLayer({
        renderMode: 'image',
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))]
        })
      });

      div = document.createElement('div');
      div.style.width = div.style.height = '100px';
      document.body.appendChild(div);
      map = new Map({
        target: div,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2
        })
      });
    });

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(div);
      map.dispose();
    });

    it('dispatches precompose and postcompose events on the vector layer', function(done) {
      let precompose = 0;
      let postcompose = 0;
      layer.on('precompose', function() {
        ++precompose;
      });
      layer.on('postcompose', function() {
        ++postcompose;
      });
      map.once('postrender', function() {
        expect(precompose).to.be(1);
        expect(postcompose).to.be(1);
        done();
      });
    });
  });

});
