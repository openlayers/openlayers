

import _ol_geom_MultiPolygon_ from '../../../../src/ol/geom/multipolygon';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';


describe('ol.geom.MultiPolygon', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      return new _ol_geom_MultiPolygon_(null);
    }).not.to.throwException();
  });

  describe('with a null MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new _ol_geom_MultiPolygon_(null);
    });

    it('can append polygons', function() {
      multiPolygon.appendPolygon(
          new _ol_geom_Polygon_([[[0, 0], [0, 2], [1, 1], [2, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql(
          [[[[0, 0], [0, 2], [1, 1], [2, 0]]]]);
      multiPolygon.appendPolygon(
          new _ol_geom_Polygon_([[[3, 0], [4, 1], [5, 2], [5, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
      expect(multiPolygon.getPolygons().length).to.eql(2);
    });

  });

  describe('with an empty MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new _ol_geom_MultiPolygon_([]);
    });

    it('can append polygons', function() {
      multiPolygon.appendPolygon(
          new _ol_geom_Polygon_([[[0, 0], [0, 2], [1, 1], [2, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql(
          [[[[0, 0], [0, 2], [1, 1], [2, 0]]]]);
      multiPolygon.appendPolygon(
          new _ol_geom_Polygon_([[[3, 0], [4, 1], [5, 2], [5, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
      expect(multiPolygon.getPolygons().length).to.eql(2);
    });

  });

  describe('#scale()', function() {

    it('scales a multi-polygon', function() {
      var geom = new _ol_geom_MultiPolygon_([[
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]]);
      geom.scale(10);
      var coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[[-10, -20], [10, -20], [10, 20], [-10, 20], [-10, -20]]]]);
    });

    it('accepts sx and sy', function() {
      var geom = new _ol_geom_MultiPolygon_([[
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]]);
      geom.scale(2, 3);
      var coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[[-2, -6], [2, -6], [2, 6], [-2, 6], [-2, -6]]]]);
    });

    it('accepts an anchor', function() {
      var geom = new _ol_geom_MultiPolygon_([[
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]]);
      geom.scale(3, 2, [-1, -2]);
      var coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[[-1, -2], [5, -2], [5, 6], [-1, 6], [-1, -2]]]]);
    });

  });

  describe('with a simple MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new _ol_geom_MultiPolygon_([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
    });

    it('can return individual polygons', function() {
      var polygon0 = multiPolygon.getPolygon(0);
      expect(polygon0).to.be.an(_ol_geom_Polygon_);
      expect(polygon0.getCoordinates()).to.eql(
          [[[0, 0], [0, 2], [1, 1], [2, 0]]]);
      var polygon1 = multiPolygon.getPolygon(1);
      expect(polygon1).to.be.an(_ol_geom_Polygon_);
      expect(polygon1.getCoordinates()).to.eql(
          [[[3, 0], [4, 1], [5, 2], [5, 0]]]);
    });

    it('can return all polygons', function() {
      var polygons = multiPolygon.getPolygons();
      expect(polygons).to.be.an(Array);
      expect(polygons).to.have.length(2);
      expect(polygons[0]).to.be.an(_ol_geom_Polygon_);
      expect(polygons[0].getCoordinates()).to.eql(
          [[[0, 0], [0, 2], [1, 1], [2, 0]]]);
      expect(polygons[1]).to.be.an(_ol_geom_Polygon_);
      expect(polygons[1].getCoordinates()).to.eql(
          [[[3, 0], [4, 1], [5, 2], [5, 0]]]);
    });

    describe('#clone()', function() {

      it('has the expected endss_', function() {
        var clone = multiPolygon.clone();
        expect(multiPolygon.endss_).to.eql(clone.endss_);
      });

    });

    describe('#getCoordinates()', function() {

      var cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      var cw2 = [[-140, -60], [-140, 60], [140, 60], [140, -60], [-140, -60]];
      var ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      var ccw2 = [[-140, -60], [140, -60], [140, 60], [-140, 60], [-140, -60]];
      var right = new _ol_geom_MultiPolygon_([[ccw, cw], [ccw2, cw2]]);
      var left = new _ol_geom_MultiPolygon_([[cw, ccw], [cw2, ccw2]]);

      it('returns coordinates as they were constructed', function() {
        expect(right.getCoordinates()).to.eql([[ccw, cw], [ccw2, cw2]]);
        expect(left.getCoordinates()).to.eql([[cw, ccw], [cw2, ccw2]]);
      });

      it('can return coordinates with right-hand orientation', function() {
        expect(right.getCoordinates(true)).to.eql([[ccw, cw], [ccw2, cw2]]);
        expect(left.getCoordinates(true)).to.eql([[ccw, cw], [ccw2, cw2]]);
      });

      it('can return coordinates with left-hand orientation', function() {
        expect(right.getCoordinates(false)).to.eql([[cw, ccw], [cw2, ccw2]]);
        expect(left.getCoordinates(false)).to.eql([[cw, ccw], [cw2, ccw2]]);
      });

    });

    describe('#getExtent()', function() {

      it('returns expected result', function() {
        expect(multiPolygon.getExtent()).to.eql([0, 0, 5, 2]);
      });

    });

    describe('#getSimplifiedGeometry', function() {

      it('returns the expected result', function() {
        var simplifiedGeometry = multiPolygon.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).to.be.an(_ol_geom_MultiPolygon_);
        expect(simplifiedGeometry.getCoordinates()).to.eql([
          [[[0, 0], [0, 2], [2, 0]]],
          [[[3, 0], [5, 2], [5, 0]]]
        ]);
      });
    });

    describe('#intersectsExtent()', function() {

      it('returns true for extent of of each polygon', function() {
        var polygons = multiPolygon.getPolygons();
        for (var i = 0; i < polygons.length; i++) {
          expect(multiPolygon.intersectsExtent(
              polygons[i].getExtent())).to.be(true);
        }
      });

      it('returns false for non-matching extent within own extent', function() {
        expect(multiPolygon.intersectsExtent([2.1, 0, 2.9, 2])).to.be(false);
      });

    });

  });

});
