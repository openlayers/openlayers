goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {
    
  var vectorSource, features;

  beforeEach(function() {
    features = [
      new ol.Feature(new ol.geom.Point([16.0, 48.0])),
      new ol.Feature(new ol.geom.Point([16.1, 48.1])),
      new ol.Feature(new ol.geom.Point([16.2, 48.2])),
      new ol.Feature(new ol.geom.Point([16.3, 48.3])),
      new ol.Feature(new ol.geom.LineString([[16.4, 48.4], [16.5, 48.5]])),
      new ol.Feature(new ol.geom.LineString([[16.6, 48.6], [16.7, 48.7]])),
      new ol.Feature(new ol.geom.LineString([[16.8, 48.8], [16.9, 48.9]])),
      new ol.Feature(new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]]))
    ];
    vectorSource = new ol.source.Vector({
      projection: ol.Projection.getFromCode('EPSG:4326')
    });
    vectorSource.addFeatures(features);
  });

  it('has working addFeatures and getFeatures methods', function() {
    var featuresInSource = vectorSource.getFeatures();
    expect(featuresInSource.length).toEqual(features.length);
    expect(featuresInSource).toContain(features[0]);
    vectorSource.addFeatures([new ol.Feature()]);
    expect(vectorSource.getFeatures().length).toEqual(features.length + 1);
  });
    
  var geomFilter = new ol.filter.Geometry(ol.geom.GeometryType.LINESTRING);
  var extentFilter = new ol.filter.Extent(new ol.Extent(16, 48, 16.3, 48.3));

  it('can filter by geometry type using its GeometryType index', function() {
    spyOn(geomFilter, 'evaluate');
    var lineStrings = vectorSource.getFeatures(geomFilter);
    expect(geomFilter.evaluate).not.toHaveBeenCalled();
    expect(lineStrings.length).toEqual(4);
    expect(lineStrings).toContain(features[4]);
  });
  
  it('can filter by extent using its RTree', function() {
    spyOn(extentFilter, 'evaluate');
    var subset = vectorSource.getFeatures(extentFilter);
    expect(extentFilter.evaluate).not.toHaveBeenCalled();
    expect(subset.length).toEqual(4);
    expect(subset).not.toContain(features[7]);
  });
  
  it('can filter by extent and geometry type using its index', function() {
    var filter1 = new ol.filter.Logical([geomFilter, extentFilter],
        ol.filter.LogicalOperator.AND);
    var filter2 = new ol.filter.Logical([extentFilter, geomFilter],
        ol.filter.LogicalOperator.AND);
    spyOn(filter1, 'evaluate');
    spyOn(filter2, 'evaluate');
    var subset1 = vectorSource.getFeatures(filter1);
    var subset2 = vectorSource.getFeatures(filter2);
    expect(filter1.evaluate).not.toHaveBeenCalled();
    expect(filter2.evaluate).not.toHaveBeenCalled();
    expect(subset1.length).toEqual(0);
    expect(subset2.length).toEqual(0);
  });
  
  it('can handle any query using the filter\'s evaluate function', function() {
    var filter = new ol.filter.Logical([geomFilter, extentFilter],
        ol.filter.LogicalOperator.OR);
    spyOn(filter, 'evaluate').andCallThrough();
    var subset = vectorSource.getFeatures(filter);
    expect(filter.evaluate).toHaveBeenCalled();
    expect(subset.length).toEqual(8);
  });

});

goog.require('ol.Projection');
goog.require('ol.filter.GeometryType');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.source.Vector');
