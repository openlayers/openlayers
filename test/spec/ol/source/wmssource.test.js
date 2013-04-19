goog.provide('ol.test.source.wms');

describe('ol.source.wms', function() {

  describe('ol.source.wms.getUrl', function() {
    it('creates expected URL', function() {
      var epsg3857 = ol.projection.get('EPSG:3857');
      var extent = [-20037508.342789244, 0, -20037508.342789244, 0];
      var expected = 'http://wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=' +
          'GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&WIDTH=256&HEIGHT=256&' +
          'foo=bar&STYLES=&CRS=EPSG%3A3857&BBOX=' +
          '-20037508.342789244%2C-20037508.342789244%2C0%2C0';
      var url = ol.source.wms.getUrl('http://wms', {'foo': 'bar'},
          extent, new ol.Size(256, 256), epsg3857);
      expect(url).to.eql(expected);
    });
    it('creates expected URL respecting axis orientation', function() {
      var epsg4326 = ol.projection.get('EPSG:4326');
      var extent = [-180, 0, -90, 90];
      var expected = 'http://wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=' +
          'GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&WIDTH=256&HEIGHT=256&' +
          'foo=bar&STYLES=&CRS=EPSG%3A4326&BBOX=-90%2C-180%2C90%2C0';
      var url = ol.source.wms.getUrl('http://wms', {'foo': 'bar'},
          extent, new ol.Size(256, 256), epsg4326);
      expect(url).to.eql(expected);
    });
  });

});


goog.require('ol.Size');
goog.require('ol.projection');
goog.require('ol.source.wms');
