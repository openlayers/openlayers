goog.provide('ol.test.parser.polyline');

describe('ol.parser.polyline', function() {

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
    });
  });
});

goog.require('ol.parser.polyline');
