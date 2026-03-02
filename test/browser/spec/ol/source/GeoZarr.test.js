import {stub as sinonStub} from 'sinon';
import {get} from '../../../../../src/ol/proj.js';
import GeoZarr from '../../../../../src/ol/source/GeoZarr.js';

const ZARR_URL = 'http://test-zarr/test.zarr';
const GROUP = 'data';

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
 * Stub fetch for a minimal v3 Zarr store with the given consolidated metadata.
 * @param {Object|null} consolidatedMetadata Consolidated metadata, or null for none.
 * @return {import('sinon').SinonStub} The fetch stub.
 */
function stubFetch(consolidatedMetadata) {
  const rootZarrJson = {
    zarr_format: 3,
    node_type: 'group',
    attributes: {},
  };
  if (consolidatedMetadata) {
    rootZarrJson.consolidated_metadata = {
      metadata: consolidatedMetadata,
    };
  }

  const groupZarrJson = {
    zarr_format: 3,
    node_type: 'group',
    attributes: {
      zarr_conventions: [
        {uuid: 'd35379db-88df-4056-af3a-620245f8e347'},
        {uuid: 'f17cb550-5864-4468-aeb7-f3180cfb622f'},
        {uuid: '689b58e2-cf7b-45e0-9fff-9cfc0883d6b4'},
      ],
      multiscales: {
        layout: [
          {
            asset: 'level0',
            'spatial:transform': [1, 0, 0, 0, -1, 256],
          },
        ],
      },
      'spatial:bbox': [0, 0, 256, 256],
      'proj:code': 'EPSG:4326',
    },
  };

  const responses = {
    [`${ZARR_URL}/zarr.json`]: JSON.stringify(rootZarrJson),
    [`${ZARR_URL}/${GROUP}/zarr.json`]: JSON.stringify(groupZarrJson),
  };

  return sinonStub(window, 'fetch').callsFake(function (url) {
    const body = responses[url];
    if (body !== undefined) {
      return Promise.resolve(new Response(body, {status: 200}));
    }
    return Promise.resolve(new Response('', {status: 404}));
  });
}

describe('ol/source/GeoZarr', function () {
  describe('constructor', function () {
    it('can be constructed with basic options', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr',
        group: 'measurements/reflectance',
        bands: ['b04', 'b03', 'b02'],
      });
      expect(source).to.be.a(GeoZarr);
      expect(source.getState()).to.be('loading');
    });

    it('defaults to wrapX: false', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr',
        group: 'measurements/reflectance',
        bands: ['b04', 'b03'],
      });
      expect(source.getWrapX()).to.be(false);
    });

    it('respects the wrapX option', function () {
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr',
        group: 'measurements/reflectance',
        bands: ['b04', 'b03'],
        wrapX: true,
      });
      expect(source.getWrapX()).to.be(true);
    });

    it('accepts projection option', function () {
      const projection = 'EPSG:3857';
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr',
        group: 'measurements/reflectance',
        bands: ['b04', 'b03'],
        projection: projection,
      });
      expect(source.getProjection()).to.be(get(projection));
    });

    it('stores band configuration and sets bandCount', function () {
      const bands = ['b05', 'b04'];
      const source = new GeoZarr({
        url: 'https://example.com/test.zarr',
        group: 'measurements/reflectance',
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
        url: 'https://example.com/test.zarr',
        group: 'measurements/reflectance',
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

  describe('error handling', function () {
    it('should handle configuration errors gracefully', function () {
      const source = new GeoZarr({
        url: 'https://invalid-url.com/nonexistent.zarr',
        group: 'measurements/reflectance',
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
        [`${GROUP}/level0/b04`]: createArrayMeta({
          shardShape: [512, 512],
          innerChunkShape: [128, 128],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
        [`${GROUP}/level0/b04`]: createArrayMeta({
          shardShape: [2048, 2048],
          innerChunkShape: [256, 256],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
        [`${GROUP}/level0/b04`]: createArrayMeta({
          shardShape: [1000, 1000],
          innerChunkShape: [100, 100],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
        group: GROUP,
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
        [`${GROUP}/level0/b04`]: createArrayMeta({
          shardShape: [64, 64],
          // no innerChunkShape → no sharding_indexed codec
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
        [`${GROUP}/level0/b04`]: createArrayMeta({
          shardShape: [32, 32],
          innerChunkShape: [8, 8],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
        [`${GROUP}/level0/b04`]: createArrayMeta({
          shardShape: [2048, 2048],
          innerChunkShape: [384, 384],
        }),
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
  });
});
