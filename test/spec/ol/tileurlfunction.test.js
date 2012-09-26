describe('ol.TileUrlFunction', function() {

  describe('createFromTemplate', function() {
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}');
      expect(tileUrl(new ol.TileCoord(3, 2, 1))).toEqual('3/2/1');
      expect(tileUrl(null)).toBeUndefined();
    });
  });

  describe('withTileCoordTransform', function() {
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.withTileCoordTransform(
          function(tileCoord) {
            return new ol.TileCoord(tileCoord.z, tileCoord.x, -tileCoord.y);
          },
          ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}'));
      expect(tileUrl(new ol.TileCoord(3, 2, -1))).toEqual('3/2/1');
      expect(tileUrl(null)).toBeUndefined();
    });
  });

  describe('createFromTileUrlFunctions', function() {
    it('creates expected URL', function() {
      tileUrl = ol.TileUrlFunction.createFromTileUrlFunctions([
          ol.TileUrlFunction.createFromTemplate('a'),
          ol.TileUrlFunction.createFromTemplate('b')
      ]);
      var tileUrl1 = tileUrl(new ol.TileCoord(1, 0, 0));
      var tileUrl2 = tileUrl(new ol.TileCoord(1, 0, 1));
      expect(tileUrl1).not.toEqual(tileUrl2);
      expect(tileUrl(null)).toBeUndefined();
    });
  });
});

goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
