import {
  useGeographic,
  getUserProjection,
  setUserProjection,
  clearUserProjection,
  toUserCoordinate,
  fromUserCoordinate,
  toUserExtent,
  fromUserExtent,
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


describe('ol.proj', () => {

  afterEach(() => {
    clearAllProjections();
    clearUserProjection();
    addCommon();
  });

  describe('useGeographic()', () => {
    test('sets the user projection to Geographic/WGS-84', () => {
      useGeographic();
      const projection = getUserProjection();
      expect(projection).toBe(getProjection('EPSG:4326'));
    });
  });

  describe('getUserProjection()', () => {
    test('returns null by default', () => {
      expect(getUserProjection()).toBe(null);
    });

    test('returns the user projection if set', () => {
      const projection = getProjection('EPSG:4326');
      setUserProjection(projection);
      expect(getUserProjection()).toBe(projection);
    });
  });

  describe('setUserProjection()', () => {
    test('accepts a string identifier', () => {
      const projection = getProjection('EPSG:4326');
      setUserProjection('EPSG:4326');
      expect(getUserProjection()).toBe(projection);
    });
  });

  describe('clearUserProjection()', () => {
    test('clears the user projection', () => {
      useGeographic();
      clearUserProjection();
      expect(getUserProjection()).toBe(null);
    });
  });

  describe('toUserCoordinate()', () => {
    test('transforms a point to the user projection', () => {
      useGeographic();
      const coordinate = fromLonLat([-110, 45]);
      const user = toUserCoordinate(coordinate, 'EPSG:3857');
      const transformed = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
      expect(user).toEqual(transformed);
      expect(user).not.toEqual(coordinate);
    });

    test('returns the original if no user projection is set', () => {
      const coordinate = fromLonLat([-110, 45]);
      const user = toUserCoordinate(coordinate, 'EPSG:3857');
      expect(user).toBe(coordinate);
    });
  });

  describe('fromUserCoordinate()', () => {
    test('transforms a point from the user projection', () => {
      useGeographic();
      const user = [-110, 45];
      const coordinate = fromUserCoordinate(user, 'EPSG:3857');
      const transformed = transform(user, 'EPSG:4326', 'EPSG:3857');
      expect(coordinate).toEqual(transformed);
      expect(user).not.toEqual(coordinate);
    });

    test('returns the original if no user projection is set', () => {
      const user = fromLonLat([-110, 45]);
      const coordinate = fromUserCoordinate(user, 'EPSG:3857');
      expect(coordinate).toBe(user);
    });
  });

  describe('toUserExtent()', () => {
    test('transforms an extent to the user projection', () => {
      useGeographic();
      const extent = transformExtent([-110, 45, -100, 50], 'EPSG:4326', 'EPSG:3857');
      const user = toUserExtent(extent, 'EPSG:3857');
      const transformed = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      expect(user).toEqual(transformed);
      expect(user).not.toEqual(extent);
    });

    test('returns the original if no user projection is set', () => {
      const extent = transformExtent([-110, 45, -100, 50], 'EPSG:4326', 'EPSG:3857');
      const user = toUserExtent(extent, 'EPSG:3857');
      expect(user).toBe(extent);
    });
  });

  describe('fromUserExtent()', () => {
    test('transforms an extent from the user projection', () => {
      useGeographic();
      const user = [-110, 45, -100, 50];
      const extent = fromUserExtent(user, 'EPSG:3857');
      const transformed = transformExtent(user, 'EPSG:4326', 'EPSG:3857');
      expect(extent).toEqual(transformed);
      expect(extent).not.toEqual(user);
    });

    test('returns the original if no user projection is set', () => {
      const user = transformExtent([-110, 45, -100, 50], 'EPSG:4326', 'EPSG:3857');
      const extent = fromUserExtent(user, 'EPSG:3857');
      expect(extent).toBe(user);
    });
  });

  describe('toLonLat()', () => {
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
      test('works for ' + c.from.join(', '), () => {
        const lonLat = toLonLat(c.from);
        expect(lonLat[0]).to.roughlyEqual(c.to[0], 1e-9);
        expect(lonLat[1]).to.roughlyEqual(c.to[1], 1e-9);
      });
    });
  });

  describe('projection equivalence', () => {

    function _testAllEquivalent(codes) {
      const projections = codes.map(getProjection);
      projections.forEach(function(source) {
        projections.forEach(function(destination) {
          expect(equivalent(source, destination)).toBeTruthy();
        });
      });
    }

    test('gives that 3857, 102100, 102113, 900913 are equivalent ', () => {
      _testAllEquivalent([
        'EPSG:3857',
        'EPSG:102100',
        'EPSG:102113',
        'EPSG:900913'
      ]);
    });

    test('gives that custom 3413 is equivalent to self', () => {
      const code = 'EPSG:3413';

      const source = new Projection({
        code: code
      });

      const destination = new Projection({
        code: code
      });

      expect(equivalent(source, destination)).toBeTruthy();
    });

    test('gives that default 3857 is equivalent to self', () => {
      _testAllEquivalent([
        'EPSG:3857',
        'EPSG:3857'
      ]);
    });

    test('gives that CRS:84, urn:ogc:def:crs:EPSG:6.6:4326, EPSG:4326 are ' +
        'equivalent', () => {
      _testAllEquivalent([
        'CRS:84',
        'urn:ogc:def:crs:EPSG:6.6:4326',
        'EPSG:4326'
      ]);
    });

    test(
      'requires code and units to be equal for projection evquivalence',
      () => {
        const proj1 = new Projection({
          code: 'EPSG:3857',
          units: 'm'
        });
        const proj2 = new Projection({
          code: 'EPSG:3857',
          units: 'tile-pixels'
        });
        expect(equivalent(proj1, proj2)).toBeFalsy();
      }
    );

  });

  describe('identify transform', () => {

    test('returns a new object, with same coord values', () => {
      const epsg4326 = getProjection('EPSG:4326');
      const uniqueObject = {};
      const sourcePoint = [uniqueObject, uniqueObject];
      const destinationPoint = transform(
        sourcePoint, epsg4326, epsg4326);
      expect(sourcePoint === destinationPoint).not.toBe();
      expect(destinationPoint[0] === sourcePoint[0]).toBeTruthy();
      expect(destinationPoint[1] === sourcePoint[1]).toBeTruthy();
    });
  });

  describe('transform 0,0 from 4326 to 3857', () => {

    test('returns expected value', () => {
      const point = transform([0, 0], 'EPSG:4326', 'EPSG:3857');
      expect(point).not.toBe(undefined);
      expect(point).not.toBe(null);
      expect(point[1]).to.roughlyEqual(0, 1e-9);
    });
  });

  describe('transform 0,0 from 3857 to 4326', () => {

    test('returns expected value', () => {
      const point = transform([0, 0], 'EPSG:3857', 'EPSG:4326');
      expect(point).not.toBe(undefined);
      expect(point).not.toBe(null);
      expect(point[0]).toEqual(0);
      expect(point[1]).toEqual(0);
    });
  });

  describe('transform from 4326 to 3857 (Alastaira)', () => {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    test('returns expected value using ol.proj.transform', () => {
      const point = transform(
        [-5.625, 52.4827802220782], 'EPSG:4326', 'EPSG:900913');
      expect(point).not.toBe(undefined);
      expect(point).not.toBe(null);
      expect(point[0]).to.roughlyEqual(-626172.13571216376, 1e-9);
      expect(point[1]).to.roughlyEqual(6887893.4928337997, 1e-8);
    });

    test('returns expected value using ol.proj.fromLonLat', () => {
      const point = fromLonLat([-5.625, 52.4827802220782]);
      expect(point).not.toBe(undefined);
      expect(point).not.toBe(null);
      expect(point[0]).to.roughlyEqual(-626172.13571216376, 1e-9);
      expect(point[1]).to.roughlyEqual(6887893.4928337997, 1e-8);
    });
  });

  describe('transform from 3857 to 4326 (Alastaira)', () => {
    // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    test('returns expected value using ol.proj.transform', () => {
      const point = transform([-626172.13571216376, 6887893.4928337997],
        'EPSG:900913', 'EPSG:4326');
      expect(point).not.toBe(undefined);
      expect(point).not.toBe(null);
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });

    test('returns expected value using ol.proj.toLonLat', () => {
      const point = toLonLat([-626172.13571216376, 6887893.4928337997]);
      expect(point).not.toBe(undefined);
      expect(point).not.toBe(null);
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });
  });

  describe('canWrapX()', () => {

    test('requires an extent for allowing wrapX', () => {
      let proj = new Projection({
        code: 'foo',
        global: true
      });
      expect(proj.canWrapX()).toBe(false);
      proj.setExtent([1, 2, 3, 4]);
      expect(proj.canWrapX()).toBe(true);
      proj = new Projection({
        code: 'foo',
        global: true,
        extent: [1, 2, 3, 4]
      });
      expect(proj.canWrapX()).toBe(true);
      proj.setExtent(null);
      expect(proj.canWrapX()).toBe(false);
    });

    test('requires global to be true for allowing wrapX', () => {
      let proj = new Projection({
        code: 'foo',
        extent: [1, 2, 3, 4]
      });
      expect(proj.canWrapX()).toBe(false);
      proj.setGlobal(true);
      expect(proj.canWrapX()).toBe(true);
      proj = new Projection({
        code: 'foo',
        global: true,
        extent: [1, 2, 3, 4]
      });
      expect(proj.canWrapX()).toBe(true);
      proj.setGlobal(false);
      expect(proj.canWrapX()).toBe(false);
    });

  });

  describe('transformExtent()', () => {

    test('transforms an extent given projection identifiers', () => {
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = transformExtent(
        sourceExtent, 'EPSG:4326', 'EPSG:3857');
      expect(destinationExtent).not.toBe(undefined);
      expect(destinationExtent).not.toBe(null);
      expect(destinationExtent[0])
        .to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent[2]).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent[1]).to.roughlyEqual(-3503549.843504376, 1e-8);
      expect(destinationExtent[3]).to.roughlyEqual(8399737.889818361, 1e-8);
    });

  });

  describe('getPointResolution()', () => {
    test('returns the correct point resolution for EPSG:4326', () => {
      let pointResolution = getPointResolution('EPSG:4326', 1, [0, 0]);
      expect (pointResolution).toBe(1);
      pointResolution = getPointResolution('EPSG:4326', 1, [0, 52]);
      expect (pointResolution).toBe(1);
    });
    test(
      'returns the correct point resolution for EPSG:4326 with custom units',
      () => {
        let pointResolution = getPointResolution('EPSG:4326', 1, [0, 0], 'm');
        expect(pointResolution).to.roughlyEqual(111195.0802335329, 1e-5);
        pointResolution = getPointResolution('EPSG:4326', 1, [0, 52], 'm');
        expect(pointResolution).to.roughlyEqual(89826.53390979706, 1e-5);
      }
    );
    test('returns the correct point resolution for EPSG:3857', () => {
      let pointResolution = getPointResolution('EPSG:3857', 1, [0, 0]);
      expect(pointResolution).toBe(1);
      pointResolution = getPointResolution('EPSG:3857', 1, fromLonLat([0, 52]));
      expect(pointResolution).to.roughlyEqual(0.615661, 1e-5);
    });
    test(
      'returns the correct point resolution for EPSG:3857 with custom units',
      () => {
        let pointResolution = getPointResolution('EPSG:3857', METERS_PER_UNIT['degrees'], [0, 0], 'degrees');
        expect(pointResolution).toBe(1);
        pointResolution = getPointResolution('EPSG:4326', 1, fromLonLat([0, 52]), 'degrees');
        expect(pointResolution).toBe(1);
      }
    );
  });

  describe('Proj4js integration', () => {

    afterEach(() => {
      delete proj4.defs['EPSG:21781'];
      clearAllProjections();
      addCommon();
    });

    test('creates ol.proj.Projection instance from EPSG:21781', () => {
      proj4.defs('EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      register(proj4);
      const proj = getProjection('EPSG:21781');
      expect(proj.getCode()).toEqual('EPSG:21781');
      expect(proj.getUnits()).toEqual('m');
      expect(proj.getMetersPerUnit()).toEqual(1);
    });

    test('creates ol.proj.Projection instance from EPSG:3739', () => {
      proj4.defs('EPSG:3739',
        '+proj=tmerc +lat_0=40.5 +lon_0=-110.0833333333333 +k=0.9999375 ' +
          '+x_0=800000.0000101599 +y_0=99999.99998983997 +ellps=GRS80 ' +
          '+towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs');
      register(proj4);
      const proj = getProjection('EPSG:3739');
      expect(proj.getCode()).toEqual('EPSG:3739');
      expect(proj.getUnits()).toEqual('us-ft');
      expect(proj.getMetersPerUnit()).toEqual(1200 / 3937);

      delete proj4.defs['EPSG:3739'];
    });

    test('allows Proj4js projections to be used transparently', () => {
      register(proj4);
      const point = transform(
        [-626172.13571216376, 6887893.4928337997], 'GOOGLE', 'WGS84');
      expect(point[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(point[1]).to.roughlyEqual(52.4827802220782, 1e-9);
    });

    test('allows new Proj4js projections to be defined', () => {
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

    test('works with ol.proj.fromLonLat and ol.proj.toLonLat', () => {
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

    test('caches the new Proj4js projections given their srsCode', () => {
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
      expect(equivalent(proj2, proj)).toBe(true);
      delete proj4.defs[code];
    });

    test('numerically estimates point scale at the equator', () => {
      register(proj4);
      const googleProjection = getProjection('GOOGLE');
      expect(getPointResolution(googleProjection, 1, [0, 0])).
        to.roughlyEqual(1, 1e-1);
    });

    test('numerically estimates point scale at various latitudes', () => {
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

    test('numerically estimates point scale at various points', () => {
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

    test('does not overwrite existing projections in the registry', () => {
      register(proj4);
      const epsg4326 = getProjection('EPSG:4326');
      new Projection({
        code: 'EPSG:4326',
        units: 'degrees',
        extent: [-45, -45, 45, 45]
      });
      expect(getProjection('EPSG:4326')).toBe(epsg4326);
    });

  });

  describe('ol.proj.getTransformFromProjections()', () => {

    beforeEach(() => {
      register(proj4);
    });

    test('returns a transform function', () => {
      const transform = getTransformFromProjections(getProjection('GOOGLE'),
        getProjection('EPSG:4326'));
      expect(typeof transform).toBe('function');

      const output = transform([-12000000, 5000000]);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);
    });

    test('works for longer arrays', () => {
      const transform = getTransformFromProjections(getProjection('GOOGLE'),
        getProjection('EPSG:4326'));
      expect(typeof transform).toBe('function');

      const output = transform([-12000000, 5000000, -12000000, 5000000]);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);
      expect(output[2]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[3]).to.roughlyEqual(40.91627447067577, 1e-9);
    });

  });

  describe('ol.proj.getTransform()', () => {

    beforeEach(() => {
      register(proj4);
    });

    test('returns a function', () => {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).toBe('function');
    });

    test('returns a transform function', () => {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).toBe('function');

      const output = transform([-626172.13571216376, 6887893.4928337997]);

      expect(output[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[1]).to.roughlyEqual(52.4827802220782, 1e-9);

    });

    test('works for longer arrays of coordinate values', () => {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).toBe('function');

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

    test('accepts an optional destination array', () => {
      const transform = getTransform('EPSG:3857', 'EPSG:4326');
      const input = [-12000000, 5000000];
      const output = [];

      const got = transform(input, output);
      expect(got).toBe(output);

      expect(output[0]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[1]).to.roughlyEqual(40.91627447067577, 1e-9);

      expect(input).toEqual([-12000000, 5000000]);
    });

    test('accepts a dimension', () => {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      expect(typeof transform).toBe('function');

      const dimension = 3;
      const output = transform([
        -626172.13571216376, 6887893.4928337997, 100,
        -12000000, 5000000, 200,
        -626172.13571216376, 6887893.4928337997, 300
      ], undefined, dimension);

      expect(output[0]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[1]).to.roughlyEqual(52.4827802220782, 1e-9);
      expect(output[2]).toBe(100);
      expect(output[3]).to.roughlyEqual(-107.79783409434258, 1e-9);
      expect(output[4]).to.roughlyEqual(40.91627447067577, 1e-9);
      expect(output[5]).toBe(200);
      expect(output[6]).to.roughlyEqual(-5.625, 1e-9);
      expect(output[7]).to.roughlyEqual(52.4827802220782, 1e-9);
      expect(output[8]).toBe(300);
    });
  });

  describe('ol.proj.transform()', () => {

    test('transforms a 2d coordinate', () => {
      const got = transform([-10, -20], 'EPSG:4326', 'EPSG:3857');
      expect(got).toHaveLength(2);
      expect(got[0]).to.roughlyEqual(-1113194.9079327357, 1e-3);
      expect(got[1]).to.roughlyEqual(-2273030.92698769, 1e-3);
    });

    test('transforms a 3d coordinate', () => {
      const got = transform([-10, -20, 3], 'EPSG:4326', 'EPSG:3857');
      expect(got).toHaveLength(3);
      expect(got[0]).to.roughlyEqual(-1113194.9079327357, 1e-3);
      expect(got[1]).to.roughlyEqual(-2273030.92698769, 1e-3);
      expect(got[2]).toBe(3);
    });

    test('transforms a 4d coordinate', () => {
      const got = transform([-10, -20, 3, 4], 'EPSG:4326', 'EPSG:3857');
      expect(got).toHaveLength(4);
      expect(got[0]).to.roughlyEqual(-1113194.9079327357, 1e-3);
      expect(got[1]).to.roughlyEqual(-2273030.92698769, 1e-3);
      expect(got[2]).toBe(3);
      expect(got[3]).toBe(4);
    });

    test('works with 3d points and proj4 defs', () => {
      proj4.defs('custom',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
      register(proj4);

      const got = transform([-111, 45.5, 123], 'EPSG:4326', 'custom');
      expect(got).toHaveLength(3);
      expect(got[0]).to.roughlyEqual(-6601512.194209638, 1);
      expect(got[1]).to.roughlyEqual(6145843.802742112, 1);
      expect(got[2]).toBe(123);

      delete proj4.defs.custom;
      clearAllProjections();
      addCommon();
    });

  });

  describe('ol.proj.Projection.prototype.getMetersPerUnit()', () => {

    beforeEach(() => {
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

    afterEach(() => {
      delete proj4.defs['EPSG:26782'];
      delete proj4.defs['EPSG:3739'];
      delete proj4.defs['EPSG:4269'];
      delete proj4.defs['EPSG:4279'];
      clearAllProjections();
      addCommon();
    });

    test('returns value in meters', () => {
      const epsg4326 = getProjection('EPSG:4326');
      expect(epsg4326.getMetersPerUnit()).toEqual(metersPerDegree);
    });

    test('works for proj4js projections without units', () => {
      const epsg26782 = getProjection('EPSG:26782');
      expect(epsg26782.getMetersPerUnit()).toEqual(0.3048006096012192);
    });

    test('works for proj4js projections with units other than m', () => {
      const epsg3739 = getProjection('EPSG:3739');
      expect(epsg3739.getMetersPerUnit()).toEqual(1200 / 3937);
    });

    test('works for proj4js OGC WKT GEOGCS projections', () => {
      const epsg4269 = getProjection('EPSG:4269');
      expect(epsg4269.getMetersPerUnit()).toEqual(6378137 * 0.01745329251994328);
      const epsg4279 = getProjection('EPSG:4279');
      expect(epsg4279.getMetersPerUnit()).toEqual(6377563.396 * 0.01745329251994328);
    });

  });

});
