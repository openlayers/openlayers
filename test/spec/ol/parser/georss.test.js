goog.provide('ol.test.parser.georss');

describe('ol.parser.georss', function() {

  var parser = new ol.parser.GeoRSS();

  describe('Test GeoRSS parser', function() {
    it('read from Atom works correctly', function(done) {
      var url = 'spec/ol/parser/georss/7day-M2.5.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(234);
        var feature = obj.features[0];
        expect(feature.get('title')).to.eql(
            'M 5.2, south of the Mariana Islands');
        expect(feature.getGeometry()).to.be.a(ol.geom.Point);
        expect(feature.getGeometry().getCoordinates()).to.eql([143.1261,
          11.8126]);
        done();
      });
    });
    it('read from w3c geo works correctly', function(done) {
      var url = 'spec/ol/parser/georss/w3cgeo.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.getGeometry()).to.be.a(ol.geom.Point);
        expect(feature.getGeometry().getCoordinates()).to.eql([-1, 1]);
        done();
      });
    });
    it('reading georss box works correctly', function(done) {
      var url = 'spec/ol/parser/georss/box.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.getGeometry()).to.be.a(ol.geom.Polygon);
        done();
      });
    });
    it('read from GeoRSS GML encoding works correctly', function(done) {
      var url = 'spec/ol/parser/georss/gml.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.get('title')).to.equal('Central Square');
        expect(feature.getGeometry()).to.be.a(ol.geom.Polygon);
        done();
      });
    });
  });
});

goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.GeoRSS');
