goog.provide('ol.test.parser.ogc.Filter_v1_1_0');

describe('ol.parser.ogc.Filter_v1_1_0', function() {

  var parser = new ol.parser.ogc.Filter_v1_1_0();

  describe('reading and writing', function() {

    it('reads filter', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/test.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Logical).to.be(true);
        expect(filter.getOperator()).to.equal(ol.expr.LogicalOp.OR);
        var filters = [];
        parser.getSubfiltersForLogical_(filter, filters);
        expect(filters.length).to.equal(5);
        expect(filters[0]).to.eql(new ol.expr.Logical(ol.expr.LogicalOp.AND,
            new ol.expr.Comparison(
                ol.expr.ComparisonOp.GTE, new ol.expr.Identifier('number'),
                new ol.expr.Literal(1064866676)),
            new ol.expr.Comparison(
                ol.expr.ComparisonOp.LTE, new ol.expr.Identifier('number'),
                new ol.expr.Literal(1065512599))));
        expect(filters[1]).to.eql(new ol.expr.Not(new ol.expr.Comparison(
            ol.expr.ComparisonOp.LTE, new ol.expr.Identifier('FOO'),
            new ol.expr.Literal(5000))));
        expect(filters[2] instanceof ol.expr.Call).to.be(true);
        expect(filters[2].getCallee().getName()).to.equal(
            ol.expr.functions.LIKE);
        expect(filters[2].getArgs()).to.eql([new ol.expr.Identifier('cat'),
              new ol.expr.Literal('*dog.food!*good'), new ol.expr.Literal('*'),
              new ol.expr.Literal('.'), new ol.expr.Literal('!'),
              new ol.expr.Literal(null)]);
        expect(filters[3] instanceof ol.expr.Call).to.be(true);
        expect(filters[3].getCallee().getName()).to.equal(
            ol.expr.functions.IEQ);
        expect(filters[3].getArgs()).to.eql([new ol.expr.Identifier('cat'),
              new ol.expr.Literal('dog')]);
        expect(filters[4] instanceof ol.expr.Comparison).to.be(true);
        expect(filters[4].getOperator()).to.equal(ol.expr.ComparisonOp.EQ);
        expect(filters[4].getLeft().getName()).to.equal('cat');
        expect(filters[4].getRight().getValue()).to.equal('dog');
        done();
      });
    });

    it('reads matchCase', function() {
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
        expect(matchCase).to.equal(c.exp);
      }
    });

    it('writes BBOX', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/bbox.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('writes BBOX without property name', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/bbox_nogeomname.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('handles intersects', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/intersects.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('handles functions', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/function.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(new ol.expr.Identifier(
            ol.expr.functions.INTERSECTS),
            [new ol.expr.Call(new ol.expr.Identifier('querySingle'),
             [new ol.expr.Literal('sf:restricted'),
               new ol.expr.Literal('the_geom'),
               new ol.expr.Literal('cat=3')]), new ol.expr.Literal(null),
             new ol.expr.Identifier('the_geom')]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('writes custom functions', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/customfunction.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Logical(ol.expr.LogicalOp.AND,
            new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.INEQ),
            [new ol.expr.Identifier('FOO'), new ol.expr.Call(
            new ol.expr.Identifier('customFunction'),
            [new ol.expr.Literal('param1'), new ol.expr.Literal('param2')])]));
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('writes nested functions', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/nestedfunction.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(new ol.expr.Identifier(
            ol.expr.functions.DWITHIN),
            [new ol.expr.Call(new ol.expr.Identifier('collectGeometries'),
             [new ol.expr.Call(new ol.expr.Identifier('queryCollection'),
              [new ol.expr.Literal('sf:roads'),
               new ol.expr.Literal('the_geom'),
               new ol.expr.Literal('INCLUDE')])]), new ol.expr.Literal(200),
              new ol.expr.Literal('meters'),
             new ol.expr.Literal(null), new ol.expr.Identifier('the_geom')]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('writes matchCase on like', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/likematchcase.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(
            new ol.expr.Identifier(ol.expr.functions.LIKE),
            [new ol.expr.Identifier('person'), new ol.expr.Literal('*me*'),
             new ol.expr.Literal('*'), new ol.expr.Literal('.'),
             new ol.expr.Literal('!'), new ol.expr.Literal(false)]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('writes sortBy on like', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_1_0/sortby.xml';
      afterLoadXml(url, function(xml) {
        var writer = parser.writers['http://www.opengis.net/ogc']['SortBy'];
        var output = writer.call(parser, [{
          'property': new ol.expr.Identifier('Title'),
          'order': new ol.expr.Literal('ASC')
        },{
          'property': new ol.expr.Identifier('Relevance'),
          'order': new ol.expr.Literal('DESC')
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
goog.require('ol.expr.Literal');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.expr.Not');
goog.require('ol.expr.functions');
goog.require('ol.parser.ogc.Filter_v1_1_0');
