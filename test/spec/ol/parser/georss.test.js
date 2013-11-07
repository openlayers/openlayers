goog.provide('ol.test.parser.georss');

describe('ol.parser.georss', function() {

  var parser = new ol.parser.GeoRSS();

  describe('Test GeoRSS parser read', function() {
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
    it('read from GeoRSS simple (point) works correctly', function(done) {
      var url = 'spec/ol/parser/georss/simple-point.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.get('title')).to.equal('M 3.2, Mona Passage');
        expect(feature.getGeometry()).to.be.a(ol.geom.Point);
        expect(feature.getGeometry().getCoordinates()).to.eql([-71.92, 45.256]);
        done();
      });
    });
    it('read from GeoRSS simple (line) works correctly', function(done) {
      var url = 'spec/ol/parser/georss/simple-line.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.get('title')).to.equal('M 3.2, Mona Passage');
        expect(feature.getGeometry()).to.be.a(ol.geom.LineString);
        expect(feature.getGeometry().getCoordinates()[0]).to.eql(
            [-110.45, 45.256, -109.48, 46.46, -109.86, 43.84]);
        done();
      });
    });
    it('read from GeoRSS simple (polygon) works correctly', function(done) {
      var url = 'spec/ol/parser/georss/simple-polygon.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.get('title')).to.equal('M 3.2, Mona Passage');
        expect(feature.getGeometry()).to.be.a(ol.geom.Polygon);
        done();
      });
    });
    it('read from GeoRSS simple (box) works correctly', function(done) {
      var url = 'spec/ol/parser/georss/simple-box.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.equal(1);
        var feature = obj.features[0];
        expect(feature.getGeometry()).to.be.a(ol.geom.Polygon);
        done();
      });
    });
    it('handles leading space correctly', function() {
      var obj = parser.read('<rss version="2.0" xmlns:georss="' +
          'http://www.georss.org/georss"><item><description>  ' +
          '<![CDATA[foo]]></description></item></rss>');
      expect(obj.features.length).to.equal(1);
      expect(obj.features[0].get('description')).to.equal('  foo');
    });
  });
  describe('Test GeoRSS parser write', function() {
    it('writes out GeoRSS simple point correctly', function() {
      var point = new ol.geom.Point([-111.04, 45.68]);
      var feature = new ol.Feature({title: 'foo'});
      feature.setGeometry(point);
      var data = parser.write({features: [feature]});
      var exp = '<rss xmlns="http://backend.userland.com/rss2"><item>' +
          '<title>foo</title>' +
          '<georss:point xmlns:georss="http://www.georss.org/georss">45.68 ' +
          '-111.04</georss:point></item></rss>';
      expect(data).to.equal(exp);
    });
    it('writes out GeoRSS simple line correctly', function() {
      var linestring = new ol.geom.LineString([[-111.04, 45.68],
            [-112.04, 45.68]]);
      var feature = new ol.Feature();
      feature.setGeometry(linestring);
      var data = parser.write({features: [feature]});
      var exp = '<rss xmlns="http://backend.userland.com/rss2"><item>' +
          '<georss:line xmlns:georss="http://www.georss.org/georss">45.68 ' +
          '-111.04 45.68 -112.04</georss:line></item></rss>';
      expect(data).to.equal(exp);
    });
    it('writes out GeoRSS simple polygon correctly', function() {
      var polygon = new ol.geom.Polygon([[
        [-110.45, 45.256],
        [-109.48, 46.46],
        [-109.86, 43.84],
        [-110.45, 45.256]
      ]]);
      var feature = new ol.Feature();
      feature.setGeometry(polygon);
      var data = parser.write({features: [feature]});
      var exp = '<rss xmlns="http://backend.userland.com/rss2"><item>' +
          '<georss:polygon xmlns:georss="http://www.georss.org/georss">' +
          '45.256 -110.45 46.46 -109.48 43.84 -109.86 45.256 -110.45' +
          '</georss:polygon></item></rss>';
      expect(data).to.equal(exp);
    });
  });
});

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.GeoRSS');
