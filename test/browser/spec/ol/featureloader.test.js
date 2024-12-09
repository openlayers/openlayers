import {spy as sinonSpy} from 'sinon';
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

    it('adds features to the source', function (done) {
      loader = xhr(url, format);
      source.on('addfeature', function (e) {
        setTimeout(function () {
          expect(source.getFeatures().length).to.be.greaterThan(0);
          done();
        }, 0);
      });
      loader.call(source, [], 1, 'EPSG:3857');
    });

    describe('when called with urlFunction', function () {
      it('adds features to the source', function (done) {
        url = function (extent, resolution, projection) {
          return 'spec/ol/data/point.json';
        };
        loader = xhr(url, format);

        source.on('addfeature', function (e) {
          setTimeout(function () {
            expect(source.getFeatures().length).to.be.greaterThan(0);
            done();
          }, 0);
        });
        loader.call(source, [], 1, 'EPSG:3857');
      });

      it('sends the correct arguments to the urlFunction', function (done) {
        const extent = [];
        const resolution = 1;
        const projection = 'EPSG:3857';
        url = function (extent_, resolution_, projection_) {
          expect(extent_).to.eql(extent);
          expect(resolution_).to.eql(resolution);
          expect(projection_).to.eql(projection);
          done();
          return 'spec/ol/data/point.json';
        };
        loader = xhr(url, format);
        loader.call(source, [], 1, 'EPSG:3857');
      });
    });

    it('calls the success callback', function (done) {
      const errorSpy = sinonSpy();
      loader = xhr(url, format);
      loader.call(
        source,
        [],
        1,
        'EPSG:3857',
        function () {
          setTimeout(function () {
            expect(errorSpy.callCount).to.be(0);
            done();
          }, 0);
        },
        errorSpy,
      );
    });

    it('calls the failure callback when the parsing throws an error (xml)', function (done) {
      const successSpy = sinonSpy();
      loader = xhr('spec/ol/data/exceptionreport.xml', format);
      loader.call(source, [], 1, 'EPSG:3857', successSpy, function () {
        setTimeout(function () {
          expect(successSpy.callCount).to.be(0);
          done();
        }, 0);
      });
    });

    it('calls the failure callback when the parsing throws an error (json)', function (done) {
      const successSpy = sinonSpy();
      loader = xhr('spec/ol/data/exceptionreport.json', format);
      loader.call(source, [], 1, 'EPSG:3857', successSpy, function () {
        setTimeout(function () {
          expect(successSpy.callCount).to.be(0);
          done();
        }, 0);
      });
    });
  });
});
