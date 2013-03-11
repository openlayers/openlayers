goog.provide('ol.test.source.TileSource');

describe('ol.source.TileSource', function() {

  describe('constructor', function() {
    it('returns a tile source', function() {
      var source = new ol.source.TileSource({
        projection: ol.projection.get('EPSG:4326')
      });
      expect(source).toBeA(ol.source.Source);
      expect(source).toBeA(ol.source.TileSource);
    });
  });

  describe('#findLoadedTiles()', function() {

    it('adds no tiles if none are already loaded', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({});

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 3);

      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      source.findLoadedTiles(loadedTilesByZ, getTileIfLoaded, 3, range);

      var keys = goog.object.getKeys(loadedTilesByZ);
      expect(keys.length).toBe(0);
    });

    it('adds loaded tiles to the lookup (z: 0)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({
        '0/0/0': true,
        '1/0/0': true
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 0);

      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      source.findLoadedTiles(loadedTilesByZ, getTileIfLoaded, 0, range);
      var keys = goog.object.getKeys(loadedTilesByZ);
      expect(keys.length).toBe(1);
      var tile = loadedTilesByZ['0']['0/0/0'];
      expect(tile).toBeA(ol.Tile);
      expect(tile.state).toBe(ol.TileState.LOADED);
    });

    it('adds loaded tiles to the lookup (z: 1)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({
        '0/0/0': true,
        '1/0/0': true
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 1);

      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      source.findLoadedTiles(loadedTilesByZ, getTileIfLoaded, 1, range);
      var keys = goog.object.getKeys(loadedTilesByZ);
      expect(keys.length).toBe(1);
      var tile = loadedTilesByZ['1']['1/0/0'];
      expect(tile).toBeA(ol.Tile);
      expect(tile.state).toBe(ol.TileState.LOADED);
    });

    it('returns true when all tiles are already loaded', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({
        '1/0/0': true,
        '1/0/1': true,
        '1/1/0': true,
        '1/1/1': true
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 1);
      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).toBe(true);
    });

    it('returns true when all tiles are already loaded (part 2)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({});

      var loadedTilesByZ = {
        '1': {
          '1/0/0': true,
          '1/0/1': true,
          '1/1/0': true,
          '1/1/1': true,
          '1/1/2': true
        }
      };
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 1);

      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).toBe(true);
    });

    it('returns false when all tiles are already loaded', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({
        '1/0/0': true,
        '1/0/1': true,
        '1/1/0': true,
        '1/1/1': false
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 1);

      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).toBe(false);
    });

    it('returns false when all tiles are already loaded (part 2)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.MockTileSource({});

      var loadedTilesByZ = {
        '1': {
          '1/0/0': true,
          '1/0/1': true,
          '1/1/0': true,
          '1/1/1': false
        }
      };
      var grid = source.getTileGrid();
      var range = grid.getTileRangeForExtentAndZ(source.getExtent(), 1);

      function getTileIfLoaded(tileCoord) {
        var tile = source.getTile(tileCoord, null, null);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).toBe(false);
    });

  });

});



/**
 * Tile source for tests that uses a EPSG:4326 based grid with 4 resolutions and
 * 256x256 tiles.
 *
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {Object.<string, boolean>} loaded Lookup of already loaded tiles.
 */
ol.test.source.MockTileSource = function(loaded) {
  var extent = new ol.Extent(-180, -180, 180, 180);
  var tileGrid = new ol.tilegrid.TileGrid({
    resolutions: [360 / 256, 180 / 256, 90 / 256, 45 / 256],
    extent: extent,
    origin: new ol.Coordinate(-180, -180),
    tileSize: new ol.Size(256, 256)
  });

  goog.base(this, {
    extent: extent,
    projection: ol.projection.get('EPSG:4326'),
    tileGrid: tileGrid
  });

  /**
   * @type {Object.<string, boolean>}
   * @private
   */
  this.loaded_ = loaded;

};
goog.inherits(ol.test.source.MockTileSource, ol.source.TileSource);


/**
 * @inheritDoc
 */
ol.test.source.MockTileSource.prototype.getTile = function(tileCoord) {
  var key = tileCoord.toString();
  var tileState = this.loaded_[key] ? ol.TileState.LOADED : ol.TileState.IDLE;
  return new ol.Tile(tileCoord, tileState);
};


describe('ol.test.source.MockTileSource', function() {

  describe('constructor', function() {
    it('creates a tile source', function() {
      var source = new ol.test.source.MockTileSource({});
      expect(source).toBeA(ol.source.TileSource);
      expect(source).toBeA(ol.test.source.MockTileSource);
    });
  });

  describe('#getTile()', function() {
    it('returns a tile with state based on constructor arg', function() {
      var source = new ol.test.source.MockTileSource({
        '0/0/0': true,
        '1/0/0': true
      });
      var tile;

      // check a loaded tile
      tile = source.getTile(new ol.TileCoord(0, 0, 0));
      expect(tile).toBeA(ol.Tile);
      expect(tile.state).toBe(ol.TileState.LOADED);

      // check a tile that is not loaded
      tile = source.getTile(new ol.TileCoord(1, 0, -1));
      expect(tile).toBeA(ol.Tile);
      expect(tile.state).toBe(ol.TileState.IDLE);

      // check another loaded tile
      tile = source.getTile(new ol.TileCoord(1, 0, 0));
      expect(tile).toBeA(ol.Tile);
      expect(tile.state).toBe(ol.TileState.LOADED);

    });
  });

});

goog.require('goog.object');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.projection');
goog.require('ol.source.Source');
goog.require('ol.source.TileSource');
goog.require('ol.tilegrid.TileGrid');
