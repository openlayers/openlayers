import {assert} from 'chai';
import proj4 from 'proj4';
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
 * @param {Object} [options.attributes] The array attributes.
 * @return {Object} The array metadata.
 */
function createArrayMeta({
  fillValue,
  shardShape,
  innerChunkShape,
  shape,
  dimensionNames,
  attributes,
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
    attributes: attributes || {},
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
 * Wait for a source to finish configuring, successfully or not.
 * @param {GeoZarr} source The source.
 * @return {Promise<GeoZarr>} The source, once ready or in error.
 */
function settled(source) {
  return new Promise((resolve) => {
    source.on('change', function () {
      const state = source.getState();
      if (state === 'ready' || state === 'error') {
        resolve(source);
      }
    });
  });
}

/**
 * Consolidated metadata (.zmetadata) for a minimal single-scale Zarr v2 store.
 * @return {Object} The .zmetadata document.
 */
function v2Zmetadata() {
  return {
    zarr_consolidated_format: 1,
    metadata: {
      '.zgroup': {zarr_format: 2},
      '.zattrs': {
        'spatial:bbox': [0, 0, 256, 256],
        'spatial:shape': [256, 256],
        'proj:code': 'EPSG:4326',
      },
      'b04/.zarray': {
        zarr_format: 2,
        shape: [256, 256],
        chunks: [256, 256],
        dtype: '<f4',
        fill_value: 0,
      },
      'b04/.zattrs': {_ARRAY_DIMENSIONS: ['y', 'x']},
    },
  };
}

/**
 * Stub fetch for a minimal v3 Zarr store with the given consolidated metadata
 * and custom group attributes (layout, bbox, etc.).
 * @param {Object|null} consolidatedMetadata Consolidated metadata, or null for none.
 * @param {Object} [groupAttrs] Custom group attributes to merge/override defaults.
 * @return {import('vitest').MockInstance} The fetch stub.
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

  return vi.spyOn(window, 'fetch').mockImplementation(function (input) {
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
 * @return {import('vitest').MockInstance} The fetch stub.
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

    it('rejects dimensions that select several bands ambiguously', function () {
      const url = 'https://example.com/test.zarr';
      assert.throws(
        () =>
          new GeoZarr({url, bands: ['climate'], dimensions: {band: [0, 1]}}),
        /requires the `variable` option/,
      );
      assert.throws(
        () =>
          new GeoZarr({
            url,
            variable: 'climate',
            dimensions: {band: [0, 1], time: [0, 1]},
          }),
        /at most one may/,
      );
    });
  });

  describe('storeOptions', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.mockRestore();
        fetchStub = null;
      }
    });

    function getRequestHeader(call, name) {
      const [input, init] = call;
      if (input instanceof Request) {
        return input.headers.get(name);
      }
      return init && init.headers ? new Headers(init.headers).get(name) : null;
    }

    it('attaches configured headers to store requests', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch(null);
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['b04'],
          storeOptions: {
            headers: {Authorization: 'Bearer test-token'},
          },
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.isAbove(fetchStub.mock.calls.length, 0);
            for (const call of fetchStub.mock.calls) {
              assert.strictEqual(
                getRequestHeader(call, 'Authorization'),
                'Bearer test-token',
              );
            }
            resolve();
          }
        });
      }));

    it('applies the configured credentials mode to store requests', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch(null);
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['b04'],
          storeOptions: {
            credentials: 'include',
          },
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.isAbove(fetchStub.mock.calls.length, 0);
            for (const [input, init] of fetchStub.mock.calls) {
              const credentials =
                input instanceof Request
                  ? input.credentials
                  : init && init.credentials;
              assert.strictEqual(credentials, 'include');
            }
            resolve();
          }
        });
      }));

    it('sends no extra headers by default', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch(null);
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['b04'],
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.isAbove(fetchStub.mock.calls.length, 0);
            for (const call of fetchStub.mock.calls) {
              assert.isNull(getRequestHeader(call, 'Authorization'));
            }
            resolve();
          }
        });
      }));
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
        fetchStub.mockRestore();
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

    it('sets nodataBandIndex and increments bandCount when fillValue is present', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('does not set nodataBandIndex when there is no consolidated metadata', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));
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
        fetchStub.mockRestore();
        fetchStub = null;
      }
    });

    it('uses shard shape for tile size when ≤ 512', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('caps tile size at 512 for large shards', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('finds largest divisor ≤ 512 for non-power-of-two shards', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('uses default tile size when no sharding metadata is available', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch(null);
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['b04'],
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            const tileSize = source.tileGrid.getTileSize(0);
            assert.strictEqual(tileSize, 256);
            resolve();
          }
        });
      }));

    it('uses default tile size when chunks have no sharding codec', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('floors tile size to 64 for small shards', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('aligns tile size with inner chunk boundaries', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('computes resolutions from extent and shape', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    describe('proj:projjson', function () {
      beforeAll(function () {
        register(proj4);
      });

      afterAll(function () {
        unregister();
      });

      it('reads projection from proj:projjson attribute', () =>
        new Promise((resolve) => {
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
              resolve();
            }
          });
        }));
    });
  });

  describe('standalone single-scale group', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.mockRestore();
        fetchStub = null;
      }
    });

    it('derives a tile grid from spatial:bbox and spatial:shape', () =>
      new Promise((resolve) => {
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
            assert.deepEqual(source.bandsByLevel_, {'0': ['b04']});
            resolve();
          }
        });
      }));

    it('works without consolidated metadata', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));
  });

  describe('Zarr v2 store', function () {
    let fetchStub;
    let urls;

    /**
     * Stub fetch, serving .zmetadata and answering `missingStatus` elsewhere.
     * @param {number} missingStatus Status for any other key.
     */
    function stubV2Store(missingStatus) {
      urls = [];
      fetchStub = vi
        .spyOn(window, 'fetch')
        .mockImplementation(function (input) {
          const url = input instanceof Request ? input.url : input;
          urls.push(url);
          return Promise.resolve(
            url.endsWith('/.zmetadata')
              ? new Response(JSON.stringify(v2Zmetadata()))
              : new Response(null, {status: missingStatus}),
          );
        });
    }

    afterEach(function () {
      fetchStub.mockRestore();
      fetchStub = null;
    });

    it('determines the version from zarr.json alone and opens as v2', async () => {
      stubV2Store(404);
      const source = await settled(
        new GeoZarr({url: ZARR_URL, bands: ['b04']}),
      );
      // The missing zarr.json is the only version probe; the group is then
      // opened as v2 off the consolidated .zmetadata.
      assert.deepEqual(urls, [
        `${ZARR_URL}/zarr.json`,
        `${ZARR_URL}/.zmetadata`,
      ]);
      assert.deepEqual(source.tileGrid.getResolutions(), [1]);
    });

    it('reads a 403 on a missing key as absent, as S3 reports it', async () => {
      stubV2Store(403);
      const source = await settled(
        new GeoZarr({url: ZARR_URL, bands: ['b04']}),
      );
      assert.strictEqual(source.getState(), 'ready');
    });

    it('reports a forbidden store as missing or denied', async () => {
      fetchStub = vi.spyOn(window, 'fetch').mockImplementation(function () {
        return Promise.resolve(new Response(null, {status: 403}));
      });
      const source = await settled(
        new GeoZarr({url: ZARR_URL, bands: ['b04']}),
      );
      assert.match(source.error_.message, /missing, or access to it is denied/);
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
      return vi.spyOn(window, 'fetch').mockImplementation(function (input) {
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
        fetchStub.mockRestore();
        fetchStub = null;
      }
    });

    it('resolves bands from multiple groups into bandsByLevel', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('supports single-scale bands from additional groups', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));
  });

  describe('variable (datacube)', function () {
    let fetchStub;

    /**
     * Zarr v3 metadata and chunk bytes for a 1-D float64 coordinate array.
     * @param {Array<number>} values The coordinate values.
     * @return {{meta: Object, chunk: Uint8Array}} The metadata and its chunk.
     */
    function coordinateArray(values) {
      return {
        meta: {
          zarr_format: 3,
          node_type: 'array',
          shape: [values.length],
          data_type: 'float64',
          fill_value: 0,
          chunk_grid: {
            name: 'regular',
            configuration: {chunk_shape: [values.length]},
          },
          chunk_key_encoding: {
            name: 'default',
            configuration: {separator: '/'},
          },
          codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
          attributes: {},
        },
        chunk: new Uint8Array(new Float64Array(values).buffer),
      };
    }

    /**
     * Stub a v3 store with consolidated metadata, group attributes, and the
     * chunk bytes of any coordinate arrays.
     * @param {Object} metadata Consolidated metadata, by path.
     * @param {Object} attributes The group attributes.
     * @param {Object<string, Uint8Array>} [chunks] Chunk bytes, by path.
     * @return {import('vitest').MockInstance} The fetch stub.
     */
    function stubDatacube(metadata, attributes, chunks) {
      const group = JSON.stringify({
        zarr_format: 3,
        node_type: 'group',
        attributes,
        consolidated_metadata: {metadata},
      });
      return vi.spyOn(window, 'fetch').mockImplementation(function (input) {
        const url = input instanceof Request ? input.url : input;
        if (url === `${ZARR_URL}/zarr.json`) {
          return Promise.resolve(new Response(group, {status: 200}));
        }
        const key = url.slice(`${ZARR_URL}/`.length);
        if (chunks && key in chunks) {
          return Promise.resolve(new Response(chunks[key], {status: 200}));
        }
        return Promise.resolve(new Response('', {status: 404}));
      });
    }

    afterEach(function () {
      if (fetchStub) {
        fetchStub.mockRestore();
        fetchStub = null;
      }
    });

    it('renders one band per dimension value, across pyramid levels', () =>
      new Promise((resolve) => {
        fetchStub = stubFetchWithAttrs(
          {
            ['0/climate']: createArrayMeta({
              shape: [2, 3, 256, 256],
              dimensionNames: ['month', 'band', 'y', 'x'],
            }),
            ['1/climate']: createArrayMeta({
              shape: [2, 3, 128, 128],
              dimensionNames: ['month', 'band', 'y', 'x'],
            }),
          },
          {
            zarr_conventions: undefined,
            multiscales: [
              {
                datasets: [
                  {path: '0', 'spatial:shape': [256, 256]},
                  {path: '1', 'spatial:shape': [128, 128]},
                ],
              },
            ],
          },
        );
        const source = new GeoZarr({
          url: ZARR_URL,
          variable: 'climate',
          dimensions: {band: [0, 2], month: 1},
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.deepEqual(source.tileGrid.getResolutions(), [2, 1]);
            assert.deepEqual(source.bandExtraSelection_, [
              [1, 0, null, null],
              [1, 2, null, null],
            ]);
            resolve();
          }
        });
      }));

    it('infers the extent and south-up rows from the coordinate arrays', () =>
      new Promise((resolve) => {
        // Ascending y coordinates mean the rows are stored south-up. The
        // coordinates are pixel centers, so the extent is padded by half a pixel.
        const x = coordinateArray([0.5, 1.5, 2.5, 3.5]);
        const y = coordinateArray([0.5, 1.5, 2.5, 3.5]);
        fetchStub = stubDatacube(
          {
            t2m: createArrayMeta({
              shape: [2, 4, 4],
              dimensionNames: ['time', 'y', 'x'],
            }),
            x: x.meta,
            y: y.meta,
          },
          {},
          {'x/c/0': x.chunk, 'y/c/0': y.chunk},
        );
        const source = new GeoZarr({
          url: ZARR_URL,
          variable: 't2m',
          dimensions: {time: 1},
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.deepEqual(source.tileGrid.getExtent(), [0, 0, 4, 4]);
            assert.strictEqual(source.levelRowInfo_['0'].flip, true);
            assert.strictEqual(source.getProjection(), get('EPSG:4326'));
            resolve();
          }
        });
      }));

    it('falls back to the extent and flipY options', () =>
      new Promise((resolve) => {
        // A store with neither spatial metadata nor coordinate arrays.
        fetchStub = stubDatacube(
          {
            fgco2: createArrayMeta({
              shape: [1, 180, 360],
              dimensionNames: ['time', 'y', 'x'],
            }),
          },
          {},
        );
        const source = new GeoZarr({
          url: ZARR_URL,
          variable: 'fgco2',
          dimensions: {time: 0},
          extent: [-180, -90, 180, 90],
          flipY: true,
        });
        source.on('change', function () {
          if (source.getState() === 'ready') {
            assert.deepEqual(source.tileGrid.getExtent(), [-180, -90, 180, 90]);
            assert.strictEqual(source.levelRowInfo_['0'].flip, true);
            resolve();
          }
        });
      }));
  });

  describe('dimensions (time-slice / extra dimensions)', function () {
    let fetchStub;

    afterEach(function () {
      if (fetchStub) {
        fetchStub.mockRestore();
        fetchStub = null;
      }
    });

    it('resolves the extra-dimension index from dimension_names', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('locates the spatial axes by name when they are not trailing', () =>
      new Promise((resolve) => {
        // A [y, time, x] layout: the spatial axes are the outer and inner axis,
        // and `spatial:dimensions` names them so they can be found by name.
        fetchStub = stubFetchWithAttrs(
          {
            ['level0/vv']: createArrayMeta({
              shape: [256, 4, 256],
              dimensionNames: ['y', 'time', 'x'],
            }),
          },
          {'spatial:dimensions': ['y', 'x']},
        );
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['vv'],
          dimensions: {time: 3},
        });
        source.on('change', async function () {
          if (source.getState() === 'ready') {
            assert.deepEqual(source.bandSpatialAxes_[0], {row: 0, col: 2});
            // The fixed index lands on the time axis (position 1), not a
            // trailing axis.
            assert.deepEqual(source.bandExtraSelection_[0], [null, 3, null]);
            assert.deepEqual(await source.getDimensions(), {
              time: {size: 4, attributes: null},
            });
            resolve();
          }
        });
      }));

    it('reports the non-spatial dimensions via getDimensions()', async () => {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [5, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
      });
      const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
      assert.deepEqual(await source.getDimensions(), {
        time: {size: 5, attributes: null},
      });
    });

    it('getDimensions() includes the coordinate array attributes', async () => {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({
          shape: [3, 256, 256],
          dimensionNames: ['time', 'y', 'x'],
        }),
        ['level0/time']: createArrayMeta({
          shape: [3],
          dimensionNames: ['time'],
          attributes: {
            units: 'seconds since 2020-01-01',
            standard_name: 'time',
          },
        }),
      });
      const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
      assert.deepEqual(await source.getDimensions(), {
        time: {
          size: 3,
          attributes: {
            units: 'seconds since 2020-01-01',
            standard_name: 'time',
          },
        },
      });
    });

    it('getDimensions() is empty for 2-D bands', async () => {
      fetchStub = stubFetch({['level0/b04']: createArrayMeta()});
      const source = new GeoZarr({url: ZARR_URL, bands: ['b04']});
      assert.deepEqual(await source.getDimensions(), {});
    });

    it('getDimensions() names unnamed dimensions by axis position', async () => {
      fetchStub = stubFetch({
        ['level0/vv']: createArrayMeta({shape: [3, 256, 256]}),
      });
      const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
      assert.deepEqual(await source.getDimensions(), {
        '0': {size: 3, attributes: null},
      });
    });

    it('selects unnamed dimensions by axis position', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('binds a single extra axis positionally when dimension_names is absent', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('leaves 2-D arrays unselected (no behavior change)', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('supports band-as-dimension (forward-compat for #17474)', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('derives a 2-D-equivalent tile size for a sharded 3-D array', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('errors on an out-of-range index', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('errors on a label without a coordinate array to resolve it', () =>
      new Promise((resolve) => {
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
            assert.include(source.error_.message, 'Could not resolve label');
            assert.include(source.error_.message, 'numeric index');
            resolve();
          }
        });
      }));

    it('errors on an unknown dimension name', () =>
      new Promise((resolve) => {
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
            resolve();
          }
        });
      }));

    it('updateDimensions() moves to another slice and changes the tile key', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch({
          ['level0/vv']: createArrayMeta({
            shape: [5, 256, 256],
            dimensionNames: ['time', 'y', 'x'],
          }),
        });
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['vv'],
          dimensions: {time: 0},
        });
        let handled = false;
        source.on('change', function () {
          if (source.getState() === 'ready' && !handled) {
            handled = true;
            const before = source.getKey();
            source.updateDimensions({time: 3});
            assert.deepEqual(source.bandExtraSelection_[0], [3, null, null]);
            assert.notStrictEqual(source.getKey(), before);
            resolve();
          }
        });
      }));

    it('updateDimensions() merges into the current selection', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch({
          ['level0/vv']: createArrayMeta({shape: [2, 3, 256, 256]}),
        });
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['vv'],
          dimensions: {'0': 1, '1': 2},
        });
        let handled = false;
        source.on('change', function () {
          if (source.getState() === 'ready' && !handled) {
            handled = true;
            source.updateDimensions({'1': 0}); // change only the second axis
            assert.deepEqual(source.bandExtraSelection_[0], [1, 0, null, null]);
            resolve();
          }
        });
      }));

    it('updateDimensions() throws on an out-of-range index and keeps the selection', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch({
          ['level0/vv']: createArrayMeta({
            shape: [5, 256, 256],
            dimensionNames: ['time', 'y', 'x'],
          }),
        });
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['vv'],
          dimensions: {time: 0},
        });
        let handled = false;
        source.on('change', function () {
          if (source.getState() === 'ready' && !handled) {
            handled = true;
            assert.throws(function () {
              source.updateDimensions({time: 9});
            }, /invalid index 9/);
            assert.deepEqual(source.bandExtraSelection_[0], [0, null, null]);
            resolve();
          }
        });
      }));

    it('updateDimensions() reuses the tile key when revisiting a slice', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch({
          ['level0/vv']: createArrayMeta({
            shape: [5, 256, 256],
            dimensionNames: ['time', 'y', 'x'],
          }),
        });
        const source = new GeoZarr({
          url: ZARR_URL,
          bands: ['vv'],
          dimensions: {time: 0},
        });
        let handled = false;
        source.on('change', function () {
          if (source.getState() === 'ready' && !handled) {
            handled = true;
            source.updateDimensions({time: 0});
            const keyA = source.getKey();
            source.updateDimensions({time: 3});
            assert.notStrictEqual(source.getKey(), keyA);
            source.updateDimensions({time: 0});
            assert.strictEqual(source.getKey(), keyA);
            resolve();
          }
        });
      }));

    it('getValue() throws on an out-of-range index', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch({
          ['level0/vv']: createArrayMeta({
            shape: [3, 256, 256],
            dimensionNames: ['time', 'y', 'x'],
          }),
          ['level0/time']: createArrayMeta({
            shape: [3],
            dimensionNames: ['time'],
          }),
        });
        const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
        source.on('change', function () {
          if (source.getState() === 'ready') {
            source.getValue('time', 5).then(
              () => assert.fail('expected a rejection'),
              (error) => {
                assert.include(error.message, 'out of range');
                resolve();
              },
            );
          }
        });
      }));

    it('getValue() returns null when there is no coordinate array', () =>
      new Promise((resolve) => {
        fetchStub = stubFetch({
          ['level0/vv']: createArrayMeta({
            shape: [3, 256, 256],
            dimensionNames: ['time', 'y', 'x'],
          }),
        });
        const source = new GeoZarr({url: ZARR_URL, bands: ['vv']});
        source.on('change', function () {
          if (source.getState() === 'ready') {
            source.getValue('time', 0).then((value) => {
              assert.strictEqual(value, null);
              resolve();
            });
          }
        });
      }));
  });
});
