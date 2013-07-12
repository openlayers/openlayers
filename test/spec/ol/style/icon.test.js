goog.provide('ol.test.style.Icon');

describe('ol.style.IconLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png'
      });
      var equalLiteral = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png'
      });
      var differentLiteral1 = new ol.style.IconLiteral({
        height: 11,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png'
      });
      var differentLiteral2 = new ol.style.IconLiteral({
        height: 10,
        width: 2,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png'
      });
      var differentLiteral3 = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 0.5,
        rotation: 0.1,
        url: 'http://example.com/1.png'
      });
      var differentLiteral4 = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.2,
        url: 'http://example.com/1.png'
      });
      var differentLiteral5 = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/2.png'
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentLiteral1)).to.be(false);
      expect(literal.equals(differentLiteral2)).to.be(false);
      expect(literal.equals(differentLiteral3)).to.be(false);
      expect(literal.equals(differentLiteral4)).to.be(false);
      expect(literal.equals(differentLiteral5)).to.be(false);
    });

  });

});

describe('ol.style.Icon', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Icon({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png'
      });
      expect(symbolizer).to.be.a(ol.style.Icon);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Icon({
        height: ol.expr.parse('10'),
        width: ol.expr.parse('20'),
        opacity: ol.expr.parse('1'),
        rotation: ol.expr.parse('0.1'),
        url: ol.expr.parse('"http://example.com/1.png"')
      });
      expect(symbolizer).to.be.a(ol.style.Icon);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Icon({
        height: ol.expr.parse('heightAttr'),
        width: ol.expr.parse('widthAttr'),
        opacity: ol.expr.parse('opacityAttr'),
        rotation: ol.expr.parse('rotationAttr'),
        url: ol.expr.parse('urlAttr')
      });

      var feature = new ol.Feature({
        heightAttr: 42,
        widthAttr: 0.42,
        opacityAttr: 0.5,
        rotationAttr: 123,
        urlAttr: 'http://example.com/1.png'
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.IconLiteral);
      expect(literal.height).to.be(42);
      expect(literal.width).to.be(.42);
      expect(literal.opacity).to.be(0.5);
      expect(literal.rotation).to.be(123);
      expect(literal.url).to.be('http://example.com/1.png');
    });

    it('can be called without a feature', function() {
      var symbolizer = new ol.style.Icon({
        height: ol.expr.parse('10'),
        width: ol.expr.parse('20'),
        opacity: ol.expr.parse('1'),
        rotation: ol.expr.parse('0.1'),
        url: ol.expr.parse('"http://example.com/1.png"')
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.IconLiteral);
      expect(literal.height).to.be(10);
      expect(literal.width).to.be(20);
      expect(literal.opacity).to.be(1);
      expect(literal.rotation).to.be(0.1);
      expect(literal.url).to.be('http://example.com/1.png');
    });

    it('applies default type if none provided', function() {
      var symbolizer = new ol.style.Icon({
        height: ol.expr.parse('10'),
        width: ol.expr.parse('20'),
        url: ol.expr.parse('"http://example.com/1.png"')
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.IconLiteral);
      expect(literal.opacity).to.be(1);
      expect(literal.rotation).to.be(0);
    });

  });
});


goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.style.Icon');
goog.require('ol.style.IconLiteral');
