goog.provide('ol.test.parser.osm');

describe('ol.parser.osm', function() {

    var parser = new ol.parser.OSM();

    describe('Test OSM XAPI parser', function() {
        it('Parser is created', function() {
            expect(parser).to.be.a(ol.parser.OSM);
        });

        it('Node read correctly', function(done) {
            var url = 'spec/ol/parser/osm/node.xml';
            afterLoadXml(url, function(xml) {
                vvv PROBLÉM JE TADY vvv
                var obj = parser.read(xml);
                ^^^ PROBLÉM JE TADY ^^^
                expect(obj.features.length).to.eql(1);
                //var geom = obj.features[0].getGeometry();
                //expect(geom).to.be.a(ol.geom.Point);
                expect(parser).to.be.a(ol.parser.OSM);
                done();
            });
        });
    });
});

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.parser.OSM');
goog.require('goog.dom.xml');
