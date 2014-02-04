goog.provide('ol.test.parser.ogc.WMSCapabilities');

describe('test WMSCapabilities', function() {
  describe('test getVersion', function() {
    var snippet = '<WMS_Capabilities version="1.3.0" ' +
        'xmlns="http://www.opengis.net/wms"><Service></Service>' +
        '</WMS_Capabilities>';
    var snippet2 = '<WMS_Capabilities xmlns="http://www.opengis.net/wms">' +
        '<Service></Service></WMS_Capabilities>';
    it('Version taken from document', function() {
      var parser = new ol.parser.ogc.WMSCapabilities();
      var data = parser.read(snippet);
      expect(data.version).to.eql('1.3.0');
    });
    it('Version taken from parser takes preference', function() {
      var parser = new ol.parser.ogc.WMSCapabilities({version: '1.1.0'});
      var data = parser.read(snippet);
      expect(data.version).to.eql('1.1.0');
    });
    it('If nothing else is set, defaultVersion should be returned', function() {
      var parser = new ol.parser.ogc.WMSCapabilities({defaultVersion: '1.1.1'});
      var data = parser.read(snippet2);
      expect(data.version).to.eql('1.1.1');
    });
    var parser = new ol.parser.ogc.WMSCapabilities({defaultVersion: '1.1.1'});
    it('Version from options returned', function() {
      var version = parser.getVersion(null, {version: '1.3.0'});
      expect(version).to.eql('1.3.0');
    });
    var msg = 'defaultVersion returned if no version specified in options ' +
        'and no version on the format';
    it(msg, function() {
      var version = parser.getVersion(null);
      expect(version).to.eql('1.1.1');
    });
    msg = 'version returned of the Format if no version specified in options';
    it(msg, function() {
      parser.version = '1.1.0';
      var version = parser.getVersion(null);
      expect(version).to.eql('1.1.0');
    });
  });
});

goog.require('ol.parser.ogc.WMSCapabilities');
