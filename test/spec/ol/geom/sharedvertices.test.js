goog.provide('ol.test.geom.SharedVertices');

describe('ol.geom.SharedVertices', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices).toBeA(ol.geom.SharedVertices);
    });

    it('accepts options', function() {
      var vertices = new ol.geom.SharedVertices({
        dimension: 4,
        offset: [1, 2, 3, 4]
      });

      expect(vertices.getDimension()).toBe(4);
      expect(vertices.getOffset()).toEqual([1, 2, 3, 4]);
    });
  });

  describe('offset option', function() {
    it('offsets the internally stored vertex coordinates', function() {
      var vertices = new ol.geom.SharedVertices({offset: [3, -1]});
      vertices.add([[3, -1], [0, 0]]);
      vertices.add([[10, 20]]);
      expect(vertices.coordinates).toEqual([0, 0, -3, 1, 7, 21]);
    });
  });

  describe('#add()', function() {
    it('adds vertex arrays to the shared coordinates', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices.coordinates.length).toBe(0);

      vertices.add([[1, 2], [3, 4]]);
      expect(vertices.coordinates).toEqual([1, 2, 3, 4]);

      vertices.add([[5, 6]]);
      expect(vertices.coordinates).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('returns an identifier for coordinate access', function() {
      var vertices = new ol.geom.SharedVertices();
      var id = vertices.add([[1, 2], [3, 4]]);
      expect(typeof id).toBe('string');
    });
  });

  describe('#get()', function() {
    it('provides access to vertex coordinates', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[1, 2], [3, 4]]);
      var second = vertices.add([[5, 6]]);

      expect(vertices.get(first, 0, 0)).toBe(1);
      expect(vertices.get(first, 0, 1)).toBe(2);
      expect(vertices.get(first, 1, 0)).toBe(3);
      expect(vertices.get(first, 1, 1)).toBe(4);
      expect(vertices.get(second, 0, 0)).toBe(5);
      expect(vertices.get(second, 0, 1)).toBe(6);
    });

    it('works for non-2d vertices', function() {
      var vertices = new ol.geom.SharedVertices({dimension: 3});
      var id = vertices.add([[1, 2, 3], [4, 5, 6]]);

      expect(vertices.get(id, 0, 0)).toBe(1);
      expect(vertices.get(id, 0, 1)).toBe(2);
      expect(vertices.get(id, 0, 2)).toBe(3);
      expect(vertices.get(id, 1, 0)).toBe(4);
      expect(vertices.get(id, 1, 1)).toBe(5);
      expect(vertices.get(id, 1, 2)).toBe(6);
    });

    it('works when an offset is provided', function() {
      var vertices = new ol.geom.SharedVertices({offset: [3, 3]});
      var id = vertices.add([[1, 2], [3, 4], [5, 6]]);

      expect(vertices.get(id, 0, 0)).toBe(1);
      expect(vertices.get(id, 0, 1)).toBe(2);
      expect(vertices.get(id, 1, 0)).toBe(3);
      expect(vertices.get(id, 1, 1)).toBe(4);
      expect(vertices.get(id, 2, 0)).toBe(5);
      expect(vertices.get(id, 2, 1)).toBe(6);
    });

  });

  describe('#getCount()', function() {
    it('returns the length of an identified vertex array', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[2, 3], [3, 4], [4, 5]]);
      var second = vertices.add([[5, 6], [6, 6]]);

      expect(vertices.getCount(first)).toBe(3);
      expect(vertices.getCount(second)).toBe(2);
    });
  });

  describe('#getDimension()', function() {
    it('returns 2 by default', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices.getDimension()).toBe(2);
    });

    it('returns the dimension provided to the constructor', function() {
      var vertices = new ol.geom.SharedVertices({dimension: 10});
      expect(vertices.getDimension()).toBe(10);
    });
  });

  describe('#getOffset()', function() {
    it('returns null by default', function() {
      var vertices = new ol.geom.SharedVertices();
      expect(vertices.getOffset()).toBeNull();
    });

    it('returns the offset provided to the constructor', function() {
      var vertices = new ol.geom.SharedVertices({offset: [1, 2]});
      expect(vertices.getOffset()).toEqual([1, 2]);
    });
  });

  describe('#getStart()', function() {
    it('returns the start of the identified vertex array', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[1, 2]]);
      var second = vertices.add([[3, 4], [5, 6]]);
      var third = vertices.add([[7, 8], [9, 10], [11, 12]]);

      expect(vertices.coordinates).toEqual(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(vertices.getStart(first)).toBe(0);
      expect(vertices.getStart(second)).toBe(2);
      expect(vertices.getStart(third)).toBe(6);
    });
  });

  describe('#remove()', function() {
    it('removes a vertex array', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[1, 2], [3, 4]]);
      var second = vertices.add([[5, 6]]);
      var third = vertices.add([[7, 8], [9, 10], [11, 12]]);

      expect(vertices.remove(second)).toEqual([[5, 6]]);
      expect(vertices.coordinates).toEqual([1, 2, 3, 4, 7, 8, 9, 10, 11, 12]);

      expect(vertices.remove(first)).toEqual([[1, 2], [3, 4]]);
      expect(vertices.coordinates).toEqual([7, 8, 9, 10, 11, 12]);

      expect(vertices.remove(third)).toEqual([[7, 8], [9, 10], [11, 12]]);
      expect(vertices.coordinates).toEqual([]);
    });

    it('adjusts returned vertices by offset', function() {

      var vertices = new ol.geom.SharedVertices({offset: [10, 20]});
      var first = vertices.add([[1, 2]]);
      var second = vertices.add([[3, 4]]);
      var third = vertices.add([[5, 6]]);

      expect(vertices.remove(second)).toEqual([[3, 4]]);
      expect(vertices.coordinates).toEqual([-9, -18, -5, -14]);

      expect(vertices.remove(third)).toEqual([[5, 6]]);
      expect(vertices.coordinates).toEqual([-9, -18]);

      expect(vertices.remove(first)).toEqual([[1, 2]]);
      expect(vertices.coordinates).toEqual([]);
    });

  });

  describe('#coordinates', function() {
    it('is not reassigned', function() {
      var vertices = new ol.geom.SharedVertices();
      var first = vertices.add([[1, 2], [3, 4]]);
      var coordinates = vertices.coordinates;

      var second = vertices.add([[5, 6]]);
      expect(vertices.coordinates).toBe(coordinates);

      vertices.remove(first);
      expect(vertices.coordinates).toBe(coordinates);

      vertices.remove(second);
      expect(vertices.coordinates).toBe(coordinates);
    });
  });

});

goog.require('ol.geom.SharedVertices');
