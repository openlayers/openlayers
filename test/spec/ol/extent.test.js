goog.provide('ol.test.extent');


describe('ol.extent', function() {

  describe('buffer', function() {

    it('buffers an extent by some value', function() {
      var extent = [-10, -20, 10, 20];
      ol.extent.buffer(extent, 15);
      expect(extent).to.eql([-25, -35, 25, 35]);
    });

  });

  describe('clone', function() {

    it('creates a copy of an extent', function() {
      var extent = ol.extent.createOrUpdate(1, 2, 3, 4);
      var clone = ol.extent.clone(extent);
      expect(ol.extent.equals(extent, clone)).to.be(true);

      ol.extent.extendCoordinate(extent, [10, 20]);
      expect(ol.extent.equals(extent, clone)).to.be(false);
    });

  });

  describe('containsCoordinate', function() {

    describe('positive', function() {
      it('returns true', function() {
        var extent = [1, 2, 3, 4];
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
        var extent = [1, 2, 3, 4];
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
      var extent = [1, 2, 3, 4];
      var center = ol.extent.getCenter(extent);
      expect(center[0]).to.eql(2);
      expect(center[1]).to.eql(3);
    });
  });

  describe('getForView2DAndSize', function() {

    it('works for a unit square', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 1, 0, [1, 1]);
      expect(extent[0]).to.be(-0.5);
      expect(extent[2]).to.be(0.5);
      expect(extent[1]).to.be(-0.5);
      expect(extent[3]).to.be(0.5);
    });

    it('works for center', function() {
      var extent = ol.extent.getForView2DAndSize(
          [5, 10], 1, 0, [1, 1]);
      expect(extent[0]).to.be(4.5);
      expect(extent[2]).to.be(5.5);
      expect(extent[1]).to.be(9.5);
      expect(extent[3]).to.be(10.5);
    });

    it('works for rotation', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 1, Math.PI / 4, [1, 1]);
      expect(extent[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[2]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
      expect(extent[1]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[3]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
    });

    it('works for resolution', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 2, 0, [1, 1]);
      expect(extent[0]).to.be(-1);
      expect(extent[2]).to.be(1);
      expect(extent[1]).to.be(-1);
      expect(extent[3]).to.be(1);
    });

    it('works for size', function() {
      var extent = ol.extent.getForView2DAndSize(
          [0, 0], 1, 0, [10, 5]);
      expect(extent[0]).to.be(-5);
      expect(extent[2]).to.be(5);
      expect(extent[1]).to.be(-2.5);
      expect(extent[3]).to.be(2.5);
    });

  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var extent = [0, 1, 2, 4];
      var size = ol.extent.getSize(extent);
      expect(size).to.eql([2, 3]);
    });
  });

  describe('intersects', function() {

    it('returns the expected value', function() {
      var intersects = ol.extent.intersects;
      var extent = [50, 50, 100, 100];
      expect(intersects(extent, extent)).to.be(true);
      expect(intersects(extent, [20, 20, 80, 80])).to.be(true);
      expect(intersects(extent, [20, 50, 80, 100])).to.be(true);
      expect(intersects(extent, [20, 80, 80, 120])).to.be(true);
      expect(intersects(extent, [50, 20, 100, 80])).to.be(true);
      expect(intersects(extent, [50, 80, 100, 120])).to.be(true);
      expect(intersects(extent, [80, 20, 120, 80])).to.be(true);
      expect(intersects(extent, [80, 50, 120, 100])).to.be(true);
      expect(intersects(extent, [80, 80, 120, 120])).to.be(true);
      expect(intersects(extent, [20, 20, 120, 120])).to.be(true);
      expect(intersects(extent, [70, 70, 80, 80])).to.be(true);
      expect(intersects(extent, [10, 10, 30, 30])).to.be(false);
      expect(intersects(extent, [30, 10, 70, 30])).to.be(false);
      expect(intersects(extent, [50, 10, 100, 30])).to.be(false);
      expect(intersects(extent, [80, 10, 120, 30])).to.be(false);
      expect(intersects(extent, [120, 10, 140, 30])).to.be(false);
      expect(intersects(extent, [10, 30, 30, 70])).to.be(false);
      expect(intersects(extent, [120, 30, 140, 70])).to.be(false);
      expect(intersects(extent, [10, 50, 30, 100])).to.be(false);
      expect(intersects(extent, [120, 50, 140, 100])).to.be(false);
      expect(intersects(extent, [10, 80, 30, 120])).to.be(false);
      expect(intersects(extent, [120, 80, 140, 120])).to.be(false);
      expect(intersects(extent, [10, 120, 30, 140])).to.be(false);
      expect(intersects(extent, [30, 120, 70, 140])).to.be(false);
      expect(intersects(extent, [50, 120, 100, 140])).to.be(false);
      expect(intersects(extent, [80, 120, 120, 140])).to.be(false);
      expect(intersects(extent, [120, 120, 140, 140])).to.be(false);
    });
  });

  describe('touches', function() {

    it('returns the expected value', function() {
      var touches = ol.extent.touches;
      var extent = [50, 50, 100, 100];
      expect(touches(extent, [20, 20, 80, 80])).to.be(false);
      expect(touches(extent, [20, 20, 50, 80])).to.be(true);
      expect(touches(extent, [20, 20, 50, 40])).to.be(false);
      expect(touches(extent, [100, 20, 140, 80])).to.be(true);
      expect(touches(extent, [100, 20, 140, 40])).to.be(false);
      expect(touches(extent, [20, 20, 80, 50])).to.be(true);
      expect(touches(extent, [20, 20, 40, 50])).to.be(false);
      expect(touches(extent, [20, 100, 80, 140])).to.be(true);
      expect(touches(extent, [20, 100, 40, 140])).to.be(false);
    });
  });

  describe('normalize', function() {
    it('returns the expected coordinate', function() {
      var extent = [0, 1, 2, 3];
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
      var extent = [1, 1, 3, 3];
      ol.extent.scaleFromCenter(extent, 2);
      expect(extent[0]).to.eql(0);
      expect(extent[2]).to.eql(4);
      expect(extent[1]).to.eql(0);
      expect(extent[3]).to.eql(4);
    });
  });

  describe('transform', function() {

    it('does transform', function() {
      var transformFn = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
      var sourceExtent = [-15, -30, 45, 60];
      var destinationExtent = ol.extent.transform(sourceExtent, transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      // FIXME check values with third-party tool
      expect(destinationExtent[0])
          .to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent[2]).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent[1]).to.roughlyEqual(-3503549.843504376, 1e-8);
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
      var sourceExtent = [-15, -30, 45, 60];
      var destinationExtent = ol.extent.transform(sourceExtent, transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      expect(destinationExtent[0]).to.be(-45);
      expect(destinationExtent[2]).to.be(15);
      expect(destinationExtent[1]).to.be(-60);
      expect(destinationExtent[3]).to.be(30);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.proj');
