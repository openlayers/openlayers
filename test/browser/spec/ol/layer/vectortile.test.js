import Feature from '../../../../../src/ol/Feature.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import ImageState from '../../../../../src/ol/ImageState.js';
import Map from '../../../../../src/ol/Map.js';
import VectorTileLayer from '../../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import View from '../../../../../src/ol/View.js';
import {Icon, Style} from '../../../../../src/ol/style.js';
import {Point} from '../../../../../src/ol/geom.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import {fromLonLat, get as getProjection} from '../../../../../src/ol/proj.js';
import {getUid} from '../../../../../src/ol/util.js';
import {isEmpty} from '../../../../../src/ol/obj.js';

describe('ol.layer.VectorTile', function () {
  describe('constructor (defaults)', function () {
    let layer;

    beforeEach(function () {
      layer = new VectorTileLayer({
        source: new VectorTileSource({}),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    it('creates an instance', function () {
      expect(layer).to.be.a(VectorTileLayer);
    });

    it('provides default preload', function () {
      expect(layer.getPreload()).to.be(0);
    });

    it('provides default useInterimTilesOnError', function () {
      expect(layer.getUseInterimTilesOnError()).to.be(true);
    });

    it('provides default renderMode', function () {
      expect(layer.getRenderMode()).to.be('hybrid');
    });
  });

  describe('constructor (options)', function () {
    it('works with options', function () {
      let layer = new VectorTileLayer({
        renderMode: 'hybrid',
        source: new VectorTileSource({}),
      });
      expect(layer.getRenderMode()).to.be('hybrid');
      expect(function () {
        layer = new VectorTileLayer({
          renderMode: 'foo',
          source: new VectorTileSource({}),
        });
      }).to.throwException();
    });
  });

  describe('#getFeatures()', function () {
    let map, layer;

    beforeEach(function () {
      layer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new GeoJSON(),
          url: `data:application/json;charset=utf-8,
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [-36, 0]
                  },
                  "properties": {
                    "name": "feature1"
                  }
                },
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [36, 0]
                  },
                  "properties": {
                    "name": "feature2"
                  }
                }
              ]
            }
          `,
        }),
      });
      const container = document.createElement('div');
      container.style.width = '256px';
      container.style.height = '256px';
      document.body.appendChild(container);
      map = new Map({
        target: container,
        layers: [layer],
        view: new View({
          zoom: 0,
          center: [0, 0],
        }),
      });
    });

    afterEach(function () {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('detects features properly', function (done) {
      map.once('rendercomplete', function () {
        const pixel = map.getPixelFromCoordinate(fromLonLat([-36, 0]));
        layer
          .getFeatures(pixel)
          .then(function (features) {
            expect(features[0].get('name')).to.be('feature1');
            done();
          })
          .catch(done);
      });
    });

    it('does not give false positives', function (done) {
      map.once('rendercomplete', function () {
        const pixel = map.getPixelFromCoordinate(fromLonLat([0, 0]));
        layer
          .getFeatures(pixel)
          .then(function (features) {
            expect(features.length).to.be(0);
            done();
          })
          .catch(done);
      });
    });

    it('stores separate hit detection data for each layer that uses the source', function (done) {
      const layer2 = new VectorTileLayer({
        source: layer.getSource(),
      });
      map.addLayer(layer2);
      map.once('rendercomplete', function () {
        const pixel = map.getPixelFromCoordinate(fromLonLat([-36, 0]));
        Promise.all([layer.getFeatures(pixel), layer2.getFeatures(pixel)])
          .then(function (result) {
            const tile = layer.getSource().tileCache.get('0/0/0');
            expect(Object.keys(tile.hitDetectionImageData).length).to.be(2);
            done();
          })
          .catch(done);
      });
    });
  });

  describe('#renderFrame', function () {
    /** @type {VectorTileLayer} */ let layer;

    afterEach(function () {
      layer.dispose();
    });

    it('sets ready property to false when icons are loading', function (done) {
      const zoom = 1;
      const tileSize = 32;
      const projection = getProjection('EPSG:3857');
      const tileGrid = createXYZ({tileSize: tileSize});
      const resolution = tileGrid.getResolution(zoom);
      layer = new VectorTileLayer({
        renderBuffer: 0,
        source: new VectorTileSource({
          tileSize: tileSize,
          tileUrlFunction: (tileCoord) => tileCoord.join('/'),
          tileLoadFunction: function (tile, url) {
            const coordinate = tileGrid.getTileCoordCenter(tile.getTileCoord());
            tile.setFeatures([new Feature(new Point(coordinate))]);
          },
        }),
        style: new Style({
          image: new Icon({
            src:
              'data:image/svg+xml;base64,' +
              window.btoa(`<svg width="10" height="10" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="1" height="1"/>
              </svg>`),
          }),
        }),
      });
      const renderer = layer.getRenderer();
      const frameState =
        /** @type {import("../../../../../src/ol/Map.js").FrameState} */ ({
          pixelRatio: 1,
          viewState: {
            zoom: zoom,
            resolution: resolution,
            center: [0, 0],
            rotation: 0,
            projection: projection,
          },
          size: [2 * tileSize, 2 * tileSize],
          extent: [-tileSize, -tileSize, tileSize, tileSize].map(
            (n) => n * resolution
          ),
          viewHints: [0, 0],
          layerStatesArray: layer.getLayerStatesArray(),
          layerIndex: 0,
          wantedTiles: {},
          usedTiles: {},
          tileQueue: {isKeyQueued: () => true},
          pixelToCoordinateTransform: createTransform(),
        });

      renderer.renderFrame(frameState);
      // Tiles not yet loaded, no icon queued
      expect(renderer.ready).to.be(true);
      const source = layer.getSource();
      const wantedTiles = frameState.wantedTiles[getUid(source)];
      expect(isEmpty(wantedTiles)).to.be(false);

      // Tiles are loaded synchronously
      source.tileCache.forEach((tile) => tile.load());

      renderer.renderFrame(frameState);
      // Tiles loaded, waiting for icon
      expect(renderer.ready).to.be(false);

      layer
        .getStyle()
        .getImage()
        .listenImageChange(function (evt) {
          if (evt.target.getImageState() !== ImageState.LOADED) {
            return;
          }
          try {
            renderer.renderFrame(frameState);
            // Tiles and icon loaded
            expect(renderer.ready).to.be(true);
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });
});
