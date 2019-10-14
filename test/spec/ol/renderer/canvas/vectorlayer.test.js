import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {buffer as bufferExtent, getWidth} from '../../../../../src/ol/extent.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import Point from '../../../../../src/ol/geom/Point.js';
import {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {clear} from '../../../../../src/ol/obj.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import {checkedFonts} from '../../../../../src/ol/render/canvas.js';
import CanvasVectorLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorLayer.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
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
      const spy = sinon.spy(layer.getRenderer(), 'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.be(layerStyle);
      expect(spy.getCall(1).args[2]).to.be(featureStyle);
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
        resolution, rotation, hitTolerance, callback) {
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
        viewState: {
          center: [0, 0],
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
        viewHints: [],
        viewState: {
          center: [0, 0],
          projection: projection,
          resolution: 1,
          rotation: 0
        }
      };
    });

    it('sets correct extent for small viewport near dateline', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[0] + 10000, 10000];
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));

    });

    it('sets correct extent for viewport less than 1 world wide', function() {

      frameState.extent =
          [projExtent[0] - 10000, -10000, projExtent[1] - 10000, 10000];
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - worldWidth + buffer,
        -10000, projExtent[2] + worldWidth - buffer, 10000
      ], buffer));
    });

    it('sets correct extent for viewport more than 1 world wide', function() {

      frameState.extent =
          [2 * projExtent[0] - 10000, -10000, 2 * projExtent[1] + 10000, 10000];
      renderer.prepareFrame(frameState);
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
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroup_.maxExtent_).to.eql(bufferExtent([
        projExtent[0] - 2 * worldWidth - 10000,
        -10000, projExtent[2] + 2 * worldWidth + 10000, 10000
      ], buffer));
    });

    it('sets replayGroupChanged correctly', function() {
      frameState.extent = [-10000, -10000, 10000, 10000];
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroupChanged).to.be(true);
      renderer.prepareFrame(frameState);
      expect(renderer.replayGroupChanged).to.be(false);
    });

    it('dispatches a postrender event when rendering', function(done) {
      const layer = renderer.getLayer();
      layer.getSource().addFeature(new Feature(new Point([0, 0])));
      layer.once('postrender', function() {
        expect(true);
        done();
      });
      frameState.layerStatesArray = [layer.getLayerState()];
      frameState.layerIndex = 0;
      frameState.extent = [-10000, -10000, 10000, 10000];
      frameState.size = [100, 100];
      frameState.viewState.center = [0, 0];
      let rendered = false;
      if (renderer.prepareFrame(frameState)) {
        rendered = true;
        renderer.renderFrame(frameState, null);
      }
      expect(rendered).to.be(true);
    });

  });

  describe('hit detection', function() {

    it('with no fill and transparent fill', function() {
      const target = document.createElement('div');
      target.style.width = '300px';
      target.style.height = '300px';
      document.body.appendChild(target);
      const styles = {
        transparent: new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 3
          }),
          fill: new Fill({
            color: 'transparent'
          }),
          image: new CircleStyle({
            radius: 30,
            stroke: new Stroke({
              color: 'blue',
              width: 3
            }),
            fill: new Fill({
              color: 'transparent'
            })
          })
        }),
        none: new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 3
          }),
          image: new CircleStyle({
            radius: 30,
            stroke: new Stroke({
              color: 'blue',
              width: 3
            })
          })
        })
      };
      const source = new VectorSource({
        features: [
          new Feature({
            geometry: fromExtent([0, 10, 3, 13]),
            fillType: 'none'
          }),
          new Feature({
            geometry: fromExtent([1, 11, 4, 14]),
            fillType: 'none'
          }),
          new Feature({
            geometry: fromExtent([5, 10, 8, 13]),
            fillType: 'transparent'
          }),
          new Feature({
            geometry: fromExtent([6, 11, 9, 14]),
            fillType: 'transparent'
          }),
          new Feature({
            geometry: new Circle([1.5, 6.5], 1.5),
            fillType: 'none'
          }),
          new Feature({
            geometry: new Circle([2.5, 7.5], 1.5),
            fillType: 'none'
          }),
          new Feature({
            geometry: new Circle([6.5, 6.5], 1.5),
            fillType: 'transparent'
          }),
          new Feature({
            geometry: new Circle([7.5, 7.5], 1.5),
            fillType: 'transparent'
          }),
          new Feature({
            geometry: new Point([1.5, 1.5]),
            fillType: 'none'
          }),
          new Feature({
            geometry: new Point([2.5, 2.5]),
            fillType: 'none'
          }),
          new Feature({
            geometry: new Point([6.5, 1.5]),
            fillType: 'transparent'
          }),
          new Feature({
            geometry: new Point([7.5, 2.5]),
            fillType: 'transparent'
          })
        ]
      });
      const layer = new VectorLayer({
        source: source,
        style: function(feature, resolution) {
          return styles[feature.get('fillType')];
        }
      });
      const map = new Map({
        layers: [layer],
        view: new View({
          center: [4.5, 7],
          resolution: 0.05
        }),
        target: target
      });
      map.renderSync();

      function hitTest(coordinate) {
        const features = map.getFeaturesAtPixel(
          map.getPixelFromCoordinate(coordinate)
        );
        const result = {count: 0};
        if (features && features.length > 0) {
          result.count = features.length;
          result.extent = features[0].getGeometry().getExtent();
        }
        return result;
      }
      let res;

      res = hitTest([0, 12]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(0);
      res = hitTest([1, 12]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(1);
      res = hitTest([2, 12]);
      expect(res.count).to.be(0);
      res = hitTest([3, 12]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(0);
      res = hitTest([4, 12]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(1);
      res = hitTest([5, 12]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(5);
      res = hitTest([6, 12]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(6);
      res = hitTest([7, 12]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(6);
      res = hitTest([8, 12]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(6);
      res = hitTest([9, 12]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(6);

      res = hitTest([0, 6.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(0);
      res = hitTest([1, 7.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(1);
      res = hitTest([2, 7.0]);
      expect(res.count).to.be(0);
      res = hitTest([3, 6.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(0);
      res = hitTest([4, 7.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(1);
      res = hitTest([5, 6.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(5);
      res = hitTest([6, 7.5]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(6);
      res = hitTest([7, 7.0]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(6);
      res = hitTest([8, 6.5]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(6);
      res = hitTest([9, 7.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(6);

      res = hitTest([0, 1.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(1.5);
      res = hitTest([1, 2.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(2.5);
      res = hitTest([2, 2.0]);
      expect(res.count).to.be(0);
      res = hitTest([3, 1.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(1.5);
      res = hitTest([4, 2.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(2.5);
      res = hitTest([5, 1.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(6.5);
      res = hitTest([6, 2.5]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(7.5);
      res = hitTest([7, 2.0]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(7.5);
      res = hitTest([8, 1.5]);
      expect(res.count).to.be(2);
      expect(res.extent[0]).to.be(7.5);
      res = hitTest([9, 2.5]);
      expect(res.count).to.be(1);
      expect(res.extent[0]).to.be(7.5);

      document.body.removeChild(target);
    });

  });

});
