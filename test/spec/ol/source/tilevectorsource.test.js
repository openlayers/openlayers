goog.provide('ol.test.source.TileVector');


describe('ol.source.TileVector', function() {

  describe('#loadFeatures()', function() {

    it('calls tileUrlFunction with correct tile coords', function() {
      var tileCoords = [];
      var source = new ol.source.TileVector({
        format: new ol.format.TopoJSON(),
        tileGrid: ol.tilegrid.createXYZ({
          maxZoom: 19
        }),
        tileUrlFunction: function(tileCoord) {
          tileCoords.push(tileCoord.slice());
          return null;
        }
      });
      var projection = ol.proj.get('EPSG:3857');
      source.loadFeatures(
          [-8238854, 4969777, -8237854, 4970777], 4.8, projection);
      expect(tileCoords[0]).to.eql([15, 9647, -12321]);
      expect(tileCoords[1]).to.eql([15, 9647, -12320]);
      expect(tileCoords[2]).to.eql([15, 9648, -12321]);
      expect(tileCoords[3]).to.eql([15, 9648, -12320]);
    });

  });

  describe('#getTileCoordForTileUrlFunction()', function() {

    it('returns the expected tile coordinate - {wrapX: true}', function() {
      var tileSource = new ol.source.TileVector({
        format: new ol.format.TopoJSON(),
        tileGrid: ol.tilegrid.createXYZ({
          maxZoom: 19
        }),
        wrapX: true
      });
      var projection = ol.proj.get('EPSG:3857');

      var tileCoord = tileSource.getTileCoordForTileUrlFunction(
          [6, -31, -23], projection);
      expect(tileCoord).to.eql([6, 33, -23]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction(
          [6, 33, -23], projection);
      expect(tileCoord).to.eql([6, 33, -23]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction(
          [6, 97, -23], projection);
      expect(tileCoord).to.eql([6, 33, -23]);
    });

    it('returns the expected tile coordinate - {wrapX: false}', function() {
      var tileSource = new ol.source.TileVector({
        format: new ol.format.TopoJSON(),
        tileGrid: ol.tilegrid.createXYZ({
          maxZoom: 19
        }),
        wrapX: false
      });
      var projection = ol.proj.get('EPSG:3857');

      var tileCoord = tileSource.getTileCoordForTileUrlFunction(
          [6, -31, -23], projection);
      expect(tileCoord).to.eql(null);

      tileCoord = tileSource.getTileCoordForTileUrlFunction(
          [6, 33, -23], projection);
      expect(tileCoord).to.eql([6, 33, -23]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction(
          [6, 97, -23], projection);
      expect(tileCoord).to.eql(null);
    });
  });

});


goog.require('ol.format.TopoJSON');
goog.require('ol.proj');
goog.require('ol.source.TileVector');
