import {stub as sinonStub} from 'sinon';
import {get} from '../../../../../src/ol/proj.js';
import GeoZarr from '../../../../../src/ol/source/GeoZarr.js';

const ZARR_URL = 'http://test-zarr/test.zarr/data';

/**
 * Create a Zarr v3 array metadata object with optional sharding codec.
 * @param {Object} options Options.
 * @param {number} [options.fillValue] The fill value.
 * @param {Array<number>} [options.shardShape] The shard (outer chunk) shape [rows, cols].
 * @param {Array<number>} [options.innerChunkShape] The inner chunk shape [rows, cols].
 * @return {Object} The array metadata.
 */
function createArrayMeta({fillValue, shardShape, innerChunkShape} = {}) {
  const meta = {
    zarr_format: 3,
    node_type: 'array',
    shape: [10980, 10980],
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

  return sinonStub(window, 'fetch').callsFake(function (url) {
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
      expect(source).to.be.a(GeoZarr);
      expect(source.getState()).to.be('loading');
    });

    it('defaults to wrapX: false', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03'],
      });
      expect(source.getWrapX()).to.be(false);
    });

    it('respects the wrapX option', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03'],
        wrapX: true,
      });
      expect(source.getWrapX()).to.be(true);
    });

    it('accepts projection option', function () {
      const projection = 'EPSG:3857';
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: ['b04', 'b03'],
        projection: projection,
      });
      expect(source.getProjection()).to.be(get(projection));
    });

    it('stores band configuration and sets bandCount', function () {
      const bands = ['b05', 'b04'];
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr/measurements/reflectance',
        bands: bands,
      });
      expect(source.bands_).to.eql(bands);
      expect(source.bandCount).to.be(bands.length);
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
      expect(source.bands_).to.have.length(2);
      expect(source.bands_[0]).to.be('b05'); // NIR
      expect(source.bands_[1]).to.be('b04'); // Red
    });

    it('should be compatible with WebGL expressions', function () {
      // This test ensures GeoZarr can be used with band arithmetic expressions
      // The actual band value testing will be done in integration tests
      expect(source).to.be.a(GeoZarr);
      expect(source.bands_).to.not.be.empty();
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
      expect(source.nodataBandIndex).to.be(undefined);
      expect(source.bandCount).to.be(1);
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
          expect(source.bandCount).to.be(3);
          expect(source.nodataBandIndex).to.be(3);
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
          expect(source.bandCount).to.be(1);
          expect(source.nodataBandIndex).to.be(undefined);
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

      // Source starts in loading state
      expect(source.getState()).to.be('loading');

      // Error handling will be tested separately when we can mock the network
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
          expect(tileSize).to.eql([512, 512]);
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
          expect(tileSize).to.eql([512, 512]);
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
          // 500 is the largest divisor of 1000 that is ≤ 512
          expect(tileSize).to.eql([500, 500]);
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
          expect(tileSize).to.be(256);
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
          expect(tileSize).to.be(256);
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
          expect(tileSize).to.eql([64, 64]);
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
          // Tile must be a multiple of 384 (inner chunk), so 384
          expect(tileSize).to.eql([384, 384]);
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
                'spatial:transform': [10, 0, 399960, 0, -10, 8000040],
              },
              {
                asset: 'r20m',
                derived_from: 'r10m',
                transform: {scale: [2, 2], translation: [0, 0]},
                'spatial:shape': [5490, 5490],
                // spatial:transform resolution is correct here
                'spatial:transform': [20, 0, 399960, 0, -20, 8000040],
              },
              {
                asset: 'r60m',
                derived_from: 'r10m',
                transform: {scale: [6, 6], translation: [0, 0]},
                'spatial:shape': [1830, 1830],
                'spatial:transform': [60, 0, 399960, 0, -60, 8000040],
              },
              {
                asset: 'r120m',
                derived_from: 'r60m',
                transform: {scale: [2, 2], translation: [0, 0]},
                'spatial:shape': [915, 915],
                // spatial:transform is WRONG (60 instead of 120) - as seen in real datasets
                'spatial:transform': [60, 0, 399990, 0, -60, 8000010],
              },
              {
                asset: 'r360m',
                derived_from: 'r120m',
                transform: {scale: [3, 3], translation: [0, 0]},
                'spatial:shape': [305, 305],
                // spatial:transform is WRONG (60 instead of 360)
                'spatial:transform': [60, 0, 400110, 0, -60, 7999890],
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
          // Should be sorted descending
          expect(resolutions).to.eql([360, 120, 60, 20, 10]);
          // Origins should all inherit from the base level
          const origins = source.tileGrid.getOrigins();
          for (const origin of origins) {
            expect(origin).to.eql([399960, 8000040]);
          }
          done();
        }
      });
    });
  });
});
