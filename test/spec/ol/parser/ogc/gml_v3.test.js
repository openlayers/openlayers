goog.provide('ol.test.parser.gml_v3');

describe('ol.parser.gml_v3', function() {

  var parser = new ol.parser.ogc.GML_v3();

  describe('Test GML v3 parser', function() {
    it('Envelope read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/envelope.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.bounds).to.eql([1, 3, 2, 4]);
      });
    });
    it('LinearRing read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/linearring.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = parser.createGeometry_({geometry: obj.geometry});
        parser.srsName = 'foo';
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        delete parser.srsName;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('linearring');
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4], [5, 6],
              [1, 2]]);
      });
    });
    it('Linestring read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/linestring.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = parser.createGeometry_({geometry: obj.geometry});
        parser.srsName = 'foo';
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        delete parser.srsName;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('linestring');
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4]]);
      });
    });
    it('Linestring 3D read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/linestring3d.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        // no write test since simple features only does 2D
        expect(obj.geometry.type).to.eql('linestring');
        expect(obj.geometry.coordinates).to.eql([[1, 2, 3], [4, 5, 6]]);
      });
    });
    it('Curve read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/curve.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v3({curve: true, srsName: 'foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('linestring');
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4]]);
      });
    });
    it('MultiLineString plural read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multilinestring-plural.xml';
      afterLoadXml(url, function(xml) {
        // no write test for plural, we only write singular
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multilinestring');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('linestring');
      });
    });
    it('MultiLineString singular read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multilinestring-singular.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v3({multiCurve: false, srsName: 'foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('multilinestring');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('linestring');
      });
    });
    it('MultiCurve singular read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multicurve-singular.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
        expect(obj.geometry.type).to.eql('multilinestring');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('linestring');
        expect(obj.geometry.parts[0].coordinates).to.eql([[1, 2], [2, 3]]);
      });
    });
    it('MultiCurve curve read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multicurve-curve.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v3({curve: true, srsName: 'foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('multilinestring');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('linestring');
        expect(obj.geometry.parts[0].coordinates).to.eql([[1, 2], [2, 3]]);
      });
    });
    it('MultiPoint plural read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multipoint-plural.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multipoint');
        expect(obj.geometry.parts.length).to.eql(3);
        expect(obj.geometry.parts[0].type).to.eql('point');
        expect(obj.geometry.parts[0].coordinates).to.eql([1, 2]);
      });
    });
    it('MultiPoint singular read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multipoint-singular.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
        expect(obj.geometry.type).to.eql('multipoint');
        expect(obj.geometry.parts.length).to.eql(3);
        expect(obj.geometry.parts[0].type).to.eql('point');
        expect(obj.geometry.parts[0].coordinates).to.eql([1, 2]);
      });
    });
    it('MultiPolygon plural read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multipolygon-plural.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multipolygon');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('polygon');
      });
    });
    it('MultiPolygon singular read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multipolygon-singular.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v3({multiSurface: false, srsName: 'foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('multipolygon');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('polygon');
      });
    });
    it('MultiSurface plural read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multisurface-plural.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multipolygon');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('polygon');
      });
    });
    it('MultiSurface singular read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multisurface-singular.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
        expect(obj.geometry.type).to.eql('multipolygon');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('polygon');
      });
    });
    it('MultiSurface surface read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/multisurface-surface.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v3({surface: true, srsName: 'foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('multipolygon');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('polygon');
      });
    });
    it('Point read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/point.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = parser.createGeometry_({geometry: obj.geometry});
        parser.srsName = 'foo';
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        delete parser.srsName;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('point');
        expect(obj.geometry.coordinates).to.eql([1, 2]);
      });
    });
    it('Polygon read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/polygon.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        var geom = parser.createGeometry_({geometry: obj.geometry});
        parser.srsName = 'foo';
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        delete parser.srsName;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('polygon');
        expect(obj.geometry.coordinates.length).to.eql(3);
        expect(obj.geometry.coordinates[0].length).to.eql(4);
        expect(obj.geometry.coordinates[0]).to.eql([[1, 2], [3, 4],
              [5, 6], [1, 2]]);
        expect(obj.geometry.coordinates[1]).to.eql([[2, 3], [4, 5],
              [6, 7], [2, 3]]);
        expect(obj.geometry.coordinates[2]).to.eql([[3, 4], [5, 6],
              [7, 8], [3, 4]]);
      });
    });
    it('Surface read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/surface.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v3({surface: true, srsName: 'foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('polygon');
        expect(obj.geometry.coordinates.length).to.eql(3);
        expect(obj.geometry.coordinates[0].length).to.eql(4);
        expect(obj.geometry.coordinates[0]).to.eql([[1, 2], [3, 4],
              [5, 6], [1, 2]]);
        expect(obj.geometry.coordinates[1]).to.eql([[2, 3], [4, 5],
              [6, 7], [2, 3]]);
        expect(obj.geometry.coordinates[2]).to.eql([[3, 4], [5, 6],
              [7, 8], [3, 4]]);
      });
    });
    it('FeatureCollection from GML read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/topp-states-gml.xml';
      afterLoadXml(url, function(xml) {
        var srsName = 'urn:x-ogc:def:crs:EPSG:4326';
        var schemaLoc = 'http://www.openplans.org/topp ' +
            'http://demo.opengeo.org/geoserver/wfs?service=WFS&version=' +
            '1.1.0&request=DescribeFeatureType&typeName=topp:states ' +
            'http://www.opengis.net/gml ' +
            'http://schemas.opengis.net/gml/3.2.1/gml.xsd';
        var p = new ol.parser.ogc.GML_v3({srsName: srsName,
          schemaLocation: schemaLoc});
        var obj = p.read(xml);
        var output = p.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        expect(p.geometryName).to.eql('the_geom');
        expect(obj.features.length).to.eql(10);
        var feature = obj.features[0];
        expect(feature.getGeometry() instanceof
            ol.geom.MultiPolygon).to.be.ok();
        var attributes = feature.getAttributes();
        expect(feature.getFeatureId()).to.eql('states.1');
        expect(attributes['STATE_NAME']).to.eql('Illinois');
        expect(attributes['STATE_FIPS']).to.eql('17');
        expect(attributes['SUB_REGION']).to.eql('E N Cen');
        expect(attributes['STATE_ABBR']).to.eql('IL');
        expect(attributes['LAND_KM']).to.eql('143986.61');
      });
    });
    it('FeatureCollection from WFS read correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/topp-states-wfs.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.eql(3);
        var feature = obj.features[0];
        expect(feature.getGeometry() instanceof
            ol.geom.MultiPolygon).to.be.ok();
        var attributes = feature.getAttributes();
        expect(feature.getFeatureId()).to.eql('states.1');
        expect(attributes['STATE_NAME']).to.eql('Illinois');
        expect(attributes['STATE_FIPS']).to.eql('17');
        expect(attributes['SUB_REGION']).to.eql('E N Cen');
        expect(attributes['STATE_ABBR']).to.eql('IL');
        expect(attributes['LAND_KM']).to.eql('143986.61');
      });
    });
    it('Read autoConfig', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/topp-states-wfs.xml';
      afterLoadXml(url, function(xml) {
        parser.read(xml);
        expect(parser.featureType).to.eql('states');
        expect(parser.featureNS).to.eql('http://www.openplans.org/topp');
        expect(parser.autoConfig === true).to.be.ok();
        parser.autoConfig = false;
        parser.read(xml);
        expect(parser.autoConfig === false).to.be.ok();
        parser.autoConfig = true;
      });
    });
    it('Empty attribute', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/empty-attribute.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.eql(1);
        var attr = obj.features[0].getAttributes();
        expect(attr['name']).to.eql('Aflu');
        expect(attr['foo']).to.eql(undefined);
        expect(attr['empty']).to.eql('');
      });
    });
    it('Repeated name', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v3/repeated-name.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.eql(1);
        var atts = obj.features[0].getAttributes();
        expect(atts['zoning']).to.eql('I-L');
      });
    });
  });
});

goog.require('goog.dom.xml');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.parser.ogc.GML_v3');
