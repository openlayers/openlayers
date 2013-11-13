goog.provide('ol.test.color');


describe('ol.color', function() {

  describe('ol.color.fromString', function() {

    before(function() {
      sinon.spy(ol.color, 'fromStringInternal_');
    });

    after(function() {
      ol.color.fromStringInternal_.restore();
    });

    it('can parse named colors', function() {
      expect(ol.color.fromString('red')).to.eql([255, 0, 0, 1]);
    });

    it('can parse hex colors', function() {
      expect(ol.color.fromString('#00ff0080')).to.eql([0, 255, 0, 128 / 255]);
    });

    it('can parse rgb colors', function() {
      expect(ol.color.fromString('rgb(0, 0, 255)')).to.eql([0, 0, 255, 1]);
    });

    it('can parse rgba colors', function() {
      expect(ol.color.fromString('rgba(255, 255, 0, 0.1)')).to.eql(
          [255, 255, 0, 25 / 255]);
    });

    it('caches parsed values', function() {
      var count = ol.color.fromStringInternal_.callCount;
      ol.color.fromString('aquamarine');
      expect(ol.color.fromStringInternal_.callCount).to.be(count + 1);
      ol.color.fromString('aquamarine');
      expect(ol.color.fromStringInternal_.callCount).to.be(count + 1);
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

  });
});


goog.require('ol.color');
