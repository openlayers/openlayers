goog.provide('ol.test.style.Text');

describe('ol.style.TextLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5
      });
      var equalLiteral = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5
      });
      var differentLiteral1 = new ol.style.TextLiteral({
        color: '#0000ff',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5
      });
      var differentLiteral2 = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Dingbats',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5
      });
      var differentLiteral3 = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 12,
        text: 'Test',
        opacity: 0.5
      });
      var differentLiteral4 = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.6
      });
      var equalLiteral2 = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Text is not compared for equality',
        opacity: 0.5
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentLiteral1)).to.be(false);
      expect(literal.equals(differentLiteral2)).to.be(false);
      expect(literal.equals(differentLiteral3)).to.be(false);
      expect(literal.equals(differentLiteral4)).to.be(false);
      expect(literal.equals(equalLiteral2)).to.be(true);
    });

  });

});

describe('ol.style.Text', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Text({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.6
      });
      expect(symbolizer).to.be.a(ol.style.Text);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Text({
        color: ol.expr.parse('"#ff0000"'),
        fontFamily: ol.expr.parse('"Arial"'),
        fontSize: ol.expr.parse('11'),
        text: ol.expr.parse('"Test"'),
        opacity: ol.expr.parse('0.6')
      });
      expect(symbolizer).to.be.a(ol.style.Text);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Text({
        color: ol.expr.parse('colorAttr'),
        fontFamily: ol.expr.parse('fontFamilyAttr'),
        fontSize: ol.expr.parse('fontSizeAttr'),
        text: ol.expr.parse('textAttr'),
        opacity: ol.expr.parse('opacityAttr')
      });

      var feature = new ol.Feature({
        colorAttr: '#ff0000',
        fontFamilyAttr: 'Dingbats',
        fontSizeAttr: 43,
        textAttr: 'Test',
        opacityAttr: 0.4
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.TextLiteral);
      expect(literal.color).to.be('#ff0000');
      expect(literal.fontFamily).to.be('Dingbats');
      expect(literal.fontSize).to.be(43);
      expect(literal.text).to.be('Test');
      expect(literal.opacity).to.be(0.4);
    });

    it('can be called without a feature', function() {
      var symbolizer = new ol.style.Text({
        color: ol.expr.parse('"#ff0000"'),
        fontFamily: ol.expr.parse('"Arial"'),
        fontSize: ol.expr.parse('11'),
        text: ol.expr.parse('"Test"'),
        opacity: ol.expr.parse('0.6')
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.TextLiteral);
      expect(literal.color).to.be('#ff0000');
      expect(literal.fontFamily).to.be('Arial');
      expect(literal.fontSize).to.be(11);
      expect(literal.text).to.be('Test');
      expect(literal.opacity).to.be(0.6);
    });

    it('applies default type if none provided', function() {
      var symbolizer = new ol.style.Text({
        text: 'Test'
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.TextLiteral);
      expect(literal.color).to.be('#000');
      expect(literal.fontFamily).to.be('sans-serif');
      expect(literal.fontSize).to.be(10);
      expect(literal.text).to.be('Test');
      expect(literal.opacity).to.be(1);
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Literal');
goog.require('ol.style.Text');
goog.require('ol.style.TextLiteral');
