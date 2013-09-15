goog.provide('ol.test.source.wms');

describe('ol.source.wms', function() {

  describe('ol.source.wms.getUrl', function() {
    it('creates expected URL', function() {
      var epsg3857 = ol.proj.get('EPSG:3857');
      var extent = [-20037508.342789244, -20037508.342789244, 0, 0];
      var expected = 'http://wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=' +
          'GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&WIDTH=256&HEIGHT=256&' +
          'foo=bar&STYLES=&CRS=EPSG%3A3857&BBOX=' +
          '-20037508.342789244%2C-20037508.342789244%2C0%2C0';
      var url = ol.source.wms.getUrl('http://wms', {'foo': 'bar'},
          extent, [256, 256], epsg3857);
      expect(url).to.eql(expected);
    });
    it('creates expected URL respecting axis orientation', function() {
      var epsg4326 = ol.proj.get('EPSG:4326');
      var extent = [-180, -90, 0, 90];
      var expected = 'http://wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=' +
          'GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&WIDTH=256&HEIGHT=256&' +
          'foo=bar&STYLES=&CRS=EPSG%3A4326&BBOX=-90%2C-180%2C90%2C0';
      var url = ol.source.wms.getUrl('http://wms', {'foo': 'bar'},
          extent, [256, 256], epsg4326);
      expect(url).to.eql(expected);
    });
  });

  describe('ol.source.wms.getFeatureInfo', function() {
    it('calls a callback with a feature info IFRAME as result', function(done) {
      ol.source.wms.getFeatureInfo('?REQUEST=GetMap&VERSION=1.3&LAYERS=foo',
          [5, 10], {params: {'INFO_FORMAT': 'text/plain'}},
          function(info) {
            expect(info).to.eql('<iframe seamless src="' +
                '?REQUEST=GetFeatureInfo&VERSION=1.3&LAYERS=foo&QUERY_LAYERS=' +
                'foo&INFO_FORMAT=text%2Fplain&I=5&J=10"></iframe>');
            done();
          });
    });
    it('can do xhr to retrieve feature info', function(done) {
      ol.source.wms.getFeatureInfo('?REQUEST=GetMap&VERSION=1.1.1&LAYERS=foo',
          [5, 10], {method: ol.source.WMSGetFeatureInfoMethod.XHR_GET},
          function(info) {
            expect(info).to.contain('<html>');
            done();
          });
    });
  });

});


goog.require('ol.proj');
goog.require('ol.source.WMSGetFeatureInfoMethod');
goog.require('ol.source.wms');
