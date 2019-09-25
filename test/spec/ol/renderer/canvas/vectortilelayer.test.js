import {clear} from '../../../../../src/ol/obj.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import TileState from '../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../src/ol/VectorTile.js';
import View from '../../../../../src/ol/View.js';
import {getCenter} from '../../../../../src/ol/extent.js';
import MVT from '../../../../../src/ol/format/MVT.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorTileLayer from '../../../../../src/ol/layer/VectorTile.js';
import {getKey} from '../../../../../src/ol/tilecoord.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import {checkedFonts} from '../../../../../src/ol/render/canvas.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';
import CanvasVectorTileLayerRenderer from '../../../../../src/ol/renderer/canvas/VectorTileLayer.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import Style from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import VectorTileRenderType from '../../../../../src/ol/layer/VectorTileRenderType.js';
import {getUid} from '../../../../../src/ol/util.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';


describe('ol.renderer.canvas.VectorTileLayer', () => {

  describe('constructor', () => {

    const head = document.getElementsByTagName('head')[0];
    const font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css?family=Dancing+Script';
    font.rel = 'stylesheet';

    let map, layer, layerStyle, source, feature1, feature2, feature3, target, tileCallback;

    beforeEach(() => {
      tileCallback = function() {};
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      map = new Map({
        pixelRatio: 1,
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
          this.setFeatures([feature1, feature2, feature3]);
          this.setState(TileState.LOADED);
          tileCallback(this);
        }
      }
      source = new VectorTileSource({
        format: new MVT(),
        tileClass: TileClass,
        tileGrid: createXYZ()
      });
      source.getSourceTiles = function() {
        return [new TileClass([0, 0, 0])];
      };
      source.getTile = function() {
        const tile = VectorTileSource.prototype.getTile.apply(source, arguments);
        tile.hasContext = function() {
          return true;
        };
        tile.setState(TileState.LOADED);
        return tile;
      };
      layer = new VectorTileLayer({
        source: source,
        style: layerStyle
      });
      map.addLayer(layer);
    });

    afterEach(() => {
      document.body.removeChild(target);
      map.dispose();
    });

    test('creates a new instance', () => {
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      expect(renderer).toBeInstanceOf(CanvasVectorTileLayerRenderer);
      expect(renderer.getLayer()).toBe(layer);
    });

    test('does not render replays for pure image rendering', () => {
      const testLayer = new VectorTileLayer({
        renderMode: VectorTileRenderType.IMAGE,
        source: source,
        style: layerStyle
      });
      map.removeLayer(layer);
      map.addLayer(testLayer);
      const spy = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'getRenderTransform');
      map.renderSync();
      expect(spy.callCount).toBe(0);
      spy.restore();
    });

    test('renders both replays and images for hybrid rendering', () => {
      const spy1 = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'getRenderTransform');
      const spy2 = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'renderTileImage_');
      map.renderSync();
      expect(spy1.callCount).toBe(1);
      expect(spy2.callCount).toBe(1);
      spy1.restore();
      spy2.restore();
    });

    test('renders replays with custom renderers as direct replays', () => {
      layer.setStyle(new Style({
        renderer: function() {}
      }));
      const spy = sinon.spy(CanvasVectorTileLayerRenderer.prototype,
        'getRenderTransform');
      map.renderSync();
      expect(spy.callCount).toBe(1);
      spy.restore();
    });

    test('gives precedence to feature styles over layer styles', () => {
      const spy = sinon.spy(layer.getRenderer(),
        'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).toBe(layer.getStyle());
      expect(spy.getCall(1).args[2]).toBe(feature2.getStyle());
      spy.restore();
    });

    test('does not re-render for unavailable fonts', done => {
      map.renderSync();
      clear(checkedFonts);
      layerStyle[0].getText().setFont('12px "Unavailable font",sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).toBe(revision);
        done();
      }, 800);
    });

    test('does not re-render for available fonts', done => {
      map.renderSync();
      clear(checkedFonts);
      layerStyle[0].getText().setFont('12px sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function() {
        expect(layer.getRevision()).toBe(revision);
        done();
      }, 800);
    });

    test('re-renders for fonts that become available', done => {
      map.renderSync();
      clear(checkedFonts);
      head.appendChild(font);
      layerStyle[0].getText().setFont('12px "Dancing Script",sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function() {
        head.removeChild(font);
        expect(layer.getRevision()).toBe(revision + 1);
        done();
      }, 1600);
    });

    test('works for multiple layers that use the same source', () => {
      const layer2 = new VectorTileLayer({
        source: source,
        style: new Style({
          text: new Text({
            text: 'layer2'
          })
        })
      });
      map.addLayer(layer2);

      map.renderSync();
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(Object.keys(tile.executorGroups)[0]).toBe(getUid(layer));
      expect(Object.keys(tile.executorGroups)[1]).toBe(getUid(layer2));
    });

    test(
      'reuses render container and adds and removes overlay context',
      done => {
        map.getLayers().insertAt(0, new TileLayer({
          source: new XYZ({
            url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
          })
        }));
        map.once('postcompose', function(e) {
          expect(e.frameState.layerStatesArray[1].hasOverlay).toBe(true);
        });
        map.once('rendercomplete', function() {
          expect(document.querySelector('.ol-layers').childElementCount).toBe(1);
          expect(document.querySelector('.ol-layer').childElementCount).toBe(2);
          map.removeLayer(map.getLayers().item(1));
          map.renderSync();
          expect(document.querySelector('.ol-layer').childElementCount).toBe(1);
          done();
        });
      }
    );

  });

  describe('#prepareFrame', () => {
    test('re-renders when layer changed', () => {
      const layer = new VectorTileLayer({
        source: new VectorTileSource({
          tileGrid: createXYZ(),
          transition: 0
        })
      });
      const sourceTile = new VectorTile([0, 0, 0], 2);
      sourceTile.features_ = [];
      sourceTile.getImage = function() {
        return document.createElement('canvas');
      };
      const tile = new VectorRenderTile([0, 0, 0], 1, [0, 0, 0], createXYZ(),
        function() {
          return sourceTile;
        },
        function() {});
      tile.transition_ = 0;
      tile.setState(TileState.LOADED);
      layer.getSource().getTile = function() {
        return tile;
      };
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      renderer.isDrawableTile = function() {
        return true;
      };
      const proj = getProjection('EPSG:3857');
      const frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
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
      renderer.renderFrame(frameState);
      const replayState = renderer.renderedTiles[0].getReplayState(layer);
      const revision = replayState.renderedTileRevision;
      renderer.renderFrame(frameState, null);
      expect(replayState.renderedTileRevision).toBe(revision);
      layer.changed();
      renderer.renderFrame(frameState, null);
      expect(replayState.renderedTileRevision).toBe(revision + 1);
      expect(Object.keys(renderer.tileListenerKeys_).length).toBe(0);
    });
  });

  describe('#forEachFeatureAtCoordinate', () => {
    let layer, renderer, executorGroup, source;
    class TileClass extends VectorRenderTile {
      constructor() {
        super(...arguments);
        this.setState(TileState.LOADED);
        this.wrappedTileCoord = arguments[0];
      }
    }

    beforeEach(() => {
      const sourceTile = new VectorTile([0, 0, 0]);
      sourceTile.setState(TileState.LOADED);
      source = new VectorTileSource({
        tileClass: TileClass,
        tileGrid: createXYZ()
      });
      source.sourceTileByCoordKey_[getKey(sourceTile.tileCoord)] = sourceTile;
      source.sourceTilesByTileKey_[sourceTile.getKey()] = [sourceTile];
      executorGroup = {};
      source.getTile = function() {
        const tile = VectorTileSource.prototype.getTile.apply(source, arguments);
        tile.executorGroups[getUid(layer)] = [executorGroup];
        return tile;
      };
      layer = new VectorTileLayer({
        source: source
      });
      renderer = new CanvasVectorTileLayerRenderer(layer);
      executorGroup.forEachFeatureAtCoordinate = function(coordinate,
        resolution, rotation, hitTolerance, callback) {
        const feature = new Feature();
        callback(feature);
        callback(feature);
      };
    });

    test('calls callback once per feature with a layer as 2nd arg', () => {
      const spy = sinon.spy();
      const coordinate = [0, 0];
      const frameState = {
        layerStatesArray: [{}],
        viewState: {
          projection: getProjection('EPSG:3857'),
          resolution: 1,
          rotation: 0
        }
      };
      renderer.renderedTiles = [source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'))];
      renderer.forEachFeatureAtCoordinate(
        coordinate, frameState, 0, spy, undefined);
      expect(spy.callCount).toBe(1);
      expect(spy.getCall(0).args[1]).toBe(layer);
    });

    test('does not give false positives when overzoomed', done => {
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
          expect(features).toBeInstanceOf(Array);
          expect(features).toHaveLength(0);
          done();
        }, 200);
      });
    });

  });
});
