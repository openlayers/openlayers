goog.provide('ol.test.parser.polyline');

describe('ol.parser.polyline', function() {

  var flat_points = [38.50000, -120.20000,
                     40.70000, -120.95000,
                     43.25200, -126.45300];

  describe('encodeFlatCoordinates', function() {
    it('returns expected value', function() {
      var encodeFlatCoordinates = ol.parser.polyline.encodeFlatCoordinates;

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeFlatCoordinates(
          flat_points)).toEqual('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    });
  });

  describe('decodeFlatCoordinates', function() {
    it('returns expected value', function() {
      var decodeFlatCoordinates = ol.parser.polyline.decodeFlatCoordinates;

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeFlatCoordinates(
          '_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual(flat_points);
    });
  });


  describe('encodeDeltas', function() {
    it('returns expected value', function() {
      var encodeDeltas = ol.parser.polyline.encodeDeltas;

      expect(encodeDeltas(
          flat_points.slice(), 2)).toEqual('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    });
  });

  describe('decodeDeltas', function() {
    it('returns expected value', function() {
      var decodeDeltas = ol.parser.polyline.decodeDeltas;

      expect(decodeDeltas(
          '_p~iF~ps|U_ulLnnqC_mqNvxq`@', 2)).toEqual(flat_points);
    });
  });


  var floats = [0.00, 0.15, -0.01, -0.16, 0.16, 0.01];
  var smallFloats = [0.00000, 0.00015, -0.00001, -0.00016, 0.00016, 0.00001];
  var encodedFloats = '?]@^_@A';

  describe('encodeFloats', function() {
    it('returns expected value', function() {
      var encodeFloats = ol.parser.polyline.encodeFloats;

      expect(encodeFloats(smallFloats.slice())).toEqual(encodedFloats);
      expect(encodeFloats(smallFloats.slice(), 1e5)).toEqual(encodedFloats);
      expect(encodeFloats(floats.slice(), 1e2)).toEqual(encodedFloats);
    });
  });

  describe('decodeFloats', function() {
    it('returns expected value', function() {
      var decodeFloats = ol.parser.polyline.decodeFloats;

      expect(decodeFloats(encodedFloats)).toEqual(smallFloats);
      expect(decodeFloats(encodedFloats, 1e5)).toEqual(smallFloats);
      expect(decodeFloats(encodedFloats, 1e2)).toEqual(floats);
    });
  });


  var signedIntegers = [0, 15, -1, -16, 16, 1];
  var encodedSignedIntegers = '?]@^_@A';

  describe('encodeSignedIntegers', function() {
    it('returns expected value', function() {
      var encodeSignedIntegers = ol.parser.polyline.encodeSignedIntegers;

      expect(encodeSignedIntegers(
          signedIntegers.slice())).toEqual(encodedSignedIntegers);
    });
  });

  describe('decodeSignedIntegers', function() {
    it('returns expected value', function() {
      var decodeSignedIntegers = ol.parser.polyline.decodeSignedIntegers;

      expect(decodeSignedIntegers(
          encodedSignedIntegers)).toEqual(signedIntegers);
    });
  });


  var unsignedIntegers = [0, 30, 1, 31, 32, 2, 174];
  var encodedUnsignedIntegers = '?]@^_@AmD';

  describe('encodeUnsignedIntegers', function() {
    it('returns expected value', function() {
      var encodeUnsignedIntegers = ol.parser.polyline.encodeUnsignedIntegers;

      expect(encodeUnsignedIntegers(
          unsignedIntegers)).toEqual(encodedUnsignedIntegers);
    });
  });

  describe('decodeUnsignedIntegers', function() {
    it('returns expected value', function() {
      var decodeUnsignedIntegers = ol.parser.polyline.decodeUnsignedIntegers;

      expect(decodeUnsignedIntegers(
          encodedUnsignedIntegers)).toEqual(unsignedIntegers);
    });
  });


  describe('encodeFloat', function() {
    it('returns expected value', function() {
      var encodeFloat = ol.parser.polyline.encodeFloat;

      expect(encodeFloat(0.00000)).toEqual('?');
      expect(encodeFloat(-0.00001)).toEqual('@');
      expect(encodeFloat(0.00001)).toEqual('A');
      expect(encodeFloat(-0.00002)).toEqual('B');
      expect(encodeFloat(0.00002)).toEqual('C');
      expect(encodeFloat(0.00015)).toEqual(']');
      expect(encodeFloat(-0.00016)).toEqual('^');

      expect(encodeFloat(-0.1, 10)).toEqual('@');
      expect(encodeFloat(0.1, 10)).toEqual('A');

      expect(encodeFloat(16 * 32 / 1e5)).toEqual('__@');
      expect(encodeFloat(16 * 32 * 32 / 1e5)).toEqual('___@');

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeFloat(-179.9832104)).toEqual('`~oia@');
    });
  });

  describe('decodeFloat', function() {
    it('returns expected value', function() {
      var decodeFloat = ol.parser.polyline.decodeFloat;

      expect(decodeFloat('?')).toEqual(0.00000);
      expect(decodeFloat('@')).toEqual(-0.00001);
      expect(decodeFloat('A')).toEqual(0.00001);
      expect(decodeFloat('B')).toEqual(-0.00002);
      expect(decodeFloat('C')).toEqual(0.00002);
      expect(decodeFloat(']')).toEqual(0.00015);
      expect(decodeFloat('^')).toEqual(-0.00016);

      expect(decodeFloat('@', 10)).toEqual(-0.1);
      expect(decodeFloat('A', 10)).toEqual(0.1);

      expect(decodeFloat('__@')).toEqual(16 * 32 / 1e5);
      expect(decodeFloat('___@')).toEqual(16 * 32 * 32 / 1e5);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeFloat('`~oia@')).toEqual(-179.98321);
    });
  });

  describe('encodeSignedInteger', function() {
    it('returns expected value', function() {
      var encodeSignedInteger = ol.parser.polyline.encodeSignedInteger;

      expect(encodeSignedInteger(0)).toEqual('?');
      expect(encodeSignedInteger(-1)).toEqual('@');
      expect(encodeSignedInteger(1)).toEqual('A');
      expect(encodeSignedInteger(-2)).toEqual('B');
      expect(encodeSignedInteger(2)).toEqual('C');
      expect(encodeSignedInteger(15)).toEqual(']');
      expect(encodeSignedInteger(-16)).toEqual('^');

      expect(encodeSignedInteger(16)).toEqual('_@');
      expect(encodeSignedInteger(16 * 32)).toEqual('__@');
      expect(encodeSignedInteger(16 * 32 * 32)).toEqual('___@');
    });
  });

  describe('decodeSignedInteger', function() {
    it('returns expected value', function() {
      var decodeSignedInteger = ol.parser.polyline.decodeSignedInteger;

      expect(decodeSignedInteger('?')).toEqual(0);
      expect(decodeSignedInteger('@')).toEqual(-1);
      expect(decodeSignedInteger('A')).toEqual(1);
      expect(decodeSignedInteger('B')).toEqual(-2);
      expect(decodeSignedInteger('C')).toEqual(2);
      expect(decodeSignedInteger(']')).toEqual(15);
      expect(decodeSignedInteger('^')).toEqual(-16);

      expect(decodeSignedInteger('_@')).toEqual(16);
      expect(decodeSignedInteger('__@')).toEqual(16 * 32);
      expect(decodeSignedInteger('___@')).toEqual(16 * 32 * 32);
    });
  });

  describe('encodeUnsignedInteger', function() {
    it('returns expected value', function() {
      var encodeUnsignedInteger = ol.parser.polyline.encodeUnsignedInteger;

      expect(encodeUnsignedInteger(0)).toEqual('?');
      expect(encodeUnsignedInteger(1)).toEqual('@');
      expect(encodeUnsignedInteger(2)).toEqual('A');
      expect(encodeUnsignedInteger(30)).toEqual(']');
      expect(encodeUnsignedInteger(31)).toEqual('^');
      expect(encodeUnsignedInteger(32)).toEqual('_@');

      expect(encodeUnsignedInteger(32 * 32)).toEqual('__@');
      expect(encodeUnsignedInteger(5 * 32 * 32)).toEqual('__D');
      expect(encodeUnsignedInteger(32 * 32 * 32)).toEqual('___@');

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(encodeUnsignedInteger(174)).toEqual('mD');
    });
  });

  describe('decodeUnsignedInteger', function() {
    it('returns expected value', function() {
      var decodeUnsignedInteger = ol.parser.polyline.decodeUnsignedInteger;

      expect(decodeUnsignedInteger('?')).toEqual(0);
      expect(decodeUnsignedInteger('@')).toEqual(1);
      expect(decodeUnsignedInteger('A')).toEqual(2);
      expect(decodeUnsignedInteger(']')).toEqual(30);
      expect(decodeUnsignedInteger('^')).toEqual(31);
      expect(decodeUnsignedInteger('_@')).toEqual(32);

      expect(decodeUnsignedInteger('__@')).toEqual(32 * 32);
      expect(decodeUnsignedInteger('__D')).toEqual(5 * 32 * 32);
      expect(decodeUnsignedInteger('___@')).toEqual(32 * 32 * 32);

      // from the "Encoded Polyline Algorithm Format" page at Google
      expect(decodeUnsignedInteger('mD')).toEqual(174);
    });
  });
});

goog.require('ol.parser.polyline');
