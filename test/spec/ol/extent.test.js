goog.provide('ol.test.Extent');

describe('ol.Extent', function() {

  describe('containsCoordinate', function() {

    describe('positive', function() {
      it('returns true', function() {
        var extent = new ol.Extent(1, 2, 3, 4);
        expect(extent.containsCoordinate(
            new ol.Coordinate(1, 2))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(1, 3))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(1, 4))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(2, 2))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(2, 3))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(2, 4))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(3, 2))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(3, 3))).to.be.ok();
        expect(extent.containsCoordinate(
            new ol.Coordinate(3, 4))).to.be.ok();
      });
    });

    describe('negative', function() {
      it('returns false', function() {
        var extent = new ol.Extent(1, 2, 3, 4);
        expect(extent.containsCoordinate(
            new ol.Coordinate(0, 1))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(0, 2))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(0, 3))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(0, 4))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(0, 5))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(1, 1))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(1, 5))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(2, 1))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(2, 5))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(3, 1))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(3, 5))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(4, 1))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(4, 2))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(4, 3))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(4, 4))).to.not.be();
        expect(extent.containsCoordinate(
            new ol.Coordinate(4, 5))).to.not.be();
      });
    });
  });

  describe('transform', function() {

    it('does transform', function() {
      var transformFn = ol.projection.getTransform('EPSG:4326', 'EPSG:3857');
      var sourceExtent = new ol.Extent(-15, -30, 45, 60);
      var destinationExtent = sourceExtent.transform(transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      // FIXME check values with third-party tool
      expect(destinationExtent.minX).to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent.minY).to.roughlyEqual(-3503549.843504376, 1e-8);
      expect(destinationExtent.maxX).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent.maxY).to.roughlyEqual(8399737.889818361, 1e-9);
    });

    it('takes arbitrary function', function() {
      var transformFn = function(input) {
        return [-input[0], -input[1], -input[2], -input[3]];
      };
      var sourceExtent = new ol.Extent(-15, -30, 45, 60);
      var destinationExtent = sourceExtent.transform(transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      expect(destinationExtent.minX).to.be(-45);
      expect(destinationExtent.minY).to.be(-60);
      expect(destinationExtent.maxX).to.be(15);
      expect(destinationExtent.maxY).to.be(30);
    });

  });

  describe('getForView2DAndSize', function() {

    it('works for a unit square', function() {
      var extent = ol.Extent.getForView2DAndSize(
          new ol.Coordinate(0, 0), 1, 0, new ol.Size(1, 1));
      expect(extent.minX).to.be(-0.5);
      expect(extent.minY).to.be(-0.5);
      expect(extent.maxX).to.be(0.5);
      expect(extent.maxY).to.be(0.5);
    });

    it('works for center', function() {
      var extent = ol.Extent.getForView2DAndSize(
          new ol.Coordinate(5, 10), 1, 0, new ol.Size(1, 1));
      expect(extent.minX).to.be(4.5);
      expect(extent.minY).to.be(9.5);
      expect(extent.maxX).to.be(5.5);
      expect(extent.maxY).to.be(10.5);
    });

    it('works for rotation', function() {
      var extent = ol.Extent.getForView2DAndSize(
          new ol.Coordinate(0, 0), 1, Math.PI / 4, new ol.Size(1, 1));
      expect(extent.minX).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent.minY).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent.maxX).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
      expect(extent.maxY).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
    });

    it('works for resolution', function() {
      var extent = ol.Extent.getForView2DAndSize(
          new ol.Coordinate(0, 0), 2, 0, new ol.Size(1, 1));
      expect(extent.minX).to.be(-1);
      expect(extent.minY).to.be(-1);
      expect(extent.maxX).to.be(1);
      expect(extent.maxY).to.be(1);
    });

    it('works for size', function() {
      var extent = ol.Extent.getForView2DAndSize(
          new ol.Coordinate(0, 0), 1, 0, new ol.Size(10, 5));
      expect(extent.minX).to.be(-5);
      expect(extent.minY).to.be(-2.5);
      expect(extent.maxX).to.be(5);
      expect(extent.maxY).to.be(2.5);
    });

  });

});

goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.projection');
