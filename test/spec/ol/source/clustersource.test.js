goog.provide('ol.test.source.ClusterSource');

goog.require('ol.source.Vector');

describe('ol.source.Cluster', function() {

  describe('constructor', function() {
    it('returns a cluster source', function() {
      var source = new ol.source.Cluster({
        projection: ol.proj.get('EPSG:4326'),
        source: new ol.source.Vector()
      });
      expect(source).to.be.a(ol.source.Source);
      expect(source).to.be.a(ol.source.Cluster);
    });
  });
});

goog.require('ol.proj');
goog.require('ol.source.Cluster');
goog.require('ol.source.Source');
