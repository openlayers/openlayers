goog.provide('ol.test.parser.gml_v2');

describe('ol.parser.gml_v2', function() {

  var parser = new ol.parser.ogc.GML_v2();

  describe('Test GML v2 parser', function() {
    it('Point read  correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/point-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('point');
        expect(obj.geometry.coordinates).to.eql([1, 2]);
      });
    });
    it('Point read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/point-coordinates.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
        expect(obj.geometry.type).to.eql('point');
        expect(obj.geometry.coordinates).to.eql([1, 2]);
      });
    });
    it('MultiPoint read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multipoint-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multipoint');
        expect(obj.geometry.parts.length).to.eql(3);
        expect(obj.geometry.parts[0].type).to.eql('point');
        expect(obj.geometry.parts[0].coordinates).to.eql([1, 2]);
        expect(obj.geometry.parts[1].coordinates).to.eql([2, 3]);
        expect(obj.geometry.parts[2].coordinates).to.eql([3, 4]);
      });
    });
    it('MultiPoint read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multipoint-coordinates.xml';
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
        expect(obj.geometry.parts[1].coordinates).to.eql([2, 3]);
        expect(obj.geometry.parts[2].coordinates).to.eql([3, 4]);
      });
    });
    it('LineString read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/linestring-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('linestring');
        expect(obj.geometry.coordinates.length).to.eql(2);
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4]]);
      });
    });
    it('LineString read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/linestring-coordinates.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
        expect(obj.geometry.type).to.eql('linestring');
        expect(obj.geometry.coordinates.length).to.eql(2);
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4]]);
      });
    });
    it('MultiLineString read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multilinestring-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multilinestring');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('linestring');
        expect(obj.geometry.parts[0].coordinates).to.eql([[1, 2], [2, 3]]);
        expect(obj.geometry.parts[1].coordinates).to.eql([[3, 4], [4, 5]]);
      });
    });
    it('MultiLineString read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multilinestring-coordinates.xml';
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
        expect(obj.geometry.parts[1].coordinates).to.eql([[3, 4], [4, 5]]);
      });
    });
    it('Polygon read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/polygon-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
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
    it('Polygon read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/polygon-coordinates.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
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
    it('MultiPolygon read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multipolygon-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('multipolygon');
        expect(obj.geometry.parts.length).to.eql(2);
        expect(obj.geometry.parts[0].type).to.eql('polygon');
      });
    });
    it('MultiPolygon read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multipolygon-coordinates.xml';
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
    it('GeometryCollection r / w correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/' +
          'geometrycollection-coordinates.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v2({srsName: 'foo',
          featureNS: 'http://foo'});
        var obj = p.read(xml);
        var geom = p.createGeometry_({geometry: obj.geometry});
        var node = p.featureNSWiters_['_geometry'].apply(p,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(p.serialize(node))).to.xmleql(xml);
        expect(obj.geometry.type).to.eql('geometrycollection');
        expect(obj.geometry.parts.length).to.eql(3);
        expect(obj.geometry.parts[0].type).to.eql('point');
        expect(obj.geometry.parts[1].type).to.eql('linestring');
        expect(obj.geometry.parts[2].type).to.eql('polygon');
      });
    });
    it('Box read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/box-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.bounds).to.eql([1, 3, 2, 4]);
      });
    });
    it('Box read correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/box-coordinates.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.bounds).to.eql([1, 3, 2, 4]);
      });
    });
    it('LinearRing read correctly from coord', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/linearring-coord.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.geometry.type).to.eql('linearring');
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4], [5, 6],
              [1, 2]]);
      });
    });
    it('LinearRing read / written correctly from coordinates', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/linearring-coordinates.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        parser.srsName = 'foo';
        var geom = parser.createGeometry_({geometry: obj.geometry});
        var node = parser.featureNSWiters_['_geometry'].apply(parser,
            [geom]).firstChild;
        expect(goog.dom.xml.loadXml(parser.serialize(node))).to.xmleql(xml);
        delete parser.srsName;
        expect(obj.geometry.type).to.eql('linearring');
        expect(obj.geometry.coordinates).to.eql([[1, 2], [3, 4], [5, 6],
              [1, 2]]);
      });
    });
    it('FeatureCollection read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/topp-states.xml';
      afterLoadXml(url, function(xml) {
        var srsName = 'http://www.opengis.net/gml/srs/epsg.xml#4326';
        var schemaLoc = 'http://www.openplans.org/topp ' +
            'http://demo.opengeo.org/geoserver/wfs?service=WFS&version=' +
            '1.0.0&request=DescribeFeatureType&typeName=topp:states ' +
            'http://www.opengis.net/wfs http://demo.opengeo.org/' +
            'geoserver/schemas/wfs/1.0.0/WFS-basic.xsd';
        var p = new ol.parser.ogc.GML_v2({srsName: srsName,
          featureType: 'states',
          featureNS: 'http://www.openplans.org/topp',
          schemaLocation: schemaLoc});
        var obj = p.read(xml);
        var output = p.write(obj);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
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
    it('Auto configure works correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/topp-states.xml';
      afterLoadXml(url, function(xml) {
        var p = new ol.parser.ogc.GML_v2();
        var obj = p.read(xml);
        expect(obj.features.length).to.eql(3);
        expect(obj.features[0].getGeometry() instanceof
            ol.geom.MultiPolygon).to.be.ok();
        expect(p.featureType).to.eql('states');
        expect(p.featureNS).to.eql('http://www.openplans.org/topp');
      });
    });
    it('Test multiple typeNames', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/multipletypenames.xml';
      afterLoadXml(url, function(xml) {
        // we should not go through autoConfig so specify featureNS
        var p = new ol.parser.ogc.GML_v2({
          featureNS: 'http://mapserver.gis.umn.edu/mapserver',
          featureType: ['LKUNSTWERK', 'PKUNSTWERK', 'VKUNSTWERK']});
        var obj = p.read(xml);
        var features = obj.features;
        expect(features.length).to.eql(3);
        expect(features[0].getGeometry() instanceof
            ol.geom.MultiPolygon).to.be.ok();
        expect(features[1].getGeometry() instanceof
            ol.geom.MultiLineString).to.be.ok();
        expect(features[2].getGeometry() instanceof
            ol.geom.MultiPoint).to.be.ok();
      });
    });
    it('Test no geometry', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/nogeom.xml';
      afterLoadXml(url, function(xml) {
        var obj = parser.read(xml);
        expect(obj.features.length).to.eql(2);
        var feature = obj.features[0];
        expect(feature.getGeometry() === null).to.be.ok();
        // TODO test bounds on feature
        // see https://github.com/openlayers/ol3/issues/566
      });
    });
    it('Test boundedBy', function() {
      var url = 'spec/ol/parser/ogc/xml/gml_v2/boundedBy.xml';
      afterLoadXml(url, function(xml) {
        parser.read(xml);
        // TODO test bounds on feature
        // see https://github.com/openlayers/ol3/issues/566
      });
    });
  });
});

goog.require('goog.dom.xml');

goog.require('ol.parser.ogc.GML_v2');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
