import {assert} from 'chai';
import GeoTIFFSource from '../../../../../src/ol/source/GeoTIFF.js';
import TileDebug from '../../../../../src/ol/source/TileDebug.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

describe('ol/source/TileDebug', function () {
  it('applies default options', function () {
    const debugSource = new TileDebug();
    assert.strictEqual(debugSource.getProjection().getCode(), 'EPSG:3857');
    assert.strictEqual(debugSource.getProjection().getUnits(), 'm');
    assert.deepEqual(
      debugSource.getTileGrid().getExtent(),
      [
        -20037508.342789244, -20037508.342789244, 20037508.342789244,
        20037508.342789244,
      ],
    );
    assert.strictEqual(debugSource.getTileGrid().getResolutions().length, 43);
    assert.strictEqual(
      debugSource.getTileGrid().getResolution(0),
      156543.03392804097,
    );
    assert.strictEqual(debugSource.getWrapX(), true);
    assert.strictEqual(debugSource.zDirection, 0);
  });

  it('applies options from another source', () =>
    new Promise((resolve) => {
      const cogSource = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      const debugSource = new TileDebug({
        source: cogSource,
      });
      cogSource.getView().then(() => {
        assert.strictEqual(debugSource.getProjection().getCode(), 'EPSG:4326');
        assert.strictEqual(debugSource.getProjection().getUnits(), 'degrees');
        assert.deepEqual(
          debugSource.getTileGrid().getExtent(),
          [-180, -90, 180, 90],
        );
        assert.strictEqual(
          debugSource.getTileGrid().getResolutions().length,
          1,
        );
        assert.strictEqual(
          debugSource.getTileGrid().getResolution(0),
          0.703125,
        );
        assert.strictEqual(debugSource.getWrapX(), false);
        assert.strictEqual(debugSource.zDirection, 0);
        resolve();
      });
    }));

  it('overrides options from another source', () =>
    new Promise((resolve) => {
      const cogSource = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      const debugSource = new TileDebug({
        source: cogSource,
        projection: 'EPSG:3857',
        tileGrid: createXYZ(),
        wrapX: true,
        zDirection: 1,
      });
      cogSource.getView().then(() => {
        assert.strictEqual(debugSource.getProjection().getCode(), 'EPSG:3857');
        assert.strictEqual(debugSource.getProjection().getUnits(), 'm');
        assert.deepEqual(
          debugSource.getTileGrid().getExtent(),
          [
            -20037508.342789244, -20037508.342789244, 20037508.342789244,
            20037508.342789244,
          ],
        );
        assert.strictEqual(
          debugSource.getTileGrid().getResolutions().length,
          43,
        );
        assert.strictEqual(
          debugSource.getTileGrid().getResolution(0),
          156543.03392804097,
        );
        assert.strictEqual(debugSource.getWrapX(), true);
        assert.strictEqual(debugSource.zDirection, 1);
        resolve();
      });
    }));
});
