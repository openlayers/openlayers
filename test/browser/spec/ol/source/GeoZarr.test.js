import {stub} from 'sinon';
import {get} from '../../../../../src/ol/proj.js';
import GeoZarr from '../../../../../src/ol/source/GeoZarr.js';

const ZARR_URL = 'http://test-zarr/test.zarr';
const GROUP = 'data';

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

  return stub(window, 'fetch').callsFake(function (url) {
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
        group: GROUP,
        bands: ['band1'],
      });
      expect(source.nodataBandIndex).to.be(undefined);
      expect(source.bandCount).to.be(1);
    });

    it('sets nodataBandIndex and increments bandCount when fillValue is present', function (done) {
      fetchStub = stubFetch({
        [`${GROUP}/level0/b04`]: {fill_value: 'NaN'},
        [`${GROUP}/level0/b03`]: {fill_value: 'NaN'},
      });
      const source = new GeoZarr({
        url: ZARR_URL,
        group: GROUP,
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
        group: GROUP,
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
        url: 'https://invalid-url.com/nonexistent.zarr',
        group: 'measurements/reflectance',
        bands: ['b04'],
      });

      // Source starts in loading state
      expect(source.getState()).to.be('loading');

      // Error handling will be tested separately when we can mock the network
    });
  });
});
