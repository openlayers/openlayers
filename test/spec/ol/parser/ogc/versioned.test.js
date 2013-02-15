goog.provide('ol.test.parser.ogc.Versioned');

describe('ol.parser.ogc.versioned', function() {

  var snippet = '<foo version="2.0.0"></foo>';
  var snippet2 = '<foo></foo>';

  describe('test constructor', function() {
    var parser = new ol.parser.ogc.Versioned({version: '1.0.0'});
    it('new OpenLayers.Format.XML.VersionedOGC returns object', function() {
      expect(parser instanceof ol.parser.ogc.Versioned).toBeTruthy();
    });
    it('constructor sets version correctly', function() {
      expect(parser.version).toEqual('1.0.0');
    });
    it('defaultVersion should be null if not specified', function() {
      expect(parser.defaultVersion).toBeNull();
    });
    it('format has a read function', function() {
      expect(typeof(parser.read)).toEqual('function');
    });
    it('format has a write function', function() {
      expect(typeof(parser.write)).toEqual('function');
    });
  });
});

goog.require('ol.parser.ogc.Versioned');
