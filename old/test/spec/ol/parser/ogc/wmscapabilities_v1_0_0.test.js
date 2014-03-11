goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_0_0');


/**
 * @define {boolean} Whether to enable WMS Capabilities version 1.0.0.
 */
ol.ENABLE_WMSCAPS_1_0_0 = true;

describe('ol.parser.ogc.wmscapabilities_v1_0_0', function() {

  var parser = new ol.parser.ogc.WMSCapabilities();

  describe('test read', function() {
    it('Test read', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_0_0.xml';
      afterLoadXml(url, function(xml) {
        var obj;
        obj = parser.read(xml);
        expect(obj.service.keywords.length).to.eql(2);
        expect(obj.service.keywords[0]['value']).to.eql('BGDI');
        expect(obj.service.href).to.eql('https://wms.geo.admin.ch/?');
        var url = 'https://wms.geo.admin.ch/?';
        var getmap = obj.capability.request.getmap;
        expect(getmap.get.href).to.eql(url);
        expect(getmap.post.href).to.eql(url);
        expect(getmap.formats.length).to.eql(4);
        expect(getmap.formats[0]).to.eql('GIF');
        expect(obj.capability.layers[64].keywords.length).to.eql(2);
        expect(obj.capability.layers[64].keywords[0].value).to.eql('Geometer');
        done();
      });
    });
  });

});

goog.require('ol.parser.ogc.WMSCapabilities');
