goog.provide('ol.test.parser.polyline');

describe('ol.parser.polyline', function() {

  var flatPoints, encodedFlatPoints;
  var floats, smallFloats, encodedFloats;
  var signedIntegers, encodedSignedIntegers;
  var unsignedIntegers, encodedUnsignedIntegers;

  function resetTestingData() {
    flatPoints = [38.50000, -120.20000,
                  40.70000, -120.95000,
                  43.25200, -126.45300];
    encodedFlatPoints = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

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



  describe('encodeFlatCoordinates', function() {
    it('returns expected value', function() {
      var encodeFlatCoordinates = ol.parser.polyline.encodeFlatCoordinates;

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeFlatCoordinates(flatPoints)).to.eql(encodedFlatPoints);
    });
  });

  describe('decodeFlatCoordinates', function() {
    it('returns expected value', function() {
      var decodeFlatCoordinates = ol.parser.polyline.decodeFlatCoordinates;

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeFlatCoordinates(encodedFlatPoints)).to.eql(flatPoints);
    });
  });



  describe('encodeDeltas', function() {
    it('returns expected value', function() {
      var encodeDeltas = ol.parser.polyline.encodeDeltas;

      expect(encodeDeltas(flatPoints, 2)).to.eql(encodedFlatPoints);
    });
  });

  describe('decodeDeltas', function() {
    it('returns expected value', function() {
      var decodeDeltas = ol.parser.polyline.decodeDeltas;

      expect(decodeDeltas(encodedFlatPoints, 2)).to.eql(flatPoints);
    });
  });



  describe('encodeFloats', function() {
    it('returns expected value', function() {
      var encodeFloats = ol.parser.polyline.encodeFloats;

      expect(encodeFloats(smallFloats)).to.eql(encodedFloats);

      resetTestingData();
      expect(encodeFloats(smallFloats, 1e5)).to.eql(encodedFloats);

      expect(encodeFloats(floats, 1e2)).to.eql(encodedFloats);
    });
  });

  describe('decodeFloats', function() {
    it('returns expected value', function() {
      var decodeFloats = ol.parser.polyline.decodeFloats;

      expect(decodeFloats(encodedFloats)).to.eql(smallFloats);
      expect(decodeFloats(encodedFloats, 1e5)).to.eql(smallFloats);
      expect(decodeFloats(encodedFloats, 1e2)).to.eql(floats);
    });
  });



  describe('encodeSignedIntegers', function() {
    it('returns expected value', function() {
      var encodeSignedIntegers = ol.parser.polyline.encodeSignedIntegers;

      expect(encodeSignedIntegers(
          signedIntegers)).to.eql(encodedSignedIntegers);
    });
  });

  describe('decodeSignedIntegers', function() {
    it('returns expected value', function() {
      var decodeSignedIntegers = ol.parser.polyline.decodeSignedIntegers;

      expect(decodeSignedIntegers(
          encodedSignedIntegers)).to.eql(signedIntegers);
    });
  });



  describe('encodeUnsignedIntegers', function() {
    it('returns expected value', function() {
      var encodeUnsignedIntegers = ol.parser.polyline.encodeUnsignedIntegers;

      expect(encodeUnsignedIntegers(
          unsignedIntegers)).to.eql(encodedUnsignedIntegers);
    });
  });

  describe('decodeUnsignedIntegers', function() {
    it('returns expected value', function() {
      var decodeUnsignedIntegers = ol.parser.polyline.decodeUnsignedIntegers;

      expect(decodeUnsignedIntegers(
          encodedUnsignedIntegers)).to.eql(unsignedIntegers);
    });
  });



  describe('encodeFloat', function() {
    it('returns expected value', function() {
      var encodeFloat = ol.parser.polyline.encodeFloat;

      expect(encodeFloat(0.00000)).to.eql('?');
      expect(encodeFloat(-0.00001)).to.eql('@');
      expect(encodeFloat(0.00001)).to.eql('A');
      expect(encodeFloat(-0.00002)).to.eql('B');
      expect(encodeFloat(0.00002)).to.eql('C');
      expect(encodeFloat(0.00015)).to.eql(']');
      expect(encodeFloat(-0.00016)).to.eql('^');

      expect(encodeFloat(-0.1, 10)).to.eql('@');
      expect(encodeFloat(0.1, 10)).to.eql('A');

      expect(encodeFloat(16 * 32 / 1e5)).to.eql('__@');
      expect(encodeFloat(16 * 32 * 32 / 1e5)).to.eql('___@');

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeFloat(-179.9832104)).to.eql('`~oia@');
    });
  });

  describe('decodeFloat', function() {
    it('returns expected value', function() {
      var decodeFloat = ol.parser.polyline.decodeFloat;

      expect(decodeFloat('?')).to.eql(0.00000);
      expect(decodeFloat('@')).to.eql(-0.00001);
      expect(decodeFloat('A')).to.eql(0.00001);
      expect(decodeFloat('B')).to.eql(-0.00002);
      expect(decodeFloat('C')).to.eql(0.00002);
      expect(decodeFloat(']')).to.eql(0.00015);
      expect(decodeFloat('^')).to.eql(-0.00016);

      expect(decodeFloat('@', 10)).to.eql(-0.1);
      expect(decodeFloat('A', 10)).to.eql(0.1);

      expect(decodeFloat('__@')).to.eql(16 * 32 / 1e5);
      expect(decodeFloat('___@')).to.eql(16 * 32 * 32 / 1e5);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeFloat('`~oia@')).to.eql(-179.98321);
    });
  });



  describe('encodeSignedInteger', function() {
    it('returns expected value', function() {
      var encodeSignedInteger = ol.parser.polyline.encodeSignedInteger;

      expect(encodeSignedInteger(0)).to.eql('?');
      expect(encodeSignedInteger(-1)).to.eql('@');
      expect(encodeSignedInteger(1)).to.eql('A');
      expect(encodeSignedInteger(-2)).to.eql('B');
      expect(encodeSignedInteger(2)).to.eql('C');
      expect(encodeSignedInteger(15)).to.eql(']');
      expect(encodeSignedInteger(-16)).to.eql('^');

      expect(encodeSignedInteger(16)).to.eql('_@');
      expect(encodeSignedInteger(16 * 32)).to.eql('__@');
      expect(encodeSignedInteger(16 * 32 * 32)).to.eql('___@');
    });
  });

  describe('decodeSignedInteger', function() {
    it('returns expected value', function() {
      var decodeSignedInteger = ol.parser.polyline.decodeSignedInteger;

      expect(decodeSignedInteger('?')).to.eql(0);
      expect(decodeSignedInteger('@')).to.eql(-1);
      expect(decodeSignedInteger('A')).to.eql(1);
      expect(decodeSignedInteger('B')).to.eql(-2);
      expect(decodeSignedInteger('C')).to.eql(2);
      expect(decodeSignedInteger(']')).to.eql(15);
      expect(decodeSignedInteger('^')).to.eql(-16);

      expect(decodeSignedInteger('_@')).to.eql(16);
      expect(decodeSignedInteger('__@')).to.eql(16 * 32);
      expect(decodeSignedInteger('___@')).to.eql(16 * 32 * 32);
    });
  });



  describe('encodeUnsignedInteger', function() {
    it('returns expected value', function() {
      var encodeUnsignedInteger = ol.parser.polyline.encodeUnsignedInteger;

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
      var decodeUnsignedInteger = ol.parser.polyline.decodeUnsignedInteger;

      expect(decodeUnsignedInteger('?')).to.eql(0);
      expect(decodeUnsignedInteger('@')).to.eql(1);
      expect(decodeUnsignedInteger('A')).to.eql(2);
      expect(decodeUnsignedInteger(']')).to.eql(30);
      expect(decodeUnsignedInteger('^')).to.eql(31);
      expect(decodeUnsignedInteger('_@')).to.eql(32);

      expect(decodeUnsignedInteger('__@')).to.eql(32 * 32);
      expect(decodeUnsignedInteger('__D')).to.eql(5 * 32 * 32);
      expect(decodeUnsignedInteger('___@')).to.eql(32 * 32 * 32);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeUnsignedInteger('mD')).to.eql(174);
    });
  });
});

goog.require('ol.parser.polyline');
