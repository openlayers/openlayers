goog.provide('ol.test.geom.SharedVertices');

describe('ol.geom.SharedVertices', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices).to.be.a(ol.geom.SharedVertices);
    });

    it('accepts options', function() {
      var vertices = new ol.geom.SharedVertices({
        dimension: 4,
        offset: [1, 2, 3, 4]
      });

      expect(vertices.getDimension()).to.be(4);
      expect(vertices.getOffset()).to.eql([1, 2, 3, 4]);
    });
  });

  describe('offset option', function() {
    it('offsets the internally stored vertex coordinates', function() {
      var vertices = new ol.geom.SharedVertices({offset: [3, -1]});
      vertices.add([[3, -1], [0, 0]]);
      vertices.add([[10, 20]]);
      expect(vertices.coordinates).to.eql([0, 0, -3, 1, 7, 21]);
    });
  });

  describe('#add()', function() {
    it('adds vertex arrays to the shared coordinates', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices.coordinates.length).to.be(0);

      vertices.add([[1, 2], [3, 4]]);
      expect(vertices.coordinates).to.eql([1, 2, 3, 4]);

      vertices.add([[5, 6]]);
      expect(vertices.coordinates).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('ignores extra dimensions', function() {
      var vertices = new ol.geom.SharedVertices({dimension: 2});
      expect(vertices.coordinates.length).to.be(0);

      vertices.add([[1, 2], [3, 4, 5], [6, 7]]);
      expect(vertices.coordinates).to.eql([1, 2, 3, 4, 6, 7]);

      vertices.add([[8, 9, 10]]);
      expect(vertices.coordinates).to.eql([1, 2, 3, 4, 6, 7, 8, 9]);
    });

    it('pads with NaN when dimension not provided', function() {
      var vertices = new ol.geom.SharedVertices({dimension: 3});
      expect(vertices.coordinates.length).to.be(0);

      vertices.add([[1, 2], [3, 4, 5], [6, 7]]);
      expect(vertices.coordinates).to.eql([1, 2, NaN, 3, 4, 5, 6, 7, NaN]);
    });

    it('returns an identifier for coordinate access', function() {
      var vertices = new ol.geom.SharedVertices();
      var id = vertices.add([[1, 2], [3, 4]]);
      expect(typeof id).to.be('number');
    });

    it('returns the index of the added vertices', function() {
      var vertices = new ol.geom.SharedVertices();

      var first = vertices.add([[1, 2]]);
      var second = vertices.add([[3, 4], [5, 6]]);
      var third = vertices.add([[7, 8], [9, 10], [11, 12]]);

      expect(vertices.coordinates).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

      expect(first).to.be(0);
      expect(second).to.be(1);
      expect(third).to.be(2);
    });

  });

  describe('#get()', function() {
    it('provides access to vertex coordinates', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[1, 2], [3, 4]]);
      var second = vertices.add([[5, 6]]);

      expect(vertices.get(first, 0, 0)).to.be(1);
      expect(vertices.get(first, 0, 1)).to.be(2);
      expect(vertices.get(first, 1, 0)).to.be(3);
      expect(vertices.get(first, 1, 1)).to.be(4);
      expect(vertices.get(second, 0, 0)).to.be(5);
      expect(vertices.get(second, 0, 1)).to.be(6);
    });

    it('works for non-2d vertices', function() {
      var vertices = new ol.geom.SharedVertices({dimension: 3});
      var id = vertices.add([[1, 2, 3], [4, 5, 6]]);

      expect(vertices.get(id, 0, 0)).to.be(1);
      expect(vertices.get(id, 0, 1)).to.be(2);
      expect(vertices.get(id, 0, 2)).to.be(3);
      expect(vertices.get(id, 1, 0)).to.be(4);
      expect(vertices.get(id, 1, 1)).to.be(5);
      expect(vertices.get(id, 1, 2)).to.be(6);
    });

    it('works when an offset is provided', function() {
      var vertices = new ol.geom.SharedVertices({offset: [3, 3]});
      var id = vertices.add([[1, 2], [3, 4], [5, 6]]);

      expect(vertices.get(id, 0, 0)).to.be(1);
      expect(vertices.get(id, 0, 1)).to.be(2);
      expect(vertices.get(id, 1, 0)).to.be(3);
      expect(vertices.get(id, 1, 1)).to.be(4);
      expect(vertices.get(id, 2, 0)).to.be(5);
      expect(vertices.get(id, 2, 1)).to.be(6);
    });

  });

  describe('#getCount()', function() {
    it('returns the length of an identified vertex array', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[2, 3], [3, 4], [4, 5]]);
      var second = vertices.add([[5, 6], [6, 6]]);

      expect(vertices.getCount(first)).to.be(3);
      expect(vertices.getCount(second)).to.be(2);
    });
  });

  describe('#getCounts()', function() {
    it('returns the counts array', function() {
      var vertices = new ol.geom.SharedVertices();
      vertices.add([[2, 3], [3, 4], [4, 5]]);
      vertices.add([[5, 6], [6, 6]]);
      vertices.add([[7, 8]]);

      expect(vertices.getCounts()).to.eql([3, 2, 1]);
    });
  });

  describe('#getDimension()', function() {
    it('returns 2 by default', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices.getDimension()).to.be(2);
    });

    it('returns the dimension provided to the constructor', function() {
      var vertices = new ol.geom.SharedVertices({dimension: 10});
      expect(vertices.getDimension()).to.be(10);
    });
  });

  describe('#getOffset()', function() {
    it('returns null by default', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices.getOffset()).to.be(null);
    });

    it('returns the offset provided to the constructor', function() {
      var vertices = new ol.geom.SharedVertices({offset: [1, 2]});
      expect(vertices.getOffset()).to.eql([1, 2]);
    });
  });

  describe('#getStart()', function() {
    it('returns the start index of an identified vertex array', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[2, 3], [4, 5], [6, 7]]);
      var second = vertices.add([[8, 9], [10, 11]]);
      var third = vertices.add([[12, 13]]);

      expect(vertices.coordinates).to.eql(
          [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
      //   0  1  2  3  4  5  6  7   8   9  10  11

      expect(vertices.getStart(first)).to.be(0);
      expect(vertices.getStart(second)).to.be(6);
      expect(vertices.getStart(third)).to.be(10);
    });
  });

  describe('#getStarts()', function() {
    it('returns the counts array', function() {
      var vertices = new ol.geom.SharedVertices();
      vertices.add([[2, 3], [3, 4], [4, 5]]);
      vertices.add([[5, 6], [6, 6]]);
      vertices.add([[7, 8]]);

      expect(vertices.getStarts()).to.eql([0, 6, 10]);
    });
  });

  describe('#coordinates', function() {
    it('is a flat array of all coordinate values', function() {
      var vertices = new ol.geom.SharedVertices();
      vertices.add([[1, 2], [3, 4]]);
      vertices.add([[5, 6]]);
      vertices.add([[7, 8], [9, 10], [11, 12]]);
      expect(vertices.coordinates).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('is not reassigned', function() {
      var vertices = new ol.geom.SharedVertices();
      vertices.add([[1, 2], [3, 4]]);
      var coordinates = vertices.coordinates;

      vertices.add([[5, 6]]);
      expect(vertices.coordinates).to.be(coordinates);
    });
  });

});

goog.require('ol.geom.SharedVertices');
