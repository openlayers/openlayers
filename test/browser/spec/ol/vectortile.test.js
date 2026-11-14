import {assert} from 'chai';
import Feature from '../../../../src/ol/Feature.js';
import VectorTile from '../../../../src/ol/VectorTile.js';
import {listen} from '../../../../src/ol/events.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import MVT from '../../../../src/ol/format/MVT.js';
import Point from '../../../../src/ol/geom/Point.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';
import RenderFeature from '../../../../src/ol/render/Feature.js';
import {defaultLoadFunction} from '../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

describe('ol.VectorTile', function () {
  it('loader reprojects GeoJSON features', () =>
    new Promise((resolve) => {
      const format = new GeoJSON();
      const tile = new VectorTile([0, 0, 0], null, null, format);
      const url = 'spec/ol/data/point.json';
      defaultLoadFunction(tile, url);
      const loader = tile.loader_;
      listen(tile, 'change', function (e) {
        assert.deepEqual(
          tile.getFeatures()[0].getGeometry().getFlatCoordinates(),
          [-9724792.346778862, 4164041.638405114],
        );
        resolve();
      });
      loader.call(tile, [], 1, getProjection('EPSG:3857'));
    }));

  it('loader reprojects MVT features', () =>
    new Promise((resolve) => {
      const format = new MVT();
      const tileGrid = createXYZ({
        tileSize: 512,
      });
      const tile = new VectorTile([14, 8938, 5680], null, null, format);
      const url = 'spec/ol/data/14-8938-5680.vector.pbf';
      defaultLoadFunction(tile, url);
      const loader = tile.loader_;
      listen(tile, 'change', function (e) {
        assert.deepEqual(
          tile.getFeatures()[1246].getGeometry().getFlatCoordinates(),
          [1827804.0218549764, 6144812.116688028],
        );
        resolve();
      });
      const extent = tileGrid.getTileCoordExtent(tile.tileCoord);
      loader.call(tile, extent, 1, getProjection('EPSG:3857'));
    }));

  describe('#getFeaturesInProjection', function () {
    const mercator = getProjection('EPSG:3857');
    const geographic = getProjection('EPSG:4326');
    const bern = transform([7.44, 46.95], 'EPSG:4326', 'EPSG:3857');
    const createTile = () => {
      const tile = new VectorTile([0, 0, 0], null, null, new MVT());
      tile.projection = mercator;
      tile.setFeatures([new RenderFeature('Point', bern.slice(), [], 2)]);
      return tile;
    };

    it('returns the features as they are in their own projection', function () {
      const tile = createTile();
      assert.strictEqual(
        tile.getFeaturesInProjection(mercator),
        tile.getFeatures(),
      );
    });

    it('transforms copies once, and leaves the originals alone', function () {
      const tile = createTile();
      const features = tile.getFeaturesInProjection(geographic);
      const coordinates = features[0].getGeometry().getFlatCoordinates();
      assert.approximately(coordinates[0], 7.44, 1e-9);
      assert.approximately(coordinates[1], 46.95, 1e-9);
      assert.deepEqual(tile.getFeatures()[0].getFlatCoordinates(), bern);
      assert.strictEqual(tile.getFeaturesInProjection(geographic), features);
    });

    it('does not keep copies of editable features', function () {
      const tile = new VectorTile([0, 0, 0], null, null, new MVT());
      tile.projection = mercator;
      const feature = new Feature(new Point(bern.slice()));
      tile.setFeatures([feature]);
      const first = tile.getFeaturesInProjection(geographic);
      assert.notStrictEqual(tile.getFeaturesInProjection(geographic), first);

      // A change to the original shows in the next copy.
      feature.getGeometry().setCoordinates([0, 0]);
      const coordinates = tile
        .getFeaturesInProjection(geographic)[0]
        .getGeometry()
        .getFlatCoordinates();
      assert.deepEqual(coordinates, [0, 0]);
    });

    it('transforms again once the features are replaced', function () {
      const tile = createTile();
      const before = tile.getFeaturesInProjection(geographic);
      tile.setFeatures([new RenderFeature('Point', [0, 0], [], 2)]);
      const after = tile.getFeaturesInProjection(geographic);
      assert.notStrictEqual(after, before);
      assert.deepEqual(after[0].getGeometry().getFlatCoordinates(), [0, 0]);
    });
  });
});
