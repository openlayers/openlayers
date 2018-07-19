import {getUid} from '../../../../../src/ol/util.js';
import {clear} from '../../../../../src/ol/obj.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import TileState from '../../../../../src/ol/TileState.js';
import VectorImageTile from '../../../../../src/ol/VectorImageTile.js';
import VectorTile from '../../../../../src/ol/VectorTile.js';
import View from '../../../../../src/ol/View.js';
import {getCenter} from '../../../../../src/ol/extent.js';
import MVT from '../../../../../src/ol/format/MVT.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../../../src/ol/layer/VectorTile.js';
import {get as getProjection, fromLonLat} from '../../../../../src/ol/proj.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import {checkedFonts} from '../../../../../src/ol/render/canvas.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';
import CanvasVectorTileLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorTileLayer.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';


describe('ol.renderer.canvas.VectorTileLayer', function() {

  describe('constructor', function() {

    const head = document.getElementsByTagName('head')[0];
    const font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css?family=Dancing+Script';
    font.rel = 'stylesheet';

    let map, layer, layerStyle, source, feature1, feature2, feature3, target, tileCallback;

    beforeEach(function() {
      tileCallback = function() {};
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      map = new Map({
        view: new View({
          center: [0, 0],
          zoom: 0
        }),
        target: target
      });
      layerStyle = [new Style({
        text: new Text({
          text: 'layer'
        })
      })];
      const featureStyle = [new Style({
        text: new Text({
          text: 'feature'
        })
      })];
      feature1 = new Feature(new Point([1, -1]));
      feature2 = new Feature(new Point([0, 0]));
      feature3 = new RenderFeature('Point', [1, -1], []);
      feature2.setStyle(featureStyle);
      class TileClass extends VectorTile {
        constructor() {
          super(...arguments);
          this.setState(TileState.LOADED);
          this.setFeatures([feature1, feature2, feature3]);
          this.setProjection(getProjection('EPSG:4326'));
          tileCallback(this);
        }
      }
      source = new VectorTileSource({
        format: new MVT(),
        tileClass: TileClass,
        tileGrid: createXYZ()
      });
      source.getTile = function() {
        const tile = VectorTileSource.prototype.getTile.apply(source, arguments);
        tile.setState(TileState.LOADED);
        return tile;
      };
      layer = new VectorTileLayer({
        source: source,
        style: layerStyle
      });
      map.addLayer(layer);
    });

    afterEach(function() {
      document.body.removeChild(target);
      map.dispose();
    });

    it('creates a new instance', function() {
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      expect(renderer).to.be.a(CanvasVectorTileLayerRenderer);
      expect(renderer.zDirection).to.be(0);
    });

    it('uses lower resolution for pure vector rendering', function() {
      layer.renderMode_ = 'vector';
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      expect(renderer.zDirection).to.be(1);
    });

    it('does not render images for pure vector rendering', function() {
      layer.renderMode_ = 'vector';
      const spy = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'renderTileImage_');
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('does not render replays for pure image rendering', function() {
      layer.renderMode_ = 'image';
      const spy = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'getTransform');
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('renders both replays and images for hybrid rendering', function() {
      const spy1 = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'getTransform');
      const spy2 = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'renderTileImage_');
      map.renderSync();
      expect(spy1.callCount).to.be(1);
      expect(spy2.callCount).to.be(1);
      spy1.restore();
      spy2.restore();
    });

    it('renders replays with custom renderers as direct replays', function() {
      layer.setStyle(new Style({
        renderer: function() {}
      }));
      const spy = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'getTransform');
      map.renderSync();
      expect(spy.callCount).to.be(1);
      spy.restore();
    });

    it('gives precedence to feature styles over layer styles', function() {
      const spy = sinon.spy(map.getRenderer().getLayerRenderer(layer),
        'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.be(layer.getStyle());
      expect(spy.getCall(1).args[2]).to.be(feature2.getStyle());
      spy.restore();
    });

    it('does not re-render for unavailable fonts', function(done) {
      map.renderSync();
      clear(checkedFonts);
      layerStyle[0].getText().setFont('12px "Unavailable font",sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('does not re-render for available fonts', function(done) {
      map.renderSync();
      clear(checkedFonts);
      layerStyle[0].getText().setFont('12px sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('re-renders for fonts that become available', function(done) {
      map.renderSync();
      clear(checkedFonts);
      head.appendChild(font);
      layerStyle[0].getText().setFont('12px "Dancing Script",sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function() {
        head.removeChild(font);
        expect(layer.getRevision()).to.be(revision + 1);
        done();
      }, 1600);
    });

    it('transforms geometries when tile and view projection are different', function() {
      let tile;
      tileCallback = function(t) {
        tile = t;
      };
      map.renderSync();
      expect(tile.getProjection()).to.equal(getProjection('EPSG:3857'));
      expect(feature1.getGeometry().getCoordinates()).to.eql(fromLonLat([1, -1]));
    });

    it('Geometries are transformed from tile-pixels', function() {
      const proj = new Projection({code: 'EPSG:3857', units: 'tile-pixels'});
      let tile;
      tileCallback = function(t) {
        t.setProjection(proj);
        tile = t;
      };
      map.renderSync();
      expect(tile.getProjection()).to.equal(getProjection('EPSG:3857'));
      expect(feature1.getGeometry().getCoordinates()).to.eql([-20027724.40316874, 20047292.282409746]);
      expect(feature3.flatCoordinates_).to.eql([-20027724.40316874, 20047292.282409746]);
    });

    it('works for multiple layers that use the same source', function() {
      const layer2 = new VectorTileLayer({
        source: source,
        style: new Style({
          text: new Text({
            text: 'layer2'
          })
        })
      });
      map.addLayer(layer2);

      const spy1 = sinon.spy(VectorTile.prototype,
        'getReplayGroup');
      const spy2 = sinon.spy(VectorTile.prototype,
        'setReplayGroup');
      map.renderSync();
      expect(spy1.callCount).to.be(4);
      expect(spy2.callCount).to.be(2);
      spy1.restore();
      spy2.restore();
    });

  });

  describe('#prepareFrame', function() {
    it('re-renders when layer changed', function() {
      const layer = new VectorTileLayer({
        source: new VectorTileSource({
          tileGrid: createXYZ(),
          transition: 0
        })
      });
      const sourceTile = new VectorTile([0, 0, 0], 2);
      sourceTile.setProjection(getProjection('EPSG:3857'));
      sourceTile.features_ = [];
      sourceTile.getImage = function() {
        return document.createElement('canvas');
      };
      const tile = new VectorImageTile([0, 0, 0], undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, 0);
      tile.transition_ = 0;
      tile.wrappedTileCoord = [0, 0, 0];
      tile.setState(TileState.LOADED);
      tile.getSourceTile = function() {
        return sourceTile;
      };
      layer.getSource().getTile = function() {
        return tile;
      };
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      const proj = getProjection('EPSG:3857');
      const frameState = {
        extent: proj.getExtent(),
        pixelRatio: 1,
        time: Date.now(),
        viewHints: [],
        viewState: {
          center: [0, 0],
          resolution: 156543.03392804097,
          projection: proj
        },
        size: [256, 256],
        usedTiles: {},
        wantedTiles: {}
      };
      renderer.prepareFrame(frameState, {});
      const replayState = renderer.renderedTiles[0].getReplayState(layer);
      const revision = replayState.renderedTileRevision;
      renderer.prepareFrame(frameState, {});
      expect(replayState.renderedTileRevision).to.be(revision);
      layer.changed();
      renderer.prepareFrame(frameState, {});
      expect(replayState.renderedTileRevision).to.be(revision + 1);
    });
  });

  describe('#forEachFeatureAtCoordinate', function() {
    let layer, renderer, replayGroup;
    class TileClass extends VectorImageTile {
      constructor() {
        super(...arguments);
        this.extent = [-Infinity, -Infinity, Infinity, Infinity];
        this.setState(TileState.LOADED);
        const sourceTile = new VectorTile([0, 0, 0]);
        sourceTile.setState(TileState.LOADED);
        sourceTile.setProjection(getProjection('EPSG:3857'));
        sourceTile.getReplayGroup = function() {
          return replayGroup;
        };
        const key = sourceTile.tileCoord.toString();
        this.tileKeys = [key];
        this.sourceTiles_ = {};
        this.sourceTiles_[key] = sourceTile;
        this.wrappedTileCoord = arguments[0];
      }
    }

    beforeEach(function() {
      replayGroup = {};
      layer = new VectorTileLayer({
        source: new VectorTileSource({
          tileClass: TileClass,
          tileGrid: createXYZ()
        })
      });
      renderer = new CanvasVectorTileLayerRenderer(layer);
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
        layerStates: {},
        skippedFeatureUids: {},
        viewState: {
          projection: getProjection('EPSG:3857'),
          resolution: 1,
          rotation: 0
        }
      };
      frameState.layerStates[getUid(layer)] = {};
      renderer.renderedTiles = [new TileClass([0, 0, -1])];
      renderer.forEachFeatureAtCoordinate(
        coordinate, frameState, 0, spy, undefined);
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.equal(layer);
    });

    it('does not give false positives when overzoomed', function(done) {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      const extent = [1824704.739223726, 6141868.096770482, 1827150.7241288517, 6144314.081675608];
      const source = new VectorTileSource({
        format: new MVT(),
        url: 'spec/ol/data/14-8938-5680.vector.pbf',
        minZoom: 14,
        maxZoom: 14
      });
      const map = new Map({
        target: target,
        layers: [
          new VectorTileLayer({
            extent: extent,
            source: source
          })
        ],
        view: new View({
          center: getCenter(extent),
          zoom: 19
        })
      });
      source.on('tileloadend', function() {
        setTimeout(function() {
          const features = map.getFeaturesAtPixel([96, 96]);
          document.body.removeChild(target);
          map.dispose();
          expect(features).to.be(null);
          done();
        }, 200);
      });
    });

  });
});
