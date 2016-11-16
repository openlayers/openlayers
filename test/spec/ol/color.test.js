goog.provide('ol.test.color');

goog.require('ol.color');


describe('ol.color', function() {

  describe('ol.color.asArray()', function() {

    it('returns the same for an array', function() {
      var color = [1, 2, 3, 0.4];
      var got = ol.color.asArray(color);
      expect(got).to.be(color);
    });

    it('returns an array given an rgba string', function() {
      var color = ol.color.asArray('rgba(1,2,3,0.4)');
      expect(color).to.eql([1, 2, 3, 0.4]);
    });

    it('returns an array given an rgb string', function() {
      var color = ol.color.asArray('rgb(1,2,3)');
      expect(color).to.eql([1, 2, 3, 1]);
    });

    it('returns an array given a hex string', function() {
      var color = ol.color.asArray('#00ccff');
      expect(color).to.eql([0, 204, 255, 1]);
    });

  });

  describe('ol.color.asString()', function() {

    it('returns the same for a string', function() {
      var color = 'rgba(0,1,2,0.3)';
      var got = ol.color.asString(color);
      expect(got).to.be(color);
    });

    it('returns a string given an rgba array', function() {
      var color = ol.color.asString([1, 2, 3, 0.4]);
      expect(color).to.eql('rgba(1,2,3,0.4)');
    });

    it('returns a string given an rgb array', function() {
      var color = ol.color.asString([1, 2, 3]);
      expect(color).to.eql('rgba(1,2,3,1)');
    });

  });

  describe('ol.color.fromString', function() {

    before(function() {
      sinon.spy(ol.color, 'fromStringInternal_');
    });

    after(function() {
      ol.color.fromStringInternal_.restore();
    });

    if (ol.ENABLE_NAMED_COLORS) {
      it('can parse named colors', function() {
        expect(ol.color.fromString('red')).to.eql([255, 0, 0, 1]);
      });
    }

    it('can parse 3-digit hex colors', function() {
      expect(ol.color.fromString('#087')).to.eql([0, 136, 119, 1]);
    });

    it('can parse 6-digit hex colors', function() {
      expect(ol.color.fromString('#56789a')).to.eql([86, 120, 154, 1]);
    });

    it('can parse rgb colors', function() {
      expect(ol.color.fromString('rgb(0, 0, 255)')).to.eql([0, 0, 255, 1]);
    });

    it('can parse rgba colors', function() {
      expect(ol.color.fromString('rgba(255, 255, 0, 0.1)')).to.eql(
          [255, 255, 0, 0.1]);
    });

    it('caches parsed values', function() {
      var count = ol.color.fromStringInternal_.callCount;
      ol.color.fromString('aquamarine');
      expect(ol.color.fromStringInternal_.callCount).to.be(count + 1);
      ol.color.fromString('aquamarine');
      expect(ol.color.fromStringInternal_.callCount).to.be(count + 1);
    });

    it('throws an error on invalid colors', function() {
      var invalidColors = ['tuesday', '#1234567', 'rgb(255.0,0,0)'];
      var i, ii;
      for (i = 0, ii < invalidColors.length; i < ii; ++i) {
        expect(function() {
          ol.color.fromString(invalidColors[i]);
        }).to.throwException();
      }
    });

  });

  describe('ol.color.isValid', function() {

    it('identifies valid colors', function() {
      expect(ol.color.isValid([0, 0, 0, 0])).to.be(true);
      expect(ol.color.isValid([255, 255, 255, 1])).to.be(true);
    });

    it('identifies out-of-range channels', function() {
      expect(ol.color.isValid([-1, 0, 0, 0])).to.be(false);
      expect(ol.color.isValid([256, 0, 0, 0])).to.be(false);
      expect(ol.color.isValid([0, -1, 0, 0])).to.be(false);
      expect(ol.color.isValid([0, 256, 0, 0])).to.be(false);
      expect(ol.color.isValid([0, 0, -1, 0])).to.be(false);
      expect(ol.color.isValid([0, 0, 256, 0])).to.be(false);
      expect(ol.color.isValid([0, 0, -1, 0])).to.be(false);
      expect(ol.color.isValid([0, 0, 256, 0])).to.be(false);
      expect(ol.color.isValid([0, 0, 0, -1])).to.be(false);
      expect(ol.color.isValid([0, 0, 0, 2])).to.be(false);
    });

  });

  describe('ol.color.normalize', function() {

    it('clamps out-of-range channels', function() {
      expect(ol.color.normalize([-1, 256, 0, 2])).to.eql([0, 255, 0, 1]);
    });

    it('rounds color channels to integers', function() {
      expect(ol.color.normalize([1.2, 2.5, 3.7, 1])).to.eql([1, 3, 4, 1]);
    });

  });

  describe('ol.color.toString', function() {

    it('converts valid colors', function() {
      expect(ol.color.toString([1, 2, 3, 0.4])).to.be('rgba(1,2,3,0.4)');
    });

    it('rounds to integers if needed', function() {
      expect(ol.color.toString([1.2, 2.5, 3.7, 0.4])).to.be('rgba(1,3,4,0.4)');
    });

    it('sets default alpha value if undefined', function() {
      expect(ol.color.toString([0, 0, 0])).to.be('rgba(0,0,0,1)');
    });

  });
});
