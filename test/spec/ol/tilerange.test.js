describe('ol.TileRange', function() {

  describe('contains', function() {
    it('returns the expected value', function() {
      var tileRange = new ol.TileRange(1, 1, 3, 3);
      expect(tileRange.contains(new ol.TileCoord(0, 0, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 1))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 2))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 3))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 1))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 2))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 3))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 1))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 2))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 3))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 1))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 2))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 3))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 1))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 2))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 3))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 4))).toBeFalsy();
    });
  });

  describe('boundingTileRange', function() {
    it('returns the expected TileRange', function() {
      var tileRange = new ol.TileRange.boundingTileRange(
          new ol.TileCoord(3, 1, 3),
          new ol.TileCoord(3, 2, 0));
      expect(tileRange.minX).toEqual(1);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(2);
      expect(tileRange.maxY).toEqual(3);
    });

    describe('with mixed z', function() {
      expect(function() {
        var tileRange = new ol.TileRange.boundingTileRange(
            new ol.TileCoord(3, 1, 3),
            new ol.TileCoord(4, 2, 0));
      }).toThrow();
    });
  });

  describe('forEachTileCoord', function() {
    it('iterates as expected', function() {
      var tileRange = new ol.TileRange(0, 2, 1, 3);

      var tileCoords = [];
      tileRange.forEachTileCoord(5, function(tileCoord) {
        tileCoords.push(new ol.TileCoord(tileCoord.z, tileCoord.x, tileCoord.y));
      });

      expect(tileCoords.length).toEqual(4);

      expect(tileCoords[0].z).toEqual(5);
      expect(tileCoords[0].x).toEqual(0);
      expect(tileCoords[0].y).toEqual(2);

      expect(tileCoords[1].z).toEqual(5);
      expect(tileCoords[1].x).toEqual(0);
      expect(tileCoords[1].y).toEqual(3);

      expect(tileCoords[2].z).toEqual(5);
      expect(tileCoords[2].x).toEqual(1);
      expect(tileCoords[2].y).toEqual(2);

      expect(tileCoords[3].z).toEqual(5);
      expect(tileCoords[3].x).toEqual(1);
      expect(tileCoords[3].y).toEqual(3);
    });
  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var tileRange = new ol.TileRange(0, 1, 2, 4);
      var size = tileRange.getSize();
      expect(size.width).toEqual(3);
      expect(size.height).toEqual(4);
    });
  });

});

goog.require('ol.TileRange');
