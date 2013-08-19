goog.provide('ol.test.style.TextLiteral');

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

goog.require('ol.style.TextLiteral');
