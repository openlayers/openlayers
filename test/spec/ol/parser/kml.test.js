goog.provide('ol.test.parser.KML');

describe('ol.parser.KML', function() {

  var parser = new ol.parser.KML();

  describe('Test KML parser', function() {
    it('Polygon read / written correctly', function(done) {
      var url = 'spec/ol/parser/kml/polygon.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var output = parser.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        expect(obj.features.length).to.eql(1);
        var geom = obj.features[0].getGeometry();
        expect(obj.features[0].getId()).to.eql('KML.Polygon');
        expect(geom instanceof ol.geom.Polygon).to.be.ok();
        done();
      });
    });
    it('Linestring read / written correctly', function(done) {
      var url = 'spec/ol/parser/kml/linestring.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var output = parser.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        expect(obj.features.length).to.eql(2);
        var geom = obj.features[0].getGeometry();
        expect(geom instanceof ol.geom.LineString).to.be.ok();
        geom = obj.features[1].getGeometry();
        expect(geom instanceof ol.geom.LineString).to.be.ok();
        done();
      });
    });
    it('Point read / written correctly', function(done) {
      var url = 'spec/ol/parser/kml/point.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var output = parser.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        expect(obj.features.length).to.eql(1);
        var geom = obj.features[0].getGeometry();
        expect(geom instanceof ol.geom.Point).to.be.ok();
        done();
      });
    });
    it('NetworkLink read correctly', function(done) {
      var url = 'spec/ol/parser/kml/networklink.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({maxDepth: 1});
        // we need to supply a callback to get visited NetworkLinks
        p.read(xml, function(obj) {
          expect(obj.features.length).to.eql(3);
          done();
        });
      });
    });
    it('NetworkLink read correctly [recursively]', function(done) {
      var url = 'spec/ol/parser/kml/networklink_depth.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({maxDepth: 2});
        // we need to supply a callback to get visited NetworkLinks
        p.read(xml, function(obj) {
          expect(obj.features.length).to.eql(2);
          done();
        });
      });
    });
    it('NetworkLink maxDepth', function(done) {
      var url = 'spec/ol/parser/kml/networklink_depth.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({maxDepth: 1});
        // we need to supply a callback to get visited NetworkLinks
        p.read(xml, function(obj) {
          // since maxDepth is 1, we will not get to the second feature
          expect(obj.features.length).to.eql(1);
          done();
        });
      });
    });
    it('Extended data read correctly', function(done) {
      var url = 'spec/ol/parser/kml/extended_data.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features[0].get('name')).to.eql('Extended data placemark');
        var description = 'Attached to the ground. Intelligently places ' +
            'itself \n       at the height of the underlying terrain.';
        expect(obj.features[0].get('description')).to.eql(description);
        expect(obj.features[0].get('foo')).to.eql('bar');
        expect(obj.features[0].getId()).to.eql('foobarbaz');
        done();
      });
    });
    it('Extended data read correctly [2]', function(done) {
      var url = 'spec/ol/parser/kml/extended_data2.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var feature = obj.features[0];
        expect(feature.get('TrailHeadName')).to.eql('Pi in the sky');
        expect(feature.get('TrailLength')).to.eql('3.14159');
        expect(feature.get('ElevationGain')).to.eql('10');
        done();
      });
    });
    it('Multi geometry read / written correctly', function(done) {
      var url = 'spec/ol/parser/kml/multigeometry.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = obj.features[0].getGeometry();
        var output = parser.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        expect(geom instanceof ol.geom.MultiLineString).to.be.ok();
        done();
      });
    });
    it('Discrete multi geometry read correctly', function(done) {
      var url = 'spec/ol/parser/kml/multigeometry_discrete.kml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = obj.features[0].getGeometry();
        var components = geom.getComponents();
        expect(geom instanceof ol.geom.GeometryCollection).to.be.ok();
        expect(components.length).to.eql(2);
        expect(components[0] instanceof ol.geom.LineString).to.be.ok();
        expect(components[1] instanceof ol.geom.Point).to.be.ok();
        done();
      });
    });
    it('Test extract tracks', function(done) {
      var url = 'spec/ol/parser/kml/macnoise.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({extractStyles: true,
          trackAttributes: ['speed', 'num']});
        var obj = p.read(xml);
        expect(obj.features.length).to.be(170);
        var attr = obj.features[4].getAttributes();
        // standard track point attributes
        expect(attr.when).to.be.a(Date);
        expect(attr.when.getTime()).to.be(1272736815000);
        expect(attr.altitude).to.be(1006);
        expect(attr.heading).to.be(230);
        expect(attr.tilt).to.be(0);
        expect(attr.roll).to.be(0);
        expect(attr.name).to.be('B752');
        expect(attr.adflag).to.be('A');
        expect(attr.flightid).to.be('DAL2973');
        expect(attr.speed).to.be('166');
        expect(attr.num).to.be('50');
        var geom = obj.features[4].getGeometry();
        expect(geom.get(0)).to.be(-93.0753620391713);
        expect(geom.get(1)).to.be(44.9879724110872);
        expect(geom.get(2)).to.be(1006);
        done();
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

    it('handles line style (read / write)', function() {
      var kml = '<kml xmlns="http://www.opengis.net/kml/2.2" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.opengis.net/kml/2.2 ' +
          'http://schemas.opengis.net/kml/2.2.0/ogckml22.xsd"> ' +
          '<Document><Placemark><Style><LineStyle> <color>870000ff</color> ' +
          '<width>10</width> </LineStyle> </Style>  <LineString> ' +
          '<coordinates> -112,36 -113,37 </coordinates> </LineString>' +
          '</Placemark></Document></kml>';
      var p = new ol.parser.KML({extractStyles: true});
      var obj = p.read(kml);
      var output = p.write(obj);
      expect(goog.dom.xml.loadXml(kml)).to.xmleql(
          goog.dom.xml.loadXml(output));

      var symbolizers = obj.features[0].getSymbolizers();
      expect(symbolizers).to.have.length(1);

      var stroke = symbolizers[0];
      expect(stroke).to.be.a(ol.style.Stroke);

      var literal = stroke.createLiteral(ol.geom.GeometryType.LINESTRING);
      expect(literal).to.be.a(ol.style.LineLiteral);
      expect(literal.color).to.eql('#ff0000');
      expect(literal.opacity).to.eql(0.5294117647058824);
      expect(literal.width).to.eql(10);
    });

    it('reads PolyStyle fill', function() {
      var kml = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '<Document><Placemark>    <Style> <PolyStyle> <fill>1</fill> ' +
          '<color>870000ff</color></PolyStyle> </Style>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' +
          '5.001370157823406,49.26855713824488 8.214706453896161,' +
          '49.630662409673505 8.397385910100951,48.45172350357396 ' +
          '5.001370157823406,49.26855713824488</coordinates></LinearRing>' +
          '</outerBoundaryIs></Polygon></Placemark><Placemark>    <Style> ' +
          '<PolyStyle><fill>0</fill><color>870000ff</color>' +
          '</PolyStyle> </Style>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' +
          '5.001370157823406,49.26855713824488 8.214706453896161,' +
          '49.630662409673505 8.397385910100951,48.45172350357396 ' +
          '5.001370157823406,49.26855713824488</coordinates></LinearRing>' +
          '</outerBoundaryIs></Polygon></Placemark></Document></kml>';
      var p = new ol.parser.KML({extractStyles: true});
      var obj = p.read(kml);

      var symbolizers = obj.features[0].getSymbolizers();
      expect(symbolizers).to.have.length(2);
      expect(symbolizers[0]).to.be.a(ol.style.Fill);
      expect(symbolizers[1]).to.be.a(ol.style.Stroke);

      var literals = ol.style.Style.createLiterals(
          symbolizers, ol.geom.GeometryType.POLYGON);
      expect(literals).to.have.length(1);

      var literal = literals[0];
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillColor).to.be('#ff0000');
      expect(literal.strokeColor).to.be('#ff0000');

      symbolizers = obj.features[1].getSymbolizers();
      expect(symbolizers).to.have.length(1);
      expect(symbolizers[0]).to.be.a(ol.style.Stroke);

      var literals = ol.style.Style.createLiterals(
          symbolizers, ol.geom.GeometryType.POLYGON);
      expect(literals).to.have.length(1);

      literal = literals[0];
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillColor).to.be(undefined);
    });

    it('writes PolyStyle fill and outline', function() {
      var kml = '<kml xmlns="http://www.opengis.net/kml/2.2" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.opengis.net/kml/2.2 ' +
          'http://schemas.opengis.net/kml/2.2.0/ogckml22.xsd"> ' +
          '<Document><Placemark><Style><PolyStyle>' +
          '<fill>1</fill><outline>0</outline>' +
          '<color>870000ff</color></PolyStyle> </Style>' +
          '<Polygon><outerBoundaryIs><LinearRing><coordinates>' +
          '5.001370157823406,49.26855713824488 8.214706453896161,' +
          '49.630662409673505 8.397385910100951,48.45172350357396 ' +
          '5.001370157823406,49.26855713824488</coordinates></LinearRing>' +
          '</outerBoundaryIs></Polygon></Placemark></Document></kml>';
      var p = new ol.parser.KML({extractStyles: true});
      var output = p.write(p.read(kml));
      expect(goog.dom.xml.loadXml(kml)).to.xmleql(
          goog.dom.xml.loadXml(output));
    });

    it('handles iconStyle (read / write)', function(done) {
      var url = 'spec/ol/parser/kml/iconstyle.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({extractStyles: true});
        var obj = p.read(xml);
        var output = p.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);

        var symbolizers = obj.features[0].getSymbolizers();
        expect(symbolizers).to.have.length(1);

        var symbolizer = symbolizers[0];
        expect(symbolizer).to.be.a(ol.style.Icon);

        var literal = symbolizer.createLiteral(ol.geom.GeometryType.POINT);
        expect(literal).to.be.a(ol.style.IconLiteral);

        var url = 'http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';
        expect(literal.url).to.eql(url);
        expect(literal.width).to.eql(32);
        expect(literal.height).to.eql(32);
        done();
      });
    });

    it('handles styleMap (read / write)', function(done) {
      var url = 'spec/ol/parser/kml/stylemap.kml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.KML({extractStyles: true});
        var obj = p.read(xml);
        var output = p.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);

        var symbolizers = obj.features[0].getSymbolizers();
        expect(symbolizers).to.have.length(1);

        var symbolizer = symbolizers[0];
        expect(symbolizer).to.be.a(ol.style.Icon);

        var literal = symbolizer.createLiteral(ol.geom.GeometryType.POINT);
        expect(literal).to.be.a(ol.style.IconLiteral);

        var url = 'http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';
        expect(literal.url).to.eql(url);
        expect(literal.width).to.eql(32);
        expect(literal.height).to.eql(32);
        done();
      });
    });
  });

  describe('parsing states.kml', function() {

    var features;
    before(function(done) {
      afterLoadXml('spec/ol/parser/kml/states.kml', function(xml) {
        var parser = new ol.parser.KML();
        var obj;
        try {
          obj = parser.read(xml);
        } catch (err) {
          return done(err);
        }
        if (!obj.features) {
          return done(new Error('Failed to parse features from doc'));
        }
        features = obj.features;
        done();
      });
    });

    it('creates 50 features', function() {
      expect(features).to.have.length(50);
    });

    it('creates features with heterogenous geometry collections', function() {
      // TODO: decide if we should instead create features with multiple geoms
      var feature = features[0];
      expect(feature).to.be.a(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.GeometryCollection);
    });

    it('parses Point and MultiPolygon for Alaska', function() {
      var alaska = goog.array.find(features, function(feature) {
        return feature.get('name') === 'Alaska';
      });
      expect(alaska).to.be.a(ol.Feature);
      var geometry = alaska.getGeometry();
      expect(geometry).to.be.a(ol.geom.GeometryCollection);
      var components = geometry.getComponents();
      expect(components).to.have.length(2);
      expect(components[0]).to.be.a(ol.geom.Point);
      expect(components[1]).to.be.a(ol.geom.MultiPolygon);
    });

  });

});

goog.require('goog.array');
goog.require('goog.dom.xml');

goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.KML');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.IconLiteral');
goog.require('ol.style.LineLiteral');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
