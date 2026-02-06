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
import expect from '../../expect.js';

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
      expect(projection).to.eql(getProjection('EPSG:4326'));
    });
  });

  describe('encodeDeltas', function () {
    it('returns expected value', function () {
      expect(encodeDeltas(flippedFlatPoints, 2)).to.eql(encodedFlatPoints);
    });
    it('rounds positive numbers in the python 2 way', function () {
      expect(decodeDeltas(encodeDeltas([0.000005, 0], 2), 2)).to.eql([
        0.00001, 0,
      ]);
    });
    it('rounds negative numbers in the python 2 way', function () {
      expect(decodeDeltas(encodeDeltas([-0.000005, 0], 2), 2)).to.eql([
        -0.00001, 0,
      ]);
    });
    it('encodes changes smaller than the configured precision', function () {
      const coordinates = [0.04, 0, 0.08, 0, 0.12, 0];
      expect(decodeDeltas(encodeDeltas(coordinates, 2, 1e1), 2, 1e1)).to.eql([
        0.0, 0.0, 0.1, 0.0, 0.1, 0.0,
      ]);
    });
  });

  describe('decodeDeltas', function () {
    it('returns expected value', function () {
      expect(decodeDeltas(encodedFlatPoints, 2)).to.eql(flippedFlatPoints);
    });
    it('has no rounding errors from float additions', function () {
      expect(decodeDeltas('?A?C', 2, 1e1)).to.eql([0.0, 0.1, 0.0, 0.3]);
    });
  });

  describe('encodeFloats', function () {
    it('returns expected value', function () {
      expect(encodeDeltas(smallFloats, smallFloats.length)).to.eql(
        encodedFloats,
      );

      resetTestingData();
      expect(encodeDeltas(smallFloats, smallFloats.length, 1e5)).to.eql(
        encodedFloats,
      );

      expect(encodeDeltas(floats, floats.length, 1e2)).to.eql(encodedFloats);
    });
  });

  describe('decodeFloats', function () {
    it('returns expected value', function () {
      expect(decodeDeltas(encodedFloats, smallFloats.length)).to.eql(
        smallFloats,
      );
      expect(decodeDeltas(encodedFloats, smallFloats.length, 1e5)).to.eql(
        smallFloats,
      );
      expect(decodeDeltas(encodedFloats, floats.length, 1e2)).to.eql(floats);
    });
  });

  describe('encodeSignedIntegers', function () {
    it('returns expected value', function () {
      expect(encodeSignedIntegers(signedIntegers)).to.eql(
        encodedSignedIntegers,
      );
    });
  });

  describe('decodeSignedIntegers', function () {
    it('returns expected value', function () {
      expect(decodeSignedIntegers(encodedSignedIntegers)).to.eql(
        signedIntegers,
      );
    });
  });

  describe('encodeUnsignedIntegers', function () {
    it('returns expected value', function () {
      expect(encodeUnsignedIntegers(unsignedIntegers)).to.eql(
        encodedUnsignedIntegers,
      );
    });
  });

  describe('decodeUnsignedIntegers', function () {
    it('returns expected value', function () {
      expect(decodeUnsignedIntegers(encodedUnsignedIntegers)).to.eql(
        unsignedIntegers,
      );
    });
  });

  describe('encodeFloat', function () {
    it('returns expected value', function () {
      expect(encodeDeltas([0.0], 1)).to.eql('?');
      expect(encodeDeltas([-0.00001], 1)).to.eql('@');
      expect(encodeDeltas([0.00001], 1)).to.eql('A');
      expect(encodeDeltas([-0.00002], 1)).to.eql('B');
      expect(encodeDeltas([0.00002], 1)).to.eql('C');
      expect(encodeDeltas([0.00015], 1)).to.eql(']');
      expect(encodeDeltas([-0.00016], 1)).to.eql('^');

      expect(encodeDeltas([-0.1], 1, 10)).to.eql('@');
      expect(encodeDeltas([0.1], 1, 10)).to.eql('A');

      expect(encodeDeltas([(16 * 32) / 1e5], 1)).to.eql('__@');
      expect(encodeDeltas([(16 * 32 * 32) / 1e5], 1)).to.eql('___@');

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeDeltas([-179.9832104], 1)).to.eql('`~oia@');
    });
  });

  describe('decodeFloat', function () {
    it('returns expected value', function () {
      expect(decodeDeltas('?', 1)).to.eql([0.0]);
      expect(decodeDeltas('@', 1)).to.eql([-0.00001]);
      expect(decodeDeltas('A', 1)).to.eql([0.00001]);
      expect(decodeDeltas('B', 1)).to.eql([-0.00002]);
      expect(decodeDeltas('C', 1)).to.eql([0.00002]);
      expect(decodeDeltas(']', 1)).to.eql([0.00015]);
      expect(decodeDeltas('^', 1)).to.eql([-0.00016]);

      expect(decodeDeltas('@', 1, 10)).to.eql([-0.1]);
      expect(decodeDeltas('A', 1, 10)).to.eql([0.1]);

      expect(decodeDeltas('__@', 1)).to.eql([(16 * 32) / 1e5]);
      expect(decodeDeltas('___@', 1)).to.eql([(16 * 32 * 32) / 1e5]);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeDeltas('`~oia@', 1)).to.eql([-179.98321]);
    });
  });

  describe('encodeSignedInteger', function () {
    it('returns expected value', function () {
      expect(encodeSignedIntegers([0])).to.eql('?');
      expect(encodeSignedIntegers([-1])).to.eql('@');
      expect(encodeSignedIntegers([1])).to.eql('A');
      expect(encodeSignedIntegers([-2])).to.eql('B');
      expect(encodeSignedIntegers([2])).to.eql('C');
      expect(encodeSignedIntegers([15])).to.eql(']');
      expect(encodeSignedIntegers([-16])).to.eql('^');

      expect(encodeSignedIntegers([16])).to.eql('_@');
      expect(encodeSignedIntegers([16 * 32])).to.eql('__@');
      expect(encodeSignedIntegers([16 * 32 * 32])).to.eql('___@');
    });
  });

  describe('decodeSignedInteger', function () {
    it('returns expected value', function () {
      expect(decodeSignedIntegers('?')).to.eql([0]);
      expect(decodeSignedIntegers('@')).to.eql([-1]);
      expect(decodeSignedIntegers('A')).to.eql([1]);
      expect(decodeSignedIntegers('B')).to.eql([-2]);
      expect(decodeSignedIntegers('C')).to.eql([2]);
      expect(decodeSignedIntegers(']')).to.eql([15]);
      expect(decodeSignedIntegers('^')).to.eql([-16]);

      expect(decodeSignedIntegers('_@')).to.eql([16]);
      expect(decodeSignedIntegers('__@')).to.eql([16 * 32]);
      expect(decodeSignedIntegers('___@')).to.eql([16 * 32 * 32]);
    });
  });

  describe('encodeUnsignedInteger', function () {
    it('returns expected value', function () {
      expect(encodeUnsignedInteger(0)).to.eql('?');
      expect(encodeUnsignedInteger(1)).to.eql('@');
      expect(encodeUnsignedInteger(2)).to.eql('A');
      expect(encodeUnsignedInteger(30)).to.eql(']');
      expect(encodeUnsignedInteger(31)).to.eql('^');
      expect(encodeUnsignedInteger(32)).to.eql('_@');

      expect(encodeUnsignedInteger(32 * 32)).to.eql('__@');
      expect(encodeUnsignedInteger(5 * 32 * 32)).to.eql('__D');
      expect(encodeUnsignedInteger(32 * 32 * 32)).to.eql('___@');

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeUnsignedInteger(174)).to.eql('mD');
    });
  });

  describe('decodeUnsignedInteger', function () {
    it('returns expected value', function () {
      expect(decodeUnsignedIntegers('?')).to.eql([0]);
      expect(decodeUnsignedIntegers('@')).to.eql([1]);
      expect(decodeUnsignedIntegers('A')).to.eql([2]);
      expect(decodeUnsignedIntegers(']')).to.eql([30]);
      expect(decodeUnsignedIntegers('^')).to.eql([31]);
      expect(decodeUnsignedIntegers('_@')).to.eql([32]);

      expect(decodeUnsignedIntegers('__@')).to.eql([32 * 32]);
      expect(decodeUnsignedIntegers('__D')).to.eql([5 * 32 * 32]);
      expect(decodeUnsignedIntegers('___@')).to.eql([32 * 32 * 32]);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeUnsignedIntegers('mD')).to.eql([174]);
    });
  });

  describe('#readFeature', function () {
    it('returns the expected feature', function () {
      const feature = format.readFeature(encodedFlatPoints);
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(LineString);
      expect(geometry.getFlatCoordinates()).to.eql(flatPoints);
    });

    it('transforms and returns the expected feature', function () {
      const feature = format.readFeature(encodedFlatPoints, {
        featureProjection: 'EPSG:3857',
      });
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(LineString);
      expect(geometry.getCoordinates()).to.eql(points3857);
    });
  });

  describe('#readFeatures', function () {
    it('returns the expected feature', function () {
      const features = format.readFeatures(encodedFlatPoints);
      expect(features).to.be.an(Array);
      expect(features).to.have.length(1);
      const feature = features[0];
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(LineString);
      expect(geometry.getFlatCoordinates()).to.eql(flatPoints);
    });

    it('transforms and returns the expected features', function () {
      const features = format.readFeatures(encodedFlatPoints, {
        featureProjection: 'EPSG:3857',
      });
      expect(features).to.be.an(Array);
      expect(features).to.have.length(1);
      const feature = features[0];
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(LineString);
      expect(geometry.getCoordinates()).to.eql(points3857);
    });
  });

  describe('#readGeometry', function () {
    it('returns the expected geometry', function () {
      const geometry = format.readGeometry(encodedFlatPoints);
      expect(geometry).to.be.an(LineString);
      expect(geometry.getFlatCoordinates()).to.eql(flatPoints);
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
      expect(geometry.getLayout()).to.eql('XYZ');
      expect(geometry.getCoordinates()).to.eql([
        [-120.2, 38.5, 100],
        [-120.95, 40.7, 200],
        [-126.453, 43.252, 20],
      ]);
    });

    it('transforms and returns the expected geometry', function () {
      const geometry = format.readGeometry(encodedFlatPoints, {
        featureProjection: 'EPSG:3857',
      });
      expect(geometry).to.be.an(LineString);
      expect(geometry.getCoordinates()).to.eql(points3857);
    });
  });

  describe('#readProjection', function () {
    it('returns the expected projection', function () {
      const projection = format.readProjection(encodedFlatPoints);
      expect(projection).to.be(getProjection('EPSG:4326'));
    });
  });

  describe('#writeFeature', function () {
    it('returns the expected text', function () {
      const feature = new Feature(new LineString(points));
      expect(format.writeFeature(feature)).to.be(encodedFlatPoints);
    });

    it('transforms and returns the expected text', function () {
      const feature = new Feature(new LineString(points3857));
      expect(
        format.writeFeature(feature, {
          featureProjection: 'EPSG:3857',
        }),
      ).to.be(encodedFlatPoints);
    });
  });

  describe('#writeFeature', function () {
    it('returns the expected text', function () {
      const features = [new Feature(new LineString(points))];
      expect(format.writeFeatures(features)).to.be(encodedFlatPoints);
    });

    it('transforms and returns the expected text', function () {
      const features = [new Feature(new LineString(points3857))];
      expect(
        format.writeFeatures(features, {
          featureProjection: 'EPSG:3857',
        }),
      ).to.be(encodedFlatPoints);
    });
  });

  describe('#writeGeometry', function () {
    it('returns the expected text', function () {
      const geometry = new LineString(points);
      expect(format.writeGeometry(geometry)).to.be(encodedFlatPoints);
    });

    it('transforms and returns the expected text', function () {
      const geometry = new LineString(points3857);
      expect(
        format.writeGeometry(geometry, {
          featureProjection: 'EPSG:3857',
        }),
      ).to.be(encodedFlatPoints);
    });
  });
});
