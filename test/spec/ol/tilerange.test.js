goog.provide('ol.test.TileRange');

goog.require('ol.TileRange');


describe('ol.TileRange', function() {

  describe('constructor', function() {
    it('creates a range', function() {
      var range = new ol.TileRange(1, 3, 2, 4);
      expect(range).to.be.a(ol.TileRange);
    });

    it('can represent a range of one tile', function() {
      var range = new ol.TileRange(2, 2, 3, 3);
      expect(range).to.be.a(ol.TileRange);
      expect(range.getHeight()).to.be(1);
      expect(range.getWidth()).to.be(1);
    });
  });

  describe('contains', function() {
    it('returns the expected value', function() {
      var tileRange = new ol.TileRange(1, 3, 1, 3);
      expect(tileRange.contains([0, 0, 0])).to.not.be();
      expect(tileRange.contains([0, 0, 1])).to.not.be();
      expect(tileRange.contains([0, 0, 2])).to.not.be();
      expect(tileRange.contains([0, 0, 3])).to.not.be();
      expect(tileRange.contains([0, 0, 4])).to.not.be();
      expect(tileRange.contains([0, 1, 0])).to.not.be();
      expect(tileRange.contains([0, 1, 1])).to.be.ok();
      expect(tileRange.contains([0, 1, 2])).to.be.ok();
      expect(tileRange.contains([0, 1, 3])).to.be.ok();
      expect(tileRange.contains([0, 1, 4])).to.not.be();
      expect(tileRange.contains([0, 2, 0])).to.not.be();
      expect(tileRange.contains([0, 2, 1])).to.be.ok();
      expect(tileRange.contains([0, 2, 2])).to.be.ok();
      expect(tileRange.contains([0, 2, 3])).to.be.ok();
      expect(tileRange.contains([0, 2, 4])).to.not.be();
      expect(tileRange.contains([0, 3, 0])).to.not.be();
      expect(tileRange.contains([0, 3, 1])).to.be.ok();
      expect(tileRange.contains([0, 3, 2])).to.be.ok();
      expect(tileRange.contains([0, 3, 3])).to.be.ok();
      expect(tileRange.contains([0, 3, 4])).to.not.be();
      expect(tileRange.contains([0, 4, 0])).to.not.be();
      expect(tileRange.contains([0, 4, 1])).to.not.be();
      expect(tileRange.contains([0, 4, 2])).to.not.be();
      expect(tileRange.contains([0, 4, 3])).to.not.be();
      expect(tileRange.contains([0, 4, 4])).to.not.be();
    });
  });

  describe('boundingTileRange', function() {
    it('returns the expected TileRange', function() {
      var tileRange = new ol.TileRange.boundingTileRange(
          [3, 1, 3], [3, 2, 0]);
      expect(tileRange.minX).to.eql(1);
      expect(tileRange.maxX).to.eql(2);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxY).to.eql(3);
    });

    describe('with mixed z', function() {
      it('returns the expected TileRange', function() {
        expect(function() {
          return new ol.TileRange.boundingTileRange([3, 1, 3], [4, 2, 0]);
        }).to.throwException();
      });
    });
  });

  describe('equals', function() {
    it('determines equivalence of two ranges', function() {
      var one = new ol.TileRange(0, 2, 1, 4);
      var same = new ol.TileRange(0, 2, 1, 4);
      var diff1 = new ol.TileRange(0, 2, 1, 5);
      var diff2 = new ol.TileRange(0, 3, 1, 4);
      var diff3 = new ol.TileRange(0, 2, 2, 4);
      var diff4 = new ol.TileRange(1, 2, 1, 4);
      expect(one.equals(same)).to.be(true);
      expect(one.equals(diff1)).to.be(false);
      expect(one.equals(diff2)).to.be(false);
      expect(one.equals(diff3)).to.be(false);
      expect(one.equals(diff4)).to.be(false);
    });
  });

  describe('extent', function() {
    it('modifies range so it includes another', function() {
      var one = new ol.TileRange(0, 2, 1, 4);
      var other = new ol.TileRange(-1, -3, 10, 12);
      one.extend(other);

      expect(one.minX).to.be(-1);
      expect(one.maxX).to.be(2);
      expect(one.minY).to.be(1);
      expect(one.maxY).to.be(12);

    });
  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var tileRange = new ol.TileRange(0, 2, 1, 4);
      var size = tileRange.getSize();
      expect(size).to.eql([3, 4]);
    });
  });

  describe('intersects', function() {
    it('determines if two ranges overlap', function() {
      var one = new ol.TileRange(0, 2, 1, 4);
      var overlapsRight = new ol.TileRange(2, 4, 1, 4);
      var overlapsLeft = new ol.TileRange(-3, 0, 1, 4);
      var overlapsTop = new ol.TileRange(0, 2, 4, 5);
      var overlapsBottom = new ol.TileRange(0, 2, -3, 1);
      expect(one.intersects(overlapsLeft)).to.be(true);
      expect(one.intersects(overlapsRight)).to.be(true);
      expect(one.intersects(overlapsTop)).to.be(true);
      expect(one.intersects(overlapsBottom)).to.be(true);

      var right = new ol.TileRange(3, 5, 1, 4);
      var left = new ol.TileRange(-3, -1, 1, 4);
      var above = new ol.TileRange(0, 2, 5, 6);
      var below = new ol.TileRange(0, 2, -3, 0);
      expect(one.intersects(right)).to.be(false);
      expect(one.intersects(left)).to.be(false);
      expect(one.intersects(above)).to.be(false);
      expect(one.intersects(below)).to.be(false);
    });
  });

});
