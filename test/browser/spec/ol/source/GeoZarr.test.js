import {assert} from 'chai';
import proj4 from 'proj4';
import {stub as sinonStub} from 'sinon';
import {get} from '../../../../../src/ol/proj.js';
import {register, unregister} from '../../../../../src/ol/proj/proj4.js';
import GeoZarr from '../../../../../src/ol/source/GeoZarr.js';

const ZARR_URL = 'http://test-zarr/test.zarr/data';
const ZARR_ROOT_URL = 'http://test-zarr/test.zarr';

/**
 * Create a Zarr v3 array metadata object with optional sharding codec.
 * @param {Object} options Options.
 * @param {number} [options.fillValue] The fill value.
 * @param {Array<number>} [options.shardShape] The shard (outer chunk) shape.
 * @param {Array<number>} [options.innerChunkShape] The inner chunk shape.
 * @param {Array<number>} [options.shape] The array shape (defaults to a 2-D [10980, 10980]).
 * @param {Array<string>} [options.dimensionNames] The Zarr v3 `dimension_names`.
 * @return {Object} The array metadata.
 */
function createArrayMeta({
  fillValue,
  shardShape,
  innerChunkShape,
  shape,
  dimensionNames,
} = {}) {
  const meta = {
    zarr_format: 3,
    node_type: 'array',
    shape: shape || [10980, 10980],
    data_type: 'float32',
    fill_value: fillValue !== undefined ? fillValue : 0,
    chunk_grid: {
      name: 'regular',
      configuration: {
        chunk_shape: shardShape || [256, 256],
      },
    },
    chunk_key_encoding: {
      name: 'default',
      configuration: {separator: '/'},
    },
    codecs: [],
    attributes: {},
  };
  if (dimensionNames) {
    meta.dimension_names = dimensionNames;
  }
  if (innerChunkShape) {
    meta.codecs = [
      {
        name: 'sharding_indexed',
        configuration: {
          chunk_shape: innerChunkShape,
          codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
          index_codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
        },
      },
    ];
  }
  return meta;
}

/**
 * Stub fetch for a minimal v3 Zarr store with the given consolidated metadata
 * and custom group attributes (layout, bbox, etc.).
 * @param {Object|null} consolidatedMetadata Consolidated metadata, or null for none.
 * @param {Object} [groupAttrs] Custom group attributes to merge/override defaults.
 * @return {import('sinon').SinonStub} The fetch stub.
 */
function stubFetchWithAttrs(consolidatedMetadata, groupAttrs) {
  const defaultAttrs = {
    zarr_conventions: [
      {uuid: 'd35379db-88df-4056-af3a-620245f8e347'},
      {uuid: 'f17cb550-5864-4468-aeb7-f3180cfb622f'},
      {uuid: '689b58e2-cf7b-45e0-9fff-9cfc0883d6b4'},
    ],
    multiscales: {
      layout: [
        {
          asset: 'level0',
          'spatial:shape': [256, 256],
          'spatial:transform': [1, 0, 0, 0, -1, 256],
        },
      ],
    },
    'spatial:bbox': [0, 0, 256, 256],
    'proj:code': 'EPSG:4326',
  };
  const groupZarrJson = {
    zarr_format: 3,
    node_type: 'group',
    attributes: Object.assign(defaultAttrs, groupAttrs),
  };
  if (consolidatedMetadata) {
    groupZarrJson.consolidated_metadata = {
      metadata: consolidatedMetadata,
    };
  }

  const responses = {
    [`${ZARR_URL}/zarr.json`]: JSON.stringify(groupZarrJson),
  };

  return sinonStub(window, 'fetch').callsFake(function (input) {
    const url = input instanceof Request ? input.url : input;
    const body = responses[url];
    if (body !== undefined) {
      return Promise.resolve(new Response(body, {status: 200}));
    }
    return Promise.resolve(new Response('', {status: 404}));
  });
}

/**
 * Stub fetch for a minimal v3 Zarr store with the given consolidated metadata.
 * @param {Object|null} consolidatedMetadata Consolidated metadata, or null for none.
 * @return {import('sinon').SinonStub} The fetch stub.
 */
