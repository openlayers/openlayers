goog.provide('ol.test.parser.ogc.Filter_v1_0_0');

describe('ol.parser.ogc.Filter_v1_0_0', function() {

  var parser = new ol.parser.ogc.Filter_v1_0_0();

  describe('#readwrite', function() {

    it('intersects filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/intersects.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Call).to.be(true);
        expect(filter.getCallee().getName()).to.equal(
            ol.expr.functions.INTERSECTS);
        var args = filter.getArgs();
        var geom = args[0];
        expect(geom.getValue() instanceof ol.geom.Polygon).to.be(true);
        expect(args[2].getName()).to.equal('Geometry');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('within filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/within.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Call).to.be(true);
        expect(filter.getCallee().getName()).to.equal(ol.expr.functions.WITHIN);
        var args = filter.getArgs();
        var geom = args[0];
        expect(geom.getValue() instanceof ol.geom.Polygon).to.be(true);
        expect(args[2].getName()).to.equal('Geometry');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('contains filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/contains.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Call).to.be(true);
        expect(filter.getCallee().getName()).to.equal(
            ol.expr.functions.CONTAINS);
        var args = filter.getArgs();
        var geom = args[0];
        expect(geom.getValue() instanceof ol.geom.Polygon).to.be(true);
        expect(args[2].getName()).to.equal('Geometry');
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('between filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/between.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Logical).to.be.ok();
        expect(filter.getOperator()).to.equal(ol.expr.LogicalOp.AND);
        expect(filter.getLeft() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getLeft().getOperator()).to.equal(
            ol.expr.ComparisonOp.GTE);
        expect(filter.getLeft().getLeft().getName()).to.equal('number');
        expect(filter.getLeft().getRight().getValue()).to.equal(0);
        expect(filter.getRight() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getRight().getOperator()).to.equal(
            ol.expr.ComparisonOp.LTE);
        expect(filter.getRight().getLeft().getName()).to.equal('number');
        expect(filter.getRight().getRight().getValue()).to.equal(100);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('between filter read correctly without literals', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/between2.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Logical).to.be.ok();
        expect(filter.getOperator()).to.equal(ol.expr.LogicalOp.AND);
        expect(filter.getLeft() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getLeft().getOperator()).to.equal(
            ol.expr.ComparisonOp.GTE);
        expect(filter.getLeft().getLeft().getName()).to.equal('number');
        expect(filter.getLeft().getRight().getValue()).to.equal(0);
        expect(filter.getRight() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getRight().getOperator()).to.equal(
            ol.expr.ComparisonOp.LTE);
        expect(filter.getRight().getLeft().getName()).to.equal('number');
        expect(filter.getRight().getRight().getValue()).to.equal(100);
        done();
      });
    });

    it('null filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/null.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getLeft().getName()).to.equal('prop');
        expect(filter.getRight().getValue()).to.equal(null);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('BBOX written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/bbox.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(
            new ol.expr.Identifier(ol.expr.functions.EXTENT),
            [new ol.expr.Literal(-180), new ol.expr.Literal(-90),
              new ol.expr.Literal(180), new ol.expr.Literal(90),
              new ol.expr.Literal('EPSG:4326'),
              new ol.expr.Identifier('the_geom')]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('BBOX without geometry name written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/bbox_nogeom.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(
            new ol.expr.Identifier(ol.expr.functions.EXTENT),
            [new ol.expr.Literal(-180), new ol.expr.Literal(-90),
              new ol.expr.Literal(180), new ol.expr.Literal(90),
              new ol.expr.Literal('EPSG:4326')]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('reads DWithin', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/dwithin.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter).to.be.a(ol.expr.Call);
        var callee = filter.getCallee();
        expect(callee).to.be.a(ol.expr.Identifier);
        var name = callee.getName();
        expect(name).to.equal(ol.expr.functions.DWITHIN);
        var args = filter.getArgs();
        expect(args.length).to.equal(5);
        var distance = args[1];
        expect(distance).to.be.a(ol.expr.Literal);
        expect(distance.getValue()).to.equal(1000);
        var units = args[2];
        expect(units).to.be.a(ol.expr.Literal);
        expect(units.getValue()).to.equal('m');
        done();
      });
    });

    it('DWithin written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/dwithin.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(new ol.expr.Identifier(
            ol.expr.functions.DWITHIN),
            [new ol.expr.Literal(new ol.geom.Point([2488789, 289552])),
              new ol.expr.Literal(1000), new ol.expr.Literal('m'),
              new ol.expr.Literal(null), new ol.expr.Identifier('Geometry')]);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        filter = parser.read(xml);
        output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

  });

  // the Filter Encoding spec doesn't allow for FID filters inside logical
  // filters however, to be liberal, we will write them without complaining
  describe('#logicalfid', function() {

    it('logical filter [OR] with fid filter written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/logicalfeatureid.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Logical(ol.expr.LogicalOp.OR,
            new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.LIKE),
            [new ol.expr.Identifier('person'), new ol.expr.Literal('me'),
              new ol.expr.Literal('*'), new ol.expr.Literal('.'),
              new ol.expr.Literal('!')]),
            new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.FID),
            [new ol.expr.Literal('foo.1'), new ol.expr.Literal('foo.2')]));
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('logical filter [AND] with fid filter written correctly',
        function(done) {
          var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/' +
              'logicalfeatureidand.xml';
          afterLoadXml(url, function(xml) {
            var filter = new ol.expr.Logical(ol.expr.LogicalOp.AND,
                new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.LIKE),
                [new ol.expr.Identifier('person'), new ol.expr.Literal('me'),
                  new ol.expr.Literal('*'), new ol.expr.Literal('.'),
                  new ol.expr.Literal('!')]),
                new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.FID),
                [new ol.expr.Literal('foo.1'), new ol.expr.Literal('foo.2')]));
            var output = parser.write(filter);
            expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
            done();
          });
        });

    it('logical filter [NOT] with fid filter written correctly',
        function(done) {
          var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/' +
              'logicalfeatureidnot.xml';
          afterLoadXml(url, function(xml) {
            var filter = new ol.expr.Not(
                new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.FID),
                    [new ol.expr.Literal('foo.2')]));
            var output = parser.write(filter);
            expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
            done();
          });
        });

  });

  describe('_expression reader works as expected', function() {
    it('_expression reader handles combined propertyname and literal',
        function() {
          var xml = '<ogc:UpperBoundary xmlns:ogc="' +
              'http://www.opengis.net/ogc">10</ogc:UpperBoundary>';
          var reader = parser.readers['http://www.opengis.net/ogc'][
              '_expression'];
          var expr = reader.call(parser, goog.dom.xml.loadXml(
              xml).documentElement);
          expect(expr instanceof ol.expr.Literal).to.be.ok();
          expect(expr.getValue()).to.equal(10);
          xml = '<ogc:UpperBoundary xmlns:ogc="http://www.opengis.net/ogc">' +
              'foo<ogc:PropertyName>x</ogc:PropertyName>bar</ogc:UpperBoundary>';
          expr = reader.call(parser, goog.dom.xml.loadXml(xml).documentElement);
          expect(expr.evaluate({x: 4})).to.eql('foo4bar');
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
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.ogc.Filter_v1_0_0');
