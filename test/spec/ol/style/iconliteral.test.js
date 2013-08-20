goog.provide('ol.test.style.IconLiteral');

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



goog.require('ol.style.IconLiteral');
