import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import ImageState from '../../../../../src/ol/ImageState.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import Point from '../../../../../src/ol/geom/Point.js';
import {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import VectorTileLayer from '../../../../../src/ol/layer/VectorTile.js';
import {isEmpty} from '../../../../../src/ol/obj.js';
import {fromLonLat, get as getProjection} from '../../../../../src/ol/proj.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import Style from '../../../../../src/ol/style/Style.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';
import {getUid} from '../../../../../src/ol/util.js';

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
      assert.instanceOf(layer, VectorTileLayer);
    });

    it('provides default preload', function () {
      assert.strictEqual(layer.getPreload(), 0);
    });

    it('provides default useInterimTilesOnError', function () {
      assert.strictEqual(layer.getUseInterimTilesOnError(), true);
    });

    it('provides default renderMode', function () {
      assert.strictEqual(layer.getRenderMode(), 'hybrid');
    });
  });

  describe('constructor (options)', function () {
    it('works with options', function () {
      let layer = new VectorTileLayer({
        renderMode: 'hybrid',
        source: new VectorTileSource({}),
      });
      assert.strictEqual(layer.getRenderMode(), 'hybrid');
      assert.throws(function () {
        layer = new VectorTileLayer({
          renderMode: 'foo',
          source: new VectorTileSource({}),
        });
      });
    });
  });

  describe('#getFeatures()', function () {
    let map, layer, objectURL;

    beforeEach(function () {
      objectURL = URL.createObjectURL(
        new Blob(
          [
            `{
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
      }`,
          ],
          {type: 'application/json'},
        ),
      );
      layer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new GeoJSON(),
          url: objectURL,
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
      disposeMap(map);
      URL.revokeObjectURL(objectURL);
    });

    it('detects features properly', function (done) {
      map.once('rendercomplete', function () {
        const pixel = map.getPixelFromCoordinate(fromLonLat([-36, 0]));
        layer
          .getFeatures(pixel)
          .then(function (features) {
            assert.strictEqual(features[0].get('name'), 'feature1');
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
            assert.strictEqual(features.length, 0);
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
            const tile = layer
              .getRenderer()
              .tileCache_.get(
                `${getUid(layer.getSource())},${objectURL},0/0/0`,
              );
            assert.strictEqual(
              Object.keys(tile.hitDetectionImageData).length,
              1,
            );
            const tile2 = layer2
              .getRenderer()
              .tileCache_.get(
                `${getUid(layer.getSource())},${objectURL},0/0/0`,
              );
            assert.strictEqual(
              Object.keys(tile2.hitDetectionImageData).length,
              1,
            );
            done();
          })
          .catch(done);
      });
    });
  });

  describe('getFeatuersInExtent', function () {
    let map, layer, target;

    beforeEach(function () {
      const source = new VectorTileSource({
        maxZoom: 15,
        tileSize: 256,
        url: '{z}/{x}/{y}',
        tileLoadFunction: function (tile) {
          const extent = source
            .getTileGrid()
            .getTileCoordExtent(tile.tileCoord);
          const feature = new Feature(fromExtent(extent));
          feature.setId(tile.tileCoord.toString());
          feature.set('z', tile.tileCoord[0]);
          tile.setFeatures([feature]);
        },
      });
      layer = new VectorTileLayer({source});
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('returns an empty array when no tiles are in the cache', function () {
      layer.getRenderer().getTileCache().clear();
      const extent = map.getView().calculateExtent(map.getSize());
      assert.strictEqual(layer.getFeaturesInExtent(extent).length, 0);
    });

    it('returns features in extent for the last rendered z', function (done) {
      map.getView().setZoom(15);
      map.once('rendercomplete', function () {
        const extent = map.getView().calculateExtent(map.getSize());
        const features = layer.getFeaturesInExtent(extent);
        assert.strictEqual(features.length, 4);
        const keys = {};
        features.forEach((feature) => {
          assert.strictEqual(feature.get('z'), 15);
          assert.strictEqual(feature.getId() in keys, false);
          keys[feature.getId()] = true;
        });
        map.getView().setZoom(0);
        map.once('rendercomplete', function () {
          const extent = map.getView().calculateExtent(map.getSize());
          const features = layer.getFeaturesInExtent(extent);
          assert.strictEqual(features.length, 1);
          features.forEach((feature) => {
            assert.strictEqual(feature.get('z'), 0);
            assert.strictEqual(feature.getId() in keys, false);
            keys[feature.getId()] = true;
          });
          done();
        });
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
            (n) => n * resolution,
          ),
          viewHints: [0, 0],
          layerStatesArray: layer.getLayerStatesArray(),
          layerIndex: 0,
          wantedTiles: {},
          usedTiles: {},
          tileQueue: {isKeyQueued: () => true},
          pixelToCoordinateTransform: createTransform(),
          postRenderFunctions: [],
        });

      renderer.renderFrame(frameState);
      assert.strictEqual(renderer.ready, true);
      const source = layer.getSource();
      const wantedTiles = frameState.wantedTiles[getUid(source)];
      assert.strictEqual(isEmpty(wantedTiles), false);

      // Tiles are loaded synchronously
      renderer.tileCache_.forEach((tile) => tile.load());

      renderer.renderFrame(frameState);
      assert.strictEqual(renderer.ready, false);

      layer
        .getStyle()
        .getImage()
        .listenImageChange(function (evt) {
          if (evt.target.getImageState() !== ImageState.LOADED) {
            return;
          }
          try {
            renderer.renderFrame(frameState);
            assert.strictEqual(renderer.ready, true);
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });
});
