import CanvasImageLayerRenderer from '../../../../../../src/ol/renderer/canvas/ImageLayer.js';
import Feature from '../../../../../../src/ol/Feature.js';
import ImageLayer from '../../../../../../src/ol/layer/Image.js';
import ImageState from '../../../../../../src/ol/ImageState.js';
import ImageWrapper from '../../../../../../src/ol/Image.js';
import Map from '../../../../../../src/ol/Map.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import Static from '../../../../../../src/ol/source/ImageStatic.js';
import VectorImageLayer from '../../../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import View from '../../../../../../src/ol/View.js';
import {get as getProj} from '../../../../../../src/ol/proj.js';

describe('ol/renderer/canvas/ImageLayer', function () {
  describe('#getData', function () {
    let map, target, source;
    /** @type {ImageLayer} */
    let layer;
    beforeEach(function (done) {
      const projection = new Projection({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200],
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      source = new Static({
        url: 'spec/ol/data/dot.png',
        projection: projection,
        imageExtent: [0, 0, 20, 20],
      });
      layer = new ImageLayer({
        source: source,
      });
      map = new Map({
        pixelRatio: 1,
        target: target,
        layers: [layer],
        view: new View({
          projection: projection,
          center: [10, 10],
          zoom: 2,
          maxZoom: 8,
        }),
      });
      source.on('imageloadend', function () {
        done();
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('properly detects pixels', function () {
      map.renderSync();

      expect(layer.getData([20, 80])[3]).to.not.be(0);
      expect(layer.getData([10, 90])[3]).to.be(0);
    });
  });

  describe('#getData Image CORS', function () {
    let map,
      target,
      imageExtent,
      projection,
      sourceCross,
      source,
      imageLayer,
      imageLayerCross;
    beforeEach(function (done) {
      projection = new Projection({
        code: 'custom-image',
        units: 'pixels',
        extent: [0, 0, 200, 200],
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      imageExtent = [0, 0, 20, 20];
      source = new Static({
        url: `https://openlayers.org/assets/theme/img/logo70.png`,
        projection: projection,
        imageExtent: imageExtent,
      });
      imageLayer = new ImageLayer({
        source: source,
      });
      sourceCross = new Static({
        url: `https://openlayers.org/assets/theme/img/logo70.png`,
        projection: projection,
        imageExtent: imageExtent,
        crossOrigin: 'anonymous',
      });
      imageLayerCross = new ImageLayer({
        source: sourceCross,
      });
      map = new Map({
        pixelRatio: 1,
        target: target,
        layers: [imageLayer, imageLayerCross],
        view: new View({
          projection: projection,
          center: [10, 10],
          zoom: 1,
          maxZoom: 8,
        }),
      });
      let loadedCount = 0;
      [source, sourceCross].forEach(function (source) {
        source.once('imageloadend', function () {
          loadedCount++;
          if (loadedCount === 2) {
            done();
          }
        });
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('should not detect pixels when crossOrigin is not set', function () {
      imageLayerCross.setVisible(false);
      imageLayer.setVisible(true);
      map.renderSync();

      expect(imageLayer.getData([50, 50])).to.be(null);
      expect(imageLayer.getData([10, 10])).to.be(null);
    });

    it('should not detect pixels outside of the layer extent with crossOrigin set', function () {
      imageLayerCross.setVisible(true);
      imageLayer.setVisible(false);
      map.renderSync();

      expect(imageLayerCross.getData([50, 50])).to.not.be(null);
      expect(imageLayerCross.getData([10, 10])).to.be(null);
    });

    it('should not detect pixels outside of the layer extent with extent set', function () {
      imageLayerCross.setVisible(true);
      imageLayerCross.setExtent(imageExtent);
      imageLayer.setVisible(false);
      map.renderSync();

      expect(imageLayerCross.getData([50, 50])).to.not.be(null);
      expect(imageLayerCross.getData([10, 10])).to.be(null);
    });
  });

  describe('Image rendering', function () {
    let map, div, layer;

    beforeEach(function (done) {
      const projection = getProj('EPSG:3857');
      layer = new ImageLayer({
        source: new Static({
          url: 'spec/ol/data/osm-0-0-0.png',
          imageExtent: projection.getExtent(),
          projection: projection,
        }),
      });

      div = document.createElement('div');
      div.style.width = '100px';
      div.style.height = '100px';
      document.body.appendChild(div);
      map = new Map({
        target: div,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
      layer.getSource().on('imageloadend', function () {
        done();
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(div);
      map.dispose();
    });

    it('dispatches prerender and postrender events on the image layer', function (done) {
      let prerender = 0;
      let postrender = 0;
      layer.on('prerender', function () {
        ++prerender;
      });
      layer.on('postrender', function () {
        ++postrender;
      });
      map.on('postrender', function () {
        expect(prerender).to.be(1);
        expect(postrender).to.be(1);
        done();
      });
    });

    it('image smoothing is re-enabled after rendering', function (done) {
      let context;
      layer.on('postrender', function (e) {
        context = e.context;
        context.imageSmoothingEnabled = false;
      });
      map.on('postrender', function () {
        expect(context.imageSmoothingEnabled).to.be(true);
        done();
      });
    });
  });

  describe('Vector image rendering', function () {
    let map, div, layer;

    beforeEach(function () {
      layer = new VectorImageLayer({
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
      });

      div = document.createElement('div');
      div.style.width = '100px';
      div.style.height = '100px';
      document.body.appendChild(div);
      map = new Map({
        target: div,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(div);
      map.dispose();
    });

    it('dispatches prerender and postrender events on the vector layer', function (done) {
      let prerender = 0;
      let postrender = 0;
      layer.on('prerender', function () {
        ++prerender;
      });
      layer.on('postrender', function () {
        ++postrender;
      });
      map.once('postrender', function () {
        expect(prerender).to.be(1);
        expect(postrender).to.be(1);
        done();
      });
    });
  });
  describe('renderFrame', function () {
    const projection = new Projection({
      code: 'custom-image',
      units: 'pixels',
      extent: [0, 0, 256, 256],
    });
    let renderer, layer;
    function createLayerFrameState(extent) {
      layer = new ImageLayer({
        source: new Static({
          url: 'spec/ol/data/osm-0-0-0.png',
          imageExtent: projection.getExtent(),
          projection: projection,
        }),
        extent: extent,
      });
      layer.getSource().image_.load();
      renderer = layer.getRenderer();
      renderer.renderWorlds = sinon.spy();
      renderer.clipUnrotated = sinon.spy();
      renderer.useContainer = function () {
        CanvasImageLayerRenderer.prototype.useContainer.apply(this, arguments);
        this.context = sinon.spy(this.context);
      };
      return {
        pixelRatio: 1,
        time: 1000000000000,
        viewState: {
          center: [0, 0],
          projection: projection,
          resolution: 1,
          rotation: 0,
        },
        animate: false,
        coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
        extent: [0, 0, 100, 100],
        index: 0,
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
        size: [100, 100],
        viewHints: [],
      };
    }
    it('does not render if layer extent does not intersect view extent', function (done) {
      const frameState = createLayerFrameState([200, 200, 300, 300]);
      layer.getSource().on('imageloadend', function () {
        try {
          expect(renderer.prepareFrame(frameState)).to.be(false);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('renders if layer extent partially intersects view extent', function (done) {
      const frameState = createLayerFrameState([50, 50, 150, 150]);
      layer.getSource().on('imageloadend', function () {
        if (renderer.prepareFrame(frameState)) {
          renderer.renderFrame(frameState, null);
        }
        try {
          expect(renderer.clipUnrotated.callCount).to.be(1);
          expect(renderer.context.drawImage.callCount).to.be(1);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('renders without clipping when layer extent covers view', function (done) {
      const frameState = createLayerFrameState([0, 0, 100, 100]);
      layer.getSource().on('imageloadend', function () {
        if (renderer.prepareFrame(frameState)) {
          renderer.renderFrame(frameState, null);
        }
        try {
          expect(renderer.clipUnrotated.callCount).to.be(0);
          expect(renderer.context.drawImage.callCount).to.be(1);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('resets image when empty', function (done) {
      const frameState = createLayerFrameState([0, 0, 100, 100]);
      layer.getSource().on('imageloadend', function () {
        if (renderer.prepareFrame(frameState)) {
          renderer.renderFrame(frameState, null);
        }
        expect(renderer.image_).to.be.a(ImageWrapper);
        renderer.image_.state = ImageState.EMPTY;
        expect(renderer.prepareFrame(frameState)).to.be(false);
        expect(renderer.image_).to.be(null);
        done();
      });
    });
  });
});
