import CanvasVectorTileLayerRenderer from '../../../../../../src/ol/renderer/canvas/VectorTileLayer.js';
import Feature from '../../../../../../src/ol/Feature.js';
import MVT from '../../../../../../src/ol/format/MVT.js';
import Map from '../../../../../../src/ol/Map.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import RenderFeature from '../../../../../../src/ol/render/Feature.js';
import Style from '../../../../../../src/ol/style/Style.js';
import Text from '../../../../../../src/ol/style/Text.js';
import TileLayer from '../../../../../../src/ol/layer/Tile.js';
import TileState from '../../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../../src/ol/VectorTile.js';
import VectorTileLayer from '../../../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../../../src/ol/source/VectorTile.js';
import View from '../../../../../../src/ol/View.js';
import XYZ from '../../../../../../src/ol/source/XYZ.js';
import {checkedFonts} from '../../../../../../src/ol/render/canvas.js';
import {create} from '../../../../../../src/ol/transform.js';
import {createFontStyle} from '../../../util.js';
import {createXYZ} from '../../../../../../src/ol/tilegrid.js';
import {getCenter} from '../../../../../../src/ol/extent.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import {getUid} from '../../../../../../src/ol/util.js';

describe('ol/renderer/canvas/VectorTileLayer', function () {
  describe('constructor', function () {
    const fontFamily = 'Ubuntu - VectorTileLayerTest';
    const font = createFontStyle({
      fontFamily: fontFamily,
      src: {
        url: '/spec/ol/data/fonts/ubuntu-regular-webfont.woff2',
        format: 'woff2',
      },
    });

    let map,
      layer,
      layerStyle,
      source,
      feature1,
      feature2,
      feature3,
      target,
      tileCallback;

    beforeEach(function () {
      tileCallback = function () {};
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      map = new Map({
        pixelRatio: 1,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
        target: target,
      });
      layerStyle = [
        new Style({
          text: new Text({
            text: 'layer',
          }),
        }),
      ];
      const featureStyle = [
        new Style({
          text: new Text({
            text: 'feature',
          }),
        }),
      ];
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
        tileGrid: createXYZ(),
        url: '{z}/{x}/{y}.pbf',
      });
      source.getSourceTiles = function () {
        return [new TileClass([0, 0, 0])];
      };
      source.getTile = function () {
        const tile = VectorTileSource.prototype.getTile.apply(
          source,
          arguments
        );
        tile.hasContext = function () {
          return true;
        };
        tile.setState(TileState.LOADED);
        return tile;
      };
      layer = new VectorTileLayer({
        source: source,
        style: layerStyle,
      });
      map.addLayer(layer);
    });

    afterEach(function () {
      document.body.removeChild(target);
      map.dispose();
    });

    it('creates a new instance', function () {
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      expect(renderer).to.be.a(CanvasVectorTileLayerRenderer);
      expect(renderer.getLayer()).to.be(layer);
    });

    it('does not render images for pure vector rendering', function () {
      const testLayer = new VectorTileLayer({
        renderMode: 'vector',
        source: source,
        style: layerStyle,
      });
      map.removeLayer(layer);
      map.addLayer(testLayer);
      const spy = sinon.spy(
        CanvasVectorTileLayerRenderer.prototype,
        'renderTileImage_'
      );
      map.renderSync();
      expect(spy.callCount).to.be(0);
      spy.restore();
    });

    it('renders both replays and images for hybrid rendering', function () {
      const spy1 = sinon.spy(
        CanvasVectorTileLayerRenderer.prototype,
        'getRenderTransform'
      );
      const spy2 = sinon.spy(
        CanvasVectorTileLayerRenderer.prototype,
        'renderTileImage_'
      );
      map.renderSync();
      expect(spy1.callCount).to.be(1);
      expect(spy2.callCount).to.be(1);
      spy1.restore();
      spy2.restore();
    });

    it('renders replays with custom renderers as direct replays', function () {
      layer.setStyle(
        new Style({
          renderer: function () {},
        })
      );
      const spy = sinon.spy(
        CanvasVectorTileLayerRenderer.prototype,
        'getRenderTransform'
      );
      map.renderSync();
      expect(spy.callCount).to.be(1);
      spy.restore();
    });

    it('gives precedence to feature styles over layer styles', function () {
      const spy = sinon.spy(layer.getRenderer(), 'renderFeature');
      map.renderSync();
      expect(spy.getCall(0).args[2]).to.be(layer.getStyle());
      expect(spy.getCall(1).args[2]).to.be(feature2.getStyle());
      spy.restore();
    });

    it('does not re-render for unavailable fonts', function (done) {
      map.renderSync();
      checkedFonts.values_ = {};
      layerStyle[0].getText().setFont('12px "Unavailable font",sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function () {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('does not re-render for available fonts', function (done) {
      map.renderSync();
      checkedFonts.values_ = {};
      layerStyle[0].getText().setFont('12px sans-serif');
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function () {
        expect(layer.getRevision()).to.be(revision);
        done();
      }, 800);
    });

    it('re-renders for fonts that become available', function (done) {
      map.renderSync();
      checkedFonts.values_ = {};
      font.add();
      layerStyle[0].getText().setFont(`12px "${fontFamily}",sans-serif`);
      layer.changed();
      const revision = layer.getRevision();
      setTimeout(function () {
        try {
          font.remove();
          expect(layer.getRevision()).to.be(revision + 1);
          done();
        } catch (e) {
          done(e);
        }
      }, 1600);
    });

    it('works for multiple layers that use the same source', function () {
      const layer2 = new VectorTileLayer({
        source: source,
        style: new Style({
          text: new Text({
            text: 'layer2',
          }),
        }),
      });
      map.addLayer(layer2);

      map.renderSync();
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(Object.keys(tile.executorGroups)[0]).to.be(getUid(layer));
      expect(Object.keys(tile.executorGroups)[1]).to.be(getUid(layer2));
    });

    it('reuses render container and adds and removes overlay context', function (done) {
      map.getLayers().insertAt(
        0,
        new TileLayer({
          source: new XYZ({
            url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
          }),
        })
      );
      map.once('rendercomplete', function () {
        expect(document.querySelector('.ol-layers').childElementCount).to.be(1);
        expect(document.querySelector('.ol-layer').childElementCount).to.be(1);
        map.removeLayer(map.getLayers().item(1));
        map.renderSync();
        expect(document.querySelector('.ol-layer').childElementCount).to.be(1);
        done();
      });
    });

    it('reuses render container when previous layer has a background', function (done) {
      map.getLayers().insertAt(
        0,
        new TileLayer({
          background: 'rgb(255, 0, 0)',
          source: new XYZ({
            url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
          }),
        })
      );
      map.once('rendercomplete', function () {
        expect(document.querySelector('.ol-layers').childElementCount).to.be(1);
        expect(document.querySelector('.ol-layer').childElementCount).to.be(1);
        map.removeLayer(map.getLayers().item(1));
        map.renderSync();
        expect(document.querySelector('.ol-layer').childElementCount).to.be(1);
        done();
      });
    });

    it('does not reuse render container when backgrounds are different', function (done) {
      map.getLayers().insertAt(
        0,
        new TileLayer({
          background: 'rgb(255, 0, 0)',
          source: new XYZ({
            url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
          }),
        })
      );
      map.getLayers().insertAt(
        0,
        new TileLayer({
          background: 'rgba(255, 0, 0, 0.1)',
          source: new XYZ({
            url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
          }),
        })
      );
      map.once('rendercomplete', function () {
        expect(document.querySelector('.ol-layers').childElementCount).to.be(2);
        expect(document.querySelector('.ol-layer').childElementCount).to.be(1);
        map.removeLayer(map.getLayers().item(1));
        map.renderSync();
        expect(document.querySelector('.ol-layers').childElementCount).to.be(1);
        done();
      });
    });

    it('sets the configured background (string) on the container', function (done) {
      layer.setBackground('rgba(255, 0, 0, 0.5)');
      map.once('rendercomplete', function () {
        expect(layer.getRenderer().container.style.backgroundColor).to.be(
          'rgba(255, 0, 0, 0.5)'
        );
        done();
      });
    });

    it('sets the configured background (function) on the container', function (done) {
      layer.setBackground(function (resolution) {
        expect(resolution).to.be(map.getView().getResolution());
        return 'rgba(255, 0, 0, 0.5)';
      });
      map.once('rendercomplete', function () {
        expect(layer.getRenderer().container.style.backgroundColor).to.be(
          'rgba(255, 0, 0, 0.5)'
        );
        done();
      });
    });

    it('changes background when function returns a different color', function (done) {
      let first = true;
      layer.setBackground(function (resolution) {
        expect(resolution).to.be(map.getView().getResolution());
        const background = first === true ? undefined : 'rgba(255, 0, 0, 0.5)';
        first = false;
        return background;
      });
      map.once('rendercomplete', function () {
        expect(layer.getRenderer().container.style.backgroundColor).to.be('');
        map.renderSync();
        expect(layer.getRenderer().container.style.backgroundColor).to.be(
          'rgba(255, 0, 0, 0.5)'
        );
        done();
      });
    });
  });

  describe('#prepareFrame', function () {
    it('re-renders when layer changed', function () {
      const layer = new VectorTileLayer({
        source: new VectorTileSource({
          tileGrid: createXYZ(),
          transition: 0,
        }),
      });
      const sourceTile = new VectorTile([0, 0, 0], 2);
      sourceTile.features_ = [];
      sourceTile.getImage = function () {
        return document.createElement('canvas');
      };
      const tile = new VectorRenderTile([0, 0, 0], 1, [0, 0, 0], function () {
        return sourceTile;
      });
      tile.transition_ = 0;
      tile.setState(TileState.LOADED);
      layer.getSource().getTile = function () {
        return tile;
      };
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      renderer.isDrawableTile = function () {
        return true;
      };
      const proj = getProjection('EPSG:3857');
      const frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: proj.getExtent(),
        pixelRatio: 1,
        pixelToCoordinateTransform: create(),
        time: Date.now(),
        viewHints: [],
        viewState: {
          center: [0, 0],
          resolution: 156543.03392804097,
          projection: proj,
        },
        size: [256, 256],
        usedTiles: {},
        wantedTiles: {},
      };
      renderer.renderFrame(frameState);
      const replayState = renderer.renderedTiles[0].getReplayState(layer);
      const revision = replayState.renderedTileRevision;
      renderer.renderFrame(frameState, null);
      expect(replayState.renderedTileRevision).to.be(revision);
      layer.changed();
      renderer.renderFrame(frameState, null);
      expect(replayState.renderedTileRevision).to.be(revision + 1);
    });
  });

  describe('#renderFrame', function () {
    it('uses correct image - vector sequence in vector mode', function () {
      const layer = new VectorTileLayer({
        renderMode: 'vector',
        source: new VectorTileSource({
          tileGrid: createXYZ(),
        }),
      });
      const sourceTile = new VectorTile([0, 0, 0], 2);
      sourceTile.features_ = [new RenderFeature('Point', [0, 0])];
      sourceTile.getImage = function () {
        return document.createElement('canvas');
      };
      layer.getSource().getSourceTiles = () => [sourceTile];
      const tile = new VectorRenderTile([0, 0, 0], 1, [0, 0, 0], function () {
        return sourceTile;
      });
      tile.transition_ = 0;
      tile.replayState_[getUid(layer)] = [{dirty: true}];
      tile.setState(TileState.LOADED);
      layer.getSource().getTile = function () {
        return tile;
      };
      const renderer = new CanvasVectorTileLayerRenderer(layer);
      renderer.isDrawableTile = function () {
        return true;
      };
      const proj = getProjection('EPSG:3857');
      const frameState = {
        layerStatesArray: [layer.getLayerState()],
        layerIndex: 0,
        extent: proj.getExtent(),
        pixelRatio: 1,
        pixelToCoordinateTransform: create(),
        time: Date.now(),
        viewHints: [],
        viewState: {
          center: [0, 0],
          resolution: 156543.03392804097,
          projection: proj,
        },
        size: [256, 256],
        usedTiles: {},
        wantedTiles: {},
      };

      renderer.container = {};
      const sequence = [];
      renderer.context = {
        clearRect: () => sequence.push('clearRect'),
        save: () => sequence.push('save'),
        restore: () => sequence.push('restore'),
        beginPath: () => sequence.push('beginPath'),
        moveTo: () => sequence.push('moveTo'),
        lineTo: () => sequence.push('lineTo'),
        clip: () => sequence.push('clip'),
        canvas: {
          style: {
            transform: '',
          },
        },
      };

      layer.on('prerender', () => sequence.push('prerender'));
      layer.on('postrender', () => sequence.push('postrender'));
      renderer.renderFrame(frameState);
      expect(sequence).to.eql([
        'prerender',
        'clearRect',
        'save',
        'beginPath',
        'moveTo',
        'lineTo',
        'lineTo',
        'lineTo',
        'clip',
        'restore',
        'postrender',
      ]);
    });
  });

  describe('#forEachFeatureAtCoordinate', function () {
    /** @type {VectorTileLayer] */ let layer;
    /** @type {CanvasVectorTileLayerRenderer} */ let renderer;
    /** @type {VectorTileSource} */ let source;
    let executorGroup;
    class TileClass extends VectorRenderTile {
      constructor() {
        super(...arguments);
        this.setState(TileState.LOADED);
        this.wrappedTileCoord = arguments[0];
      }
    }

    beforeEach(function () {
      const sourceTile = new VectorTile([0, 0, 0]);
      sourceTile.setState(TileState.LOADED);
      source = new VectorTileSource({
        tileClass: TileClass,
        tileGrid: createXYZ(),
      });
      source.sourceTileCache.set('0/0/0.mvt', sourceTile);
      executorGroup = {};
      executorGroup.forEachFeatureAtCoordinate = function (
        coordinate,
        resolution,
        rotation,
        hitTolerance,
        callback
      ) {
        const feature = new Feature(new Point([0, 0]));
        const distanceSq = 0;
        callback(feature, feature.getGeometry(), distanceSq);
        callback(feature, feature.getGeometry(), distanceSq);
      };
      source.getTile = function () {
        const tile = VectorTileSource.prototype.getTile.apply(
          source,
          arguments
        );
        tile.sourceTiles = [sourceTile];
        tile.executorGroups[getUid(layer)] = [executorGroup];
        return tile;
      };
      layer = new VectorTileLayer({
        source: source,
      });
      renderer = new CanvasVectorTileLayerRenderer(layer);
    });

    it('calls callback once per feature with a layer as 2nd arg', function () {
      const spy = sinon.spy();
      const coordinate = [0, 0];
      const matches = [];
      const frameState = {
        layerStatesArray: [{}],
        viewState: {
          projection: getProjection('EPSG:3857'),
          resolution: 1,
          rotation: 0,
        },
      };
      renderer.renderedTiles = [
        source.getTile(0, 0, 0, 1, getProjection('EPSG:3857')),
      ];
      renderer.forEachFeatureAtCoordinate(
        coordinate,
        frameState,
        0,
        spy,
        matches
      );
      expect(spy.callCount).to.be(1);
      expect(spy.getCall(0).args[1]).to.be(layer);
      expect(matches).to.be.empty();
    });

    it('does not give false positives when overzoomed', function (done) {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      const extent = [
        1824704.739223726, 6141868.096770482, 1827150.7241288517,
        6144314.081675608,
      ];
      const source = new VectorTileSource({
        format: new MVT(),
        url: 'spec/ol/data/14-8938-5680.vector.pbf',
        minZoom: 14,
        maxZoom: 14,
      });
      const map = new Map({
        target: target,
        layers: [
          new VectorTileLayer({
            extent: extent,
            source: source,
          }),
        ],
        view: new View({
          center: getCenter(extent),
          zoom: 19,
        }),
      });
      source.on('tileloadend', function () {
        setTimeout(function () {
          const features = map.getFeaturesAtPixel([96, 96]);
          document.body.removeChild(target);
          map.dispose();
          expect(features).to.be.an(Array);
          expect(features).to.be.empty();
          done();
        }, 200);
      });
    });
  });
});
