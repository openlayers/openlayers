import {assert} from 'chai';
import {xhr} from '../../../../src/ol/featureloader.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

describe('ol.featureloader', function () {
  describe('ol.featureloader.xhr', function () {
    let loader;
    let source;
    let url;
    let format;

    beforeEach(function () {
      url = 'spec/ol/data/point.json';
      format = new GeoJSON();

      source = new VectorSource();
    });

    it('adds features to the source', () =>
      new Promise((resolve) => {
        loader = xhr(url, format);
        source.on('addfeature', function (e) {
          setTimeout(function () {
            assert.isAbove(source.getFeatures().length, 0);
            resolve();
          }, 0);
        });
        loader.call(source, [], 1, 'EPSG:3857');
      }));

    describe('when called with urlFunction', function () {
      it('adds features to the source', () =>
        new Promise((resolve) => {
          url = function (extent, resolution, projection) {
            return 'spec/ol/data/point.json';
          };
          loader = xhr(url, format);

          source.on('addfeature', function (e) {
            setTimeout(function () {
              assert.isAbove(source.getFeatures().length, 0);
              resolve();
            }, 0);
          });
          loader.call(source, [], 1, 'EPSG:3857');
        }));

      it('sends the correct arguments to the urlFunction', () =>
        new Promise((resolve) => {
          const extent = [];
          const resolution = 1;
          const projection = 'EPSG:3857';
          url = function (extent_, resolution_, projection_) {
            assert.deepEqual(extent_, extent);
            assert.deepEqual(resolution_, resolution);
            assert.deepEqual(projection_, projection);
            resolve();
            return 'spec/ol/data/point.json';
          };
          loader = xhr(url, format);
          loader.call(source, [], 1, 'EPSG:3857');
        }));
    });

    it('calls the success callback', () =>
      new Promise((resolve) => {
        const errorSpy = vi.fn();
        loader = xhr(url, format);
        loader.call(
          source,
          [],
          1,
          'EPSG:3857',
          function () {
            setTimeout(function () {
              assert.strictEqual(errorSpy.mock.calls.length, 0);
              resolve();
            }, 0);
          },
          errorSpy,
        );
      }));

    it('calls the failure callback when the parsing throws an error (xml)', () =>
      new Promise((resolve) => {
        const successSpy = vi.fn();
        loader = xhr('spec/ol/data/exceptionreport.xml', format);
        loader.call(source, [], 1, 'EPSG:3857', successSpy, function () {
          setTimeout(function () {
            assert.strictEqual(successSpy.mock.calls.length, 0);
            resolve();
          }, 0);
        });
      }));

    it('calls the failure callback when the parsing throws an error (json)', () =>
      new Promise((resolve) => {
        const successSpy = vi.fn();
        loader = xhr('spec/ol/data/exceptionreport.json', format);
        loader.call(source, [], 1, 'EPSG:3857', successSpy, function () {
          setTimeout(function () {
            assert.strictEqual(successSpy.mock.calls.length, 0);
            resolve();
          }, 0);
        });
      }));
  });
});
