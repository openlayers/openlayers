goog.provide('ol.test.parser.ogc.Filter_v1_0_0');

describe('ol.parser.ogc.Filter_v1_0_0', function() {

  var parser = new ol.parser.ogc.Filter_v1_0_0();

  describe('#readwrite', function() {

    it('intersects filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/intersects.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Call).to.be(true);
        expect(filter.getCallee().getName()).to.eql(
            ol.expr.functions.INTERSECTS);
        var args = filter.getArgs();
        var geom = args[0];
        expect(geom instanceof ol.geom.Polygon).to.be(true);
        expect(args[2]).to.eql('Geometry');
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
        expect(filter.getCallee().getName()).to.eql(ol.expr.functions.WITHIN);
        var args = filter.getArgs();
        var geom = args[0];
        expect(geom instanceof ol.geom.Polygon).to.be(true);
        expect(args[2]).to.eql('Geometry');
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
        expect(filter.getCallee().getName()).to.eql(
            ol.expr.functions.CONTAINS);
        var args = filter.getArgs();
        var geom = args[0];
        expect(geom instanceof ol.geom.Polygon).to.be(true);
        expect(args[2]).to.eql('Geometry');
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
        expect(filter.getOperator()).to.eql(ol.expr.LogicalOp.AND);
        expect(filter.getLeft() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getLeft().getOperator()).to.eql(ol.expr.ComparisonOp.GTE);
        expect(filter.getLeft().getLeft()).to.eql('number');
        expect(filter.getLeft().getRight()).to.eql(0);
        expect(filter.getRight() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getRight().getOperator()).to.eql(
            ol.expr.ComparisonOp.LTE);
        expect(filter.getRight().getLeft()).to.eql('number');
        expect(filter.getRight().getRight()).to.eql(100);
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
        expect(filter.getOperator()).to.eql(ol.expr.LogicalOp.AND);
        expect(filter.getLeft() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getLeft().getOperator()).to.eql(ol.expr.ComparisonOp.GTE);
        expect(filter.getLeft().getLeft()).to.eql('number');
        expect(filter.getLeft().getRight()).to.eql(0);
        expect(filter.getRight() instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getRight().getOperator()).to.eql(
            ol.expr.ComparisonOp.LTE);
        expect(filter.getRight().getLeft()).to.eql('number');
        expect(filter.getRight().getRight()).to.eql(100);
        done();
      });
    });

    it('null filter read / written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/null.xml';
      afterLoadXml(url, function(xml) {
        var filter = parser.read(xml);
        expect(filter instanceof ol.expr.Comparison).to.be.ok();
        expect(filter.getLeft()).to.eql('prop');
        expect(filter.getRight()).to.eql(null);
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
            [-180, -90, 180, 90, 'EPSG:4326', 'the_geom']);
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
            [-180, -90, 180, 90, 'EPSG:4326']);
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
        done();
      });
    });

    it('DWithin written correctly', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/dwithin.xml';
      afterLoadXml(url, function(xml) {
        var filter = new ol.expr.Call(new ol.expr.Identifier(
            ol.expr.functions.DWITHIN),
            [new ol.geom.Point([2488789, 289552]), 1000, 'm', undefined,
             'Geometry']);
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
            ['person', 'me', '*', '.', '!']),
            new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.FID),
            ['foo.1', 'foo.2']));
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
                ['person', 'me', '*', '.', '!']),
                new ol.expr.Call(new ol.expr.Identifier(ol.expr.functions.FID),
                ['foo.1', 'foo.2']));
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
                    ['foo.2']));
            var output = parser.write(filter);
            expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
            done();
          });
        });

  });

  describe('#date', function() {

    it('date writing works as expected', function(done) {
      var url = 'spec/ol/parser/ogc/xml/filter_v1_0_0/betweendates.xml';
      afterLoadXml(url, function(xml) {
        // ISO 8601: 2010-11-27T18:19:15.123Z
        var start = new Date(Date.UTC(2010, 10, 27, 18, 19, 15, 123));
        // ISO 8601: 2011-12-27T18:19:15.123Z
        var end = new Date(Date.UTC(2011, 11, 27, 18, 19, 15, 123));
        var filter = new ol.expr.Logical(ol.expr.LogicalOp.AND,
            new ol.expr.Comparison(ol.expr.ComparisonOp.GTE, 'when', start),
            new ol.expr.Comparison(ol.expr.ComparisonOp.LTE, 'when', end));
        var output = parser.write(filter);
        expect(goog.dom.xml.loadXml(output)).to.xmleql(xml);
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
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.ogc.Filter_v1_0_0');
