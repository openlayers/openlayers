

goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.format.MVT');
goog.require('ol.proj');
goog.require('ol.source.VectorTile');
goog.require('ol.tilegrid');

describe('ol.source.VectorTile', function() {

  var format = new ol.format.MVT();
  var source = new ol.source.VectorTile({
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
      expect(source.tileClass).to.equal(ol.VectorTile);
    });

    it('creates a 512 XYZ tilegrid by default', function() {
      var tileGrid = ol.tilegrid.createXYZ({tileSize: 512});
      expect(source.tileGrid.tileSize_).to.equal(tileGrid.tileSize_);
      expect(source.tileGrid.extent_).to.equal(tileGrid.extent_);
    });
  });

  describe('#getTile()', function() {
    it('creates a tile with the correct tile class', function() {
      tile = source.getTile(0, 0, 0, 1, ol.proj.get('EPSG:3857'));
      expect(tile).to.be.a(ol.VectorImageTile);
    });
    it('sets the correct tileCoord on the created tile', function() {
      expect(tile.getTileCoord()).to.eql([0, 0, 0]);
    });
    it('fetches tile from cache when requested again', function() {
      expect(source.getTile(0, 0, 0, 1, ol.proj.get('EPSG:3857')))
          .to.equal(tile);
    });
  });

  describe('#getTileGridForProjection', function() {
    it('creates a tile grid with the source tile grid\'s tile size', function() {
      var tileGrid = source.getTileGridForProjection(ol.proj.get('EPSG:3857'));
      expect(tileGrid.getTileSize(0)).to.be(512);
    });
  });

  describe('Tile load events', function() {
    it('triggers tileloadstart and tileloadend with ol.VectorTile', function(done) {
      tile = source.getTile(14, 8938, -5681, 1, ol.proj.get('EPSG:3857'));
      var started = false;
      source.on('tileloadstart', function() {
        started = true;
      });
      source.on('tileloadend', function(e) {
        expect(started).to.be(true);
        expect(e.tile).to.be.a(ol.VectorTile);
        expect(e.tile.getFeatures().length).to.be(1327);
        done();
      });
      tile.load();
    });
  });

});
