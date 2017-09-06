

import _ol_featureloader_ from '../../../src/ol/featureloader';
import _ol_format_GeoJSON_ from '../../../src/ol/format/geojson';
import _ol_source_Vector_ from '../../../src/ol/source/vector';


describe('ol.featureloader', function() {

  describe('ol.featureloader.xhr', function() {
    var loader;
    var source;
    var url;
    var format;

    beforeEach(function() {
      url = 'spec/ol/data/point.json';
      format = new _ol_format_GeoJSON_();

      source = new _ol_source_Vector_();
    });

    it('adds features to the source', function(done) {
      loader = _ol_featureloader_.xhr(url, format);
      source.on('addfeature', function(e) {
        expect(source.getFeatures().length).to.be.greaterThan(0);
        done();
      });
      loader.call(source, [], 1, 'EPSG:3857');
    });

    describe('when called with urlFunction', function() {
      it('adds features to the source', function(done) {
        url = function(extent, resolution, projection) {
          return 'spec/ol/data/point.json';
        };
        loader = _ol_featureloader_.xhr(url, format);

        source.on('addfeature', function(e) {
          expect(source.getFeatures().length).to.be.greaterThan(0);
          done();
        });
        loader.call(source, [], 1, 'EPSG:3857');
      });

      it('sends the correct arguments to the urlFunction', function(done) {
        var extent = [];
        var resolution = 1;
        var projection = 'EPSG:3857';
        url = function(extent_, resolution_, projection_) {
          expect(extent_).to.eql(extent);
          expect(resolution_).to.eql(resolution);
          expect(projection_).to.eql(projection);
          done();
          return 'spec/ol/data/point.json';
        };
        loader = _ol_featureloader_.xhr(url, format);
        loader.call(source, [], 1, 'EPSG:3857');
      });
    });

  });

});
