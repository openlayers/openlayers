goog.provide('ol.test.source.TileImageSource');

describe('ol.source.TileImage', function() {

  describe('constructor', function() {
    it('returns a tile image source', function() {
      var source = new ol.source.TileImage({
        projection: ol.proj.get('EPSG:4326')
      });
      expect(source).to.be.a(ol.source.Tile);
      expect(source).to.be.a(ol.source.TileImage);
    });
  });

  describe('#getTile()', function() {
    it('sets the correct source tile pixel ratio', function() {
      var source = new ol.source.TileImage({
        projection: ol.proj.get('EPSG:4326'),
        tileClass: ol.Tile
      });
      var tile = source.getTile(0, 0, 0, 1, ol.proj.get('EPSG:4326'));
      expect(source.sourcePixelRatio).to.be(undefined);
      tile.getImage = function() {
        return {width: 512, height: 512};
      };
      tile.state = ol.TileState.LOADED;
      source.getTile(0, 0, 0, 1, ol.proj.get('EPSG:4326'));
      expect(source.sourcePixelRatio).to.be(2);
    });
  });

});

goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.proj');
goog.require('ol.source.Tile');
goog.require('ol.source.TileImage');
