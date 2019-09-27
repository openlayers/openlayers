import {assert} from 'chai';
import proj4 from 'proj4';
import View from '../../../src/ol/View.js';
import Projection from '../../../src/ol/proj/Projection.js';
import {METERS_PER_UNIT} from '../../../src/ol/proj/Units.js';
import {HALF_SIZE} from '../../../src/ol/proj/epsg3857.js';
import {METERS_PER_UNIT as metersPerDegree} from '../../../src/ol/proj/epsg4326.js';
import {register} from '../../../src/ol/proj/proj4.js';

import {
  addCommon,
  addCoordinateTransforms,
  clearAllProjections,
  clearUserProjection,
  disableCoordinateWarning,
  equivalent,
  fromLonLat,
  fromUserCoordinate,
  fromUserExtent,
  fromUserResolution,
  getPointResolution,
  get as getProjection,
  getTransform,
  getTransformFromProjections,
  getUserProjection,
  setUserProjection,
  toLonLat,
  toUserCoordinate,
  toUserExtent,
  toUserResolution,
  transform,
  transformExtent,
  useGeographic,
} from '../../../src/ol/proj.js';

describe('ol/proj.js', function () {
  afterEach(function () {
    clearAllProjections();
    clearUserProjection();
    addCommon();
  });

  describe('useGeographic()', function () {
    it('sets the user projection to Geographic/WGS-84', function () {
      useGeographic();
      const projection = getUserProjection();
      assert.strictEqual(projection, getProjection('EPSG:4326'));
    });
  });

  describe('getUserProjection()', function () {
    it('returns null by default', function () {
      assert.strictEqual(getUserProjection(), null);
    });

    it('returns the user projection if set', function () {
      const projection = getProjection('EPSG:4326');
      setUserProjection(projection);
      assert.strictEqual(getUserProjection(), projection);
    });
  });

  describe('setUserProjection()', function () {
    it('accepts a string identifier', function () {
      const projection = getProjection('EPSG:4326');
      setUserProjection('EPSG:4326');
      assert.strictEqual(getUserProjection(), projection);
    });
  });

  describe('clearUserProjection()', function () {
    it('clears the user projection', function () {
      useGeographic();
      clearUserProjection();
      assert.strictEqual(getUserProjection(), null);
    });
  });

  describe('toUserCoordinate()', function () {
    it('transforms a point to the user projection', function () {
      useGeographic();
      const coordinate = fromLonLat([-110, 45]);
      const user = toUserCoordinate(coordinate, 'EPSG:3857');
      const transformed = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
      assert.deepEqual(user, transformed);
      assert.notDeepEqual(user, coordinate);
    });

    it('returns the original if no user projection is set', function () {
      const coordinate = fromLonLat([-110, 45]);
      const user = toUserCoordinate(coordinate, 'EPSG:3857');
      assert.strictEqual(user, coordinate);
    });
  });

  describe('fromUserCoordinate()', function () {
    it('transforms a point from the user projection', function () {
      useGeographic();
      const user = [-110, 45];
      const coordinate = fromUserCoordinate(user, 'EPSG:3857');
      const transformed = transform(user, 'EPSG:4326', 'EPSG:3857');
      assert.deepEqual(coordinate, transformed);
      assert.notDeepEqual(user, coordinate);
    });

    it('returns the original if no user projection is set', function () {
      const user = fromLonLat([-110, 45]);
      const coordinate = fromUserCoordinate(user, 'EPSG:3857');
      assert.strictEqual(coordinate, user);
    });
  });

  describe('toUserExtent()', function () {
    it('transforms an extent to the user projection', function () {
      useGeographic();
      const extent = transformExtent(
        [-110, 45, -100, 50],
        'EPSG:4326',
        'EPSG:3857',
      );
      const user = toUserExtent(extent, 'EPSG:3857');
      const transformed = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      assert.deepEqual(user, transformed);
      assert.notDeepEqual(user, extent);
    });

    it('returns the original if no user projection is set', function () {
      const extent = transformExtent(
        [-110, 45, -100, 50],
        'EPSG:4326',
        'EPSG:3857',
      );
      const user = toUserExtent(extent, 'EPSG:3857');
      assert.strictEqual(user, extent);
    });
  });

  describe('fromUserExtent()', function () {
    it('transforms an extent from the user projection', function () {
      useGeographic();
      const user = [-110, 45, -100, 50];
      const extent = fromUserExtent(user, 'EPSG:3857');
      const transformed = transformExtent(user, 'EPSG:4326', 'EPSG:3857');
      assert.deepEqual(extent, transformed);
      assert.notDeepEqual(extent, user);
    });

    it('returns the original if no user projection is set', function () {
      const user = transformExtent(
        [-110, 45, -100, 50],
        'EPSG:4326',
        'EPSG:3857',
      );
      const extent = fromUserExtent(user, 'EPSG:3857');
      assert.strictEqual(extent, user);
    });
  });

  describe('fromUserResolution()', function () {
    it("adjusts a resolution for the user projection's units", function () {
      useGeographic();
      const user = 1 / getProjection('EPSG:4326').getMetersPerUnit();
      const resolution = fromUserResolution(user, 'EPSG:3857');
      assert.approximately(resolution, 1, 1e-9);
    });

    it('returns the original if no user projection is set', function () {
      const user = METERS_PER_UNIT.meters;
      const resolution = fromUserResolution(user, 'EPSG:3857');
      assert.deepEqual(resolution, user);
    });
  });

  describe('toUserResolution()', function () {
    it("adjusts a resolution for the user projection's units", function () {
      useGeographic();
      const dest = 1;
      const resolution = toUserResolution(dest, 'EPSG:3857');
      assert.approximately(
        resolution,
        1 / getProjection('EPSG:4326').getMetersPerUnit(),
        1e-9,
      );
    });

    it('returns the original if no user projection is set', function () {
      const dest = METERS_PER_UNIT.degrees;
      const resolution = toUserResolution(dest, 'EPSG:3857');
      assert.deepEqual(resolution, dest);
    });
  });

  describe('toLonLat()', function () {
    const cases = [
      {
        from: [0, 0],
        to: [0, 0],
      },
      {
        from: [-12356463.478053365, 5700582.732404122],
        to: [-111, 45.5],
      },
      {
        from: [2 * HALF_SIZE - 12356463.478053365, 5700582.732404122],
        to: [-111, 45.5],
      },
      {
        from: [-4 * HALF_SIZE - 12356463.478053365, 5700582.732404122],
        to: [-111, 45.5],
      },
    ];

    cases.forEach(function (c) {
      it('works for ' + c.from.join(', '), function () {
        const lonLat = toLonLat(c.from);
        assert.approximately(lonLat[0], c.to[0], 1e-9);
        assert.approximately(lonLat[1], c.to[1], 1e-9);
      });
    });
  });

  describe('projection equivalence', function () {
    function _testAllEquivalent(codes) {
      const projections = codes.map(getProjection);
      projections.forEach(function (source) {
        projections.forEach(function (destination) {
          assert.isOk(equivalent(source, destination));
        });
      });
    }

    it('treats EPSG:3857 variants as equivalent', function () {
      _testAllEquivalent([
        'EPSG:3857',
        'EPSG:102100',
        'EPSG:102113',
        'EPSG:900913',
        'http://www.opengis.net/def/crs/EPSG/0/3857',
        'http://www.opengis.net/gml/srs/epsg.xml#3857',
      ]);
    });

    it('gives that custom 3413 is equivalent to self', function () {
      const code = 'EPSG:3413';

      const source = new Projection({
        code: code,
      });

      const destination = new Projection({
        code: code,
      });

      assert.isOk(equivalent(source, destination));
    });

    it('gives that default 3857 is equivalent to self', function () {
      _testAllEquivalent(['EPSG:3857', 'EPSG:3857']);
    });

    it('treats EPSG:4326 variants as equivalent', function () {
      _testAllEquivalent([
        'CRS:84',
        'urn:ogc:def:crs:EPSG:6.6:4326',
        'urn:x-ogc:def:crs:EPSG:6.6:4326',
        'EPSG:4326',
        'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
        'http://www.opengis.net/gml/srs/epsg.xml#4326',
        'http://www.opengis.net/def/crs/EPSG/0/4326',
      ]);
    });

    it('requires code and units to be equal for projection evquivalence', function () {
      const proj1 = new Projection({
        code: 'EPSG:3857',
        units: 'm',
      });
      const proj2 = new Projection({
        code: 'EPSG:3857',
        units: 'tile-pixels',
      });
      assert.isNotOk(equivalent(proj1, proj2));
    });
  });

  describe('identify transform', function () {
    it('returns a new object, with same coord values', function () {
      const epsg4326 = getProjection('EPSG:4326');
      const uniqueObject = {};
      const sourcePoint = [uniqueObject, uniqueObject];
      const destinationPoint = transform(sourcePoint, epsg4326, epsg4326);
      assert.isFalse(sourcePoint === destinationPoint);
      assert.isOk(destinationPoint[0] === sourcePoint[0]);
      assert.isOk(destinationPoint[1] === sourcePoint[1]);
    });
  });

  describe('transform 0,0 from 4326 to 3857', function () {
    it('returns expected value', function () {
      const point = transform([0, 0], 'EPSG:4326', 'EPSG:3857');
      assert.notEqual(point, undefined);
      assert.notEqual(point, null);
      assert.approximately(point[1], 0, 1e-9);
    });
  });

  describe('transform 0,0 from 3857 to 4326', function () {
    it('returns expected value', function () {
      const point = transform([0, 0], 'EPSG:3857', 'EPSG:4326');
      assert.notEqual(point, undefined);
      assert.notEqual(point, null);
      assert.deepEqual(point[0], 0);
      assert.deepEqual(point[1], 0);
    });
  });

  describe('transform from 4326 to 3857 (Alastaira)', function () {
    // https://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value using ol.proj.transform', function () {
      const point = transform(
        [-5.625, 52.4827802220782],
        'EPSG:4326',
        'EPSG:900913',
      );
      assert.notEqual(point, undefined);
      assert.notEqual(point, null);
      assert.approximately(point[0], -626172.13571216376, 1e-9);
      assert.approximately(point[1], 6887893.4928337997, 1e-8);
    });

    it('returns expected value using ol.proj.fromLonLat', function () {
      const point = fromLonLat([-5.625, 52.4827802220782]);
      assert.notEqual(point, undefined);
      assert.notEqual(point, null);
      assert.approximately(point[0], -626172.13571216376, 1e-9);
      assert.approximately(point[1], 6887893.4928337997, 1e-8);
    });
  });

  describe('transform from 3857 to 4326 (Alastaira)', function () {
    // https://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/

    it('returns expected value using ol.proj.transform', function () {
      const point = transform(
        [-626172.13571216376, 6887893.4928337997],
        'EPSG:900913',
        'EPSG:4326',
      );
      assert.notEqual(point, undefined);
      assert.notEqual(point, null);
      assert.approximately(point[0], -5.625, 1e-9);
      assert.approximately(point[1], 52.4827802220782, 1e-9);
    });

    it('returns expected value using ol.proj.toLonLat', function () {
      const point = toLonLat([-626172.13571216376, 6887893.4928337997]);
      assert.notEqual(point, undefined);
      assert.notEqual(point, null);
      assert.approximately(point[0], -5.625, 1e-9);
      assert.approximately(point[1], 52.4827802220782, 1e-9);
    });
  });

  describe('canWrapX()', function () {
    it('requires an extent for allowing wrapX', function () {
      let proj = new Projection({
        code: 'foo',
        global: true,
      });
      assert.strictEqual(proj.canWrapX(), false);
      proj.setExtent([1, 2, 3, 4]);
      assert.strictEqual(proj.canWrapX(), true);
      proj = new Projection({
        code: 'foo',
        global: true,
        extent: [1, 2, 3, 4],
      });
      assert.strictEqual(proj.canWrapX(), true);
      proj.setExtent(null);
      assert.strictEqual(proj.canWrapX(), false);
    });

    it('requires global to be true for allowing wrapX', function () {
      let proj = new Projection({
        code: 'foo',
        extent: [1, 2, 3, 4],
      });
      assert.strictEqual(proj.canWrapX(), false);
      proj.setGlobal(true);
      assert.strictEqual(proj.canWrapX(), true);
      proj = new Projection({
        code: 'foo',
        global: true,
        extent: [1, 2, 3, 4],
      });
      assert.strictEqual(proj.canWrapX(), true);
      proj.setGlobal(false);
      assert.strictEqual(proj.canWrapX(), false);
    });
  });

  describe('transformExtent()', function () {
    it('transforms an extent given projection identifiers', function () {
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = transformExtent(
        sourceExtent,
        'EPSG:4326',
        'EPSG:3857',
      );
      assert.notEqual(destinationExtent, undefined);
      assert.notEqual(destinationExtent, null);
      assert.approximately(destinationExtent[0], -1669792.3618991037, 1e-9);
      assert.approximately(destinationExtent[2], 5009377.085697311, 1e-9);
      assert.approximately(destinationExtent[1], -3503549.843504376, 1e-8);
      assert.approximately(destinationExtent[3], 8399737.889818361, 1e-8);
    });
  });

  describe('getPointResolution()', function () {
    it('returns the correct point resolution for EPSG:4326', function () {
      let pointResolution = getPointResolution('EPSG:4326', 1, [0, 0]);
      assert.strictEqual(pointResolution, 1);
      pointResolution = getPointResolution('EPSG:4326', 1, [0, 52]);
      assert.strictEqual(pointResolution, 1);
    });
    it('returns the correct point resolution for EPSG:4326 with custom units', function () {
      let pointResolution = getPointResolution('EPSG:4326', 1, [0, 0], 'm');
      assert.approximately(pointResolution, 111195.0802335329, 1e-5);
      pointResolution = getPointResolution('EPSG:4326', 1, [0, 52], 'm');
      assert.approximately(pointResolution, 89826.53390979706, 1e-5);
    });
    it('returns the correct point resolution for EPSG:3857', function () {
      let pointResolution = getPointResolution('EPSG:3857', 1, [0, 0]);
      assert.strictEqual(pointResolution, 1);
      pointResolution = getPointResolution('EPSG:3857', 1, fromLonLat([0, 52]));
      assert.approximately(pointResolution, 0.615661, 1e-5);
    });
    it('returns the correct point resolution for EPSG:3857 with custom units', function () {
      let pointResolution = getPointResolution(
        'EPSG:3857',
        METERS_PER_UNIT.degrees,
        [0, 0],
        'degrees',
      );
      assert.strictEqual(pointResolution, 1);
      pointResolution = getPointResolution(
        'EPSG:4326',
        1,
        fromLonLat([0, 52]),
        'degrees',
      );
      assert.strictEqual(pointResolution, 1);
    });
    it('returns the nominal resolution for projections without transforms', function () {
      const projection = new Projection({
        code: 'foo',
        units: 'ft',
      });
      let pointResolution = getPointResolution(projection, 2, [0, 0]);
      assert.strictEqual(pointResolution, 2);
      pointResolution = getPointResolution(projection, 2, [0, 0], 'm');
      assert.strictEqual(pointResolution, 0.6096);
    });
  });

  describe('lazily registered utm transforms', () => {
    afterEach(() => {
      clearAllProjections();
      addCommon();
    });

    const cases = [
      {
        sourceCode: 'EPSG:32633',
        sourceCoord: [500000, 100000],
        destCode: 'EPSG:4326',
        destCoord: [15, 0.9047306],
      },
      {
        sourceCode: 'EPSG:32633',
        sourceCoord: [500000, 4649776.22],
        destCode: 'EPSG:4326',
        destCoord: [15, 42],
      },
      {
        sourceCode: 'EPSG:32633',
        sourceCoord: [500000, 4649776.22],
        destCode: 'EPSG:3857',
        destCoord: [1669792.3618991016, 5160979.437547961],
      },
      {
        sourceCode: 'EPSG:32633',
        sourceCoord: [170000, 4649776.22],
        destCode: 'EPSG:3857',
        destCoord: [1226739.3663468603, 5150642.9136177115],
      },
      {
        sourceCode: 'EPSG:32715',
        sourceCoord: [600000, 8000000],
        destCode: 'EPSG:4326',
        destCoord: [-92.0549531, -18.0863946],
      },
      {
        sourceCode: 'EPSG:32715',
        sourceCoord: [600000, 8000000],
        destCode: 'EPSG:3857',
        destCoord: [-10247510.498555563, -2047663.3668866507],
      },
    ];

    function epsilon(code) {
      const projection = getProjection(code);
      switch (projection.getUnits()) {
        case 'm': {
          return 1e-1;
        }
        case 'degrees': {
          return 1e-6;
        }
        default: {
          throw new Error(`unsupported units: ${projection.getUnits()}`);
        }
      }
    }

    for (const c of cases) {
      it(`works for transform([${c.sourceCoord.join(', ')}], '${c.sourceCode}', '${c.destCode}')`, () => {
        const output = transform(c.sourceCoord, c.sourceCode, c.destCode);
        const e = epsilon(c.destCode);
        assert.approximately(output[0], c.destCoord[0], e);
        assert.approximately(output[1], c.destCoord[1], e);
      });

      it(`works for transform([${c.destCoord.join(', ')}], '${c.destCode}', '${c.sourceCode}')`, () => {
        const output = transform(c.destCoord, c.destCode, c.sourceCode);
        const e = epsilon(c.sourceCode);
        assert.approximately(output[0], c.sourceCoord[0], e);
        assert.approximately(output[1], c.sourceCoord[1], e);
      });
    }
  });

  describe('Proj4js integration', function () {
    afterEach(function () {
      delete proj4.defs['EPSG:21781'];
      clearAllProjections();
      addCommon();
    });

    it('creates ol.proj.Projection instance from EPSG:21781', function () {
      proj4.defs(
        'EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      );
      register(proj4);
      const proj = getProjection('EPSG:21781');
      assert.deepEqual(proj.getCode(), 'EPSG:21781');
      assert.deepEqual(proj.getUnits(), 'm');
      assert.deepEqual(proj.getMetersPerUnit(), 1);
    });

    it('creates ol.proj.Projection instance from EPSG:3739', function () {
      proj4.defs(
        'EPSG:3739',
        '+proj=tmerc +lat_0=40.5 +lon_0=-110.0833333333333 +k=0.9999375 ' +
          '+x_0=800000.0000101599 +y_0=99999.99998983997 +ellps=GRS80 ' +
          '+towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs',
      );
      register(proj4);
      const proj = getProjection('EPSG:3739');
      assert.deepEqual(proj.getCode(), 'EPSG:3739');
      assert.deepEqual(proj.getUnits(), 'us-ft');
      assert.deepEqual(proj.getMetersPerUnit(), 1200 / 3937);

      delete proj4.defs['EPSG:3739'];
    });

    it('creates ol.proj.Projection instance from EPSG:4258', function () {
      proj4.defs(
        'EPSG:4258',
        '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs',
      );
      register(proj4);
      const proj = getProjection('EPSG:4258');
      assert.deepEqual(proj.getCode(), 'EPSG:4258');
      assert.deepEqual(proj.getUnits(), 'degrees');
      assert.deepEqual(proj.getMetersPerUnit(), METERS_PER_UNIT.degrees);

      delete proj4.defs['EPSG:4258'];
    });

    it('allows Proj4js projections to be used transparently', function () {
      register(proj4);
      const point = transform(
        [-626172.13571216376, 6887893.4928337997],
        'GOOGLE',
        'WGS84',
      );
      assert.approximately(point[0], -5.625, 1e-9);
      assert.approximately(point[1], 52.4827802220782, 1e-9);
    });

    it('allows new Proj4js projections to be defined', function () {
      proj4.defs(
        'EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      );
      register(proj4);
      const point = transform(
        [7.439583333333333, 46.95240555555556],
        'EPSG:4326',
        'EPSG:21781',
      );
      assert.approximately(point[0], 600072.3, 1);
      assert.approximately(point[1], 200146.976, 1);
    });

    it('works with ol.proj.fromLonLat and ol.proj.toLonLat', function () {
      proj4.defs(
        'EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      );
      register(proj4);
      const lonLat = [7.439583333333333, 46.95240555555556];
      let point = fromLonLat(lonLat, 'EPSG:21781');
      assert.approximately(point[0], 600072.3, 1);
      assert.approximately(point[1], 200146.976, 1);
      point = toLonLat(point, 'EPSG:21781');
      assert.approximately(point[0], lonLat[0], 1);
      assert.approximately(point[1], lonLat[1], 1);
    });

    it('caches the new Proj4js projections given their srsCode', function () {
      proj4.defs(
        'EPSG:21781',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      );
      const code = 'urn:ogc:def:crs:EPSG:21781';
      const srsCode = 'EPSG:21781';
      proj4.defs(code, proj4.defs(srsCode));
      register(proj4);
      const proj = getProjection(code);
      const proj2 = getProjection(srsCode);
      assert.strictEqual(equivalent(proj2, proj), true);
      delete proj4.defs[code];
    });

    it('numerically estimates point scale at the equator', function () {
      register(proj4);
      const googleProjection = getProjection('GOOGLE');
      assert.approximately(
        getPointResolution(googleProjection, 1, [0, 0]),
        1,
        1e-1,
      );
    });

    it('numerically estimates point scale at various latitudes', function () {
      register(proj4);
      const epsg3857Projection = getProjection('EPSG:3857');
      const googleProjection = getProjection('GOOGLE');
      let point, y;
      for (y = -20; y <= 20; ++y) {
        point = [0, 1000000 * y];
        assert.approximately(
          getPointResolution(googleProjection, 1, point),
          getPointResolution(epsg3857Projection, 1, point),
          1e-1,
        );
      }
    });

    it('numerically estimates point scale at various points', function () {
      register(proj4);
      const epsg3857Projection = getProjection('EPSG:3857');
      const googleProjection = getProjection('GOOGLE');
      let point, x, y;
      for (x = -20; x <= 20; x += 2) {
        for (y = -20; y <= 20; y += 2) {
          point = [1000000 * x, 1000000 * y];
          assert.approximately(
            getPointResolution(googleProjection, 1, point),
            getPointResolution(epsg3857Projection, 1, point),
            1e-1,
          );
        }
      }
    });

    it('does not overwrite existing projections in the registry', function () {
      register(proj4);
      const epsg4326 = getProjection('EPSG:4326');
      new Projection({
        code: 'EPSG:4326',
        units: 'degrees',
        extent: [-45, -45, 45, 45],
      });
      assert.equal(getProjection('EPSG:4326'), epsg4326);
    });

    it('uses safe transform functions', function () {
      register(proj4);
      const wgs84 = getProjection('WGS84');
      const epsg4326 = getProjection('EPSG:4326');
      wgs84.setExtent(epsg4326.getExtent());
      wgs84.setGlobal(true);
      const google = getProjection('GOOGLE');
      const epsg3857 = getProjection('EPSG:3857');
      google.setExtent(epsg3857.getExtent());
      google.setGlobal(true);

      const coord = [-190, 85];

      let expected = transform(coord, wgs84, google);
      let got = transform(coord, epsg4326, epsg3857);
      assert.approximately(got[0], expected[0], 1e-7);
      assert.approximately(got[1], expected[1], 1e-7);

      expected = transform(expected, google, wgs84);
      got = transform(got, epsg3857, epsg4326);
      assert.approximately(got[0], expected[0], 1e-7);
      assert.approximately(got[1], expected[1], 1e-7);
    });
  });

  describe('ol.proj.getTransformFromProjections()', function () {
    beforeEach(function () {
      register(proj4);
    });

    it('returns a transform function', function () {
      const transform = getTransformFromProjections(
        getProjection('GOOGLE'),
        getProjection('EPSG:4326'),
      );
      assert.strictEqual(typeof transform, 'function');

      const output = transform([-12000000, 5000000]);

      assert.approximately(output[0], -107.79783409434258, 1e-9);
      assert.approximately(output[1], 40.91627447067577, 1e-9);
    });

    it('works for longer arrays', function () {
      const transform = getTransformFromProjections(
        getProjection('GOOGLE'),
        getProjection('EPSG:4326'),
      );
      assert.strictEqual(typeof transform, 'function');

      const output = transform([-12000000, 5000000, -12000000, 5000000]);

      assert.approximately(output[0], -107.79783409434258, 1e-9);
      assert.approximately(output[1], 40.91627447067577, 1e-9);
      assert.approximately(output[2], -107.79783409434258, 1e-9);
      assert.approximately(output[3], 40.91627447067577, 1e-9);
    });
  });

  describe('ol.proj.getTransform()', function () {
    beforeEach(function () {
      register(proj4);
    });

    it('returns a function', function () {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      assert.strictEqual(typeof transform, 'function');
    });

    it('returns a transform function', function () {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      assert.strictEqual(typeof transform, 'function');

      const output = transform([-626172.13571216376, 6887893.4928337997]);

      assert.approximately(output[0], -5.625, 1e-9);
      assert.approximately(output[1], 52.4827802220782, 1e-9);
    });

    it('works for longer arrays of coordinate values', function () {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      assert.strictEqual(typeof transform, 'function');

      const output = transform([
        -626172.13571216376, 6887893.4928337997, -12000000, 5000000,
        -626172.13571216376, 6887893.4928337997,
      ]);

      assert.approximately(output[0], -5.625, 1e-9);
      assert.approximately(output[1], 52.4827802220782, 1e-9);
      assert.approximately(output[2], -107.79783409434258, 1e-9);
      assert.approximately(output[3], 40.91627447067577, 1e-9);
      assert.approximately(output[4], -5.625, 1e-9);
      assert.approximately(output[5], 52.4827802220782, 1e-9);
    });

    it('accepts an optional destination array', function () {
      const transform = getTransform('EPSG:3857', 'EPSG:4326');
      const input = [-12000000, 5000000];
      const output = [];

      const got = transform(input, output);
      assert.strictEqual(got, output);

      assert.approximately(output[0], -107.79783409434258, 1e-9);
      assert.approximately(output[1], 40.91627447067577, 1e-9);

      assert.deepEqual(input, [-12000000, 5000000]);
    });

    it('accepts a dimension', function () {
      const transform = getTransform('GOOGLE', 'EPSG:4326');
      assert.strictEqual(typeof transform, 'function');

      const dimension = 3;
      const output = transform(
        [
          -626172.13571216376, 6887893.4928337997, 100, -12000000, 5000000, 200,
          -626172.13571216376, 6887893.4928337997, 300,
        ],
        undefined,
        dimension,
      );

      assert.approximately(output[0], -5.625, 1e-9);
      assert.approximately(output[1], 52.4827802220782, 1e-9);
      assert.strictEqual(output[2], 100);
      assert.approximately(output[3], -107.79783409434258, 1e-9);
      assert.approximately(output[4], 40.91627447067577, 1e-9);
      assert.strictEqual(output[5], 200);
      assert.approximately(output[6], -5.625, 1e-9);
      assert.approximately(output[7], 52.4827802220782, 1e-9);
      assert.strictEqual(output[8], 300);
    });
  });

  describe('ol.proj.transform()', function () {
    it('transforms a 2d coordinate', function () {
      const got = transform([-10, -20], 'EPSG:4326', 'EPSG:3857');
      assert.lengthOf(got, 2);
      assert.approximately(got[0], -1113194.9079327357, 1e-3);
      assert.approximately(got[1], -2273030.92698769, 1e-3);
    });

    it('transforms a 3d coordinate', function () {
      const got = transform([-10, -20, 3], 'EPSG:4326', 'EPSG:3857');
      assert.lengthOf(got, 3);
      assert.approximately(got[0], -1113194.9079327357, 1e-3);
      assert.approximately(got[1], -2273030.92698769, 1e-3);
      assert.strictEqual(got[2], 3);
    });

    it('transforms a 3d coordinate with 2-dimension transform', function () {
      const latlon = new Projection({
        code: 'latlon',
      });
      addCoordinateTransforms(
        'EPSG:4326',
        latlon,
        function (coordinate) {
          return coordinate.slice(0, 2).reverse();
        },
        function (coordinate) {
          return coordinate.slice(0, 2).reverse();
        },
      );

      const got = transform([-10, -20, 3], 'EPSG:4326', latlon);
      assert.lengthOf(got, 3);
      assert.deepEqual(got, [-20, -10, 3]);
    });

    it('transforms a 4d coordinate', function () {
      const got = transform([-10, -20, 3, 4], 'EPSG:4326', 'EPSG:3857');
      assert.lengthOf(got, 4);
      assert.approximately(got[0], -1113194.9079327357, 1e-3);
      assert.approximately(got[1], -2273030.92698769, 1e-3);
      assert.strictEqual(got[2], 3);
      assert.strictEqual(got[3], 4);
    });

    it('works with 3d points and proj4 defs', function () {
      proj4.defs(
        'custom',
        '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
          '+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
          '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
      );
      register(proj4);

      const got = transform([-111, 45.5, 123], 'EPSG:4326', 'custom');
      assert.lengthOf(got, 3);
      assert.approximately(got[0], -6601512.194209638, 1);
      assert.approximately(got[1], 6145843.802742112, 1);
      assert.strictEqual(got[2], 123);

      delete proj4.defs.custom;
      clearAllProjections();
      addCommon();
    });

    it('works with 3d points and proj4 defs for 3d transforms', function () {
      proj4.defs(
        'geocent',
        '+proj=geocent +datum=WGS84 +ellps=WGS84 +units=m +no_defs',
      );
      register(proj4);

      const got = transform(
        [5584000, 2844000, 3448000],
        'geocent',
        'EPSG:4326',
      );
      assert.lengthOf(got, 3);
      assert.approximately(got[0], 26.990304649234826, 1e-9);
      assert.approximately(got[1], 28.965718227798618, 1e-9);
      assert.approximately(got[2], 779337.8584198505, 1e-9);

      delete proj4.defs.geocent;
      clearAllProjections();
      addCommon();
    });

    it('works with 3d points and proj4 defs for 3d transforms with clamped extent', function () {
      proj4.defs(
        'geocent',
        '+proj=geocent +datum=WGS84 +ellps=WGS84 +units=m +no_defs',
      );
      register(proj4);

      const got = transform([-7.56234, 38.96618, 0], 'EPSG:4326', 'geocent');

      assert.lengthOf(got, 3);
      assert.approximately(got[0], 4922499, 1);
      assert.approximately(got[1], -653508, 1);
      assert.approximately(got[2], 3989398, 1);

      delete proj4.defs.geocent;
      clearAllProjections();
      addCommon();
    });

    it('does not flip axis order', function () {
      proj4.defs('enu', '+proj=longlat');
      proj4.defs('neu', '+proj=longlat +axis=neu');
      register(proj4);

      const got = transform([1, 2], 'neu', 'enu');
      assert.deepEqual(got, [1, 2]);
      delete proj4.defs.enu;
      delete proj4.defs.neu;
      clearAllProjections();
      addCommon();
    });
  });

  describe('ol.proj.Projection.prototype.getMetersPerUnit()', function () {
    beforeEach(function () {
      proj4.defs(
        'EPSG:26782',
        '+proj=lcc +lat_1=29.3 +lat_2=30.7 +lat_0=28.66666666666667 ' +
          '+lon_0=-91.33333333333333 +x_0=609601.2192024384 +y_0=0 ' +
          '+ellps=clrk66 +datum=NAD27 +to_meter=0.3048006096012192 +no_defs',
      );
      proj4.defs(
        'EPSG:3739',
        '+proj=tmerc +lat_0=40.5 ' +
          '+lon_0=-110.0833333333333 +k=0.9999375 +x_0=800000.0000101599 ' +
          '+y_0=99999.99998983997 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 ' +
          '+units=us-ft +no_defs',
      );
      proj4.defs(
        'EPSG:4269',
        'GEOGCS["NAD83",' +
          'DATUM["North_American_Datum_1983",' +
          'SPHEROID["GRS 1980",6378137,298.257222101,' +
          'AUTHORITY["EPSG","7019"]],' +
          'AUTHORITY["EPSG","6269"]],' +
          'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
          'UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],' +
          'AUTHORITY["EPSG","4269"]]',
      );
      proj4.defs(
        'EPSG:4279',
        'GEOGCS["OS(SN)80",DATUM["OS_SN_1980",' +
          'SPHEROID["Airy 1830",6377563.396,299.3249646,' +
          'AUTHORITY["EPSG","7001"]],' +
          'AUTHORITY["EPSG","6279"]],' +
          'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
          'UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],' +
          'AUTHORITY["EPSG","4279"]]',
      );
      register(proj4);
    });

    afterEach(function () {
      delete proj4.defs['EPSG:26782'];
      delete proj4.defs['EPSG:3739'];
      delete proj4.defs['EPSG:4269'];
      delete proj4.defs['EPSG:4279'];
      clearAllProjections();
      addCommon();
    });

    it('returns value in meters', function () {
      const epsg4326 = getProjection('EPSG:4326');
      assert.deepEqual(epsg4326.getMetersPerUnit(), metersPerDegree);
    });

    it('works for proj4js projections without units', function () {
      const epsg26782 = getProjection('EPSG:26782');
      assert.deepEqual(epsg26782.getMetersPerUnit(), 0.3048006096012192);
    });

    it('works for proj4js projections with units other than m', function () {
      const epsg3739 = getProjection('EPSG:3739');
      assert.deepEqual(epsg3739.getMetersPerUnit(), 1200 / 3937);
    });

    it('works for proj4js OGC WKT GEOGCS projections', function () {
      const epsg4269 = getProjection('EPSG:4269');
      assert.deepEqual(
        epsg4269.getMetersPerUnit(),
        6378137 * 0.01745329251994328,
      );
      const epsg4279 = getProjection('EPSG:4279');
      assert.deepEqual(
        epsg4279.getMetersPerUnit(),
        6377563.396 * 0.01745329251994328,
      );
    });
  });

  describe('Console info about `setUserProjection`', function () {
    let originalConsole, callCount;
    beforeEach(function () {
      disableCoordinateWarning(false);
      originalConsole = console;
      callCount = 0;
      global.console = {
        ...console,
        warn: () => ++callCount,
      };
    });
    afterEach(function () {
      global.console = originalConsole;
      clearUserProjection();
    });
    it('is shown once when suspicious coordinates are used', function () {
      const view = new View({
        center: [16, 48],
      });
      view.setCenter([15, 47]);
      assert.strictEqual(callCount, 1);
    });
    it('is not shown when fromLonLat() is used', function () {
      const view = new View({
        center: fromLonLat([16, 48]),
      });
      view.setCenter(fromLonLat([15, 47]));
      assert.strictEqual(callCount, 0);
    });
    it('is not shown when useGeographic() is used', function () {
      useGeographic();
      const view = new View({
        center: [16, 48],
      });
      view.setCenter([15, 47]);
      assert.strictEqual(callCount, 0);
    });
    it('is not shown when view projection is configured', function () {
      const view = new View({
        projection: 'EPSG:4326',
        center: [16, 48],
      });
      view.setCenter([15, 47]);
      assert.strictEqual(callCount, 0);
    });
  });
});
