goog.provide('ol.test.extent');


describe('ol.extent', function() {

  describe('containsCoordinate', function() {

    describe('positive', function() {
      it('returns true', function() {
        var extent = [1, 3, 2, 4];
        expect(ol.extent.containsCoordinate(extent, [1, 2])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [1, 3])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [1, 4])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [2, 2])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [2, 3])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [2, 4])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [3, 2])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [3, 3])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [3, 4])).to.be.ok();
      });
    });

    describe('negative', function() {
      it('returns false', function() {
        var extent = [1, 3, 2, 4];
        expect(ol.extent.containsCoordinate(extent, [0, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 2])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 3])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 4])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [1, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [1, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [2, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [2, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [3, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [3, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 2])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 3])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 4])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 5])).to.not.be();
      });
    });
  });

  describe('getCenter', function() {
    it('returns the expected center', function() {
      var extent = [1, 3, 2, 4];
      var center = ol.extent.getCenter(extent);
      expect(center[0]).to.eql(2);
      expect(center[1]).to.eql(3);
    });
  });

  describe('getForView2DAndSize', function() {

    it('works for a unit square', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 1, 0, new ol.Size(1, 1));
      expect(extent[0]).to.be(-0.5);
      expect(extent[1]).to.be(0.5);
      expect(extent[2]).to.be(-0.5);
      expect(extent[3]).to.be(0.5);
    });

    it('works for center', function() {
      var extent = ol.extent.getForView2DAndSize(
          [5, 10], 1, 0, new ol.Size(1, 1));
      expect(extent[0]).to.be(4.5);
      expect(extent[1]).to.be(5.5);
      expect(extent[2]).to.be(9.5);
      expect(extent[3]).to.be(10.5);
    });

    it('works for rotation', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 1, Math.PI / 4, new ol.Size(1, 1));
      expect(extent[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[1]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
      expect(extent[2]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[3]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
    });

    it('works for resolution', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 2, 0, new ol.Size(1, 1));
      expect(extent[0]).to.be(-1);
      expect(extent[1]).to.be(1);
      expect(extent[2]).to.be(-1);
      expect(extent[3]).to.be(1);
    });

    it('works for size', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 1, 0, new ol.Size(10, 5));
      expect(extent[0]).to.be(-5);
      expect(extent[1]).to.be(5);
      expect(extent[2]).to.be(-2.5);
      expect(extent[3]).to.be(2.5);
    });

  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var extent = [0, 2, 1, 4];
      var size = ol.extent.getSize(extent);
      expect(size.width).to.eql(2);
      expect(size.height).to.eql(3);
    });
  });

  describe('intersect', function() {

    var extent1;

    beforeEach(function() {
      extent1 = [50, 100, 50, 100];
    });

    it('returns the expected value', function() {
      expect(ol.extent.intersects(extent1, extent1)).to.be(true);
      expect(ol.extent.intersects(extent1, [20, 80, 20, 80])).to.be(true);
      expect(ol.extent.intersects(extent1, [20, 80, 50, 100])).to.be(true);
      expect(ol.extent.intersects(extent1, [20, 80, 80, 120])).to.be(true);
      expect(ol.extent.intersects(extent1, [50, 100, 20, 80])).to.be(true);
      expect(ol.extent.intersects(extent1, [50, 100, 80, 120])).to.be(true);
      expect(ol.extent.intersects(extent1, [80, 120, 20, 80])).to.be(true);
      expect(ol.extent.intersects(extent1, [80, 120, 50, 100])).to.be(true);
      expect(ol.extent.intersects(extent1, [80, 120, 80, 120])).to.be(true);
      expect(ol.extent.intersects(extent1, [20, 120, 20, 120])).to.be(true);
      expect(ol.extent.intersects(extent1, [70, 80, 70, 80])).to.be(true);
      expect(ol.extent.intersects(extent1, [10, 30, 10, 30])).to.be(false);
      expect(ol.extent.intersects(extent1, [30, 70, 10, 30])).to.be(false);
      expect(ol.extent.intersects(extent1, [50, 100, 10, 30])).to.be(false);
      expect(ol.extent.intersects(extent1, [80, 120, 10, 30])).to.be(false);
      expect(ol.extent.intersects(extent1, [120, 140, 10, 30])).to.be(false);
      expect(ol.extent.intersects(extent1, [10, 30, 30, 70])).to.be(false);
      expect(ol.extent.intersects(extent1, [120, 140, 30, 70])).to.be(false);
      expect(ol.extent.intersects(extent1, [10, 30, 50, 100])).to.be(false);
      expect(ol.extent.intersects(extent1, [120, 140, 50, 100])).to.be(false);
      expect(ol.extent.intersects(extent1, [10, 30, 80, 120])).to.be(false);
      expect(ol.extent.intersects(extent1, [120, 140, 80, 120])).to.be(false);
      expect(ol.extent.intersects(extent1, [10, 30, 120, 140])).to.be(false);
      expect(ol.extent.intersects(extent1, [30, 70, 120, 140])).to.be(false);
      expect(ol.extent.intersects(extent1, [50, 100, 120, 140])).to.be(false);
      expect(ol.extent.intersects(extent1, [80, 120, 120, 140])).to.be(false);
      expect(ol.extent.intersects(extent1, [120, 140, 120, 140])).to.be(false);
    });
  });

  describe('normalize', function() {
    it('returns the expected coordinate', function() {
      var extent = [0, 2, 1, 3];
      var coordinate;

      coordinate = ol.extent.normalize(extent, [1, 2]);
      expect(coordinate[0]).to.eql(0.5);
      expect(coordinate[1]).to.eql(0.5);

      coordinate = ol.extent.normalize(extent, [0, 3]);
      expect(coordinate[0]).to.eql(0);
      expect(coordinate[1]).to.eql(1);

      coordinate = ol.extent.normalize(extent, [2, 1]);
      expect(coordinate[0]).to.eql(1);
      expect(coordinate[1]).to.eql(0);

      coordinate = ol.extent.normalize(extent, [0, 0]);
      expect(coordinate[0]).to.eql(0);
      expect(coordinate[1]).to.eql(-0.5);

      coordinate = ol.extent.normalize(extent, [-1, 1]);
      expect(coordinate[0]).to.eql(-0.5);
      expect(coordinate[1]).to.eql(0);
    });
  });

  describe('scaleFromCenter', function() {
    it('scales the extent from its center', function() {
      var extent = [1, 3, 1, 3];
      ol.extent.scaleFromCenter(extent, 2);
      expect(extent[0]).to.eql(0);
      expect(extent[1]).to.eql(4);
      expect(extent[2]).to.eql(0);
      expect(extent[3]).to.eql(4);
    });
  });

  describe('toString', function() {
    it('returns the expected string', function() {
      var extent = [0, 2, 1, 3];
      expect(ol.extent.toString(extent)).to.eql('(0, 2, 1, 3)');
    });
  });

  describe('transform', function() {

    it('does transform', function() {
      var transformFn = ol.projection.getTransform('EPSG:4326', 'EPSG:3857');
      var sourceExtent = [-15, 45, -30, 60];
      var destinationExtent = ol.extent.transform(sourceExtent, transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      // FIXME check values with third-party tool
      expect(destinationExtent[0]).to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent[1]).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent[2]).to.roughlyEqual(-3503549.843504376, 1e-8);
      expect(destinationExtent[3]).to.roughlyEqual(8399737.889818361, 1e-9);
    });

    it('takes arbitrary function', function() {
      var transformFn = function(input, output, opt_dimension) {
        var dimension = goog.isDef(opt_dimension) ? opt_dimension : 2;
        if (!goog.isDef(output)) {
          output = new Array(input.length);
        }
        var n = input.length;
        var i;
        for (i = 0; i < n; i += dimension) {
          output[i] = -input[i];
          output[i + 1] = -input[i + 1];
        }
        return output;
      };
      var sourceExtent = [-15, 45, -30, 60];
      var destinationExtent = ol.extent.transform(sourceExtent, transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      expect(destinationExtent[0]).to.be(-45);
      expect(destinationExtent[1]).to.be(15);
      expect(destinationExtent[2]).to.be(-60);
      expect(destinationExtent[3]).to.be(30);
    });

  });

});


goog.require('ol.Size');
goog.require('ol.extent');
goog.require('ol.projection');
