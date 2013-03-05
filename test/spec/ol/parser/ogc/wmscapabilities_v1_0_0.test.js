goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_0_0');

describe('ol.parser.ogc.wmscapabilities_v1_0_0', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read', function() {
    it('Test read', function() {
      var obj;
      runs(function() {
        var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_0_0.xml';
        goog.net.XhrIo.send(url, function(e) {
          var xhr = e.target;
          obj = parser.read(xhr.getResponseXml());
        });
      });
      waitsFor(function() {
        return (obj !== undefined);
      }, 'XHR timeout', 1000);
      runs(function() {
        expect(obj.service.keywords.length).toEqual(2);
        expect(obj.service.keywords[0]['value']).toEqual('BGDI');
        expect(obj.service.href).toEqual('https://wms.geo.admin.ch/?');
        var url = 'https://wms.geo.admin.ch/?';
        var getmap = obj.capability.request.getmap;
        expect(getmap.get.href).toEqual(url);
        expect(getmap.post.href).toEqual(url);
        expect(getmap.formats.length).toEqual(4);
        expect(getmap.formats[0]).toEqual('GIF');
        expect(obj.capability.layers[64].keywords.length).toEqual(2);
        expect(obj.capability.layers[64].keywords[0].value).toEqual('Geometer');
      });
    });
  });

});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');
