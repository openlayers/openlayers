goog.provide('ol.test.parser.ogc.WFS_v1_0_0');

describe('ol.parser.ogc.WFS_v1_0_0', function() {

  var parser = new ol.parser.ogc.WFS();

  describe('reading and writing', function() {

    it('handles read of transaction response', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1_0_0/Transaction_Response.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.insertIds.length).to.equal(2);
        expect(obj.insertIds[0]).to.equal('parcelle.40');
        expect(obj.insertIds[1]).to.equal('parcelle.41');
        expect(obj.version).to.equal('1.0.0');
        expect(obj.success).to.be(true);
        done();
      });
    });

    it('handles writing Query with BBOX Filter', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1_0_0/query0.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.WFS_v1_0_0({featureTypes: ['states'],
          featurePrefix: 'topp', featureNS: 'http://www.openplans.org/topp'});
        var filter = new ol.expr.Call(
            new ol.expr.Identifier(ol.expr.functions.EXTENT),
            [new ol.expr.Literal(1), new ol.expr.Literal(2),
              new ol.expr.Literal(3), new ol.expr.Literal(4),
              undefined,
              new ol.expr.Identifier('the_geom')]);
        var output = p.writers[p.defaultNamespaceURI]['Query'].apply(
            p, [{filter: filter, featureType: 'states'}]);
        expect(goog.dom.xml.loadXml(p.serialize(output))).to.xmleql(xml);
        done();
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.expr.Call');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Literal');
goog.require('ol.parser.ogc.WFS');
goog.require('ol.parser.ogc.WFS_v1_0_0');
