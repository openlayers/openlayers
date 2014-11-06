goog.provide('ol.test.geom.flat.intersectsextent');

describe('ol.geom.flat.intersectsextent', function() {

  describe('ol.geom.flat.intersectsextent.lineString', function() {
    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [0, 0, 1, 1, 2, 2];
    });
    describe('linestring envelope does not intersect the extent', function() {
      it('returns false', function() {
        var extent = [3, 3, 4, 4];
        var r = ol.geom.flat.intersectsextent.lineString(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
    });
    describe('linestring envelope within the extent', function() {
      it('returns true', function() {
        var extent = [-1, -1, 3, 3];
        var r = ol.geom.flat.intersectsextent.lineString(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
    describe('linestring envelope bisected by an edge of the extent',
        function() {
          it('returns true', function() {
            var extent = [-0.1, 0.1, 2.1, 0.1];
            var r = ol.geom.flat.intersectsextent.lineString(
                flatCoordinates, 0, flatCoordinates.length, 2, extent);
            expect(r).to.be(true);
          });
        });
    describe('a segment intersects the extent', function() {
      it('returns true', function() {
        var extent = [-0.5, -0.5, 0.5, 0.5];
        var r = ol.geom.flat.intersectsextent.lineString(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
    describe('no segments intersect the extent', function() {
      it('returns false', function() {
        var extent = [0.5, 1.5, 1, 1.75];
        var r = ol.geom.flat.intersectsextent.lineString(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
      it('returns false', function() {
        var extent = [1, 0.25, 1.5, 0.5];
        var r = ol.geom.flat.intersectsextent.lineString(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
    });
  });

  describe('ol.geom.flat.intersectsextent.linearRing', function() {
    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [0, 0, 1, 1, 2, 0, 1, -1, 0, 0];
    });
    describe('boundary intersects the extent', function() {
      it('returns true', function() {
        var extent = [1.5, 0.0, 2.5, 1.0];
        var r = ol.geom.flat.intersectsextent.linearRing(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
    describe('boundary does not intersect the extent and ring does not ' +
        'contain a corner of the extent', function() {
          it('returns false', function() {
            var extent = [2.0, 0.5, 3, 1.5];
            var r = ol.geom.flat.intersectsextent.linearRing(
                flatCoordinates, 0, flatCoordinates.length, 2, extent);
            expect(r).to.be(false);
          });
        });
    describe('ring contains the extent', function() {
      it('returns true', function() {
        var extent = [0.75, -0.25, 1.25, 0.25];
        var r = ol.geom.flat.intersectsextent.linearRing(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
  });
});

goog.require('ol.geom.flat.intersectsextent');
