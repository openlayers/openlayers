goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var source = new ol.source.Vector({});
      expect(source).to.be.a(ol.source.Vector);
      expect(source).to.be.a(ol.source.Source);
    });
  });

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var source = new ol.source.Vector({});
      source.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(source.getFeatures().length).to.eql(2);
    });
  });

  describe('#getFeatures()', function() {

    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.Point([16.1, 48.1])
        }),
        new ol.Feature({
          g: new ol.geom.Point([16.2, 48.2])
        }),
        new ol.Feature({
          g: new ol.geom.Point([16.3, 48.3])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[16.4, 48.4], [16.5, 48.5]])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[16.6, 48.6], [16.7, 48.7]])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[16.8, 48.8], [16.9, 48.9]])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector({});
      source.addFeatures(features);
    });

    var geomFilter = new ol.filter.Geometry(ol.geom.GeometryType.LINESTRING);
    var extentFilter = new ol.filter.Extent(new ol.Extent(16, 48, 16.3, 48.3));

    it('can filter by geometry type using its GeometryType index', function() {
      sinon.spy(geomFilter, 'applies');
      var lineStrings = source.getFeatures(geomFilter);
      expect(geomFilter.applies).to.not.be.called();
      expect(lineStrings.length).to.eql(4);
      expect(lineStrings).to.contain(features[4]);
    });

    it('can filter by extent using its RTree', function() {
      sinon.spy(extentFilter, 'applies');
      var subset = source.getFeatures(extentFilter);
      expect(extentFilter.applies).to.not.be.called();
      expect(subset.length).to.eql(4);
      expect(subset).not.to.contain(features[7]);
    });

    it('can filter by extent and geometry type using its index', function() {
      var filter1 = new ol.filter.Logical([geomFilter, extentFilter],
          ol.filter.LogicalOperator.AND);
      var filter2 = new ol.filter.Logical([extentFilter, geomFilter],
          ol.filter.LogicalOperator.AND);
      sinon.spy(filter1, 'applies');
      sinon.spy(filter2, 'applies');
      var subset1 = source.getFeatures(filter1);
      var subset2 = source.getFeatures(filter2);
      expect(filter1.applies).to.not.be.called();
      expect(filter2.applies).to.not.be.called();
      expect(subset1.length).to.eql(0);
      expect(subset2.length).to.eql(0);
    });

    it('can handle query using the filter\'s applies function', function() {
      var filter = new ol.filter.Logical([geomFilter, extentFilter],
          ol.filter.LogicalOperator.OR);
      sinon.spy(filter, 'applies');
      var subset = source.getFeatures(filter);
      expect(filter.applies).to.be.called();
      expect(subset.length).to.eql(8);
    });

  });

});

goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.source.Source');
goog.require('ol.source.Vector');
