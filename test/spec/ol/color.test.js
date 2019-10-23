import {
  asArray,
  asString,
  fromString,
  isStringColor,
  normalize,
  toString
} from '../../../src/ol/color.js';

describe('ol.color', function() {

  describe('asArray()', function() {

    it('returns the same for an array', function() {
      const color = [1, 2, 3, 0.4];
      const got = asArray(color);
      expect(got).to.be(color);
    });

    it('returns an array given an rgba string', function() {
      const color = asArray('rgba(1,2,3,0.4)');
      expect(color).to.eql([1, 2, 3, 0.4]);
    });

    it('returns an array given an rgb string', function() {
      const color = asArray('rgb(1,2,3)');
      expect(color).to.eql([1, 2, 3, 1]);
    });

    it('returns an array given a hex string', function() {
      const color = asArray('#00ccff');
      expect(color).to.eql([0, 204, 255, 1]);
    });

    it('returns an array given a hex string with alpha', function() {
      const color = asArray('#00ccffb0');
      expect(color).to.eql([0, 204, 255, 176 / 255]);
    });

  });

  describe('asString()', function() {

    it('returns the same for a string', function() {
      const color = 'rgba(0,1,2,0.3)';
      const got = asString(color);
      expect(got).to.be(color);
    });

    it('returns a string given an rgba array', function() {
      const color = asString([1, 2, 3, 0.4]);
      expect(color).to.eql('rgba(1,2,3,0.4)');
    });

    it('returns a string given an rgb array', function() {
      const color = asString([1, 2, 3]);
      expect(color).to.eql('rgba(1,2,3,1)');
    });

  });

  describe('fromString()', function() {

    it('can parse 3-digit hex colors', function() {
      expect(fromString('#087')).to.eql([0, 136, 119, 1]);
    });

    it('can parse 4-digit hex colors', function() {
      expect(fromString('#0876')).to.eql([0, 136, 119, 102 / 255]);
    });

    it('can parse 6-digit hex colors', function() {
      expect(fromString('#56789a')).to.eql([86, 120, 154, 1]);
    });

    it('can parse 8-digit hex colors', function() {
      expect(fromString('#56789acc')).to.eql([86, 120, 154, 204 / 255]);
    });

    it('can parse rgb colors', function() {
      expect(fromString('rgb(0, 0, 255)')).to.eql([0, 0, 255, 1]);
    });

    it('ignores whitespace before, between & after numbers (rgb)', function() {
      expect(fromString('rgb( \t 0  ,   0 \n , 255  )')).to.eql(
        [0, 0, 255, 1]);
    });

    it('can parse rgba colors', function() {
      // opacity 0
      expect(fromString('rgba(255, 255, 0, 0)')).to.eql(
        [255, 255, 0, 0]);
      // opacity 0.0 (simple float)
      expect(fromString('rgba(255, 255, 0, 0.0)')).to.eql(
        [255, 255, 0, 0]);
      // opacity 0.0000000000000000 (float with 16 digits)
      expect(fromString('rgba(255, 255, 0, 0.0000000000000000)')).to.eql(
        [255, 255, 0, 0]);
      // opacity 0.1 (simple float)
      expect(fromString('rgba(255, 255, 0, 0.1)')).to.eql(
        [255, 255, 0, 0.1]);
      // opacity 0.1111111111111111 (float with 16 digits)
      expect(fromString('rgba(255, 255, 0, 0.1111111111111111)')).to.eql(
        [255, 255, 0, 0.1111111111111111]);
      // opacity 1
      expect(fromString('rgba(255, 255, 0, 1)')).to.eql(
        [255, 255, 0, 1]);
      // opacity 1.0
      expect(fromString('rgba(255, 255, 0, 1.0)')).to.eql(
        [255, 255, 0, 1]);
      // opacity 1.0000000000000000
      expect(fromString('rgba(255, 255, 0, 1.0000000000000000)')).to.eql(
        [255, 255, 0, 1]);
      // with 30 decimal digits
      expect(fromString('rgba(255, 255, 0, 0.123456789012345678901234567890)')).to.eql(
        [255, 255, 0, 0.123456789012345678901234567890]);
    });

    it('ignores whitespace before, between & after numbers (rgba)', function() {
      expect(fromString('rgba( \t 0  ,   0 \n ,   255  ,   0.4711   )')).to.eql(
        [0, 0, 255, 0.4711]);
    });

    it('throws an error on invalid colors', function() {
      const invalidColors = ['tuesday', '#12345', '#1234567'];
      let i, ii;
      for (i = 0, ii = invalidColors.length; i < ii; ++i) {
        expect(function() {
          fromString(invalidColors[i]);
        }).to.throwException();
      }
    });

  });

  describe('normalize()', function() {

    it('clamps out-of-range channels', function() {
      expect(normalize([-1, 256, 0, 2])).to.eql([0, 255, 0, 1]);
    });

    it('rounds color channels to integers', function() {
      expect(normalize([1.2, 2.5, 3.7, 1])).to.eql([1, 3, 4, 1]);
    });

  });

  describe('toString()', function() {

    it('converts valid colors', function() {
      expect(toString([1, 2, 3, 0.4])).to.be('rgba(1,2,3,0.4)');
    });

    it('rounds to integers if needed', function() {
      expect(toString([1.2, 2.5, 3.7, 0.4])).to.be('rgba(1,3,4,0.4)');
    });

    it('sets default alpha value if undefined', function() {
      expect(toString([0, 0, 0])).to.be('rgba(0,0,0,1)');
    });

  });

  describe('isValid()', function() {

    it('correctly detects valid colors', function() {
      expect(isStringColor('rgba(1,3,4,0.4)')).to.be(true);
      expect(isStringColor('rgb(1,3,4)')).to.be(true);
      expect(isStringColor('lightgreen')).to.be(true);
      expect(isStringColor('yellow')).to.be(true);
      expect(isStringColor('GREEN')).to.be(true);
      expect(isStringColor('notacolor')).to.be(false);
      expect(isStringColor('red_')).to.be(false);
    });

  });
});
