goog.provide('ol.test.style.Text');

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

      var literal = symbolizer.createLiteral(ol.geom.GeometryType.POINT);
      expect(literal).to.be.a(ol.style.TextLiteral);
      expect(literal.color).to.be('#ff0000');
      expect(literal.fontFamily).to.be('Arial');
      expect(literal.fontSize).to.be(11);
      expect(literal.text).to.be('Test');
      expect(literal.opacity).to.be(0.6);
    });

    it('applies defaults if none provided', function() {
      var symbolizer = new ol.style.Text({
        text: 'Test'
      });

      var literal = symbolizer.createLiteral(ol.geom.GeometryType.POINT);
      expect(literal).to.be.a(ol.style.TextLiteral);
      expect(literal.color).to.be('#000');
      expect(literal.fontFamily).to.be('sans-serif');
      expect(literal.fontSize).to.be(10);
      expect(literal.text).to.be('Test');
      expect(literal.opacity).to.be(1);
    });

    it('casts size to number', function() {
      var symbolizer = new ol.style.Text({
        text: 'test',
        fontSize: ol.expr.parse('size')
      });

      var feature = new ol.Feature({
        size: '42'
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal.fontSize).to.be(42);
    });

    it('casts opacity to number', function() {
      var symbolizer = new ol.style.Text({
        text: 'test',
        opacity: ol.expr.parse('opacity')
      });

      var feature = new ol.Feature({
        opacity: '0.42'
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal.opacity).to.be(0.42);
    });

  });

  describe('#getColor()', function() {

    it('returns the text color', function() {
      var symbolizer = new ol.style.Text({
        color: '#ff0000'
      });

      var color = symbolizer.getColor();
      expect(color).to.be.a(ol.expr.Literal);
      expect(color.getValue()).to.be('#ff0000');
    });

  });


  describe('#getFontFamily()', function() {

    it('returns the font family', function() {
      var symbolizer = new ol.style.Text({
        fontFamily: 'Arial'
      });

      var fontFamily = symbolizer.getFontFamily();
      expect(fontFamily).to.be.a(ol.expr.Literal);
      expect(fontFamily.getValue()).to.be('Arial');
    });

  });

  describe('#getFontSize()', function() {

    it('returns the font size', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 42
      });

      var fontSize = symbolizer.getFontSize();
      expect(fontSize).to.be.a(ol.expr.Literal);
      expect(fontSize.getValue()).to.be(42);
    });

  });

  describe('#getOpacity()', function() {

    it('returns the opacity', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 1,
        opacity: 0.123
      });

      var opacity = symbolizer.getOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

  });

  describe('#setColor()', function() {

    it('sets the text color', function() {
      var symbolizer = new ol.style.Text({
        color: '#ff0000'
      });

      symbolizer.setColor(new ol.expr.Literal('#0000ff'));

      var color = symbolizer.getColor();
      expect(color).to.be.a(ol.expr.Literal);
      expect(color.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Text({
        color: '#ff0000'
      });

      expect(function() {
        symbolizer.setColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setFontFamily()', function() {

    it('sets the font family', function() {
      var symbolizer = new ol.style.Text({
        fontFamily: '#ff0000'
      });

      symbolizer.setFontFamily(new ol.expr.Literal('#0000ff'));

      var fontFamily = symbolizer.getFontFamily();
      expect(fontFamily).to.be.a(ol.expr.Literal);
      expect(fontFamily.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Text({
        fontFamily: '#ff0000'
      });

      expect(function() {
        symbolizer.setFontFamily('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setFontSize()', function() {

    it('sets the font size', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 10
      });
      symbolizer.setFontSize(new ol.expr.Literal(20));

      var fontSize = symbolizer.getFontSize();
      expect(fontSize).to.be.a(ol.expr.Literal);
      expect(fontSize.getValue()).to.be(20);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 10
      });

      expect(function() {
        symbolizer.setFontSize(10);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setOpacity()', function() {

    it('sets the opacity', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 1,
        opacity: 0.123
      });
      symbolizer.setOpacity(new ol.expr.Literal(0.321));

      var opacity = symbolizer.getOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.321);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 1,
        opacity: 1
      });

      expect(function() {
        symbolizer.setOpacity(0.5);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setText()', function() {

    it('sets the text', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 1,
        text: 'Initial Text'
      });
      symbolizer.setText(new ol.expr.Literal('New Text'));

      var text = symbolizer.getText();
      expect(text).to.be.a(ol.expr.Literal);
      expect(text.getValue()).to.be('New Text');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Text({
        fontSize: 1,
        text: 'Test'
      });

      expect(function() {
        symbolizer.setText('Bad');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

});

goog.require('goog.asserts.AssertionError');

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Literal');
goog.require('ol.expr.Literal');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Text');
goog.require('ol.style.TextLiteral');
