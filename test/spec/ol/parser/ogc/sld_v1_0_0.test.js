goog.provide('ol.test.parser.ogc.SLD_v1_0_0');


describe('ol.parser.ogc.SLD_v1_0_0', function() {

  var parser = new ol.parser.ogc.SLD();
  var obj;

  describe('reading and writing', function() {
    it('Handles reading', function(done) {
      var url = 'spec/ol/parser/ogc/xml/sld_v1_0_0.xml';
      afterLoadXml(url, function(xml) {
        obj = parser.read(xml);
        expect(obj.version).to.equal('1.0.0');
        var style = obj.namedLayers['AAA161'].userStyles[0];
        expect(style).to.be.a(ol.style.Style);
        expect(style.rules_.length).to.equal(2);
        var first = style.rules_[0];
        expect(first).to.be.a(ol.style.Rule);
        expect(first.filter_).to.be.a(ol.expr.Comparison);
        expect(first.filter_.getLeft()).to.be.a(ol.expr.Identifier);
        expect(first.filter_.getLeft().getName()).to.equal('CTE');
        expect(first.filter_.getOperator()).to.equal(ol.expr.ComparisonOp.EQ);
        expect(first.filter_.getRight()).to.be.a(ol.expr.Literal);
        expect(first.filter_.getRight().getValue()).to.equal('V0305');
        expect(first.getSymbolizers().length).to.equal(3);
        expect(first.getSymbolizers()[0]).to.be.a(ol.style.Fill);
        expect(first.getSymbolizers()[0].getColor().getValue()).to.equal(
            '#ffffff');
        expect(first.getSymbolizers()[0].getOpacity().getValue()).to.equal(1);
        expect(first.getSymbolizers()[1]).to.be.a(ol.style.Stroke);
        expect(first.getSymbolizers()[1].getColor().getValue()).to.equal(
            '#000000');
        expect(first.getSymbolizers()[2]).to.be.a(ol.style.Text);
        expect(first.getSymbolizers()[2].getText()).to.be.a(ol.expr.Call);
        expect(first.getSymbolizers()[2].getText().getArgs().length).to.equal(
            3);
        expect(first.getSymbolizers()[2].getText().getArgs()[0]).to.be.a(
            ol.expr.Literal);
        expect(first.getSymbolizers()[2].getText().getArgs()[0].getValue()).
            to.equal('A');
        expect(first.getSymbolizers()[2].getText().getArgs()[1]).to.be.a(
            ol.expr.Identifier);
        expect(first.getSymbolizers()[2].getText().getArgs()[1].getName()).
            to.equal('FOO');
        expect(first.getSymbolizers()[2].getText().getArgs()[2]).to.be.a(
            ol.expr.Literal);
        expect(first.getSymbolizers()[2].getText().getArgs()[2].getValue()).
            to.equal('label');
        expect(first.getSymbolizers()[2].getColor().getValue()).to.equal(
            '#000000');
        expect(first.getSymbolizers()[2].getFontFamily().getValue()).to.equal(
            'Arial');
        expect(first.getSymbolizers()[2].getStroke()).to.be.a(ol.style.Stroke);
        expect(first.getSymbolizers()[2].getStroke().getColor().getValue())
            .to.equal('#ffffff');
        expect(first.getSymbolizers()[2].getStroke().getWidth().getValue())
            .to.equal(6);
        var second = style.rules_[1];
        expect(second.filter_).to.be.a(ol.expr.Comparison);
        expect(second.getSymbolizers().length).to.equal(2);
        expect(second.getSymbolizers()[0]).to.be.a(ol.style.Fill);
        expect(second.getSymbolizers()[1]).to.be.a(ol.style.Stroke);
        done();
      });
    });
    it('Handles write', function(done) {
      var url = 'spec/ol/parser/ogc/xml/sld_v1_0_0_write.xml';
      afterLoadXml(url, function(xml) {
        expect(goog.dom.xml.loadXml(parser.write(obj))).to.xmleql(xml);
        done();
      });
    });
  });

});

goog.require('goog.dom.xml');
goog.require('ol.parser.ogc.SLD_v1_0_0');
goog.require('ol.parser.ogc.SLD');
goog.require('ol.expr.Call');
goog.require('ol.expr.Comparison');
goog.require('ol.expr.ComparisonOp');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Literal');
goog.require('ol.style.Fill');
goog.require('ol.style.Rule');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
