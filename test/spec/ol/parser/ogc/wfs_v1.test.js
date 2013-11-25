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

    it('handles writing out GetFeature with a handle', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1/GetFeature.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.WFS_v1_0_0();
        var output = p.writers[p.defaultNamespaceURI]['GetFeature'].
            apply(p, [{
              featureNS: 'http://www.openplans.org/topp',
              featureTypes: ['states'],
              featurePrefix: 'topp',
              handle: 'handle_g',
              maxFeatures: 1,
              outputFormat: 'json'
            }
            ]);
        expect(goog.dom.xml.loadXml(p.serialize(output))).to.xmleql(xml);
        done();
      });
    });

    it('handles writing out Transaction with a handle', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1/Transaction.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.WFS_v1_0_0();
        var output = p.writers[p.defaultNamespaceURI]['Transaction'].
            apply(p, [{
              options: {handle: 'handle_t'}
            }
            ]);
        expect(goog.dom.xml.loadXml(p.serialize(output))).to.xmleql(xml);
        done();
      });
    });

    it('handles writing out Native', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1/Native.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.WFS_v1_1_0();
        var output = p.write(null, {nativeElements: [{
          vendorId: 'ORACLE',
          safeToIgnore: true,
          value: 'ALTER SESSION ENABLE PARALLEL DML'
        }, {
          vendorId: 'ORACLE',
          safeToIgnore: false,
          value: 'Another native line goes here'
        }]});
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('handles writing out GetFeature with > 1 typename', function(done) {
      var url = 'spec/ol/parser/ogc/xml/wfs_v1/GetFeatureMultiple.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.WFS_v1_0_0();
        var output = p.writers[p.defaultNamespaceURI]['GetFeature'].
            apply(p, [{
              featureNS: 'http://www.openplans.org/topp',
              featureTypes: ['states', 'cities'],
              featurePrefix: 'topp'
            }
            ]);
        expect(goog.dom.xml.loadXml(p.serialize(output))).to.xmleql(xml);
        done();
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.parser.ogc.WFS');
goog.require('ol.parser.ogc.WFS_v1_0_0');
goog.require('ol.parser.ogc.WFS_v1_1_0');
