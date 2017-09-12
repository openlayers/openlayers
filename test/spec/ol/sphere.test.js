// See http://www.movable-type.co.uk/scripts/latlong.html
// FIXME add tests for offset


goog.require('ol.Sphere');
goog.require('ol.format.WKT');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.proj.EPSG4326');


describe('ol.Sphere', function() {

  var sphere = new ol.Sphere(6371);
  var expected = [{
    c1: [0, 0],
    c2: [0, 0],
    haversineDistance: 0
  }, {
    c1: [0, 0],
    c2: [45, 45],
    haversineDistance: 6671.695598673525
  }, {
    c1: [0, 0],
    c2: [-45, 45],
    haversineDistance: 6671.695598673525
  }, {
    c1: [0, 0],
    c2: [-45, -45],
    haversineDistance: 6671.695598673525
  }, {
    c1: [0, 0],
    c2: [45, -45],
    haversineDistance: 6671.695598673525
  }, {
    c1: [45, 45],
    c2: [45, 45],
    haversineDistance: 0
  }, {
    c1: [45, 45],
    c2: [-45, 45],
    haversineDistance: 6671.695598673525
  }, {
    c1: [45, 45],
    c2: [-45, -45],
    haversineDistance: 13343.391197347048
  }, {
    c1: [45, 45],
    c2: [45, -45],
    haversineDistance: 10007.543398010286
  }, {
    c1: [-45, 45],
    c2: [-45, 45],
    haversineDistance: 0
  }, {
    c1: [-45, 45],
    c2: [-45, -45],
    haversineDistance: 10007.543398010286
  }, {
    c1: [-45, 45],
    c2: [45, -45],
    haversineDistance: 13343.391197347048
  }, {
    c1: [-45, -45],
    c2: [-45, -45],
    haversineDistance: 0
  }, {
    c1: [-45, -45],
    c2: [45, -45],
    haversineDistance: 6671.695598673525
  }, {
    c1: [45, -45],
    c2: [45, -45],
    haversineDistance: 0
  }];

  describe('haversineDistance', function() {

    it('results match Chris Veness\'s reference implementation', function() {
      var e, i;
      for (i = 0; i < expected.length; ++i) {
        e = expected[i];
        expect(sphere.haversineDistance(e.c1, e.c2)).to.roughlyEqual(
            e.haversineDistance, 1e-9);
      }
    });

  });

  describe('Vincenty area', function() {
    var geometry;
    before(function(done) {
      afterLoadText('spec/ol/format/wkt/illinois.wkt', function(wkt) {
        try {
          var format = new ol.format.WKT();
          geometry = format.readGeometry(wkt);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('results match the expected area of Ilinois', function() {
      var coords = geometry.getPolygon(0).getLinearRing(0).getCoordinates();
      var sphere = new ol.Sphere(ol.proj.EPSG4326.RADIUS);
      expect(sphere.geodesicArea(coords)).to.equal(145978332359.37125);
    });
  });

});

describe('ol.Sphere.getLength()', function() {
  var cases = [{
    geometry: new ol.geom.Point([0, 0]),
    length: 0
  }, {
    geometry: new ol.geom.MultiPoint([[0, 0], [1, 1]]),
    length: 0
  }, {
    geometry: new ol.geom.LineString([
      [12801741.441226462, -3763310.627144653],
      [14582853.293918837, -2511525.2348457114],
      [15918687.18343812, -2875744.624352243],
      [16697923.618991036, -4028802.0261344076]
    ]),
    length: 4407939.124914191
  }, {
    geometry: new ol.geom.LineString([
      [115, -32],
      [131, -22],
      [143, -25],
      [150, -34]
    ]),
    options: {projection: 'EPSG:4326'},
    length: 4407939.124914191
  }, {
    geometry: new ol.geom.MultiLineString([
      [
        [115, -32],
        [131, -22],
        [143, -25],
        [150, -34]
      ], [
        [115, -32],
        [131, -22],
        [143, -25],
        [150, -34]
      ]
    ]),
    options: {projection: 'EPSG:4326'},
    length: 2 * 4407939.124914191
  }, {
    geometry: new ol.geom.GeometryCollection([
      new ol.geom.LineString([
        [115, -32],
        [131, -22],
        [143, -25],
        [150, -34]
      ]),
      new ol.geom.LineString([
        [115, -32],
        [131, -22],
        [143, -25],
        [150, -34]
      ])
    ]),
    options: {projection: 'EPSG:4326'},
    length: 2 * 4407939.124914191
  }];

  cases.forEach(function(c, i) {
    it('works for case ' + i, function() {
      var c = cases[i];
      var length = ol.Sphere.getLength(c.geometry, c.options);
      expect(length).to.roughlyEqual(c.length, 1e-8);
    });
  });

});

describe('ol.Sphere.getArea()', function() {
  var geometry;
  before(function(done) {
    afterLoadText('spec/ol/format/wkt/illinois.wkt', function(wkt) {
      try {
        var format = new ol.format.WKT();
        geometry = format.readGeometry(wkt);
      } catch (e) {
        done(e);
      }
      done();
    });
  });

  it('calculates the area of Ilinois', function() {
    var area = ol.Sphere.getArea(geometry, {projection: 'EPSG:4326'});
    expect(area).to.equal(145652224192.4434);
  });
});
