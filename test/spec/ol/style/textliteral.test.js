goog.provide('ol.test.style.TextLiteral');

describe('ol.style.TextLiteral', function() {

  describe('constructor', function() {

    it('creates a new literal', function() {
      var literal = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      expect(literal).to.be.a(ol.style.Literal);
      expect(literal).to.be.a(ol.style.TextLiteral);
    });

    it('accepts stroke properties', function() {
      var literal = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        strokeColor: '#ff0000',
        strokeWidth: 2,
        strokeOpacity: 0.5,
        zIndex: 0
      });
      expect(literal).to.be.a(ol.style.TextLiteral);
    });

    it('throws with incomplete stroke properties', function() {
      expect(function() {
        new ol.style.TextLiteral({
          color: '#ff0000',
          fontFamily: 'Arial',
          fontSize: 11,
          fontWeight: 'normal',
          text: 'Test',
          opacity: 0.5,
          strokeColor: '#ff0000',
          zIndex: 0
        });
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var equalLiteral = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentColor = new ol.style.TextLiteral({
        color: '#0000ff',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentFontFamily = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Dingbats',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentFontSize = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentFontWeight = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'bold',
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentOpacity = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.6,
        zIndex: 0
      });
      var equalLiteral2 = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Text is not compared for equality',
        opacity: 0.5,
        zIndex: 0
      });
      var differentZIndex = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        text: 'Test',
        opacity: 0.5,
        zIndex: 3
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentColor)).to.be(false);
      expect(literal.equals(differentFontFamily)).to.be(false);
      expect(literal.equals(differentFontSize)).to.be(false);
      expect(literal.equals(differentFontWeight)).to.be(false);
      expect(literal.equals(differentOpacity)).to.be(false);
      expect(literal.equals(equalLiteral2)).to.be(true);
      expect(literal.equals(differentZIndex)).to.be(false);
    });

  });

});

goog.require('goog.asserts.AssertionError');
goog.require('ol.style.Literal');
goog.require('ol.style.TextLiteral');
