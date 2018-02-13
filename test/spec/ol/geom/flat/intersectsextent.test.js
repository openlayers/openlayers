import {intersectsLinearRing, intersectsLineString} from '../../../../../src/ol/geom/flat/intersectsextent.js';


describe('ol.geom.flat.intersectsextent', function() {

  describe('ol.geom.flat.intersectsextent.intersectsLineString', function() {
    let flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [0, 0, 1, 1, 2, 2];
    });
    describe('linestring envelope does not intersect the extent', function() {
      it('returns false', function() {
        const extent = [3, 3, 4, 4];
        const r = intersectsLineString(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
    });
    describe('linestring envelope within the extent', function() {
      it('returns true', function() {
        const extent = [-1, -1, 3, 3];
        const r = intersectsLineString(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
    describe('linestring envelope bisected by an edge of the extent',
      function() {
        it('returns true', function() {
          const extent = [-0.1, 0.1, 2.1, 0.1];
          const r = intersectsLineString(
            flatCoordinates, 0, flatCoordinates.length, 2, extent);
          expect(r).to.be(true);
        });
      });
    describe('a segment intersects the extent', function() {
      it('returns true', function() {
        const extent = [-0.5, -0.5, 0.5, 0.5];
        const r = intersectsLineString(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
    describe('no segments intersect the extent', function() {
      it('returns false', function() {
        const extent = [0.5, 1.5, 1, 1.75];
        const r = intersectsLineString(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
      it('returns false', function() {
        const extent = [1, 0.25, 1.5, 0.5];
        const r = intersectsLineString(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
    });
  });

  describe('ol.geom.flat.intersectsextent.intersectsLinearRing', function() {
    let flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [0, 0, 1, 1, 2, 0, 1, -1, 0, 0];
    });
    describe('boundary intersects the extent', function() {
      it('returns true', function() {
        const extent = [1.5, 0.0, 2.5, 1.0];
        const r = intersectsLinearRing(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
    describe('boundary does not intersect the extent and ring does not ' +
        'contain a corner of the extent',
    function() {
      it('returns false', function() {
        const extent = [2.0, 0.5, 3, 1.5];
        const r = intersectsLinearRing(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(false);
      });
    });
    describe('ring contains the extent', function() {
      it('returns true', function() {
        const extent = [0.75, -0.25, 1.25, 0.25];
        const r = intersectsLinearRing(
          flatCoordinates, 0, flatCoordinates.length, 2, extent);
        expect(r).to.be(true);
      });
    });
  });
});
