goog.provide('ol.test.parser.osm');

describe('ol.parser.osm', function() {

    var parser = new ol.parser.OSM();
    var feature;

    describe('Test OSM XAPI parser', function() {
        it('Parser is created', function() {
            expect(parser).to.be.a(ol.parser.OSM);
        });

        it('Node read correctly', function(done) {
            var url = 'spec/ol/parser/osm/node.xml';
            afterLoadXml(url, function(xml) {
                var obj = parser.read(xml);
                expect(obj.features.length).to.eql(1);
                feature = obj.features[0];
                done();
            });
        });

        it('Feature attributes', function() {
            var geom = feature.getGeometry();
            expect(geom).to.be.a(ol.geom.Point);
        });
    });
});

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.parser.OSM');
goog.require('goog.dom.xml');
