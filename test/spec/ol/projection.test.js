describe('ol.Projection', function() {

  describe('projection equivalence', function() {

    function _testAllEquivalent(codes) {
      var projections = goog.array.map(codes, ol.Projection.getFromCode);
      goog.array.forEach(projections, function(source) {
        goog.array.forEach(projections, function(destination) {
          expect(ol.Projection.equivalent(source, destination)).toBeTruthy();
        });
      });
    }

    it('gives that 3857, 102100, 102113, 900913 are equivalent ', function() {
      _testAllEquivalent([
        'EPSG:3857',
        'EPSG:102100',
        'EPSG:102113',
        'EPSG:900913'
      ]);
    });

    it('gives that CRS:84, urn:ogc:def:crs:EPSG:6.6:4326, EPSG:4326 are ' +
         'equivalent', function() {
      _testAllEquivalent([
        'CRS:84',
        'urn:ogc:def:crs:EPSG:6.6:4326',
        'EPSG:4326'
      ]);
    });

  });

  describe('identify transform', function() {

    it('returns a new object, with same coord values', function() {
      var epsg4326 = ol.Projection.getFromCode('EPSG:4326');
      var uniqueObject = {};
      var sourcePoint = new ol.Coordinate(uniqueObject, uniqueObject);
      var destinationPoint = ol.Projection.transform(
          sourcePoint, epsg4326, epsg4326);
      expect(sourcePoint === destinationPoint).toBeFalsy();
      expect(destinationPoint.x === sourcePoint.x).toBeTruthy();
      expect(destinationPoint.y === sourcePoint.y).toBeTruthy();
    });
  });

  describe('transform 0,0 from 4326 to 3857', function() {

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(0, 0), 'EPSG:4326', 'EPSG:3857');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.y).toRoughlyEqual(0, 1e-9);
    });
  });

  describe('transform 0,0 from 3857 to 4326', function() {

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(0, 0), 'EPSG:3857', 'EPSG:4326');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.x).toEqual(0);
      expect(point.y).toEqual(0);
    });
  });

  describe('transform from 4326 to 3857 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(-5.625, 52.4827802220782),
          'EPSG:4326',
          'EPSG:900913');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.x).toRoughlyEqual(-626172.13571216376, 1e-9);
      expect(point.y).toRoughlyEqual(6887893.4928337997, 1e-8);
    });
  });

  describe('transform from 3857 to 4326 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value', function() {
      var point = ol.Projection.transformWithCodes(
          new ol.Coordinate(-626172.13571216376, 6887893.4928337997),
          'EPSG:900913',
          'EPSG:4326');
      expect(point).not.toBeUndefined();
      expect(point).not.toBeNull();
      expect(point.x).toRoughlyEqual(-5.625, 1e-9);
      expect(point.y).toRoughlyEqual(52.4827802220782, 1e-9);
    });
  });
});

goog.require('goog.array');
goog.require('ol.Coordinate');
goog.require('ol.Projection');
