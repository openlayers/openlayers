goog.provide('ol.test.parser.ogc.Filter_v1_0_0');

describe('ol.parser.ogc.Filter_v1_0_0', function() {

  var parser = new ol.parser.ogc.Filter_v1_0_0();

  describe('#readwrite', function() {

    it('intersects filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/intersects.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Spatial).to.be(true);
        expect(filter.getType()).to.eql(ol.filter.SpatialType.INTERSECTS);
        var geom = filter.getValue();
        expect(geom instanceof ol.geom.Polygon).to.be(true);
        expect(filter.getProperty()).to.eql('Geometry');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('within filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/within.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Spatial).to.be(true);
        expect(filter.getType()).to.eql(ol.filter.SpatialType.WITHIN);
        var geom = filter.getValue();
        expect(geom instanceof ol.geom.Polygon).to.be(true);
        expect(filter.getProperty()).to.eql('Geometry');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('contains filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/contains.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Spatial).to.be(true);
        expect(filter.getType()).to.eql(ol.filter.SpatialType.CONTAINS);
        var geom = filter.getValue();
        expect(geom instanceof ol.geom.Polygon).to.be(true);
        expect(filter.getProperty()).to.eql('Geometry');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('between filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/between.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Comparison).to.be.ok();
        expect(filter.getType()).to.eql(ol.filter.ComparisonType.BETWEEN);
        expect(filter.getProperty()).to.eql('number');
        expect(filter.getLowerBoundary()).to.eql(0);
        expect(filter.getUpperBoundary()).to.eql(100);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('between filter read correctly without literals', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/between2.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Comparison).to.be.ok();
        expect(filter.getType()).to.eql(ol.filter.ComparisonType.BETWEEN);
        expect(filter.getProperty()).to.eql('number');
        expect(filter.getLowerBoundary()).to.eql(0);
        expect(filter.getUpperBoundary()).to.eql(100);
      });
    });

    it('null filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/null.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Comparison).to.be.ok();
        expect(filter.getType()).to.eql(ol.filter.ComparisonType.IS_NULL);
        expect(filter.getProperty()).to.eql('prop');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('BBOX written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/bbox.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Spatial({
          type: ol.filter.SpatialType.BBOX,
          property: 'the_geom',
          value: [-180, -90, 180, 90],
          projection: 'EPSG:4326'
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('BBOX without geometry name written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/bbox_nogeom.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Spatial({
          type: ol.filter.SpatialType.BBOX,
          value: [-180, -90, 180, 90],
          projection: 'EPSG:4326'
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('DWithin written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/dwithin.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Spatial({
          type: ol.filter.SpatialType.DWITHIN,
          property: 'Geometry',
          value: new ol.geom.Point([2488789, 289552]),
          distance: 1000,
          distanceUnits: 'm'
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        filter = parser.read(xml);
        output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

  });

  // the Filter Encoding spec doesn't allow for FID filters inside logical
  // filters however, to be liberal, we will write them without complaining
  describe('#logicalfid', function() {

    it('logical filter [OR] with fid filter written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/logicalfeatureid.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Logical([
          new ol.filter.Comparison({
            type: ol.filter.ComparisonType.LIKE,
            property: 'person',
            value: 'me'
          }),
          new ol.filter.FeatureId({'foo.1': true, 'foo.2': true})
        ], ol.filter.LogicalOperator.OR);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('logical filter [AND] with fid filter written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/logicalfeatureidand.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Logical([
          new ol.filter.Comparison({
            type: ol.filter.ComparisonType.LIKE,
            property: 'person',
            value: 'me'
          }),
          new ol.filter.FeatureId({'foo.1': true, 'foo.2': true})
        ], ol.filter.LogicalOperator.AND);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('logical filter [NOT] with fid filter written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/logicalfeatureidnot.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Logical([
          new ol.filter.FeatureId({'foo.2': true})
        ], ol.filter.LogicalOperator.NOT);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

  });

  describe('#date', function() {

    it('date writing works as expected', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/betweendates.xml';
      afterLoadXml(url, function(xml) {
        // ISO 8601: 2010-11-27T18:19:15.123Z
        var start = new Date(Date.UTC(2010, 10, 27, 18, 19, 15, 123));
        // ISO 8601: 2011-12-27T18:19:15.123Z
        var end = new Date(Date.UTC(2011, 11, 27, 18, 19, 15, 123));
        var filter = new ol.filter.Comparison({
          type: ol.filter.ComparisonType.BETWEEN,
          property: 'when',
          lowerBoundary: start,
          upperBoundary: end
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.filter.Comparison');
goog.require('ol.filter.ComparisonType');
goog.require('ol.filter.FeatureId');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.filter.Spatial');
goog.require('ol.filter.SpatialType');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.ogc.Filter_v1_0_0');
