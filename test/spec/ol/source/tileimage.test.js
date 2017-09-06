

import _ol_ImageTile_ from '../../../../src/ol/imagetile';
import _ol_TileUrlFunction_ from '../../../../src/ol/tileurlfunction';
import _ol_events_ from '../../../../src/ol/events';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_proj_EPSG3857_ from '../../../../src/ol/proj/epsg3857';
import _ol_proj_Projection_ from '../../../../src/ol/proj/projection';
import _ol_reproj_Tile_ from '../../../../src/ol/reproj/tile';
import _ol_source_TileImage_ from '../../../../src/ol/source/tileimage';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';


describe('ol.source.TileImage', function() {
  function createSource(opt_proj, opt_tileGrid, opt_cacheSize) {
    var proj = opt_proj || 'EPSG:3857';
    return new _ol_source_TileImage_({
      cacheSize: opt_cacheSize,
      projection: proj,
      tileGrid: opt_tileGrid ||
          _ol_tilegrid_.createForProjection(proj, undefined, [2, 2]),
      tileUrlFunction: _ol_TileUrlFunction_.createFromTemplate(
          'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=')
    });
  }

  describe('#getTileCacheForProjection', function() {
    it('uses the cacheSize for reprojected tile caches', function() {
      var source = createSource(undefined, undefined, 42);
      var tileCache = source.getTileCacheForProjection(_ol_proj_.get('EPSG:4326'));
      expect(tileCache.highWaterMark).to.be(42);
      expect(tileCache).to.not.equal(source.getTileCacheForProjection(source.getProjection()));
    });
  });

  describe('#setTileGridForProjection', function() {
    it('uses the tilegrid for given projection', function() {
      var source = createSource();
      var tileGrid = _ol_tilegrid_.createForProjection('EPSG:4326', 3, [10, 20]);
      source.setTileGridForProjection('EPSG:4326', tileGrid);
      var retrieved = source.getTileGridForProjection(_ol_proj_.get('EPSG:4326'));
      expect(retrieved).to.be(tileGrid);
    });
  });

  describe('#getTileInternal', function() {
    var source, tile;

    beforeEach(function() {
      source = createSource();
      expect(source.getKey()).to.be('');
      source.getTileInternal(0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
      expect(source.tileCache.getCount()).to.be(1);
      tile = source.tileCache.get(source.getKeyZXY(0, 0, -1));
    });

    it('gets the tile from the cache', function() {
      var returnedTile = source.getTileInternal(
          0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
      expect(returnedTile).to.be(tile);
    });

    describe('change a dynamic param', function() {

      describe('tile is not loaded', function() {
        it('returns a tile with no interim tile', function() {
          source.getKey = function() {
            return 'key0';
          };
          var returnedTile = source.getTileInternal(
              0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
          expect(returnedTile).not.to.be(tile);
          expect(returnedTile.key).to.be('key0');
          expect(returnedTile.interimTile).to.be(null);
        });
      });

      describe('tile is loaded', function() {
        it('returns a tile with interim tile', function() {
          source.getKey = function() {
            return 'key0';
          };
          tile.state = 2; // LOADED
          var returnedTile = source.getTileInternal(
              0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
          expect(returnedTile).not.to.be(tile);
          expect(returnedTile.key).to.be('key0');
          expect(returnedTile.interimTile).to.be(tile);
        });
      });

      describe('tile is not loaded but interim tile is', function() {
        it('returns a tile with interim tile', function() {
          var dynamicParamsKey, returnedTile;
          source.getKey = function() {
            return dynamicParamsKey;
          };
          dynamicParamsKey = 'key0';
          tile.state = 2; // LOADED
          returnedTile = source.getTileInternal(
              0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
          dynamicParamsKey = 'key1';
          returnedTile = source.getTileInternal(
              0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
          expect(returnedTile).not.to.be(tile);
          expect(returnedTile.key).to.be('key1');
          expect(returnedTile.interimTile).to.be(tile);
        });
      });

    });

  });

  describe('#getTile', function() {
    it('does not do reprojection for identity', function() {
      var source3857 = createSource('EPSG:3857');
      var tile3857 = source3857.getTile(0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
      expect(tile3857).to.be.a(_ol_ImageTile_);
      expect(tile3857).not.to.be.a(_ol_reproj_Tile_);

      var projXXX = new _ol_proj_Projection_({
        code: 'XXX',
        units: 'degrees'
      });
      var sourceXXX = createSource(projXXX);
      var tileXXX = sourceXXX.getTile(0, 0, -1, 1, projXXX);
      expect(tileXXX).to.be.a(_ol_ImageTile_);
      expect(tileXXX).not.to.be.a(_ol_reproj_Tile_);
    });

    beforeEach(function() {
      proj4.defs('4326_noextentnounits', '+proj=longlat +datum=WGS84 +no_defs');
    });

    afterEach(function() {
      delete proj4.defs['4326_noextentnounits'];
    });

    it('can handle source projection without extent and units', function(done) {
      var source = createSource('4326_noextentnounits', _ol_tilegrid_.createXYZ({
        extent: [-180, -90, 180, 90],
        tileSize: [2, 2]
      }));
      var tile = source.getTile(0, 0, -1, 1, _ol_proj_.get('EPSG:3857'));
      expect(tile).to.be.a(_ol_reproj_Tile_);

      _ol_events_.listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          done();
        }
      });
      tile.load();
    });

    it('can handle target projection without extent and units', function(done) {
      var proj = _ol_proj_.get('4326_noextentnounits');
      var source = createSource();
      source.setTileGridForProjection(proj,
          _ol_tilegrid_.createXYZ({
            extent: _ol_proj_EPSG3857_.WORLD_EXTENT,
            tileSize: [2, 2]
          }));
      var tile = source.getTile(0, 0, -1, 1, proj);
      expect(tile).to.be.a(_ol_reproj_Tile_);

      _ol_events_.listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          done();
        }
      });
      tile.load();
    });
  });
});
