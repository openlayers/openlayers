import {xhr} from '../../../src/ol/featureloader.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import VectorSource from '../../../src/ol/source/Vector.js';


describe('ol.featureloader', () => {

  describe('ol.featureloader.xhr', () => {
    let loader;
    let source;
    let url;
    let format;

    beforeEach(() => {
      url = 'spec/ol/data/point.json';
      format = new GeoJSON();

      source = new VectorSource();
    });

    test('adds features to the source', done => {
      loader = xhr(url, format);
      source.on('addfeature', function(e) {
        expect(source.getFeatures().length).toBeGreaterThan(0);
        done();
      });
      loader.call(source, [], 1, 'EPSG:3857');
    });

    describe('when called with urlFunction', () => {
      test('adds features to the source', done => {
        url = function(extent, resolution, projection) {
          return 'spec/ol/data/point.json';
        };
        loader = xhr(url, format);

        source.on('addfeature', function(e) {
          expect(source.getFeatures().length).toBeGreaterThan(0);
          done();
        });
        loader.call(source, [], 1, 'EPSG:3857');
      });

      test('sends the correct arguments to the urlFunction', done => {
        const extent = [];
        const resolution = 1;
        const projection = 'EPSG:3857';
        url = function(extent_, resolution_, projection_) {
          expect(extent_).toEqual(extent);
          expect(resolution_).toEqual(resolution);
          expect(projection_).toEqual(projection);
          done();
          return 'spec/ol/data/point.json';
        };
        loader = xhr(url, format);
        loader.call(source, [], 1, 'EPSG:3857');
      });
    });

  });

});
