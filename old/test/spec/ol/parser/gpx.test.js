goog.provide('ol.test.parser.gpx');

describe('ol.parser.gpx', function() {

  var parser = new ol.parser.GPX();

  describe('Test GPX parser', function() {
    it('Read works correctly', function(done) {
      var url = 'spec/ol/parser/gpx/data.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.eql(3);
        // waypoint feature
        var feature = obj.features[0];
        var geom = feature.getGeometry();
        expect(geom.getType()).to.eql(ol.geom.GeometryType.POINT);
        expect(geom.getCoordinates()).to.eql([-0.1853562259, 51.3697845627]);
        // route feature
        feature = obj.features[1];
        geom = feature.getGeometry();
        var attributes = feature.getAttributes();
        expect(geom.getType()).to.eql(ol.geom.GeometryType.LINESTRING);
        expect(geom.getCoordinates()).to.eql([[-0.1829991904, 51.3761803674],
              [-0.1758887005, 51.3697894659], [-0.1833202965, 51.3639790884],
              [-0.1751119509, 51.3567607069]]);
        expect(attributes['name']).to.eql('Route8');
        expect(attributes['type']).to.eql('Route');
        // track feature
        feature = obj.features[2];
        geom = feature.getGeometry();
        attributes = feature.getAttributes();
        expect(geom.getType()).to.eql(ol.geom.GeometryType.LINESTRING);
        expect(geom.getCoordinates()).to.eql([[-0.1721292044, 51.3768216433],
              [-0.1649230916, 51.370833767], [-0.1736741378, 51.3644368725],
              [-0.166259525, 51.3576354272]]);
        expect(attributes['name']).to.eql('Track');
        expect(attributes['type']).to.eql('Track');
        done();
      });
    });
    it('Write works correctly for points', function() {
      var feature1 = new ol.Feature({name: 'foo', description: 'bar'});
      feature1.setGeometry(new ol.geom.Point([-111.04, 45.68]));
      var feature2 = new ol.Feature({name: 'foo', description: 'bar'});
      feature2.setGeometry(new ol.geom.Point([-112.04, 45.68]));
      var output = parser.write({features: [feature1, feature2]});
      var expected = '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'version="1.1" creator="OpenLayers" xsi:schemaLocation="' +
          'http://www.topografix.com/GPX/1/1 http://www.topografix.com/' +
          'GPX/1/1/gpx.xsd" xmlns:xsi="http://www.w3.org/2001/' +
          'XMLSchema-instance"><wpt lon="-111.04" lat="45.68"><name>foo' +
          '</name><desc>bar</desc></wpt><wpt lon="-112.04" lat="45.68">' +
          '<name>foo</name><desc>bar</desc></wpt></gpx>';
      expect(goog.dom.xml.loadXml(expected)).to.xmleql(
          goog.dom.xml.loadXml(output));
    });
    it('Write works correctly for lines', function() {
      var feature1 = new ol.Feature({name: 'foo', description: 'bar'});
      feature1.setGeometry(new ol.geom.LineString([[-111.04, 45.68],
            [-112.04, 45.68]]));
      var feature2 = new ol.Feature({name: 'dude', description: 'truite'});
      feature2.setGeometry(new ol.geom.LineString([[1, 2], [3, 4]]));
      var output = parser.write({features: [feature1, feature2]});
      var expected = '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'version="1.1" creator="OpenLayers" xsi:schemaLocation="' +
          'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/' +
          '1/1/gpx.xsd" xmlns:xsi="http://www.w3.org/2001/' +
          'XMLSchema-instance"><trk><name>foo</name><desc>bar</desc><trkseg>' +
          '<trkpt lon="-111.04" lat="45.68"/><trkpt lon="-112.04" lat="' +
          '45.68"/></trkseg></trk><trk><name>dude</name><desc>truite</desc>' +
          '<trkseg><trkpt lon="1" lat="2"/><trkpt lon="3" lat="4"/></trkseg>' +
          '</trk></gpx>';
      expect(goog.dom.xml.loadXml(expected)).to.xmleql(
          goog.dom.xml.loadXml(output));
    });
    it('Write works correctly for multilines', function() {
      var multi = new ol.geom.MultiLineString([[[-111.04, 45.68],
              [-112.04, 45.68]], [[1, 2], [3, 4]]]);
      var feature = new ol.Feature({name: 'foo', description: 'bar'});
      feature.setGeometry(multi);
      var output = parser.write({features: [feature]});
      var expected = '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'version="1.1" creator="OpenLayers" xsi:schemaLocation="' +
          'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/' +
          '1/1/gpx.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-' +
          'instance"><trk><name>foo</name><desc>bar</desc><trkseg><trkpt' +
          ' lon="-111.04" lat="45.68"/><trkpt lon="-112.04" lat="45.68"/>' +
          '</trkseg><trkseg><trkpt lon="1" lat="2"/><trkpt lon="3" lat="4"/>' +
          '</trkseg></trk></gpx>';
      expect(goog.dom.xml.loadXml(expected)).to.xmleql(
          goog.dom.xml.loadXml(output));
    });
    it('Write works correctly for polygon', function() {
      var polygon = new ol.geom.Polygon([[[-111.04, 45.68],
              [-112.04, 45.68], [-111.04, 45.68]]]);
      var feature = new ol.Feature({name: 'foo', description: 'bar'});
      feature.setGeometry(polygon);
      var output = parser.write({features: [feature]});
      var expected = '<gpx xmlns="http://www.topografix.com/GPX/1/1"' +
          ' version="1.1" creator="OpenLayers" xsi:schemaLocation="http://' +
          'www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/' +
          'gpx.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<trk><name>foo</name><desc>bar</desc><trkseg><trkpt lon="-111.04"' +
          ' lat="45.68"/><trkpt lon="-112.04" lat="45.68"/><trkpt lon="' +
          '-111.04" lat="45.68"/></trkseg></trk></gpx>';
      expect(goog.dom.xml.loadXml(expected)).to.xmleql(
          goog.dom.xml.loadXml(output));
    });
    it('Write works correctly for metadata', function() {
      var output = parser.write({features: [], metadata: {'name': 'foo',
        'desc': 'bar'}});
      var expected = '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'version="1.1" creator="OpenLayers" xsi:schemaLocation="http://' +
          'www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/' +
          'gpx.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<metadata><name>foo</name><desc>bar</desc></metadata></gpx>';
      expect(goog.dom.xml.loadXml(expected)).to.xmleql(
          goog.dom.xml.loadXml(output));
    });
  });
});

goog.require('ol.geom.GeometryType');
goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.GPX');
