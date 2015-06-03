goog.provide('ol.test.source.TileVector');


describe('ol.source.TileVector', function() {

  describe('#loadFeatures()', function() {

    it('calls tileUrlFunction with correct tile coords', function() {
      var tileCoords = [];
      var source = new ol.source.TileVector({
        format: new ol.format.TopoJSON(),
        projection: 'EPSG:3857',
        tileGrid: ol.tilegrid.createXYZ({
          maxZoom: 19
        }),
        tileUrlFunction: function(tileCoord) {
          tileCoords.push(tileCoord.slice());
          return null;
        }
      });
      source.loadFeatures(
          [-8238854, 4969777, -8237854, 4970777], 4.8, source.getProjection());
      expect(tileCoords[0]).to.eql([15, 9647, 12320]);
      expect(tileCoords[1]).to.eql([15, 9647, 12319]);
      expect(tileCoords[2]).to.eql([15, 9648, 12320]);
      expect(tileCoords[3]).to.eql([15, 9648, 12319]);
    });

  });

});


goog.require('ol.format.TopoJSON');
goog.require('ol.source.TileVector');
