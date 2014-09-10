goog.provide('ol.test.source.TileSource');

describe('ol.source.Tile', function() {

  describe('constructor', function() {
    it('returns a tile source', function() {
      var source = new ol.source.Tile({
        projection: ol.proj.get('EPSG:4326')
      });
      expect(source).to.be.a(ol.source.Source);
      expect(source).to.be.a(ol.source.Tile);
    });
  });

  describe('#findLoadedTiles()', function() {

    it('adds no tiles if none are already loaded', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({});

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 3);

      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      source.findLoadedTiles(loadedTilesByZ, getTileIfLoaded, 3, range);

      var keys = goog.object.getKeys(loadedTilesByZ);
      expect(keys.length).to.be(0);
    });

    it('adds loaded tiles to the lookup (z: 0)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({
        '0/0/0': true,
        '1/0/0': true
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 0);

      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      source.findLoadedTiles(loadedTilesByZ, getTileIfLoaded, 0, range);
      var keys = goog.object.getKeys(loadedTilesByZ);
      expect(keys.length).to.be(1);
      var tile = loadedTilesByZ['0']['0/0/0'];
      expect(tile).to.be.a(ol.Tile);
      expect(tile.state).to.be(ol.TileState.LOADED);
    });

    it('adds loaded tiles to the lookup (z: 1)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({
        '0/0/0': true,
        '1/0/0': true
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 1);

      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      source.findLoadedTiles(loadedTilesByZ, getTileIfLoaded, 1, range);
      var keys = goog.object.getKeys(loadedTilesByZ);
      expect(keys.length).to.be(1);
      var tile = loadedTilesByZ['1']['1/0/0'];
      expect(tile).to.be.a(ol.Tile);
      expect(tile.state).to.be(ol.TileState.LOADED);
    });

    it('returns true when all tiles are already loaded', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({
        '1/0/0': true,
        '1/0/1': true,
        '1/1/0': true,
        '1/1/1': true
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 1);
      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).to.be(true);
    });

    it('returns true when all tiles are already loaded (part 2)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({});

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
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 1);

      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).to.be(true);
    });

    it('returns false when all tiles are already loaded', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({
        '1/0/0': true,
        '1/0/1': true,
        '1/1/0': true,
        '1/1/1': false
      });

      var loadedTilesByZ = {};
      var grid = source.getTileGrid();
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 1);

      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).to.be(false);
    });

    it('returns false when all tiles are already loaded (part 2)', function() {
      // a source with no loaded tiles
      var source = new ol.test.source.TileMock({});

      var loadedTilesByZ = {
        '1': {
          '1/0/0': true,
          '1/0/1': true,
          '1/1/0': true,
          '1/1/1': false
        }
      };
      var grid = source.getTileGrid();
      var extent = [-180, -180, 180, 180];
      var range = grid.getTileRangeForExtentAndZ(extent, 1);

      function getTileIfLoaded(z, x, y) {
        var tile = source.getTile(z, x, y);
        return (!goog.isNull(tile) && tile.getState() === ol.TileState.LOADED) ?
            tile : null;
      }
      var loaded = source.findLoadedTiles(
          loadedTilesByZ, getTileIfLoaded, 1, range);
      expect(loaded).to.be(false);
    });

  });

});



/**
 * Tile source for tests that uses a EPSG:4326 based grid with 4 resolutions and
 * 256x256 tiles.
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {Object.<string, boolean>} loaded Lookup of already loaded tiles.
 */
ol.test.source.TileMock = function(loaded) {
  var tileGrid = new ol.tilegrid.TileGrid({
    resolutions: [360 / 256, 180 / 256, 90 / 256, 45 / 256],
    origin: [-180, -180],
    tileSize: 256
  });

  goog.base(this, {
    projection: ol.proj.get('EPSG:4326'),
    tileGrid: tileGrid
  });

  /**
   * @type {Object.<string, boolean>}
   * @private
   */
  this.loaded_ = loaded;

};
goog.inherits(ol.test.source.TileMock, ol.source.Tile);


/**
 * @inheritDoc
 */
ol.test.source.TileMock.prototype.getTile = function(z, x, y) {
  var key = ol.tilecoord.getKeyZXY(z, x, y);
  var tileState = this.loaded_[key] ? ol.TileState.LOADED : ol.TileState.IDLE;
  return new ol.Tile([z, x, y], tileState);
};


describe('ol.test.source.TileMock', function() {

  describe('constructor', function() {
    it('creates a tile source', function() {
      var source = new ol.test.source.TileMock({});
      expect(source).to.be.a(ol.source.Tile);
      expect(source).to.be.a(ol.test.source.TileMock);
    });
  });

  describe('#getTile()', function() {
    it('returns a tile with state based on constructor arg', function() {
      var source = new ol.test.source.TileMock({
        '0/0/0': true,
        '1/0/0': true
      });
      var tile;

      // check a loaded tile
      tile = source.getTile(0, 0, 0);
      expect(tile).to.be.a(ol.Tile);
      expect(tile.state).to.be(ol.TileState.LOADED);

      // check a tile that is not loaded
      tile = source.getTile(1, 0, -1);
      expect(tile).to.be.a(ol.Tile);
      expect(tile.state).to.be(ol.TileState.IDLE);

      // check another loaded tile
      tile = source.getTile(1, 0, 0);
      expect(tile).to.be.a(ol.Tile);
      expect(tile.state).to.be(ol.TileState.LOADED);

    });
  });

});

goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.proj');
goog.require('ol.source.Source');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');
