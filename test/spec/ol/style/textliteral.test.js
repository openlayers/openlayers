goog.provide('ol.test.style.TextLiteral');

describe('ol.style.TextLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var equalLiteral = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentColor = new ol.style.TextLiteral({
        color: '#0000ff',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentFontFamily = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Dingbats',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentFontSize = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 12,
        text: 'Test',
        opacity: 0.5,
        zIndex: 0
      });
      var differentOpacity = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.6,
        zIndex: 0
      });
      var equalLiteral2 = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Text is not compared for equality',
        opacity: 0.5,
        zIndex: 0
      });
      var differentZIndex = new ol.style.TextLiteral({
        color: '#ff0000',
        fontFamily: 'Arial',
        fontSize: 11,
        text: 'Test',
        opacity: 0.5,
        zIndex: 3
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentColor)).to.be(false);
      expect(literal.equals(differentFontFamily)).to.be(false);
      expect(literal.equals(differentFontSize)).to.be(false);
      expect(literal.equals(differentOpacity)).to.be(false);
      expect(literal.equals(equalLiteral2)).to.be(true);
      expect(literal.equals(differentZIndex)).to.be(false);
    });

  });

});

goog.require('ol.style.TextLiteral');
