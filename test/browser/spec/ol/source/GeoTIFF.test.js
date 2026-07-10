import {assert} from 'chai';
import TileState from '../../../../../src/ol/TileState.js';
import {get} from '../../../../../src/ol/proj.js';
import GeoTIFFSource from '../../../../../src/ol/source/GeoTIFF.js';

describe('ol/source/GeoTIFF', function () {
  describe('constructor', function () {
    it('sets convertToRGB false by default', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.convertToRGB_, false);
    });

    it('respects the convertToRGB option', function () {
      const source = new GeoTIFFSource({
        convertToRGB: true,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.convertToRGB_, true);
    });

    it('accepts auto convertToRGB', function () {
      const source = new GeoTIFFSource({
        convertToRGB: 'auto',
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.convertToRGB_, 'auto');
    });

    it('defaults to wrapX: false', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.getWrapX(), false);
    });

    it('allows wrapX to be set', function () {
      const source = new GeoTIFFSource({
        wrapX: true,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.getWrapX(), true);
    });

    it('defaults to projection: null', function () {
      const source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.getProjection(), null);
    });

    it('allows projection to be set', function () {
      const projection = 'EPSG:4326';
      const expected = get(projection);
      const source = new GeoTIFFSource({
        projection,
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
      assert.strictEqual(source.getProjection(), expected);
    });

    it('generates Float32Array data if normalize is set to false', () =>
      new Promise((resolve) => {
        const source = new GeoTIFFSource({
          normalize: false,
          sources: [{url: 'spec/ol/source/images/0-0-0.tif'}],
        });
        source.on('change', () => {
          const tile = source.getTile(0, 0, 0);
          source.on('tileloadend', () => {
            assert.strictEqual(tile.getState(), TileState.LOADED);
            assert.instanceOf(tile.getData(), Float32Array);
            resolve();
          });
          tile.load();
        });
      }));

    it('generates Uint8Array data if normalize is not set to false', () =>
      new Promise((resolve) => {
        const source = new GeoTIFFSource({
          sources: [{url: 'spec/ol/source/images/0-0-0.tif'}],
        });
        source.on('change', () => {
          const tile = source.getTile(0, 0, 0);
          source.on('tileloadend', () => {
            assert.strictEqual(tile.getState(), TileState.LOADED);
            assert.instanceOf(tile.getData(), Uint8Array);
            resolve();
          });
          tile.load();
        });
      }));

    it('loads from blob', () =>
      new Promise((resolve) => {
        fetch('spec/ol/source/images/0-0-0.tif')
          .then((response) => response.blob())
          .then((blob) => {
            const source = new GeoTIFFSource({
              sources: [{blob: blob}],
            });
            source.on('change', () => {
              const tile = source.getTile(0, 0, 0);
              source.on('tileloadend', () => {
                assert.strictEqual(tile.getState(), TileState.LOADED);
                assert.instanceOf(tile.getData(), Uint8Array);
                resolve();
              });
              tile.load();
            });
          });
      }));

    it('loads from a custom loader', () =>
      new Promise((resolve) => {
        const fetchUrl = 'spec/ol/source/images/0-0-0.tif';
        let called = false;
        const source = new GeoTIFFSource({
          sources: [
            {
              url: fetchUrl,
              loader: (url, headers, abortSignal) => {
                called = true;
                return fetch(url, {headers, signal: abortSignal});
              },
            },
          ],
        });
        source.on('change', () => {
          if (source.getState() !== 'ready') {
            return;
          }
          assert.strictEqual(called, true);
          resolve();
        });
      }));

    it('errors when overviews are configured with a custom loader', () => {
      assert.throws(
        () =>
          new GeoTIFFSource({
            sources: [
              {
                url: 'spec/ol/source/images/0-0-0.tif',
                loader: () => Promise.reject(),
                overviews: ['spec/ol/source/images/0-0-0.tif'],
              },
            ],
          }),
        'Source overviews are not supported when using a custom loader',
      );
    });
  });

  describe('loading', function () {
    /** @type {GeoTIFFSource} */
    let source;
    beforeEach(function () {
      source = new GeoTIFFSource({
        sources: [
          {
            url: 'spec/ol/source/images/0-0-0.tif',
          },
        ],
      });
    });

    it('manages load states', () =>
      new Promise((resolve) => {
        assert.strictEqual(source.getState(), 'loading');
        source.on('change', () => {
          assert.strictEqual(source.getState(), 'ready');
          resolve();
        });
      }));

    it('configures itself from source metadata', () =>
      new Promise((resolve) => {
        source.on('change', () => {
          assert.strictEqual(source.hasAlpha, true);
          assert.strictEqual(source.bandCount, 4);
          assert.strictEqual(source.nodataBandIndex, 4);
          assert.deepEqual(source.nodataValues_, [[0]]);
          assert.strictEqual(source.getTileGrid().getResolutions().length, 1);
          assert.strictEqual(source.projection.getCode(), 'EPSG:4326');
          assert.strictEqual(source.projection.getUnits(), 'degrees');
          resolve();
        });
      }));

    it('resolves view properties', () =>
      new Promise((resolve) => {
        source.getView().then((viewOptions) => {
          const projection = viewOptions.projection;
          assert.strictEqual(projection.getCode(), 'EPSG:4326');
          assert.strictEqual(projection.getUnits(), 'degrees');
          assert.deepEqual(viewOptions.extent, [-180, -90, 180, 90]);
          assert.deepEqual(viewOptions.center, [0, 0]);
          assert.deepEqual(
            viewOptions.resolutions,
            [1.40625, 0.703125, 0.3515625],
          );
          assert.strictEqual(viewOptions.showFullExtent, true);
          resolve();
        });
      }));

    it('loads tiles', () =>
      new Promise((resolve) => {
        source.on('change', () => {
          const tile = source.getTile(0, 0, 0);
          source.on('tileloadend', () => {
            assert.strictEqual(tile.getState(), TileState.LOADED);
            resolve();
          });
          tile.load();
        });
      }));
  });
});
