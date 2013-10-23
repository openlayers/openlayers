goog.provide('ol.test.parser.ogc.WFS_v1_1_0');

describe('ol.parser.ogc.WFS_v1_1_0', function() {

  var parser = new ol.parser.ogc.WFS();

  describe('reading and writing', function() {

    it('handles read of transaction response', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1_1_0/TransactionResponse.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.insertIds.length).to.equal(2);
        expect(obj.insertIds[0]).to.equal('parcelle.40');
        expect(obj.insertIds[1]).to.equal('parcelle.41');
        expect(obj.version).to.equal('1.1.0');
        expect(obj.success).to.be(true);
        done();
      });
    });

    it('handles read of number of features', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1_1_0/NumberOfFeatures.xml';
      afterLoadXml(url, function(xml) {
        // the XML does not contain a version attribute on the root node
        var p = new ol.parser.ogc.WFS_v1_1_0();
        var obj = p.read(xml);
        expect(obj.numberOfFeatures).to.equal(625);
        done();
      });
    });

    it('handles read of boundedBy on the FeatureCollection', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1_1_0/boundedBy.xml';
      afterLoadXml(url, function(xml) {
        // the XML does not contain a version attribute on the root node
        var p = new ol.parser.ogc.WFS_v1_1_0();
        var obj = p.read(xml);
        expect(obj.bounds[0]).to.equal(3197.88);
        expect(obj.bounds[1]).to.equal(306457.313);
        expect(obj.bounds[2]).to.equal(280339.156);
        expect(obj.bounds[3]).to.equal(613850.438);
        done();
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.parser.ogc.WFS');
goog.require('ol.parser.ogc.WFS_v1_1_0');
