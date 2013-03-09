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
});

goog.require('ol.parser.polyline');
