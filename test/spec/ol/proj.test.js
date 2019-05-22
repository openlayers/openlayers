import {
  addCommon,
  clearAllProjections,
  equivalent,
  get as getProjection,
  transform,
  transformExtent,
  fromLonLat,
  toLonLat,
  getTransform,
  getPointResolution,
  getTransformFromProjections,
  METERS_PER_UNIT
} from '../../../src/ol/proj.js';
import {register} from '../../../src/ol/proj/proj4.js';
import {HALF_SIZE} from '../../../src/ol/proj/epsg3857.js';
import {METERS_PER_UNIT as metersPerDegree} from '../../../src/ol/proj/epsg4326.js';
import Projection from '../../../src/ol/proj/Projection.js';


describe('ol.proj', function() {

  afterEach(function() {
    clearAllProjections();
    addCommon();
  });

  describe('toLonLat()', function() {
    const cases = [{
      from: [0, 0],
      to: [0, 0]
    }, {
      from: [-12356463.478053365, 5700582.732404122],
      to: [-111, 45.5]
    }, {
      from: [2 * HALF_SIZE - 12356463.478053365, 5700582.732404122],
      to: [-111, 45.5]
    }, {
      from: [-4 * HALF_SIZE - 12356463.478053365, 5700582.732404122],
      to: [-111, 45.5]
    }];

    cases.forEach(function(c) {
      it('works for ' + c.from.join(', '), function() {
        const lonLat = toLonLat(c.from);
        expect(lonLat[0]).to.roughlyEqual(c.to[0], 1e-9);
        expect(lonLat[1]).to.roughlyEqual(c.to[1], 1e-9);
      });
    });
  });

  describe('projection equivalence', function() {

    function _testAllEquivalent(codes) {
      const projections = codes.map(getProjection);
      projections.forEach(function(source) {
        projections.forEach(function(destination) {
          expect(equivalent(source, destination)).to.be.ok();
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

    it('gives that custom 3413 is equivalent to self', function() {
      const code = 'EPSG:3413';

      const source = new Projection({
        code: code
      });

      const destination = new Projection({
        code: code
      });

      expect(equivalent(source, destination)).to.be.ok();
    });

    it('gives that default 3857 is equivalent to self', function() {
      _testAllEquivalent([
        'EPSG:3857',
        'EPSG:3857'
      ]);
    });

    it('gives that CRS:84, urn:ogc:def:crs:EPSG:6.6:4326, EPSG:4326 are ' +
        'equivalent',
    function() {
      _testAllEquivalent([
        'CRS:84',
        'urn:ogc:def:crs:EPSG:6.6:4326',
        'EPSG:4326'
      ]);
    });

    it('requires code and units to be equal for projection evquivalence',
      function() {
        const proj1 = new Projection({
          code: 'EPSG:3857',
          units: 'm'
        });
        const proj2 = new Projection({
          code: 'EPSG:3857',
          units: 'tile-pixels'
        });
        expect(equivalent(proj1, proj2)).to.not.be.ok();
      });

  });

  describe('identify transform', function() {

    it('returns a new object, with same coord values', function() {
      const epsg4326 = getProjection('EPSG:4326');
      const uniqueObject = {};
      const sourcePoint = [uniqueObject, uniqueObject];
      const destinationPoint = transform(
        sourcePoint, epsg4326, epsg4326);
      expect(sourcePoint === destinationPoint).to.not.be();
      expect(destinationPoint[0] === sourcePoint[0]).to.be.ok();
      expect(destinationPoint[1] === sourcePoint[1]).to.be.ok();
    });
  });

  describe('transform 0,0 from 4326 to 3857', function() {

    it('returns expected value', function() {
      const point = transform([0, 0], 'EPSG:4326', 'EPSG:3857');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[1]).to.roughlyEqual(0, 1e-9);
    });
  });

  describe('transform 0,0 from 3857 to 4326', function() {

    it('returns expected value', function() {
      const point = transform([0, 0], 'EPSG:3857', 'EPSG:4326');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.eql(0);
      expect(point[1]).to.eql(0);
    });
  });

  describe('transform from 4326 to 3857 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value using ol.proj.transform', function() {
      const point = transform(
        [-5.625, 52.4827802220782], 'EPSG:4326', 'EPSG:900913');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.roughlyEqual(-626172.13571216376, 1e-9);
      expect(point[1]).to.roughlyEqual(6887893.4928337997, 1e-8);
    });

    it('returns expected value using ol.proj.fromLonLat', function() {
      const point = fromLonLat([-5.625, 52.4827802220782]);
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.roughlyEqual(-626172.13571216376, 1e-9);
      expect(point[1]).to.roughlyEqual(6887893.4928337997, 1e-8);
    });
  });

  describe('transform from 3857 to 4326 (Alastaira)', function() {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value using ol.proj.transform', function() {
      const point = transform([-626172.13571216376, 6887893.4928337997],
        'EPSG:900913', 'EPSG:4326');
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });

    it('returns expected value using ol.proj.toLonLat', function() {
      const point = toLonLat([-626172.13571216376, 6887893.4928337997]);
      expect(point).not.to.be(undefined);
      expect(point).not.to.be(null);
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });
  });

  describe('canWrapX()', function() {

    it('requires an extent for allowing wrapX', function() {
      let proj = new Projection({
        code: 'foo',
        global: true
      });
      expect(proj.canWrapX()).to.be(false);
      proj.setExtent([1, 2, 3, 4]);
      expect(proj.canWrapX()).to.be(true);
      proj = new Projection({
        code: 'foo',
        global: true,
        extent: [1, 2, 3, 4]
      });
      expect(proj.canWrapX()).to.be(true);
      proj.setExtent(null);
      expect(proj.canWrapX()).to.be(false);
    });

    it('requires global to be true for allowing wrapX', function() {
      let proj = new Projection({
        code: 'foo',
        extent: [1, 2, 3, 4]
      });
      expect(proj.canWrapX()).to.be(false);
      proj.setGlobal(true);
      expect(proj.canWrapX()).to.be(true);
      proj = new Projection({
        code: 'foo',
        global: true,
        extent: [1, 2, 3, 4]
      });
      expect(proj.canWrapX()).to.be(true);
      proj.setGlobal(false);
      expect(proj.canWrapX()).to.be(false);
    });

  });

  describe('transformExtent()', function() {

    it('transforms an extent given projection identifiers', function() {
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = transformExtent(
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

  describe('getPointResolution()', function() {
    it('returns the correct point resolution for EPSG:4326', function() {
      let pointResolution = getPointResolution('EPSG:4326', 1, [0, 0]);
      expect (pointResolution).to.be(1);
      pointResolution = getPointResolution('EPSG:4326', 1, [0, 52]);
      expect (pointResolution).to.be(1);
    });
    it('returns the correct point resolution for EPSG:4326 with custom units', function() {
      let pointResolution = getPointResolution('EPSG:4326', 1, [0, 0], 'm');
      expect(pointResolution).to.roughlyEqual(111195.0802335329, 1e-5);
      pointResolution = getPointResolution('EPSG:4326', 1, [0, 52], 'm');
      expect(pointResolution).to.roughlyEqual(89826.53390979706, 1e-5);
    });
    it('returns the correct point resolution for EPSG:3857', function() {
      let pointResolution = getPointResolution('EPSG:3857', 1, [0, 0]);
      expect(pointResolution).to.be(1);
      pointResolution = getPointResolution('EPSG:3857', 1, fromLonLat([0, 52]));
      expect(pointResolution).to.roughlyEqual(0.615661, 1e-5);
    });
    it('returns the correct point resolution for EPSG:3857 with custom units', function() {
      let pointResolution = getPointResolution('EPSG:3857', METERS_PER_UNIT['degrees'], [0, 0], 'degrees');
      expect(pointResolution).to.be(1);
      pointResolution = getPointResolution('EPSG:4326', 1, fromLonLat([0, 52]), 'degrees');
      expect(pointResolution).to.be(1);
    });
  });

  describe('Proj4js integration', function() {

    afterEach(function() {
      delete proj4.defs['EPSG:21781'];
      clearAllProjections();
      addCommon();
    });

    it('creates ol.proj.Projection instance from EPSG:21781', function() {
      proj4.defs('EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      register(proj4);
      const proj = getProjection('EPSG:21781');
      expect(proj.getCode()).to.eql('EPSG:21781');
      expect(proj.getUnits()).to.eql('m');
      expect(proj.getMetersPerUnit()).to.eql(1);
    });

    it('creates ol.proj.Projection instance from EPSG:3739', function() {
      proj4.defs('EPSG:3739',
        '+proj=tmerc +lat_0=40.5 +lon_0=-110.0833333333333 +k=0.9999375 ' +
          '+x_0=800000.0000101599 +y_0=99999.99998983997 +ellps=GRS80 ' +
          '+towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs');
      register(proj4);
      const proj = getProjection('EPSG:3739');
      expect(proj.getCode()).to.eql('EPSG:3739');
      expect(proj.getUnits()).to.eql('us-ft');
      expect(proj.getMetersPerUnit()).to.eql(1200 / 3937);

      delete proj4.defs['EPSG:3739'];
    });

    it('allows Proj4js projections to be used transparently', function() {
      register(proj4);
      const point = transform(
        [-626172.13571216376, 6887893.4928337997], 'GOOGLE', 'WGS84');
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });

    it('allows new Proj4js projections to be defined', function() {
      proj4.defs('EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      register(proj4);
      const point = transform([7.439583333333333, 46.95240555555556],
        'EPSG:4326', 'EPSG:21781');
      expect(point[0]).to.roughlyEqual(600072.300, 1);
      expect(point[1]).to.roughlyEqual(200146.976, 1);
    });

    it('works with ol.proj.fromLonLat and ol.proj.toLonLat', function() {
      proj4.defs('EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      register(proj4);
      const lonLat = [7.439583333333333, 46.95240555555556];
      let point = fromLonLat(lonLat, 'EPSG:21781');
      expect(point[0]).to.roughlyEqual(600072.300, 1);
      expect(point[1]).to.roughlyEqual(200146.976, 1);
      point = toLonLat(point, 'EPSG:21781');
      expect(point[0]).to.roughlyEqual(lonLat[0], 1);
      expect(point[1]).to.roughlyEqual(lonLat[1], 1);
    });

    it('caches the new Proj4js projections given their srsCode', function() {
      proj4.defs('EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      const code = 'urn:ogc:def:crs:EPSG:21781';
      const srsCode = 'EPSG:21781';
      proj4.defs(code, proj4.defs(srsCode));
      register(proj4);
      const proj = getProjection(code);
      const proj2 = getProjection(srsCode);
      expect(equivalent(proj2, proj)).to.be(true);
      delete proj4.defs[code];
    });

    it('numerically estimates point scale at the equator', function() {
      register(proj4);
      const googleProjection = getProjection('GOOGLE');
      expect(getPointResolution(googleProjection, 1, [0, 0])).
        to.roughlyEqual(1, 1e-1);
    });

    it('numerically estimates point scale at various latitudes', function() {
      register(proj4);
      const epsg3857Projection = getProjection('EPSG:3857');
      const googleProjection = getProjection('GOOGLE');
      let point, y;
      for (y = -20; y <= 20; ++y) {
        point = [0, 1000000 * y];
        expect(getPointResolution(googleProjection, 1, point)).to.roughlyEqual(
          getPointResolution(epsg3857Projection, 1, point), 1e-1);
      }
    });

    it('numerically estimates point scale at various points', function() {
      register(proj4);
      const epsg3857Projection = getProjection('EPSG:3857');
      const googleProjection = getProjection('GOOGLE');
      let point, x, y;
      for (x = -20; x <= 20; x += 2) {
        for (y = -20; y <= 20; y += 2) {
          point = [1000000 * x, 1000000 * y];
          expect(getPointResolution(googleProjection, 1, point)).to.roughlyEqual(
            getPointResolution(epsg3857Projection, 1, point), 1e-1);
        }
      }
    });

    it('does not overwrite existing projections in the registry', function() {
      register(proj4);
      const epsg4326 = getProjection('EPSG:4326');
      new Projection({
        code: 'EPSG:4326',
        units: 'degrees',
        extent: [-45, -45, 45, 45]
      });
      expect(getProjection('EPSG:4326')).to.equal(epsg4326);
    });

  });

  describe('ol.proj.getTransformFromProjections()', function() {

    beforeEach(function() {
      register(proj4);
    });

    it('returns a transform function', function() {
      const transform = getTransformFromProjections(getProjection('GOOGLE'),
        getProjection('EPSG:4326'));
      expect(typeof transform).to.be('function');

      const output = transform([-12000000, 5000000]);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);
    });

    it('works for longer arrays', function() {
      const transform = getTransformFromProjections(getProjection('GOOGLE'),
        getProjection('EPSG:4326'));
      expect(typeof transform).to.be('function');

      const output = transform([-12000000, 5000000, -12000000, 5000000]);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);
      expect(output[2]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[3]).to.roughlyEqual(40.91627447067577, 1e-9);
    });

  });

  describe('ol.proj.getTransform()', function() {

    beforeEach(function() {
      register(proj4);
    });

    it('returns a function', function() {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');
    });

    it('returns a transform function', function() {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');

      const output = transform([-626172.13571216376, 6887893.4928337997]);

      expect(output[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[1]).to.roughlyEqual(52.4827802220782, 1e-9);

    });

    it('works for longer arrays of coordinate values', function() {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');

      const output = transform([
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
      const transform = getTransform('EPSG:3857', 'EPSG:4326');
      const input = [-12000000, 5000000];
      const output = [];

      const got = transform(input, output);
      expect(got).to.be(output);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);

      expect(input).to.eql([-12000000, 5000000]);
    });

    it('accepts a dimension', function() {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).to.be('function');

      const dimension = 3;
      const output = transform([
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

  describe('ol.proj.transform()', function() {

    it('transforms a 2d coordinate', function() {
      const got = transform([-10, -20], 'EPSG:4326', 'EPSG:3857');
      expect(got).to.have.length(2);
      expect(got[0]).to.roughlyEqual(-1113194.9079327357, 1e-3);
      expect(got[1]).to.roughlyEqual(-2273030.92698769, 1e-3);
    });

    it('transforms a 3d coordinate', function() {
      const got = transform([-10, -20, 3], 'EPSG:4326', 'EPSG:3857');
      expect(got).to.have.length(3);
      expect(got[0]).to.roughlyEqual(-1113194.9079327357, 1e-3);
      expect(got[1]).to.roughlyEqual(-2273030.92698769, 1e-3);
      expect(got[2]).to.be(3);
    });

    it('transforms a 4d coordinate', function() {
      const got = transform([-10, -20, 3, 4], 'EPSG:4326', 'EPSG:3857');
      expect(got).to.have.length(4);
      expect(got[0]).to.roughlyEqual(-1113194.9079327357, 1e-3);
      expect(got[1]).to.roughlyEqual(-2273030.92698769, 1e-3);
      expect(got[2]).to.be(3);
      expect(got[3]).to.be(4);
    });

    it('works with 3d points and proj4 defs', function() {
      proj4.defs('custom',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      register(proj4);

      const got = transform([-111, 45.5, 123], 'EPSG:4326', 'custom');
      expect(got).to.have.length(3);
      expect(got[0]).to.roughlyEqual(-6601512.194209638, 1);
      expect(got[1]).to.roughlyEqual(6145843.802742112, 1);
      expect(got[2]).to.be(123);

      delete proj4.defs.custom;
      clearAllProjections();
      addCommon();
    });

  });

  describe('ol.proj.Projection.prototype.getMetersPerUnit()', function() {

    beforeEach(function() {
      proj4.defs('EPSG:26782',
        '+proj=lcc +lat_1=29.3 +lat_2=30.7 +lat_0=28.66666666666667 ' +
          '+lon_0=-91.33333333333333 +x_0=609601.2192024384 +y_0=0 ' +
          '+ellps=clrk66 +datum=NAD27 +to_meter=0.3048006096012192 +no_defs');
      proj4.defs('EPSG:3739', '+proj=tmerc +lat_0=40.5 ' +
          '+lon_0=-110.0833333333333 +k=0.9999375 +x_0=800000.0000101599 ' +
          '+y_0=99999.99998983997 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 ' +
          '+units=us-ft +no_defs');
      proj4.defs('EPSG:4269', 'GEOGCS["NAD83",' +
          'DATUM["North_American_Datum_1983",' +
          'SPHEROID["GRS 1980",6378137,298.257222101,' +
          'AUTHORITY["EPSG","7019"]],' +
          'AUTHORITY["EPSG","6269"]],' +
          'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
          'UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],' +
          'AUTHORITY["EPSG","4269"]]');
      proj4.defs('EPSG:4279', 'GEOGCS["OS(SN)80",DATUM["OS_SN_1980",' +
          'SPHEROID["Airy 1830",6377563.396,299.3249646,' +
          'AUTHORITY["EPSG","7001"]],' +
          'AUTHORITY["EPSG","6279"]],' +
          'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
          'UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],' +
          'AUTHORITY["EPSG","4279"]]');
      register(proj4);
    });

    afterEach(function() {
      delete proj4.defs['EPSG:26782'];
      delete proj4.defs['EPSG:3739'];
      delete proj4.defs['EPSG:4269'];
      delete proj4.defs['EPSG:4279'];
      clearAllProjections();
      addCommon();
    });

    it('returns value in meters', function() {
      const epsg4326 = getProjection('EPSG:4326');
      expect(epsg4326.getMetersPerUnit()).to.eql(metersPerDegree);
    });

    it('works for proj4js projections without units', function() {
      const epsg26782 = getProjection('EPSG:26782');
      expect(epsg26782.getMetersPerUnit()).to.eql(0.3048006096012192);
    });

    it('works for proj4js projections with units other than m', function() {
      const epsg3739 = getProjection('EPSG:3739');
      expect(epsg3739.getMetersPerUnit()).to.eql(1200 / 3937);
    });

    it('works for proj4js OGC WKT GEOGCS projections', function() {
      const epsg4269 = getProjection('EPSG:4269');
      expect(epsg4269.getMetersPerUnit()).to.eql(
        6378137 * 0.01745329251994328);
      const epsg4279 = getProjection('EPSG:4279');
      expect(epsg4279.getMetersPerUnit()).to.eql(
        6377563.396 * 0.01745329251994328);
    });

  });

});
