goog.provide('ol.test.parser.ogc.Filter_v1_1_0');

describe('ol.parser.ogc.Filter_v1_1_0', function() {

  var parser = new ol.parser.ogc.Filter_v1_1_0();

  describe('#readwrite', function() {

    it('filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/test.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.filter.Logical).to.be(true);
        expect(filter.operator).to.eql(ol.filter.LogicalOperator.OR);
        expect(filter.getFilters().length).to.eql(5);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('matchCase read correctly', function() {
      var cases = [{
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsEqualTo>' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>',
        exp: true
      }, {
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsEqualTo matchCase="1">' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>',
        exp: true
      }, {
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsEqualTo matchCase="true">' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>',
        exp: true
      }, {
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsEqualTo matchCase="0">' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>',
        exp: false
      }, {
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsEqualTo matchCase="0">' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsEqualTo>' +
            '</ogc:Filter>',
        exp: false
      }, {
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsNotEqualTo matchCase="true">' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsNotEqualTo>' +
            '</ogc:Filter>',
        exp: true
      }, {
        str:
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +
                '<ogc:PropertyIsNotEqualTo matchCase="false">' +
                    '<ogc:PropertyName>cat</ogc:PropertyName>' +
                    '<ogc:Literal>dog</ogc:Literal>' +
                '</ogc:PropertyIsNotEqualTo>' +
            '</ogc:Filter>',
        exp: false
      }];
      var filter, c;
      for (var i = 0; i < cases.length; ++i) {
        c = cases[i];
        filter = parser.read(c.str);
        expect(filter.getMatchCase()).to.eql(c.exp);
      }
    });

    it('BBOX filter written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/bbox.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        // TODO srsName in gml:Envelope
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('BBOX filter without property name written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/bbox_nogeomname.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        // TODO srsName in gml:Envelope
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('Intersects filter read / written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/intersects.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        // TODO srsName in gml:Envelope
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('Filter functions written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/function.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Spatial({
          property: 'the_geom',
          type: ol.filter.SpatialType.INTERSECTS,
          value: new ol.filter.Function({
            name: 'querySingle',
            params: ['sf:restricted', 'the_geom', 'cat=3']
          })
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('Custom filter functions written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/customfunction.xml';
      afterLoadXml(url, function(xml) {
        var filters = [
          new ol.filter.Comparison({type: ol.filter.ComparisonType.NOT_EQUAL_TO,
            matchCase: false,
            property: 'FOO',
            value: new ol.filter.Function({
              name: 'customFunction',
              params: ['param1', 'param2']
            })
          })
        ];
        var filter = new ol.filter.Logical(filters,
            ol.filter.LogicalOperator.AND);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('Nested filter functions written correctly', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/nestedfunction.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Spatial({
          property: 'the_geom',
          type: ol.filter.SpatialType.DWITHIN,
          value: new ol.filter.Function({
            name: 'collectGeometries',
            params: [
              new ol.filter.Function({
                name: 'queryCollection',
                params: ['sf:roads', 'the_geom', 'INCLUDE']
              })
            ]
          }),
          distanceUnits: 'meters',
          distance: 200
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('matchCase written correctly on Like filter', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/likematchcase.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.filter.Comparison({
          type: ol.filter.ComparisonType.LIKE,
          property: 'person',
          value: '*me*',
          matchCase: false
        });
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
      });
    });

    it('sortBy written correctly on Like filter', function() {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/sortby.xml';
      afterLoadXml(url, function(xml) {
        var writer = parser.writers['http://www.opengis.net/ogc']['SortBy'];
        var output = writer.call(parser, [{
          'property': 'Title',
          'order': 'ASC'
        },{
          'property': 'Relevance',
          'order': 'DESC'
        }]);
        expect(output).to.xmleql(xml);
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.filter.Comparison');
goog.require('ol.filter.ComparisonType');
goog.require('ol.filter.Function');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.filter.Spatial');
goog.require('ol.filter.SpatialType');
goog.require('ol.parser.ogc.Filter_v1_1_0');
