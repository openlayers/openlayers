goog.provide('ol.test.proj');

describe('ol.proj', function() {

  beforeEach(function() {
    ol.proj.common.add();
  });

  afterEach(function() {
    ol.proj.clearAllProjections();
  });

  describe('projection equivalence', function() {

    function _testAllEquivalent(codes) {
      var projections = goog.array.map(codes, ol.proj.get);
      goog.array.forEach(projections, function(source) {
        goog.array.forEach(projections, function(destination) {
          expect(ol.proj.equivalent(source, destination)).to.be.ok();
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
      var epsg4326 = ol.proj.get('EPSG:4326');
      var uniqueObject = {};
      var sourcePoint = [uniqueObject, uniqueObject];
      var destinationPoint = ol.proj.transform(
          sourcePoint, epsg4326, epsg4326);
      expect(sourcePoint === destinationPoint).to.not.be();
      expect(destinationPoint[0] === sourcePoint[0]).to.be.ok();
      expect(destinationPoint[1] === sourcePoint[1]).to.be.ok();
    });
  });

  describe('transform 0,0 from 4326 to 3857', function() {

    it('returns expected value', function() {
      var point = ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[1]).to.roughlyEqual(0, 1e-9);
    });
  });

  describe('transform 0,0 from 3857 to 4326', function() {

    it('returns expected value', function() {
      var point = ol.proj.transform([0, 0], 'EPSG:3857', 'EPSG:4326');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.eql(0);
      expect(point[1]).to.eql(0);
    });
  });

  describe('transform from 4326 to 3857 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value', function() {
      var point = ol.proj.transform(
          [-5.625, 52.4827802220782], 'EPSG:4326', 'EPSG:900913');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.roughlyEqual(-626172.13571216376, 1e-9);
      expect(point[1]).to.roughlyEqual(6887893.4928337997, 1e-8);
    });
  });

  describe('transform from 3857 to 4326 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value', function() {
      var point = ol.proj.transform([-626172.13571216376, 6887893.4928337997],
          'EPSG:900913', 'EPSG:4326');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });
  });

  describe('transformExtent()', function() {

    it('transforms an extent given projection identifiers', function() {
      var sourceExtent = [-15, -30, 45, 60];
      var destinationExtent = ol.proj.transformExtent(
          sourceExtent, 'EPSG:4326', 'EPSG:3857');
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      expect(destinationExtent[0])
          .to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent[2]).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent[1]).to.roughlyEqual(-3503549.843504376, 1e-8);
      expect(destinationExtent[3]).to.roughlyEqual(8399737.889818361, 1e-8);
    });

  });

  describe('Proj4js integration', function() {

    it('allows Proj4js projections to be used transparently', function() {
      var point = ol.proj.transform(
          [-626172.13571216376, 6887893.4928337997], 'GOOGLE', 'WGS84');
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });

    it('allows new Proj4js projections to be defined', function() {
      proj4.defs('EPSG:21781',
          '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      var point = ol.proj.transform([7.439583333333333, 46.95240555555556],
          'EPSG:4326', 'EPSG:21781');
      expect(point[0]).to.roughlyEqual(600072.300, 1);
      expect(point[1]).to.roughlyEqual(200146.976, 1);
      delete proj4.defs['EPSG:21781'];
    });

    it('caches the new Proj4js projections given their srsCode', function() {
      proj4.defs('EPSG:21781',
          '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      var code = 'urn:ogc:def:crs:EPSG:21781';
      var srsCode = 'EPSG:21781';
      proj4.defs(code, proj4.defs(srsCode));
      var proj = ol.proj.get(code);
      var proj2 = ol.proj.get(srsCode);
      expect(ol.proj.equivalent(proj2, proj)).to.be(true);
      delete proj4.defs[code];
      delete proj4.defs[srsCode];
    });

    it('numerically estimates point scale at the equator', function() {
      var googleProjection = ol.proj.get('GOOGLE');
      expect(googleProjection.getPointResolution(1, [0, 0])).
          to.roughlyEqual(1, 1e-1);
    });

    it('numerically estimates point scale at various latitudes', function() {
      var epsg3857Projection = ol.proj.get('EPSG:3857');
      var googleProjection = ol.proj.get('GOOGLE');
      var point, y;
      for (y = -20; y <= 20; ++y) {
        point = [0, 1000000 * y];
        expect(googleProjection.getPointResolution(1, point)).to.roughlyEqual(
            epsg3857Projection.getPointResolution(1, point), 1e-1);
      }
    });

    it('numerically estimates point scale at various points', function() {
      var epsg3857Projection = ol.proj.get('EPSG:3857');
      var googleProjection = ol.proj.get('GOOGLE');
      var point, x, y;
      for (x = -20; x <= 20; ++x) {
        for (y = -20; y <= 20; ++y) {
          point = [1000000 * x, 1000000 * y];
          expect(googleProjection.getPointResolution(1, point)).to.roughlyEqual(
              epsg3857Projection.getPointResolution(1, point), 1e-1);
        }
      }
    });

  });

  describe('ol.proj.getTransformFromProjections()', function() {

    it('returns a transform function', function() {
      var transform = ol.proj.getTransformFromProjections(ol.proj.get('GOOGLE'),
          ol.proj.get('EPSG:4326'));
      expect(typeof transform).to.be('function');

      var output = transform([-12000000, 5000000]);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);
    });

    it('works for longer arrays', function() {
      var transform = ol.proj.getTransformFromProjections(ol.proj.get('GOOGLE'),
          ol.proj.get('EPSG:4326'));
      expect(typeof transform).to.be('function');

      var output = transform([-12000000, 5000000, -12000000, 5000000]);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);
      expect(output[2]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[3]).to.roughlyEqual(40.91627447067577, 1e-9);
    });

  });

  describe('ol.proj.getTransform()', function() {

    it('returns a function', function() {
      var transform = ol.proj.getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');
    });

    it('returns a transform function', function() {
      var transform = ol.proj.getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');

      var output = transform([-626172.13571216376, 6887893.4928337997]);

      expect(output[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[1]).to.roughlyEqual(52.4827802220782, 1e-9);

    });

    it('works for longer arrays of coordinate values', function() {
      var transform = ol.proj.getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');

      var output = transform([
        -626172.13571216376, 6887893.4928337997,
        -12000000, 5000000,
        -626172.13571216376, 6887893.4928337997
      ]);

      expect(output[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[1]).to.roughlyEqual(52.4827802220782, 1e-9);
      expect(output[2]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[3]).to.roughlyEqual(40.91627447067577, 1e-9);
      expect(output[4]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[5]).to.roughlyEqual(52.4827802220782, 1e-9);
    });

    it('accepts an optional destination array', function() {
      var transform = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');
      var input = [-12000000, 5000000];
      var output = [];

      var got = transform(input, output);
      expect(got).to.be(output);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);

      expect(input).to.eql([-12000000, 5000000]);
    });

    it('accepts a dimension', function() {
      var transform = ol.proj.getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');

      var dimension = 3;
      var output = transform([
        -626172.13571216376, 6887893.4928337997, 100,
        -12000000, 5000000, 200,
        -626172.13571216376, 6887893.4928337997, 300
      ], undefined, dimension);

      expect(output[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[1]).to.roughlyEqual(52.4827802220782, 1e-9);
      expect(output[2]).to.be(100);
      expect(output[3]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[4]).to.roughlyEqual(40.91627447067577, 1e-9);
      expect(output[5]).to.be(200);
      expect(output[6]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[7]).to.roughlyEqual(52.4827802220782, 1e-9);
      expect(output[8]).to.be(300);
    });
  });

  describe('ol.proj.removeTransform()', function() {

    var extent = [180, -90, 180, 90];
    var units = ol.proj.Units.DEGREES;

    it('removes functions cached by addTransform', function() {
      var foo = new ol.proj.Projection({
        code: 'foo',
        units: units,
        extent: extent
      });
      var bar = new ol.proj.Projection({
        code: 'bar',
        units: units,
        extent: extent
      });
      var transform = function(input, output, dimension) {return input;};
      ol.proj.addTransform(foo, bar, transform);
      expect(ol.proj.transforms_).not.to.be(undefined);
      expect(ol.proj.transforms_.foo).not.to.be(undefined);
      expect(ol.proj.transforms_.foo.bar).to.be(transform);

      var removed = ol.proj.removeTransform(foo, bar);
      expect(removed).to.be(transform);
      expect(ol.proj.transforms_.foo).to.be(undefined);
    });

  });

  describe('ol.proj.Projection.prototype.getMetersPerUnit()', function() {

    beforeEach(function() {
      proj4.defs('EPSG:26782',
          '+proj=lcc +lat_1=29.3 +lat_2=30.7 +lat_0=28.66666666666667 ' +
          '+lon_0=-91.33333333333333 +x_0=609601.2192024384 +y_0=0 ' +
          '+ellps=clrk66 +datum=NAD27 +to_meter=0.3048006096012192 +no_defs');
    });

    afterEach(function() {
      delete proj4.defs['EPSG:26782'];
    });

    it('returns value in meters', function() {
      var epsg4326 = ol.proj.get('EPSG:4326');
      expect(epsg4326.getMetersPerUnit()).to.eql(111194.87428468118);
    });

    it('works for proj4js projections without units', function() {
      var epsg26782 = ol.proj.get('EPSG:26782');
      expect(epsg26782.getMetersPerUnit()).to.eql(0.3048006096012192);
    });

  });

});


goog.require('goog.array');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
goog.require('ol.proj.common');
