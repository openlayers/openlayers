import {assert} from 'chai';
import Feature from '../../../../src/ol/Feature.js';
import Polyline, {
  decodeDeltas,
  decodeSignedIntegers,
  decodeUnsignedIntegers,
  encodeDeltas,
  encodeSignedIntegers,
  encodeUnsignedInteger,
  encodeUnsignedIntegers,
} from '../../../../src/ol/format/Polyline.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';

describe('ol/format/Polyline.js', function () {
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
      [-120.2, 38.5],
      [-120.95, 40.7],
      [-126.453, 43.252],
    ];
    flatPoints = [-120.2, 38.5, -120.95, 40.7, -126.453, 43.252];
    flippedFlatPoints = [38.5, -120.2, 40.7, -120.95, 43.252, -126.453];
    encodedFlatPoints = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    points3857 = [
      transform([-120.2, 38.5], 'EPSG:4326', 'EPSG:3857'),
      transform([-120.95, 40.7], 'EPSG:4326', 'EPSG:3857'),
      transform([-126.453, 43.252], 'EPSG:4326', 'EPSG:3857'),
    ];

    floats = [0.0, 0.15, -0.01, -0.16, 0.16, 0.01];
    smallFloats = [0.0, 0.00015, -0.00001, -0.00016, 0.00016, 0.00001];
    encodedFloats = '?]@^_@A';

    signedIntegers = [0, 15, -1, -16, 16, 1];
    encodedSignedIntegers = '?]@^_@A';

    unsignedIntegers = [0, 30, 1, 31, 32, 2, 174];
    encodedUnsignedIntegers = '?]@^_@AmD';
  }

  // Reset testing data
  beforeEach(resetTestingData);

  describe('#readProjectionFromText', function () {
    it('returns the default projection', function () {
      const projection = format.readProjectionFromText(encodedFlatPoints);
      assert.deepEqual(projection, getProjection('EPSG:4326'));
    });
  });

  describe('encodeDeltas', function () {
    it('returns expected value', function () {
      assert.deepEqual(encodeDeltas(flippedFlatPoints, 2), encodedFlatPoints);
    });
    it('rounds positive numbers in the python 2 way', function () {
      assert.deepEqual(
        decodeDeltas(encodeDeltas([0.000005, 0], 2), 2),
        [0.00001, 0],
      );
    });
    it('rounds negative numbers in the python 2 way', function () {
      assert.deepEqual(
        decodeDeltas(encodeDeltas([-0.000005, 0], 2), 2),
        [-0.00001, 0],
      );
    });
    it('encodes changes smaller than the configured precision', function () {
      const coordinates = [0.04, 0, 0.08, 0, 0.12, 0];
      assert.deepEqual(
        decodeDeltas(encodeDeltas(coordinates, 2, 1e1), 2, 1e1),
        [0.0, 0.0, 0.1, 0.0, 0.1, 0.0],
      );
    });
  });

  describe('decodeDeltas', function () {
    it('returns expected value', function () {
      assert.deepEqual(decodeDeltas(encodedFlatPoints, 2), flippedFlatPoints);
    });
    it('has no rounding errors from float additions', function () {
      assert.deepEqual(decodeDeltas('?A?C', 2, 1e1), [0.0, 0.1, 0.0, 0.3]);
    });
  });

  describe('encodeFloats', function () {
    it('returns expected value', function () {
      assert.deepEqual(
        encodeDeltas(smallFloats, smallFloats.length),
        encodedFloats,
      );

      resetTestingData();
      assert.deepEqual(
        encodeDeltas(smallFloats, smallFloats.length, 1e5),
        encodedFloats,
      );

      assert.deepEqual(encodeDeltas(floats, floats.length, 1e2), encodedFloats);
    });
  });

  describe('decodeFloats', function () {
    it('returns expected value', function () {
      assert.deepEqual(
        decodeDeltas(encodedFloats, smallFloats.length),
        smallFloats,
      );
      assert.deepEqual(
        decodeDeltas(encodedFloats, smallFloats.length, 1e5),
        smallFloats,
      );
      assert.deepEqual(decodeDeltas(encodedFloats, floats.length, 1e2), floats);
    });
  });

  describe('encodeSignedIntegers', function () {
    it('returns expected value', function () {
      assert.deepEqual(
        encodeSignedIntegers(signedIntegers),
        encodedSignedIntegers,
      );
    });
  });

  describe('decodeSignedIntegers', function () {
    it('returns expected value', function () {
      assert.deepEqual(
        decodeSignedIntegers(encodedSignedIntegers),
        signedIntegers,
      );
    });
  });

  describe('encodeUnsignedIntegers', function () {
    it('returns expected value', function () {
      assert.deepEqual(
        encodeUnsignedIntegers(unsignedIntegers),
        encodedUnsignedIntegers,
      );
    });
  });

  describe('decodeUnsignedIntegers', function () {
    it('returns expected value', function () {
      assert.deepEqual(
        decodeUnsignedIntegers(encodedUnsignedIntegers),
        unsignedIntegers,
      );
    });
  });

  describe('encodeFloat', function () {
    it('returns expected value', function () {
      assert.deepEqual(encodeDeltas([0.0], 1), '?');
      assert.deepEqual(encodeDeltas([-0.00001], 1), '@');
      assert.deepEqual(encodeDeltas([0.00001], 1), 'A');
      assert.deepEqual(encodeDeltas([-0.00002], 1), 'B');
      assert.deepEqual(encodeDeltas([0.00002], 1), 'C');
      assert.deepEqual(encodeDeltas([0.00015], 1), ']');
      assert.deepEqual(encodeDeltas([-0.00016], 1), '^');

      assert.deepEqual(encodeDeltas([-0.1], 1, 10), '@');
      assert.deepEqual(encodeDeltas([0.1], 1, 10), 'A');

      assert.deepEqual(encodeDeltas([(16 * 32) / 1e5], 1), '__@');
      assert.deepEqual(encodeDeltas([(16 * 32 * 32) / 1e5], 1), '___@');

      assert.deepEqual(encodeDeltas([-179.9832104], 1), '`~oia@');
    });
  });

  describe('decodeFloat', function () {
    it('returns expected value', function () {
      assert.deepEqual(decodeDeltas('?', 1), [0.0]);
      assert.deepEqual(decodeDeltas('@', 1), [-0.00001]);
      assert.deepEqual(decodeDeltas('A', 1), [0.00001]);
      assert.deepEqual(decodeDeltas('B', 1), [-0.00002]);
      assert.deepEqual(decodeDeltas('C', 1), [0.00002]);
      assert.deepEqual(decodeDeltas(']', 1), [0.00015]);
      assert.deepEqual(decodeDeltas('^', 1), [-0.00016]);

      assert.deepEqual(decodeDeltas('@', 1, 10), [-0.1]);
      assert.deepEqual(decodeDeltas('A', 1, 10), [0.1]);

      assert.deepEqual(decodeDeltas('__@', 1), [(16 * 32) / 1e5]);
      assert.deepEqual(decodeDeltas('___@', 1), [(16 * 32 * 32) / 1e5]);

      assert.deepEqual(decodeDeltas('`~oia@', 1), [-179.98321]);
    });
  });

  describe('encodeSignedInteger', function () {
    it('returns expected value', function () {
      assert.deepEqual(encodeSignedIntegers([0]), '?');
      assert.deepEqual(encodeSignedIntegers([-1]), '@');
      assert.deepEqual(encodeSignedIntegers([1]), 'A');
      assert.deepEqual(encodeSignedIntegers([-2]), 'B');
      assert.deepEqual(encodeSignedIntegers([2]), 'C');
      assert.deepEqual(encodeSignedIntegers([15]), ']');
      assert.deepEqual(encodeSignedIntegers([-16]), '^');

      assert.deepEqual(encodeSignedIntegers([16]), '_@');
      assert.deepEqual(encodeSignedIntegers([16 * 32]), '__@');
      assert.deepEqual(encodeSignedIntegers([16 * 32 * 32]), '___@');
    });
  });

  describe('decodeSignedInteger', function () {
    it('returns expected value', function () {
      assert.deepEqual(decodeSignedIntegers('?'), [0]);
      assert.deepEqual(decodeSignedIntegers('@'), [-1]);
      assert.deepEqual(decodeSignedIntegers('A'), [1]);
      assert.deepEqual(decodeSignedIntegers('B'), [-2]);
      assert.deepEqual(decodeSignedIntegers('C'), [2]);
      assert.deepEqual(decodeSignedIntegers(']'), [15]);
      assert.deepEqual(decodeSignedIntegers('^'), [-16]);

      assert.deepEqual(decodeSignedIntegers('_@'), [16]);
      assert.deepEqual(decodeSignedIntegers('__@'), [16 * 32]);
      assert.deepEqual(decodeSignedIntegers('___@'), [16 * 32 * 32]);
    });
  });

  describe('encodeUnsignedInteger', function () {
    it('returns expected value', function () {
      assert.deepEqual(encodeUnsignedInteger(0), '?');
      assert.deepEqual(encodeUnsignedInteger(1), '@');
      assert.deepEqual(encodeUnsignedInteger(2), 'A');
      assert.deepEqual(encodeUnsignedInteger(30), ']');
      assert.deepEqual(encodeUnsignedInteger(31), '^');
      assert.deepEqual(encodeUnsignedInteger(32), '_@');

      assert.deepEqual(encodeUnsignedInteger(32 * 32), '__@');
      assert.deepEqual(encodeUnsignedInteger(5 * 32 * 32), '__D');
      assert.deepEqual(encodeUnsignedInteger(32 * 32 * 32), '___@');

      assert.deepEqual(encodeUnsignedInteger(174), 'mD');
    });
  });

  describe('decodeUnsignedInteger', function () {
    it('returns expected value', function () {
      assert.deepEqual(decodeUnsignedIntegers('?'), [0]);
      assert.deepEqual(decodeUnsignedIntegers('@'), [1]);
      assert.deepEqual(decodeUnsignedIntegers('A'), [2]);
      assert.deepEqual(decodeUnsignedIntegers(']'), [30]);
      assert.deepEqual(decodeUnsignedIntegers('^'), [31]);
      assert.deepEqual(decodeUnsignedIntegers('_@'), [32]);

      assert.deepEqual(decodeUnsignedIntegers('__@'), [32 * 32]);
      assert.deepEqual(decodeUnsignedIntegers('__D'), [5 * 32 * 32]);
      assert.deepEqual(decodeUnsignedIntegers('___@'), [32 * 32 * 32]);

      assert.deepEqual(decodeUnsignedIntegers('mD'), [174]);
    });
  });

  describe('#readFeature', function () {
    it('returns the expected feature', function () {
      const feature = format.readFeature(encodedFlatPoints);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getFlatCoordinates(), flatPoints);
    });

    it('transforms and returns the expected feature', function () {
      const feature = format.readFeature(encodedFlatPoints, {
        featureProjection: 'EPSG:3857',
      });
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), points3857);
    });
  });

  describe('#readFeatures', function () {
    it('returns the expected feature', function () {
      const features = format.readFeatures(encodedFlatPoints);
      assert.instanceOf(features, Array);
      assert.lengthOf(features, 1);
      const feature = features[0];
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getFlatCoordinates(), flatPoints);
    });

    it('transforms and returns the expected features', function () {
      const features = format.readFeatures(encodedFlatPoints, {
        featureProjection: 'EPSG:3857',
      });
      assert.instanceOf(features, Array);
      assert.lengthOf(features, 1);
      const feature = features[0];
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), points3857);
    });
  });

  describe('#readGeometry', function () {
    it('returns the expected geometry', function () {
      const geometry = format.readGeometry(encodedFlatPoints);
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getFlatCoordinates(), flatPoints);
    });

    it('parses XYZ linestring', function () {
      const xyz = encodeDeltas(
        [38.5, -120.2, 100, 40.7, -120.95, 200, 43.252, -126.453, 20],
        3,
      );
      const format = new Polyline({
        geometryLayout: 'XYZ',
      });

      const geometry = format.readGeometry(xyz);
      assert.deepEqual(geometry.getLayout(), 'XYZ');
      assert.deepEqual(geometry.getCoordinates(), [
        [-120.2, 38.5, 100],
        [-120.95, 40.7, 200],
        [-126.453, 43.252, 20],
      ]);
    });

    it('transforms and returns the expected geometry', function () {
      const geometry = format.readGeometry(encodedFlatPoints, {
        featureProjection: 'EPSG:3857',
      });
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), points3857);
    });
  });

  describe('#readProjection', function () {
    it('returns the expected projection', function () {
      const projection = format.readProjection(encodedFlatPoints);
      assert.strictEqual(projection, getProjection('EPSG:4326'));
    });
  });

  describe('#writeFeature', function () {
    it('returns the expected text', function () {
      const feature = new Feature(new LineString(points));
      assert.strictEqual(format.writeFeature(feature), encodedFlatPoints);
    });

    it('transforms and returns the expected text', function () {
      const feature = new Feature(new LineString(points3857));
      assert.strictEqual(
        format.writeFeature(feature, {
          featureProjection: 'EPSG:3857',
        }),
        encodedFlatPoints,
      );
    });
  });

  describe('#writeFeature', function () {
    it('returns the expected text', function () {
      const features = [new Feature(new LineString(points))];
      assert.strictEqual(format.writeFeatures(features), encodedFlatPoints);
    });

    it('transforms and returns the expected text', function () {
      const features = [new Feature(new LineString(points3857))];
      assert.strictEqual(
        format.writeFeatures(features, {
          featureProjection: 'EPSG:3857',
        }),
        encodedFlatPoints,
      );
    });
  });

  describe('#writeGeometry', function () {
    it('returns the expected text', function () {
      const geometry = new LineString(points);
      assert.strictEqual(format.writeGeometry(geometry), encodedFlatPoints);
    });

    it('transforms and returns the expected text', function () {
      const geometry = new LineString(points3857);
      assert.strictEqual(
        format.writeGeometry(geometry, {
          featureProjection: 'EPSG:3857',
        }),
        encodedFlatPoints,
      );
    });
  });
});
