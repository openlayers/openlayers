goog.provide('ol.test.parser.ogc.WFS_v1');

describe('ol.parser.ogc.WFS', function() {

  var parser = new ol.parser.ogc.WFS();

  describe('reading and writing', function() {

    it('handles read of FeatureCollection', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1/FeatureCollection.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        done();
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.parser.ogc.WFS');
