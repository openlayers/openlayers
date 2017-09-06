

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_format_Polyline_ from '../../../../src/ol/format/polyline';
import _ol_geom_LineString_ from '../../../../src/ol/geom/linestring';
import _ol_proj_ from '../../../../src/ol/proj';

describe('ol.format.Polyline', function() {

  var format;
  var points;
  var flatPoints, encodedFlatPoints, flippedFlatPoints;
  var floats, smallFloats, encodedFloats;
  var signedIntegers, encodedSignedIntegers;
  var unsignedIntegers, encodedUnsignedIntegers;
  var points3857;

  function resetTestingData() {
    format = new _ol_format_Polyline_();
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
      _ol_proj_.transform([-120.20000, 38.50000], 'EPSG:4326', 'EPSG:3857'),
      _ol_proj_.transform([-120.95000, 40.70000], 'EPSG:4326', 'EPSG:3857'),
      _ol_proj_.transform([-126.45300, 43.25200], 'EPSG:4326', 'EPSG:3857')
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

  describe('#readProjectionFromText', function() {
    it('returns the default projection', function() {
      var projection = format.readProjectionFromText(encodedFlatPoints);
      expect(projection).to.eql(_ol_proj_.get('EPSG:4326'));
    });
  });

  describe('encodeDeltas', function() {
    it('returns expected value', function() {
      var encodeDeltas = _ol_format_Polyline_.encodeDeltas;

      expect(encodeDeltas(flippedFlatPoints, 2)).to.eql(encodedFlatPoints);
    });
  });

  describe('decodeDeltas', function() {
    it('returns expected value', function() {
      var decodeDeltas = _ol_format_Polyline_.decodeDeltas;

      expect(decodeDeltas(encodedFlatPoints, 2)).to.eql(flippedFlatPoints);
    });
  });


  describe('encodeFloats', function() {
    it('returns expected value', function() {
      var encodeFloats = _ol_format_Polyline_.encodeFloats;

      expect(encodeFloats(smallFloats)).to.eql(encodedFloats);

      resetTestingData();
      expect(encodeFloats(smallFloats, 1e5)).to.eql(encodedFloats);

      expect(encodeFloats(floats, 1e2)).to.eql(encodedFloats);
    });
  });

  describe('decodeFloats', function() {
    it('returns expected value', function() {
      var decodeFloats = _ol_format_Polyline_.decodeFloats;

      expect(decodeFloats(encodedFloats)).to.eql(smallFloats);
      expect(decodeFloats(encodedFloats, 1e5)).to.eql(smallFloats);
      expect(decodeFloats(encodedFloats, 1e2)).to.eql(floats);
    });
  });


  describe('encodeSignedIntegers', function() {
    it('returns expected value', function() {
      var encodeSignedIntegers = _ol_format_Polyline_.encodeSignedIntegers;

      expect(encodeSignedIntegers(
          signedIntegers)).to.eql(encodedSignedIntegers);
    });
  });

  describe('decodeSignedIntegers', function() {
    it('returns expected value', function() {
      var decodeSignedIntegers = _ol_format_Polyline_.decodeSignedIntegers;

      expect(decodeSignedIntegers(
          encodedSignedIntegers)).to.eql(signedIntegers);
    });
  });


  describe('encodeUnsignedIntegers', function() {
    it('returns expected value', function() {
      var encodeUnsignedIntegers = _ol_format_Polyline_.encodeUnsignedIntegers;

      expect(encodeUnsignedIntegers(
          unsignedIntegers)).to.eql(encodedUnsignedIntegers);
    });
  });

  describe('decodeUnsignedIntegers', function() {
    it('returns expected value', function() {
      var decodeUnsignedIntegers = _ol_format_Polyline_.decodeUnsignedIntegers;

      expect(decodeUnsignedIntegers(
          encodedUnsignedIntegers)).to.eql(unsignedIntegers);
    });
  });


  describe('encodeFloat', function() {
    it('returns expected value', function() {
      var encodeFloats = _ol_format_Polyline_.encodeFloats;

      expect(encodeFloats([0.00000])).to.eql('?');
      expect(encodeFloats([-0.00001])).to.eql('@');
      expect(encodeFloats([0.00001])).to.eql('A');
      expect(encodeFloats([-0.00002])).to.eql('B');
      expect(encodeFloats([0.00002])).to.eql('C');
      expect(encodeFloats([0.00015])).to.eql(']');
      expect(encodeFloats([-0.00016])).to.eql('^');

      expect(encodeFloats([-0.1], 10)).to.eql('@');
      expect(encodeFloats([0.1], 10)).to.eql('A');

      expect(encodeFloats([16 * 32 / 1e5])).to.eql('__@');
      expect(encodeFloats([16 * 32 * 32 / 1e5])).to.eql('___@');

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeFloats([-179.9832104])).to.eql('`~oia@');
    });
  });

  describe('decodeFloat', function() {
    it('returns expected value', function() {
      var decodeFloats = _ol_format_Polyline_.decodeFloats;

      expect(decodeFloats('?')).to.eql([0.00000]);
      expect(decodeFloats('@')).to.eql([-0.00001]);
      expect(decodeFloats('A')).to.eql([0.00001]);
      expect(decodeFloats('B')).to.eql([-0.00002]);
      expect(decodeFloats('C')).to.eql([0.00002]);
      expect(decodeFloats(']')).to.eql([0.00015]);
      expect(decodeFloats('^')).to.eql([-0.00016]);

      expect(decodeFloats('@', 10)).to.eql([-0.1]);
      expect(decodeFloats('A', 10)).to.eql([0.1]);

      expect(decodeFloats('__@')).to.eql([16 * 32 / 1e5]);
      expect(decodeFloats('___@')).to.eql([16 * 32 * 32 / 1e5]);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeFloats('`~oia@')).to.eql([-179.98321]);
    });
  });


  describe('encodeSignedInteger', function() {
    it('returns expected value', function() {
      var encodeSignedIntegers = _ol_format_Polyline_.encodeSignedIntegers;

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

  describe('decodeSignedInteger', function() {
    it('returns expected value', function() {
      var decodeSignedIntegers = _ol_format_Polyline_.decodeSignedIntegers;

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


  describe('encodeUnsignedInteger', function() {
    it('returns expected value', function() {
      var encodeUnsignedInteger = _ol_format_Polyline_.encodeUnsignedInteger;

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

  describe('decodeUnsignedInteger', function() {
    it('returns expected value', function() {
      var decodeUnsignedIntegers = _ol_format_Polyline_.decodeUnsignedIntegers;

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

  describe('#readFeature', function() {

    it('returns the expected feature', function() {
      var feature = format.readFeature(encodedFlatPoints);
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getFlatCoordinates()).to.eql(flatPoints);
    });

    it('transforms and returns the expected feature', function() {
      var feature = format.readFeature(encodedFlatPoints, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getCoordinates()).to.eql(points3857);
    });

  });

  describe('#readFeatures', function() {

    it('returns the expected feature', function() {
      var features = format.readFeatures(encodedFlatPoints);
      expect(features).to.be.an(Array);
      expect(features).to.have.length(1);
      var feature = features[0];
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getFlatCoordinates()).to.eql(flatPoints);
    });

    it('transforms and returns the expected features', function() {
      var features = format.readFeatures(encodedFlatPoints, {
        featureProjection: 'EPSG:3857'
      });
      expect(features).to.be.an(Array);
      expect(features).to.have.length(1);
      var feature = features[0];
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getCoordinates()).to.eql(points3857);
    });

  });

  describe('#readGeometry', function() {

    it('returns the expected geometry', function() {
      var geometry = format.readGeometry(encodedFlatPoints);
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getFlatCoordinates()).to.eql(flatPoints);
    });

    it('parses XYZ linestring', function() {
      var xyz = _ol_format_Polyline_.encodeDeltas([
        38.500, -120.200, 100,
        40.700, -120.950, 200,
        43.252, -126.453, 20
      ], 3);
      var format = new _ol_format_Polyline_({
        geometryLayout: 'XYZ'
      });

      var geometry = format.readGeometry(xyz);
      expect(geometry.getLayout()).to.eql('XYZ');
      expect(geometry.getCoordinates()).to.eql([
        [-120.200, 38.500, 100],
        [-120.950, 40.700, 200],
        [-126.453, 43.252, 20]
      ]);
    });

    it('transforms and returns the expected geometry', function() {
      var geometry = format.readGeometry(encodedFlatPoints, {
        featureProjection: 'EPSG:3857'
      });
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getCoordinates()).to.eql(points3857);
    });

  });

  describe('#readProjection', function() {

    it('returns the expected projection', function() {
      var projection = format.readProjection(encodedFlatPoints);
      expect(projection).to.be(_ol_proj_.get('EPSG:4326'));
    });

  });

  describe('#writeFeature', function() {

    it('returns the expected text', function() {
      var feature = new _ol_Feature_(new _ol_geom_LineString_(points));
      expect(format.writeFeature(feature)).to.be(encodedFlatPoints);
    });

    it('transforms and returns the expected text', function() {
      var feature = new _ol_Feature_(new _ol_geom_LineString_(points3857));
      expect(format.writeFeature(feature, {
        featureProjection: 'EPSG:3857'
      })).to.be(encodedFlatPoints);
    });

  });

  describe('#writeFeature', function() {

    it('returns the expected text', function() {
      var features = [new _ol_Feature_(new _ol_geom_LineString_(points))];
      expect(format.writeFeatures(features)).to.be(encodedFlatPoints);
    });

    it('transforms and returns the expected text', function() {
      var features = [new _ol_Feature_(new _ol_geom_LineString_(points3857))];
      expect(format.writeFeatures(features, {
        featureProjection: 'EPSG:3857'
      })).to.be(encodedFlatPoints);
    });

  });

  describe('#writeGeometry', function() {

    it('returns the expected text', function() {
      var geometry = new _ol_geom_LineString_(points);
      expect(format.writeGeometry(geometry)).to.be(encodedFlatPoints);
    });

    it('transforms and returns the expected text', function() {
      var geometry = new _ol_geom_LineString_(points3857);
      expect(format.writeGeometry(geometry, {
        featureProjection: 'EPSG:3857'
      })).to.be(encodedFlatPoints);
    });

  });

});
