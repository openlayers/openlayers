import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {buffer as bufferExtent, getWidth} from '../../../../../src/ol/extent.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {clear} from '../../../../../src/ol/obj.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import {checkedFonts} from '../../../../../src/ol/render/canvas.js';
import CanvasVectorLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorLayer.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';


describe('ol.renderer.canvas.VectorLayer', function() {

  describe('constructor', function() {

    const head = document.getElementsByTagName('head')[0];
    const font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css?family=Droid+Sans';
    font.rel = 'stylesheet';

    let target;

    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function() {
      document.body.removeChild(target);
    });

    it('creates a new instance', function() {
      const layer = new VectorLayer({
        source: new VectorSource()
      });
      const renderer = new CanvasVectorLayerRenderer(layer);
      expect(renderer).to.be.a(CanvasVectorLayerRenderer);
    });

    it('gives precedence to feature styles over layer styles', function() {
      const target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      const map = new Map({
        view: new View({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      const layerStyle = [new Style({
        text: new Text({
          text: 'layer'
        })
      })];
      const featureStyle = [new Style({
        text: new Text({
          text: 'feature'
        })
      })];
      const feature1 = new Feature(new Point([0, 0]));
      const feature2 = new Feature(new Point([0, 0]));
      feature2.setStyle(featureStyle);
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature1, feature2]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      const spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
        'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[3]).to.be(layerStyle);
      expect(spy.getCall(1).args[3]).to.be(featureStyle);
      document.body.removeChild(target);
    });

    it('does not re-render for unavailable fonts', function(done) {
      clear(checkedFonts);
      const map = new Map({
        view: new View({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      const layerStyle = new Style({
        text: new Text({
          text: 'layer',
          font: '12px "Unavailable Font",sans-serif'
        })
      });

      const feature = new Feature(new Point([0, 0]));
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('does not re-render for available fonts', function(done) {
      clear(checkedFonts);
      const map = new Map({
        view: new View({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      const layerStyle = new Style({
        text: new Text({
          text: 'layer',
          font: '12px sans-serif'
        })
      });

      const feature = new Feature(new Point([0, 0]));
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('re-renders for fonts that become available', function(done) {
      clear(checkedFonts);
      head.appendChild(font);
      const map = new Map({
        view: new View({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      const layerStyle = new Style({
        text: new Text({
          text: 'layer',
          font: '12px "Droid Sans",sans-serif'
        })
      });

      const feature = new Feature(new Point([0, 0]));
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature]
        }),
        style: layerStyle
      });
      map.addLayer(layer);
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision + 1);
        head.removeChild(font);
        done();
      }, 1600);
    });

  });

  describe('#forEachFeatureAtCoordinate', function() {
    let layer, renderer;

    beforeEach(function() {
      layer = new VectorLayer({
        source: new VectorSource()
      });
      renderer = new CanvasVectorLayerRenderer(layer);
      const replayGroup = {};
      renderer.replayGroup_ = replayGroup;
      replayGroup.forEachFeatureAtCoordinate = function(coordinate,
        resolution, rotation, hitTolerance, skippedFeaturesUids, callback) {
        const feature = new Feature();
        callback(feature);
        callback(feature);
      };
    });

    it('calls callback once per feature with a layer as 2nd arg', function() {
      const spy = sinon.spy();
      const coordinate = [0, 0];
      const frameState = {
        layerStatesArray: [{}],
        skippedFeatureUids: {},
        viewState: {
          resolution: 1,
          rotation: 0
        }
      };
      renderer.forEachFeatureAtCoordinate(
        coordinate, frameState, 0, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });
  });

  describe('#prepareFrame and #compose', function() {
    let frameState, projExtent, renderer, worldWidth, buffer;

    beforeEach(function() {
      const layer = new VectorLayer({
        source: new VectorSource({wrapX: true})
      });
      renderer = new CanvasVectorLayerRenderer(layer);
      const projection = getProjection('EPSG:3857');
      projExtent = projection.getExtent();
      worldWidth = getWidth(projExtent);
      buffer = layer.getRenderBuffer();
      frameState = {
        skippedFeatureUids: {},
        viewHints: [],
        viewState: {
          projection: projection,
          resolution: 1,
          rotation: 0
        }
      };
    });

    it('sets correct extent for small viewport near dateline', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[0] + 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));

    });

    it('sets correct extent for viewport less than 1 world wide', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[1] - 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 1 world wide', function() {

      frameState.extent =
          [2 * projExtent[0] - 10000, -10000, 2 * projExtent[1] + 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 2 worlds wide', function() {

      frameState.extent = [
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[1] + 2 * worldWidth + 10000, 10000
      ];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[2] + 2 * worldWidth + 10000, 10000
      ], buffer));
    });

    it('sets replayGroupChanged correctly', function() {
      frameState.extent = [-10000, -10000, 10000, 10000];
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroupChanged).to.be(true);
      renderer.prepareFrame(frameState, {});
      expect(renderer.replayGroupChanged).to.be(false);
    });

    it('dispatches a postrender event when rendering', function(done) {
      const layer = renderer.getLayer();
      layer.getSource().addFeature(new Feature(new Point([0, 0])));
      layer.once('postrender', function() {
        expect(true);
        done();
      });
      frameState.extent = [-10000, -10000, 10000, 10000];
      frameState.size = [100, 100];
      frameState.viewState.center = [0, 0];
      let rendered = false;
      if (renderer.prepareFrame(frameState, {})) {
        rendered = true;
        renderer.renderFrame(frameState, layer.getLayerState());
      }
      expect(rendered).to.be(true);
    });

  });

});
