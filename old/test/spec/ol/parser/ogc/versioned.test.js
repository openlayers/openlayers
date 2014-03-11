goog.provide('ol.test.parser.ogc.Versioned');

describe('ol.parser.ogc.versioned', function() {

  describe('test constructor', function() {
    var parser = new ol.parser.ogc.Versioned({version: '1.0.0'});
    it('new OpenLayers.Format.XML.VersionedOGC returns object', function() {
      expect(parser instanceof ol.parser.ogc.Versioned).to.be.ok();
    });
    it('constructor sets version correctly', function() {
      expect(parser.version).to.eql('1.0.0');
    });
    it('defaultVersion should be null if not specified', function() {
      expect(parser.defaultVersion).to.be(null);
    });
    it('format has a read function', function() {
      expect(typeof(parser.read)).to.eql('function');
    });
    it('format has a write function', function() {
      expect(typeof(parser.write)).to.eql('function');
    });
  });
});

goog.require('ol.parser.ogc.Versioned');
