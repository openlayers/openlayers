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

  describe('#loadFeatures', function() {
    var extent = [-1, -1, 1, 1];
    var projection = ol.proj.get('EPSG:3857');
    it('clusters a source with point features', function() {
      var source = new ol.source.Cluster({
        source: new ol.source.Vector({
          features: [
            new ol.Feature(new ol.geom.Point([0, 0])),
            new ol.Feature(new ol.geom.Point([0, 0]))
          ]
        })
      });
      source.loadFeatures(extent, 1, projection);
      expect(source.getFeatures().length).to.be(1);
      expect(source.getFeatures()[0].get('features').length).to.be(2);
    });
    it('clusters with a custom geometryFunction', function() {
      var source = new ol.source.Cluster({
        geometryFunction: function(feature) {
          var geom = feature.getGeometry();
          if (geom.getType() == 'Point') {
            return geom;
          } else if (geom.getType() == 'Polygon') {
            return geom.getInteriorPoint();
          }
          return null;
        },
        source: new ol.source.Vector({
          features: [
            new ol.Feature(new ol.geom.Point([0, 0])),
            new ol.Feature(new ol.geom.LineString([[0, 0], [1, 1]])),
            new ol.Feature(new ol.geom.Polygon(
                [[[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]]))
          ]
        })
      });
      source.loadFeatures(extent, 1, projection);
      expect(source.getFeatures().length).to.be(1);
      expect(source.getFeatures()[0].get('features').length).to.be(2);
    });
  })
});

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('ol.source.Cluster');
goog.require('ol.source.Source');
