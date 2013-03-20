goog.provide('ol.source.test.wms');

describe('ol.source.wms', function() {

  describe('ol.source.wms.getUrl', function() {
    it('creates expected URL', function() {
      var epsg3857 = ol.projection.get('EPSG:3857');
      var tileGrid = ol.tilegrid.getForProjection(epsg3857);
      var tileUrlFunction = ol.TileUrlFunction.createFromParamsFunction(
          'http://wms', {'foo': 'bar'}, ol.source.wms.getUrl);
      var tileCoord = new ol.TileCoord(1, 0, 0);
      var tileUrl = tileUrlFunction(tileCoord, tileGrid, epsg3857);
      var expected = 'http://wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=' +
          'GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&WIDTH=256&HEIGHT=256&' +
          'foo=bar&STYLES=&CRS=EPSG%3A3857&BBOX=' +
          '-20037508.342789244%2C-20037508.342789244%2C0%2C0';
      expect(tileUrl).to.eql(expected);
    });
    it('creates expected URL respecting axis orientation', function() {
      var epsg4326 = ol.projection.get('EPSG:4326');
      var tileGrid = ol.tilegrid.getForProjection(epsg4326);
      var tileUrlFunction = ol.TileUrlFunction.createFromParamsFunction(
          'http://wms', {'foo': 'bar'}, ol.source.wms.getUrl);
      var tileCoord = new ol.TileCoord(1, 0, 0);
      var tileUrl = tileUrlFunction(tileCoord, tileGrid, epsg4326);
      var expected = 'http://wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=' +
          'GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&WIDTH=256&HEIGHT=256&' +
          'foo=bar&STYLES=&CRS=EPSG%3A4326&BBOX=-90%2C-180%2C90%2C0';
      expect(tileUrl).to.eql(expected);
    });
  });

});


goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.projection');
goog.require('ol.source.wms');
