import {get} from '../../../../../src/ol/proj.js';
import GeoZarr from '../../../../../src/ol/source/GeoZarr.js';

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
});
