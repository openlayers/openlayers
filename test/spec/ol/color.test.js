

import _ol_color_ from '../../../src/ol/color';
import _ol_ from '../../../src/ol';


describe('ol.color', function() {

  describe('ol.color.asArray()', function() {

    it('returns the same for an array', function() {
      var color = [1, 2, 3, 0.4];
      var got = _ol_color_.asArray(color);
      expect(got).to.be(color);
    });

    it('returns an array given an rgba string', function() {
      var color = _ol_color_.asArray('rgba(1,2,3,0.4)');
      expect(color).to.eql([1, 2, 3, 0.4]);
    });

    it('returns an array given an rgb string', function() {
      var color = _ol_color_.asArray('rgb(1,2,3)');
      expect(color).to.eql([1, 2, 3, 1]);
    });

    it('returns an array given a hex string', function() {
      var color = _ol_color_.asArray('#00ccff');
      expect(color).to.eql([0, 204, 255, 1]);
    });

  });

  describe('ol.color.asString()', function() {

    it('returns the same for a string', function() {
      var color = 'rgba(0,1,2,0.3)';
      var got = _ol_color_.asString(color);
      expect(got).to.be(color);
    });

    it('returns a string given an rgba array', function() {
      var color = _ol_color_.asString([1, 2, 3, 0.4]);
      expect(color).to.eql('rgba(1,2,3,0.4)');
    });

    it('returns a string given an rgb array', function() {
      var color = _ol_color_.asString([1, 2, 3]);
      expect(color).to.eql('rgba(1,2,3,1)');
    });

  });

  describe('ol.color.fromString', function() {

    before(function() {
      sinon.spy(_ol_color_, 'fromStringInternal_');
    });

    after(function() {
      var spy = _ol_color_.fromStringInternal_;
      spy.restore();
    });

    if (_ol_.ENABLE_NAMED_COLORS) {
      it('can parse named colors', function() {
        expect(_ol_color_.fromString('red')).to.eql([255, 0, 0, 1]);
      });
    }

    it('can parse 3-digit hex colors', function() {
      expect(_ol_color_.fromString('#087')).to.eql([0, 136, 119, 1]);
    });

    it('can parse 6-digit hex colors', function() {
      expect(_ol_color_.fromString('#56789a')).to.eql([86, 120, 154, 1]);
    });

    it('can parse rgb colors', function() {
      expect(_ol_color_.fromString('rgb(0, 0, 255)')).to.eql([0, 0, 255, 1]);
    });

    it('ignores whitespace before, between & after numbers (rgb)', function() {
      expect(_ol_color_.fromString('rgb( \t 0  ,   0 \n , 255  )')).to.eql(
          [0, 0, 255, 1]);
    });

    it('can parse rgba colors', function() {
      // opacity 0
      expect(_ol_color_.fromString('rgba(255, 255, 0, 0)')).to.eql(
          [255, 255, 0, 0]);
      // opacity 0.0 (simple float)
      expect(_ol_color_.fromString('rgba(255, 255, 0, 0.0)')).to.eql(
          [255, 255, 0, 0]);
      // opacity 0.0000000000000000 (float with 16 digits)
      expect(_ol_color_.fromString('rgba(255, 255, 0, 0.0000000000000000)')).to.eql(
          [255, 255, 0, 0]);
      // opacity 0.1 (simple float)
      expect(_ol_color_.fromString('rgba(255, 255, 0, 0.1)')).to.eql(
          [255, 255, 0, 0.1]);
      // opacity 0.1111111111111111 (float with 16 digits)
      expect(_ol_color_.fromString('rgba(255, 255, 0, 0.1111111111111111)')).to.eql(
          [255, 255, 0, 0.1111111111111111]);
      // opacity 1
      expect(_ol_color_.fromString('rgba(255, 255, 0, 1)')).to.eql(
          [255, 255, 0, 1]);
      // opacity 1.0
      expect(_ol_color_.fromString('rgba(255, 255, 0, 1.0)')).to.eql(
          [255, 255, 0, 1]);
      // opacity 1.0000000000000000
      expect(_ol_color_.fromString('rgba(255, 255, 0, 1.0000000000000000)')).to.eql(
          [255, 255, 0, 1]);
      // with 30 decimal digits
      expect(_ol_color_.fromString('rgba(255, 255, 0, 0.123456789012345678901234567890)')).to.eql(
          [255, 255, 0, 0.123456789012345678901234567890]);
    });

    it('ignores whitespace before, between & after numbers (rgba)', function() {
      expect(_ol_color_.fromString('rgba( \t 0  ,   0 \n ,   255  ,   0.4711   )')).to.eql(
          [0, 0, 255, 0.4711]);
    });

    it('caches parsed values', function() {
      var spy = _ol_color_.fromStringInternal_;
      var count = spy.callCount;
      _ol_color_.fromString('aquamarine');
      expect(spy.callCount).to.be(count + 1);
      _ol_color_.fromString('aquamarine');
      expect(spy.callCount).to.be(count + 1);
    });

    it('throws an error on invalid colors', function() {
      var invalidColors = ['tuesday', '#1234567', 'rgb(255.0,0,0)'];
      var i, ii;
      for (i = 0, ii < invalidColors.length; i < ii; ++i) {
        expect(function() {
          _ol_color_.fromString(invalidColors[i]);
        }).to.throwException();
      }
    });

  });

  describe('ol.color.normalize', function() {

    it('clamps out-of-range channels', function() {
      expect(_ol_color_.normalize([-1, 256, 0, 2])).to.eql([0, 255, 0, 1]);
    });

    it('rounds color channels to integers', function() {
      expect(_ol_color_.normalize([1.2, 2.5, 3.7, 1])).to.eql([1, 3, 4, 1]);
    });

  });

  describe('ol.color.toString', function() {

    it('converts valid colors', function() {
      expect(_ol_color_.toString([1, 2, 3, 0.4])).to.be('rgba(1,2,3,0.4)');
    });

    it('rounds to integers if needed', function() {
      expect(_ol_color_.toString([1.2, 2.5, 3.7, 0.4])).to.be('rgba(1,3,4,0.4)');
    });

    it('sets default alpha value if undefined', function() {
      expect(_ol_color_.toString([0, 0, 0])).to.be('rgba(0,0,0,1)');
    });

  });
});
