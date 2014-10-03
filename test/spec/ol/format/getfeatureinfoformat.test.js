goog.provide('ol.test.format.GetFeatureInfo');

describe('ol.format.GetFeatureInfo', function() {

  describe('#readFormat', function() {

    describe('read Features', function() {

      var features;

      before(function(done) {
        proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
        afterLoadText('spec/ol/format/wms/getfeatureinfo.xml', function(data) {
          try {
            features = new ol.format.GetFeatureInfo().readFeatures(data);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      it('creates 3 features', function() {
        expect(features).to.have.length(3);
      });

      it('creates a feature for 1071', function() {
        var feature = features[0];
        expect(feature.getId()).to.be(undefined);
        expect(feature.get('FID')).to.equal('1071');
        expect(feature.get('NO_CAMPAGNE')).to.equal('1020050');
      });

      it('read boundedBy but no geometry', function() {
        var feature = features[0];
        expect(feature.getGeometry()).to.be(undefined);
        expect(feature.get('boundedBy')).to.eql(
            [-531138.686422, 5386348.414671, -117252.819653, 6144475.186022]);
      });
    });
  });
});


goog.require('goog.dom');
goog.require('ol.format.GetFeatureInfo');
