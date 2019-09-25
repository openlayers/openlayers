import Feature from '../../../../src/ol/Feature.js';
import Polyline, * as polyline from '../../../../src/ol/format/Polyline.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';

describe('ol.format.Polyline', () => {

  let format;
  let points;
  let flatPoints, encodedFlatPoints, flippedFlatPoints;
  let floats, smallFloats, encodedFloats;
  let signedIntegers, encodedSignedIntegers;
  let unsignedIntegers, encodedUnsignedIntegers;
  let points3857;

  function resetTestingData() {
    format = new Polyline();
    points = [
      [-120.20000, 38.50000],
      [-120.95000, 40.70000],
      [-126.45300, 43.25200]
    ];
    flatPoints = [
      -120.20000, 38.50000,
      -120.95000, 40.70000,
      -126.45300, 43.25200
    ];
    flippedFlatPoints = [
      38.50000, -120.20000,
      40.70000, -120.95000,
      43.25200, -126.45300
    ];
    encodedFlatPoints = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    points3857 = [
      transform([-120.20000, 38.50000], 'EPSG:4326', 'EPSG:3857'),
      transform([-120.95000, 40.70000], 'EPSG:4326', 'EPSG:3857'),
      transform([-126.45300, 43.25200], 'EPSG:4326', 'EPSG:3857')
    ];

    floats = [0.00, 0.15, -0.01, -0.16, 0.16, 0.01];
    smallFloats = [0.00000, 0.00015, -0.00001, -0.00016, 0.00016, 0.00001];
    encodedFloats = '?]@^_@A';

    signedIntegers = [0, 15, -1, -16, 16, 1];
    encodedSignedIntegers = '?]@^_@A';

    unsignedIntegers = [0, 30, 1, 31, 32, 2, 174];
    encodedUnsignedIntegers = '?]@^_@AmD';
  }

  // Reset testing data
  beforeEach(resetTestingData);

  describe('#readProjectionFromText', () => {
    test('returns the default projection', () => {
      const projection = format.readProjectionFromText(encodedFlatPoints);
      expect(projection).toEqual(getProjection('EPSG:4326'));
    });
  });

  describe('encodeDeltas', () => {
    test('returns expected value', () => {
      const encodeDeltas = polyline.encodeDeltas;

      expect(encodeDeltas(flippedFlatPoints, 2)).toEqual(encodedFlatPoints);
    });
  });

  describe('decodeDeltas', () => {
    test('returns expected value', () => {
      const decodeDeltas = polyline.decodeDeltas;

      expect(decodeDeltas(encodedFlatPoints, 2)).toEqual(flippedFlatPoints);
    });
  });


  describe('encodeFloats', () => {
    test('returns expected value', () => {
      const encodeFloats = polyline.encodeFloats;

      expect(encodeFloats(smallFloats)).toEqual(encodedFloats);

      resetTestingData();
      expect(encodeFloats(smallFloats, 1e5)).toEqual(encodedFloats);

      expect(encodeFloats(floats, 1e2)).toEqual(encodedFloats);
    });
  });

  describe('decodeFloats', () => {
    test('returns expected value', () => {
      const decodeFloats = polyline.decodeFloats;

      expect(decodeFloats(encodedFloats)).toEqual(smallFloats);
      expect(decodeFloats(encodedFloats, 1e5)).toEqual(smallFloats);
      expect(decodeFloats(encodedFloats, 1e2)).toEqual(floats);
    });
  });


  describe('encodeSignedIntegers', () => {
    test('returns expected value', () => {
      const encodeSignedIntegers = polyline.encodeSignedIntegers;

      expect(encodeSignedIntegers(
        signedIntegers)).toEqual(encodedSignedIntegers);
    });
  });

  describe('decodeSignedIntegers', () => {
    test('returns expected value', () => {
      const decodeSignedIntegers = polyline.decodeSignedIntegers;

      expect(decodeSignedIntegers(
        encodedSignedIntegers)).toEqual(signedIntegers);
    });
  });


  describe('encodeUnsignedIntegers', () => {
    test('returns expected value', () => {
      const encodeUnsignedIntegers = polyline.encodeUnsignedIntegers;

      expect(encodeUnsignedIntegers(
        unsignedIntegers)).toEqual(encodedUnsignedIntegers);
    });
  });

  describe('decodeUnsignedIntegers', () => {
    test('returns expected value', () => {
      const decodeUnsignedIntegers = polyline.decodeUnsignedIntegers;

      expect(decodeUnsignedIntegers(
        encodedUnsignedIntegers)).toEqual(unsignedIntegers);
    });
  });


  describe('encodeFloat', () => {
    test('returns expected value', () => {
      const encodeFloats = polyline.encodeFloats;

      expect(encodeFloats([0.00000])).toEqual('?');
      expect(encodeFloats([-0.00001])).toEqual('@');
      expect(encodeFloats([0.00001])).toEqual('A');
      expect(encodeFloats([-0.00002])).toEqual('B');
      expect(encodeFloats([0.00002])).toEqual('C');
      expect(encodeFloats([0.00015])).toEqual(']');
      expect(encodeFloats([-0.00016])).toEqual('^');

      expect(encodeFloats([-0.1], 10)).toEqual('@');
      expect(encodeFloats([0.1], 10)).toEqual('A');

      expect(encodeFloats([16 * 32 / 1e5])).toEqual('__@');
      expect(encodeFloats([16 * 32 * 32 / 1e5])).toEqual('___@');

      expect(encodeFloats([-179.9832104])).toEqual('`~oia@');
    });
  });

  describe('decodeFloat', () => {
    test('returns expected value', () => {
      const decodeFloats = polyline.decodeFloats;

      expect(decodeFloats('?')).toEqual([0.00000]);
      expect(decodeFloats('@')).toEqual([-0.00001]);
      expect(decodeFloats('A')).toEqual([0.00001]);
      expect(decodeFloats('B')).toEqual([-0.00002]);
      expect(decodeFloats('C')).toEqual([0.00002]);
      expect(decodeFloats(']')).toEqual([0.00015]);
      expect(decodeFloats('^')).toEqual([-0.00016]);

      expect(decodeFloats('@', 10)).toEqual([-0.1]);
      expect(decodeFloats('A', 10)).toEqual([0.1]);

      expect(decodeFloats('__@')).toEqual([16 * 32 / 1e5]);
      expect(decodeFloats('___@')).toEqual([16 * 32 * 32 / 1e5]);

      expect(decodeFloats('`~oia@')).toEqual([-179.98321]);
    });
  });


  describe('encodeSignedInteger', () => {
    test('returns expected value', () => {
      const encodeSignedIntegers = polyline.encodeSignedIntegers;

      expect(encodeSignedIntegers([0])).toEqual('?');
      expect(encodeSignedIntegers([-1])).toEqual('@');
      expect(encodeSignedIntegers([1])).toEqual('A');
      expect(encodeSignedIntegers([-2])).toEqual('B');
      expect(encodeSignedIntegers([2])).toEqual('C');
      expect(encodeSignedIntegers([15])).toEqual(']');
      expect(encodeSignedIntegers([-16])).toEqual('^');

      expect(encodeSignedIntegers([16])).toEqual('_@');
      expect(encodeSignedIntegers([16 * 32])).toEqual('__@');
      expect(encodeSignedIntegers([16 * 32 * 32])).toEqual('___@');
    });
  });

  describe('decodeSignedInteger', () => {
    test('returns expected value', () => {
      const decodeSignedIntegers = polyline.decodeSignedIntegers;

      expect(decodeSignedIntegers('?')).toEqual([0]);
      expect(decodeSignedIntegers('@')).toEqual([-1]);
      expect(decodeSignedIntegers('A')).toEqual([1]);
      expect(decodeSignedIntegers('B')).toEqual([-2]);
      expect(decodeSignedIntegers('C')).toEqual([2]);
      expect(decodeSignedIntegers(']')).toEqual([15]);
      expect(decodeSignedIntegers('^')).toEqual([-16]);

      expect(decodeSignedIntegers('_@')).toEqual([16]);
      expect(decodeSignedIntegers('__@')).toEqual([16 * 32]);
      expect(decodeSignedIntegers('___@')).toEqual([16 * 32 * 32]);
    });
  });


  describe('encodeUnsignedInteger', () => {
    test('returns expected value', () => {
      const encodeUnsignedInteger = polyline.encodeUnsignedInteger;

      expect(encodeUnsignedInteger(0)).toEqual('?');
      expect(encodeUnsignedInteger(1)).toEqual('@');
      expect(encodeUnsignedInteger(2)).toEqual('A');
      expect(encodeUnsignedInteger(30)).toEqual(']');
      expect(encodeUnsignedInteger(31)).toEqual('^');
      expect(encodeUnsignedInteger(32)).toEqual('_@');

      expect(encodeUnsignedInteger(32 * 32)).toEqual('__@');
      expect(encodeUnsignedInteger(5 * 32 * 32)).toEqual('__D');
      expect(encodeUnsignedInteger(32 * 32 * 32)).toEqual('___@');

      expect(encodeUnsignedInteger(174)).toEqual('mD');
    });
  });

  describe('decodeUnsignedInteger', () => {
    test('returns expected value', () => {
      const decodeUnsignedIntegers = polyline.decodeUnsignedIntegers;

      expect(decodeUnsignedIntegers('?')).toEqual([0]);
      expect(decodeUnsignedIntegers('@')).toEqual([1]);
      expect(decodeUnsignedIntegers('A')).toEqual([2]);
      expect(decodeUnsignedIntegers(']')).toEqual([30]);
      expect(decodeUnsignedIntegers('^')).toEqual([31]);
      expect(decodeUnsignedIntegers('_@')).toEqual([32]);

      expect(decodeUnsignedIntegers('__@')).toEqual([32 * 32]);
      expect(decodeUnsignedIntegers('__D')).toEqual([5 * 32 * 32]);
      expect(decodeUnsignedIntegers('___@')).toEqual([32 * 32 * 32]);

      expect(decodeUnsignedIntegers('mD')).toEqual([174]);
    });
  });

  describe('#readFeature', () => {

    test('returns the expected feature', () => {
      const feature = format.readFeature(encodedFlatPoints);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getFlatCoordinates()).toEqual(flatPoints);
    });

    test('transforms and returns the expected feature', () => {
      const feature = format.readFeature(encodedFlatPoints, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual(points3857);
    });

  });

  describe('#readFeatures', () => {

    test('returns the expected feature', () => {
      const features = format.readFeatures(encodedFlatPoints);
      expect(features).toBeInstanceOf(Array);
      expect(features).toHaveLength(1);
      const feature = features[0];
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getFlatCoordinates()).toEqual(flatPoints);
    });

    test('transforms and returns the expected features', () => {
      const features = format.readFeatures(encodedFlatPoints, {
        featureProjection: 'EPSG:3857'
      });
      expect(features).toBeInstanceOf(Array);
      expect(features).toHaveLength(1);
      const feature = features[0];
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual(points3857);
    });

  });

  describe('#readGeometry', () => {

    test('returns the expected geometry', () => {
      const geometry = format.readGeometry(encodedFlatPoints);
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getFlatCoordinates()).toEqual(flatPoints);
    });

    test('parses XYZ linestring', () => {
      const xyz = polyline.encodeDeltas([
        38.500, -120.200, 100,
        40.700, -120.950, 200,
        43.252, -126.453, 20
      ], 3);
      const format = new Polyline({
        geometryLayout: 'XYZ'
      });

      const geometry = format.readGeometry(xyz);
      expect(geometry.getLayout()).toEqual('XYZ');
      expect(geometry.getCoordinates()).toEqual([
        [-120.200, 38.500, 100],
        [-120.950, 40.700, 200],
        [-126.453, 43.252, 20]
      ]);
    });

    test('transforms and returns the expected geometry', () => {
      const geometry = format.readGeometry(encodedFlatPoints, {
        featureProjection: 'EPSG:3857'
      });
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual(points3857);
    });

  });

  describe('#readProjection', () => {

    test('returns the expected projection', () => {
      const projection = format.readProjection(encodedFlatPoints);
      expect(projection).toBe(getProjection('EPSG:4326'));
    });

  });

  describe('#writeFeature', () => {

    test('returns the expected text', () => {
      const feature = new Feature(new LineString(points));
      expect(format.writeFeature(feature)).toBe(encodedFlatPoints);
    });

    test('transforms and returns the expected text', () => {
      const feature = new Feature(new LineString(points3857));
      expect(format.writeFeature(feature, {
        featureProjection: 'EPSG:3857'
      })).toBe(encodedFlatPoints);
    });

  });

  describe('#writeFeature', () => {

    test('returns the expected text', () => {
      const features = [new Feature(new LineString(points))];
      expect(format.writeFeatures(features)).toBe(encodedFlatPoints);
    });

    test('transforms and returns the expected text', () => {
      const features = [new Feature(new LineString(points3857))];
      expect(format.writeFeatures(features, {
        featureProjection: 'EPSG:3857'
      })).toBe(encodedFlatPoints);
    });

  });

  describe('#writeGeometry', () => {

    test('returns the expected text', () => {
      const geometry = new LineString(points);
      expect(format.writeGeometry(geometry)).toBe(encodedFlatPoints);
    });

    test('transforms and returns the expected text', () => {
      const geometry = new LineString(points3857);
      expect(format.writeGeometry(geometry, {
        featureProjection: 'EPSG:3857'
      })).toBe(encodedFlatPoints);
    });

  });

});
