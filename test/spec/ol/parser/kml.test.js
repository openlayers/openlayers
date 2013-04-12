goog.provide('ol.test.parser.kml');

describe('ol.parser.kml', function() {

  var parser = new ol.parser.KML();

  describe('Test KML parser', function() {
    it('Polygon read correctly', function() {
      var url = 'spec/ol/parser/kml/polygon.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var output = parser.write(obj);
        var expected = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '<Document><name>Polygon.kml</name><open>0</open><Placemark>' +
            '<name>hollow box</name><Polygon><outerBoundaryIs><LinearRing>' +
            '<coordinates>-122.366278,37.818844,30 ' +
            '-122.365248,37.819267,30 ' +
            '-122.36564,37.819861,30 ' +
            '-122.366669,37.819429,30 ' +
            '-122.366278,37.818844,30</coordinates></LinearRing>' +
            '</outerBoundaryIs><innerBoundaryIs><LinearRing><coordinates>' +
            '-122.366212,37.818977,30 ' +
            '-122.365424,37.819294,30 ' +
            '-122.365704,37.819731,30 ' +
            '-122.366488,37.819402,30 ' +
            '-122.366212,37.818977,30</coordinates></LinearRing>' +
            '</innerBoundaryIs></Polygon></Placemark></Document></kml>';
        expect(output).to.eql(expected);
        expect(obj.features.length).to.eql(1);
        var geom = obj.features[0].getGeometry();
        expect(geom instanceof ol.geom.Polygon).to.be.ok();
        expect(geom.dimension).to.eql(3);
      });
    });
    it('Linestring read correctly', function() {
      var url = 'spec/ol/parser/kml/linestring.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var output = parser.write(obj);
        var expected = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '<Document><name>LineString.kml</name><open>1</open><Placemark>' +
            '<name>unextruded</name><LineString><coordinates>-122.364383,' +
            '37.824664,0 -122.364152,37.824322,0</coordinates></LineString>' +
            '</Placemark><Placemark><name>extruded</name><LineString>' +
            '<coordinates>-122.364167,37.824787,50 -122.363917,37.824423,50' +
            '</coordinates></LineString></Placemark></Document></kml>';
        expect(output).to.eql(expected);
        expect(obj.features.length).to.eql(2);
        var geom = obj.features[0].getGeometry();
        expect(geom instanceof ol.geom.LineString).to.be.ok();
        expect(geom.dimension).to.eql(3);
        geom = obj.features[1].getGeometry();
        expect(geom instanceof ol.geom.LineString).to.be.ok();
      });
    });
    it('Point read correctly', function() {
      var url = 'spec/ol/parser/kml/point.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var output = parser.write(obj);
        var expected = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '<Document><Placemark><name>Simple placemark</name><description>' +
            'Attached to the ground. Intelligently places itself \n' +
            '       at the height of the underlying terrain.</description>' +
            '<Point><coordinates>-122.0822035425683,37.42228990140251,0' +
            '</coordinates></Point></Placemark></Document></kml>';
        expect(output).to.eql(expected);
        expect(obj.features.length).to.eql(1);
        var geom = obj.features[0].getGeometry();
        expect(geom instanceof ol.geom.Point).to.be.ok();
        expect(geom.dimension).to.eql(3);
      });
    });
    it('NetworkLink read correctly', function(done) {
      var url = 'spec/ol/parser/kml/networklink.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({maxDepth: 1});
        // we need to supply a callback to get visited NetworkLinks
        var obj = p.read(xml, function(features) {
          expect(features.length).to.eql(3);
          done();
        });
      });
    });
    it('NetworkLink read correctly [recursively]', function(done) {
      var url = 'spec/ol/parser/kml/networklink_depth.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({maxDepth: 2});
        // we need to supply a callback to get visited NetworkLinks
        var obj = p.read(xml, function(features) {
          expect(features.length).to.eql(2);
          done();
        });
      });
    });
    it('NetworkLink maxDepth', function(done) {
      var url = 'spec/ol/parser/kml/networklink_depth.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({maxDepth: 1});
        // we need to supply a callback to get visited NetworkLinks
        var obj = p.read(xml, function(features) {
          // since maxDepth is 1, we will not get to the second feature
          expect(features.length).to.eql(1);
          done();
        });
      });
    });
    it('Extended data read correctly', function() {
      var url = 'spec/ol/parser/kml/extended_data.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features[0].get('name')).to.eql('Extended data placemark');
        var description = 'Attached to the ground. Intelligently places ' +
            'itself \n       at the height of the underlying terrain.';
        expect(obj.features[0].get('description')).to.eql(description);
        expect(obj.features[0].get('foo')).to.eql('bar');
      });
    });
    it('Extended data read correctly [2]', function() {
      var url = 'spec/ol/parser/kml/extended_data2.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var feature = obj.features[0];
        expect(feature.get('TrailHeadName')).to.eql('Pi in the sky');
        expect(feature.get('TrailLength')).to.eql('3.14159');
        expect(feature.get('ElevationGain')).to.eql('10');
      });
    });
    it('Multi geometry read correctly', function() {
      var url = 'spec/ol/parser/kml/multigeometry.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = obj.features[0].getGeometry();
        var expected = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '<Document><name>Polygon.kml</name><open>0</open><Placemark>' +
            '<name>SF Marina Harbor Master</name><MultiGeometry><LineString>' +
            '<coordinates>-122.4425587930444,37.80666418607323,0 ' +
            '-122.4428379594768,37.80663578323093,0</coordinates>' +
            '</LineString><LineString><coordinates>-122.4425509770566,' +
            '37.80662588061205,0 -122.4428340530617,37.8065999493009,0' +
            '</coordinates></LineString></MultiGeometry></Placemark>' +
            '</Document></kml>';
        var output = parser.write(obj);
        expect(output).to.eql(expected);
        expect(geom instanceof ol.geom.MultiLineString).to.be.ok();
      });
    });
    it('Discrete multi geometry read correctly', function() {
      var url = 'spec/ol/parser/kml/multigeometry_discrete.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = obj.features[0].getGeometry();
        expect(geom instanceof ol.geom.GeometryCollection).to.be.ok();
        expect(geom.components.length).to.eql(2);
        expect(geom.components[0] instanceof ol.geom.LineString).to.be.ok();
        expect(geom.components[1] instanceof ol.geom.Point).to.be.ok();
      });
    });
    it('Test extract tracks', function() {
      var url = 'spec/ol/parser/kml/macnoise.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({extractStyles: true,
          trackAttributes: ['speed', 'num']});
        var obj = p.read(xml);
        expect(obj.features.length).to.eql(170);
        var attr = obj.features[4].getAttributes();
        // standard track point attributes
        expect(attr['when'] instanceof Date).to.be.ok();
        expect(attr['when'].getTime()).to.eql(1272736815000);
        expect(attr['altitude']).to.eql(1006);
        expect(attr['heading']).to.eql(230);
        expect(attr['tilt']).to.eql(0);
        expect(attr['roll']).to.eql(0);
        expect(attr['name']).to.eql('B752');
        expect(attr['adflag']).to.eql('A');
        expect(attr['flightid']).to.eql('DAL2973');
        expect(attr['speed']).to.eql('166');
        expect(attr['num']).to.eql('50');
        var geom = obj.features[4].getGeometry();
        expect(geom.get(0)).to.eql(-93.0753620391713);
        expect(geom.get(1)).to.eql(44.9879724110872);
        expect(geom.get(2)).to.eql(1006);
      });
    });
    it('Test CDATA attributes', function() {
      var cdata = '<kml xmlns="http://earth.google.com/kml/2.0"><Document>' +
          '<Placemark><name><![CDATA[Pezinok]]> </name><description>' +
          '<![CDATA[Full of text.]]></description><styleUrl>#rel1.0' +
          '</styleUrl><Point> <coordinates>17.266666, 48.283333</coordinates>' +
          '</Point></Placemark></Document></kml>';
      var obj = parser.read(cdata);
      expect(obj.features[0].get('description')).to.eql('Full of text.');
      expect(obj.features[0].get('name')).to.eql('Pezinok');
    });
    it('Test line style', function() {
      var test_style = '<kml xmlns="http://earth.google.com/kml/2.0"> ' +
          '<Placemark>    <Style> <LineStyle> <color>870000ff</color> ' +
          '<width>10</width> </LineStyle> </Style>  <LineString> ' +
          '<coordinates> -112,36 -113,37 </coordinates> </LineString>' +
          '</Placemark></kml>';
      var p = new ol.parser.KML({extractStyles: true});
      var obj = p.read(test_style);
      var output = p.write(obj);
      var expected = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '<Document><Placemark><Style><LineStyle><color>870000ff</color>' +
          '<width>10</width></LineStyle></Style><LineString><coordinates>' +
          '-112,36 -113,37</coordinates></LineString></Placemark>' +
          '</Document></kml>';
      expect(output).to.eql(expected);
      var symbolizer = obj.features[0].getSymbolizerLiterals()[0];
      expect(symbolizer instanceof ol.style.LineLiteral).to.be.ok();
      expect(symbolizer.strokeColor).to.eql('#ff0000');
      expect(symbolizer.opacity).to.eql(0.5294117647058824);
      expect(symbolizer.strokeWidth).to.eql(10);
    });
    it('Test style fill', function() {
      var test_style_fill = '<kml xmlns="http://earth.google.com/kml/2.0"> ' +
          '<Placemark>    <Style> <PolyStyle> <fill>1</fill> ' +
          '<color>870000ff</color> <width>10</width> </PolyStyle> </Style>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' +
          '5.001370157823406,49.26855713824488 8.214706453896161,' +
          '49.630662409673505 8.397385910100951,48.45172350357396 ' +
          '5.001370157823406,49.26855713824488</coordinates></LinearRing>' +
          '</outerBoundaryIs></Polygon></Placemark><Placemark>    <Style> ' +
          '<PolyStyle><fill>0</fill><color>870000ff</color><width>10</width> ' +
          '</PolyStyle> </Style>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' +
          '5.001370157823406,49.26855713824488 8.214706453896161,' +
          '49.630662409673505 8.397385910100951,48.45172350357396 ' +
          '5.001370157823406,49.26855713824488</coordinates></LinearRing>' +
          '</outerBoundaryIs></Polygon></Placemark></kml>';
      var p = new ol.parser.KML({extractStyles: true});
      var obj = p.read(test_style_fill);
      var output = p.write(obj);
      var expected = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>' +
          '<Placemark><Style><PolyStyle><fill>1</fill><color>870000ff' +
          '</color><width>10</width></PolyStyle></Style><Polygon>' +
          '<outerBoundaryIs><LinearRing><coordinates>5.001370157823406,' +
          '49.26855713824488 8.214706453896161,49.630662409673505 ' +
          '8.397385910100951,48.45172350357396 5.001370157823406,' +
          '49.26855713824488</coordinates></LinearRing></outerBoundaryIs>' +
          '</Polygon></Placemark><Placemark><Style><PolyStyle><fill>0</fill>' +
          '<color>00000ff</color><width>10</width></PolyStyle></Style>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' +
          '5.001370157823406,49.26855713824488 8.214706453896161,' +
          '49.630662409673505 8.397385910100951,48.45172350357396 ' +
          '5.001370157823406,49.26855713824488</coordinates></LinearRing>' +
          '</outerBoundaryIs></Polygon></Placemark></Document></kml>';
      expect(output).to.eql(expected);
      var symbolizer1 = obj.features[0].getSymbolizerLiterals()[0];
      var symbolizer2 = obj.features[1].getSymbolizerLiterals()[0];
      expect(symbolizer1.fillColor).to.eql('#ff0000');
      expect(symbolizer2.opacity).to.eql(0);
    });
    it('Test iconStyle', function() {
      var url = 'spec/ol/parser/kml/iconstyle.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({extractStyles: true});
        var obj = p.read(xml);
        var output = p.write(obj);
        var expected = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '<Document><Style id="pushpin"><IconStyle id="mystyle">' +
            '<Icon><href>http://maps.google.com/mapfiles/kml/pushpin/' +
            'ylw-pushpin.png</href></Icon></IconStyle></Style>' +
            '<Placemark><name>Pin on a mountaintop</name><styleUrl>' +
            '#pushpin</styleUrl><Point><coordinates>170.1435558771009,' +
            '-43.60505741890396,0</coordinates></Point></Placemark>' +
            '</Document></kml>';
        expect(output).to.eql(expected);
        var symbolizer = obj.features[0].getSymbolizerLiterals()[0];
        var url = 'http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';
        expect(symbolizer.url).to.eql(url);
        expect(symbolizer.width).to.eql(32);
        expect(symbolizer.height).to.eql(32);
      });
    });
  });
});

goog.require('goog.net.XhrIo');

goog.require('ol.Feature');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.KML');
goog.require('ol.style.LineLiteral');
