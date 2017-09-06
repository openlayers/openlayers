

import _ol_VectorImageTile_ from '../../../../src/ol/vectorimagetile';
import _ol_VectorTile_ from '../../../../src/ol/vectortile';
import _ol_format_MVT_ from '../../../../src/ol/format/mvt';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_source_VectorTile_ from '../../../../src/ol/source/vectortile';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';

describe('ol.source.VectorTile', function() {

  var format = new _ol_format_MVT_();
  var source = new _ol_source_VectorTile_({
    format: format,
    tilePixelRatio: 8,
    url: 'spec/ol/data/{z}-{x}-{y}.vector.pbf'
  });
  var tile;

  describe('constructor', function() {
    it('sets the format on the instance', function() {
      expect(source.format_).to.equal(format);
    });

    it('uses ol.VectorTile as default tileClass', function() {
      expect(source.tileClass).to.equal(_ol_VectorTile_);
    });

    it('creates a 512 XYZ tilegrid by default', function() {
      var tileGrid = _ol_tilegrid_.createXYZ({tileSize: 512});
      expect(source.tileGrid.tileSize_).to.equal(tileGrid.tileSize_);
      expect(source.tileGrid.extent_).to.equal(tileGrid.extent_);
    });
  });

  describe('#getTile()', function() {
    it('creates a tile with the correct tile class', function() {
      tile = source.getTile(0, 0, 0, 1, _ol_proj_.get('EPSG:3857'));
      expect(tile).to.be.a(_ol_VectorImageTile_);
    });
    it('sets the correct tileCoord on the created tile', function() {
      expect(tile.getTileCoord()).to.eql([0, 0, 0]);
    });
    it('fetches tile from cache when requested again', function() {
      expect(source.getTile(0, 0, 0, 1, _ol_proj_.get('EPSG:3857')))
          .to.equal(tile);
    });
  });

  describe('#getTileGridForProjection', function() {
    it('creates a tile grid with the source tile grid\'s tile size', function() {
      var tileGrid = source.getTileGridForProjection(_ol_proj_.get('EPSG:3857'));
      expect(tileGrid.getTileSize(0)).to.be(512);
    });
  });

  describe('Tile load events', function() {
    it('triggers tileloadstart and tileloadend with ol.VectorTile', function(done) {
      tile = source.getTile(14, 8938, -5681, 1, _ol_proj_.get('EPSG:3857'));
      var started = false;
      source.on('tileloadstart', function() {
        started = true;
      });
      source.on('tileloadend', function(e) {
        expect(started).to.be(true);
        expect(e.tile).to.be.a(_ol_VectorTile_);
        expect(e.tile.getFeatures().length).to.be(1327);
        done();
      });
      tile.load();
    });
  });

});
