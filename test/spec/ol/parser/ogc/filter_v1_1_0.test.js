goog.provide('ol.test.parser.ogc.Filter_v1_1_0');

describe('ol.parser.ogc.Filter_v1_1_0', function() {

  var parser = new ol.parser.ogc.Filter_v1_1_0();

  describe('#readwrite', function() {

    it('filter read correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/test.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Logical).to.be(true);
        expect(filter.getOperator()).to.eql(ol.expr.LogicalOp.OR);
        var filters = [];
        parser.getSubfiltersForLogical_(filter, filters);
        expect(filters.length).to.eql(5);
        expect(filters[0]).to.eql(new ol.expr.Logical(ol.expr.LogicalOp.AND,
            new ol.expr.Comparison(
                ol.expr.ComparisonOp.GTE, 'number', 1064866676),
            new ol.expr.Comparison(
                ol.expr.ComparisonOp.LTE, 'number', 1065512599)));
        expect(filters[1]).to.eql(new ol.expr.Not(new ol.expr.Comparison(
            ol.expr.ComparisonOp.LTE, 'FOO', 5000)));
        expect(filters[2] instanceof ol.expr.Call).to.be(true);
        expect(filters[2].getCallee().getName()).to.eql(
            ol.expr.functions.LIKE);
        expect(filters[2].getArgs()).to.eql(['cat', '*dog.food!*good', '*',
          '.', '!', null]);
        expect(filters[3] instanceof ol.expr.Call).to.be(true);
        expect(filters[3].getCallee().getName()).to.eql(
            ol.expr.functions.IEQ);
        expect(filters[3].getArgs()).to.eql(['cat', 'dog']);
        expect(filters[4] instanceof ol.expr.Comparison).to.be(true);
        expect(filters[4].getOperator()).to.eql(ol.expr.ComparisonOp.EQ);
        expect(filters[4].getLeft()).to.eql('cat');
        expect(filters[4].getRight()).to.eql('dog');
        done();
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
        var matchCase = (filter instanceof ol.expr.Call) ? false : true;
        expect(matchCase).to.eql(c.exp);
      }
    });

    it('BBOX filter written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/bbox.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('BBOX filter without property name written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/bbox_nogeomname.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('Intersects filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/intersects.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('Filter functions written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/function.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(new ol.expr.Identifier(
            ol.expr.functions.INTERSECTS),
            [new ol.expr.Call(new ol.expr.Identifier('querySingle'),
             ['sf:restricted', 'the_geom',
               'cat=3']), undefined, 'the_geom']);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('Custom filter functions written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/customfunction.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Logical(ol.expr.LogicalOp.AND,
            new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.INEQ),
            ['FOO', new ol.expr.Call(new ol.expr.Identifier('customFunction'),
             ['param1', 'param2'])]));
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('Nested filter functions written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/nestedfunction.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(new ol.expr.Identifier(
            ol.expr.functions.DWITHIN),
            [new ol.expr.Call(new ol.expr.Identifier('collectGeometries'),
             [new ol.expr.Call(new ol.expr.Identifier('queryCollection'),
              ['sf:roads', 'the_geom', 'INCLUDE'])]), 200, 'meters',
             undefined, 'the_geom']);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('matchCase written correctly on Like filter', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/likematchcase.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(
            new ol.expr.Identifier(ol.expr.functions.LIKE),
            ['person', '*me*', '*', '.', '!', false]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('sortBy written correctly on Like filter', function(done) {
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
        done();
      });
    });

  });

});

goog.require('goog.dom.xml');
goog.require('ol.expr');
goog.require('ol.expr.Call');
goog.require('ol.expr.Comparison');
goog.require('ol.expr.ComparisonOp');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.expr.Not');
goog.require('ol.expr.functions');
goog.require('ol.parser.ogc.Filter_v1_1_0');