function stubFetch(consolidatedMetadata) {
  return stubFetchWithAttrs(consolidatedMetadata);
}

describe('ol/source/GeoZarr', function () {
  describe('constructor', function () {
    it('can be constructed with basic options', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03', 'b02'],
      });
      assert.instanceOf(source, GeoZarr);
      assert.strictEqual(source.getState(), 'loading');
    });

    it('defaults to wrapX: false', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03'],
      });
      assert.strictEqual(source.getWrapX(), false);
    });

    it('respects the wrapX option', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03'],
        wrapX: true,
      });
      assert.strictEqual(source.getWrapX(), true);
    });

    it('accepts projection option', function () {
      const projection = 'EPSG:3857';
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03'],
        projection: projection,
      });
      assert.strictEqual(source.getProjection(), get(projection));
    });

    it('stores band configuration and sets bandCount', function () {
      const bands = ['b05', 'b04'];
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: bands,
      });
      assert.deepEqual(source.bands_, bands);
      assert.strictEqual(source.bandCount, bands.length);
    });
  });

  describe('band data access', function () {
    let source;

    beforeEach(function () {
      source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b05', 'b04'], // NIR, Red for NDVI testing
      });
    });

    it('should handle multiple bands for arithmetic operations', function () {
      assert.lengthOf(source.bands_, 2);
      assert.strictEqual(source.bands_[0], 'b05');
      assert.strictEqual(source.bands_[1], 'b04');
    });

    it('should be compatible with WebGL expressions', function () {
      assert.instanceOf(source, GeoZarr);
      assert.isNotEmpty(source.bands_);
    });
  });

  describe('nodataBandIndex', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.restore();
        fetchStub = null;
      }
    });

    it('is undefined before configure_() runs', function () {
      fetchStub = stubFetch(null);
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['band1'],
      });
      assert.strictEqual(source.nodataBandIndex, undefined);
      assert.strictEqual(source.bandCount, 1);
      assert.strictEqual(source.hasAlpha, false);
    });

    it('sets nodataBandIndex and increments bandCount when fillValue is present', function (done) {
      fetchStub = stubFetch({
        ['level0/b04']: {fill_value: 'NaN'},
        ['level0/b03']: {fill_value: 'NaN'},
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04', 'b03'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.strictEqual(source.bandCount, 3);
          assert.strictEqual(source.nodataBandIndex, 3);
          assert.strictEqual(source.hasAlpha, true);
          done();
        }
      });
    });

    it('does not set nodataBandIndex when there is no consolidated metadata', function (done) {
      fetchStub = stubFetch(null);
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.strictEqual(source.bandCount, 1);
          assert.strictEqual(source.nodataBandIndex, undefined);
          assert.strictEqual(source.hasAlpha, false);
          done();
        }
      });
    });
  });

  describe('error handling', function () {
    it('should handle configuration errors gracefully', function () {
      const source = new GeoZarr({
        url: 'https://invalid-url.com/nonexistent.zarr/measurements/reflectance',
        bands: ['b04'],
      });

      assert.strictEqual(source.getState(), 'loading');
    });
  });

  describe('configure_()', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.restore();
        fetchStub = null;
      }
    });

    it('uses shard shape for tile size when ≤ 512', function (done) {
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta({
          shardShape: [512, 512],
          innerChunkShape: [128, 128],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.deepEqual(tileSize, [512, 512]);
          done();
        }
      });
    });

    it('caps tile size at 512 for large shards', function (done) {
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta({
          shardShape: [2048, 2048],
          innerChunkShape: [256, 256],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.deepEqual(tileSize, [512, 512]);
          done();
        }
      });
    });

    it('finds largest divisor ≤ 512 for non-power-of-two shards', function (done) {
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta({
          shardShape: [1000, 1000],
          innerChunkShape: [100, 100],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.deepEqual(tileSize, [500, 500]);
          done();
        }
      });
    });

    it('uses default tile size when no sharding metadata is available', function (done) {
      fetchStub = stubFetch(null);
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.strictEqual(tileSize, 256);
          done();
        }
      });
    });

    it('uses default tile size when chunks have no sharding codec', function (done) {
      // Arrays without sharding_indexed codec should not affect tile size,
      // even when consolidated metadata has chunk_grid info
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta({
          shardShape: [64, 64],
          // no innerChunkShape → no sharding_indexed codec
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.strictEqual(tileSize, 256);
          done();
        }
      });
    });

    it('floors tile size to 64 for small shards', function (done) {
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta({
          shardShape: [32, 32],
          innerChunkShape: [8, 8],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.deepEqual(tileSize, [64, 64]);
          done();
        }
      });
    });

    it('aligns tile size with inner chunk boundaries', function (done) {
      // With 2048 shard and 384 inner chunks, tile must be a multiple of 384.
      // 384 is the largest multiple of 384 that divides 2048? 2048/384 ≈ 5.33.
      // 384*1=384, 2048%384 = 2048-5*384 = 2048-1920 = 128 ≠ 0.
      // No exact divisor → falls back to shardSize which is > MAX_TILE_SIZE,
      // so uses maxChunks*384 = 1*384 = 384.
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta({
          shardShape: [2048, 2048],
          innerChunkShape: [384, 384],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const tileSize = source.tileGrid.getTileSize(0);
          assert.deepEqual(tileSize, [384, 384]);
          done();
        }
      });
    });

    it('computes resolutions from extent and shape', function (done) {
      fetchStub = stubFetchWithAttrs(
        {
          ['r10m/b04']: createArrayMeta(),
          ['r20m/b04']: createArrayMeta(),
          ['r60m/b04']: createArrayMeta(),
          ['r120m/b04']: createArrayMeta(),
          ['r360m/b04']: createArrayMeta(),
        },
        {
          multiscales: {
            layout: [
              {
                asset: 'r10m',
                'spatial:shape': [10980, 10980],
              },
              {
                asset: 'r20m',
                derived_from: 'r10m',
                transform: {scale: [2, 2], translation: [0, 0]},
                'spatial:shape': [5490, 5490],
              },
              {
                asset: 'r60m',
                derived_from: 'r10m',
                transform: {scale: [6, 6], translation: [0, 0]},
                'spatial:shape': [1830, 1830],
              },
              {
                asset: 'r120m',
                derived_from: 'r60m',
                transform: {scale: [2, 2], translation: [0, 0]},
                'spatial:shape': [915, 915],
              },
              {
                asset: 'r360m',
                derived_from: 'r120m',
                transform: {scale: [3, 3], translation: [0, 0]},
                'spatial:shape': [305, 305],
              },
            ],
          },
          'spatial:bbox': [399960, 7890240, 509760, 8000040],
          'proj:code': 'EPSG:32626',
        },
      );
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          const resolutions = source.tileGrid.getResolutions();
          assert.deepEqual(resolutions, [360, 120, 60, 20, 10]);
          // Origins should all inherit from the base level
          const origins = source.tileGrid.getOrigins();
          for (const origin of origins) {
            assert.deepEqual(origin, [399960, 8000040]);
          }
          done();
        }
      });
    });

    describe('proj:projjson', function () {
      before(function () {
        register(proj4);
      });

      after(function () {
        unregister();
      });

      it('reads projection from proj:projjson attribute', function (done) {
        // https://spatialreference.org/ref/epsg/4326/projjson.json
        fetchStub = stubFetchWithAttrs(null, {
          'proj:code': undefined,
          'proj:projjson': {
            $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json',
            type: 'GeographicCRS',
            name: 'WGS 84',
            datum_ensemble: {
              name: 'World Geodetic System 1984 ensemble',
              members: [
                {
                  name: 'World Geodetic System 1984 (Transit)',
                  id: {authority: 'EPSG', code: 1166},
                },
              ],
              ellipsoid: {
                name: 'WGS 84',
                semi_major_axis: 6378137,
                inverse_flattening: 298.257223563,
              },
              accuracy: '2.0',
              id: {authority: 'EPSG', code: 6326},
            },
            coordinate_system: {
              subtype: 'ellipsoidal',
              axis: [
                {
                  name: 'Geodetic latitude',
                  abbreviation: 'Lat',
                  direction: 'north',
                  unit: 'degree',
                },
                {
                  name: 'Geodetic longitude',
                  abbreviation: 'Lon',
                  direction: 'east',
                  unit: 'degree',
                },
              ],
            },
            id: {authority: 'EPSG', code: 4326},
          },
        });
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['b04'],
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.strictEqual(source.getProjection(), get('EPSG:4326'));
            done();
          }
        });
      });
    });
  });

  describe('standalone single-scale group', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.restore();
        fetchStub = null;
      }
    });

    it('derives a tile grid from spatial:bbox and spatial:shape', function (done) {
      fetchStub = stubFetchWithAttrs(
        {b04: createArrayMeta({fillValue: 0})},
        {
          zarr_conventions: undefined,
          multiscales: undefined,
          'spatial:shape': [256, 256],
        },
      );
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.tileGrid.getResolutions(), [1]);
          assert.strictEqual(source.bandSingleScaleResolution_[0], 1);
          done();
        }
      });
    });

    it('works without consolidated metadata', function (done) {
      fetchStub = stubFetchWithAttrs(null, {
        zarr_conventions: undefined,
        multiscales: undefined,
        'spatial:shape': [256, 256],
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.tileGrid.getResolutions(), [1]);
          assert.strictEqual(source.bandsByLevel_, null);
          assert.strictEqual(source.bandSingleScaleResolution_[0], 1);
          done();
        }
      });
    });
  });

  describe('multi-group bands', function () {
    let fetchStub;

    function stubFetchMultiGroup(group1Meta, group2Meta) {
      const metadata = {
        data: {
          zarr_format: 3,
          node_type: 'group',
          attributes: {
            zarr_conventions: [
              {uuid: 'd35379db-88df-4056-af3a-620245f8e347'},
              {uuid: 'f17cb550-5864-4468-aeb7-f3180cfb622f'},
              {uuid: '689b58e2-cf7b-45e0-9fff-9cfc0883d6b4'},
            ],
            multiscales: {
              layout: [{asset: 'level0', 'spatial:shape': [256, 256]}],
            },
            'spatial:bbox': [0, 0, 256, 256],
            'proj:code': 'EPSG:4326',
          },
        },
        extra: {zarr_format: 3, node_type: 'group', attributes: {}},
      };
      for (const [k, v] of Object.entries(group1Meta || {})) {
        metadata[`data/${k}`] = v;
      }
      for (const [k, v] of Object.entries(group2Meta || {})) {
        metadata[`extra/${k}`] = v;
      }
      return sinonStub(window, 'fetch').callsFake(function (input) {
        const url = input instanceof Request ? input.url : input;
        if (url === `${ZARR_ROOT_URL}/zarr.json`) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                zarr_format: 3,
                node_type: 'group',
                attributes: {},
                consolidated_metadata: {metadata},
              }),
              {status: 200},
            ),
          );
        }
        return Promise.resolve(new Response('', {status: 404}));
      });
    }

    afterEach(function () {
      if (fetchStub) {
        fetchStub.restore();
        fetchStub = null;
      }
    });

    it('resolves bands from multiple groups into bandsByLevel', function (done) {
      fetchStub = stubFetchMultiGroup(
        {'level0/b04': createArrayMeta()},
        {'level0/aot': createArrayMeta()},
      );
      const source = new GeoZarr({
        url: ZARR_ROOT_URL,
        bands: [
          {name: 'b04', group: 'data'},
          {name: 'aot', group: 'extra'},
        ],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.bandGroupIndex_, [0, 1]);
          assert.include(source.bandsByLevel_['level0'], 'b04');
          assert.include(source.bandsByLevel_['level0'], 'aot');
          done();
        }
      });
    });

    it('supports single-scale bands from additional groups', function (done) {
      fetchStub = stubFetchMultiGroup(
        {'level0/b04': createArrayMeta()},
        {aot: createArrayMeta()}, // no matrixId prefix → single-scale
      );
      const source = new GeoZarr({
        url: ZARR_ROOT_URL,
        bands: [
          {name: 'b04', group: 'data'},
          {name: 'aot', group: 'extra'},
        ],
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.strictEqual(source.bandSingleScaleResolution_[0], undefined);
          assert.notEqual(source.bandSingleScaleResolution_[1], undefined);
          assert.include(source.bandsByLevel_['level0'], 'aot');
          done();
        }
      });
    });
  });

  describe('dimensions (time-slice / extra dimensions)', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.restore();
        fetchStub = null;
      }
    });

    it('resolves the extra-dimension index from dimension_names', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [3, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {time: 2},
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.bandExtraSelection_[0], [2, null, null]);
          done();
        }
      });
    });

    it('reports the non-spatial dimensions via getDimensions()', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [5, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.getDimensions(), [{name: 'time', size: 5}]);
          done();
        }
      });
    });

    it('getDimensions() is empty for 2-D bands', function (done) {
      fetchStub = stubFetch({['level0/b04']: createArrayMeta()});
      const source = new GeoZarr({url: ZARR_URL, bands: ['b04']});
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.getDimensions(), []);
          done();
        }
      });
    });

    it('getDimensions() names unnamed dimensions by axis position', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({shape: [3, 256, 256]}),
      });
      const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.getDimensions(), [{name: '0', size: 3}]);
          done();
        }
      });
    });

    it('selects unnamed dimensions by axis position', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({shape: [2, 3, 256, 256]}),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {'0': 1, '1': 2},
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.bandExtraSelection_[0], [1, 2, null, null]);
          done();
        }
      });
    });

    it('binds a single extra axis positionally when dimension_names is absent', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({shape: [3, 256, 256]}),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {time: 1},
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.bandExtraSelection_[0], [1, null, null]);
          done();
        }
      });
    });

    it('leaves 2-D arrays unselected (no behavior change)', function (done) {
      fetchStub = stubFetch({
        ['level0/b04']: createArrayMeta(),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['b04'],
        dimensions: {time: 0},
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.strictEqual(source.bandExtraSelection_[0], undefined);
          done();
        }
      });
    });

    it('supports band-as-dimension (forward-compat for #17474)', function (done) {
      fetchStub = stubFetch({
        ['level0/data']: createArrayMeta({
          shape: [4, 256, 256],
          dimensionNames: ['band', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['data'],
        dimensions: {band: 1},
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.bandExtraSelection_[0], [1, null, null]);
          done();
        }
      });
    });

    it('derives a 2-D-equivalent tile size for a sharded 3-D array', function (done) {
      // Shard/inner-chunk shapes are 3-D ([1, 512, 512] / [1, 128, 128]); the
      // leading (time) axis must be ignored so the tile size matches the 2-D case.
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [3, 512, 512],
          shardShape: [1, 512, 512],
          innerChunkShape: [1, 128, 128],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {time: 0},
      });
      source.on('change', function () {
        if (source.getState() === 'ready') {
          assert.deepEqual(source.tileGrid.getTileSize(0), [512, 512]);
          done();
        }
      });
    });

    it('errors on an out-of-range index', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [3, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {time: 5},
      });
      source.on('change', function () {
        if (source.getState() === 'error') {
          assert.include(source.error_.message, 'invalid index 5');
          done();
        }
      });
    });

    it('errors on a string (datetime-label) value as not yet implemented', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [3, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {time: '2026-06-16T18:11:16Z'},
      });
      source.on('change', function () {
        if (source.getState() === 'error') {
          assert.include(source.error_.message, 'not yet implemented');
          done();
        }
      });
    });

    it('errors on an unknown dimension name', function (done) {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [3, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        bands: ['vv'],
        dimensions: {bogus: 0},
      });
      source.on('change', function () {
        if (source.getState() === 'error') {
          assert.include(source.error_.message, 'unknown dimension "bogus"');
          done();
        }
      });
    });
  });
});
