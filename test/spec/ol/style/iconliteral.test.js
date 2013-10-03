goog.provide('ol.test.style.IconLiteral');

describe('ol.style.IconLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png',
        zIndex: 0
      });
      var equalLiteral = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png',
        zIndex: 0
      });
      var differentHeight = new ol.style.IconLiteral({
        height: 11,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png',
        zIndex: 0
      });
      var differentWidth = new ol.style.IconLiteral({
        height: 10,
        width: 2,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png',
        zIndex: 0
      });
      var differentOpacity = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 0.5,
        rotation: 0.1,
        url: 'http://example.com/1.png',
        zIndex: 0
      });
      var differentRotation = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.2,
        url: 'http://example.com/1.png',
        zIndex: 0
      });
      var differentUrl = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/2.png',
        zIndex: 0
      });
      var differentZIndex = new ol.style.IconLiteral({
        height: 10,
        width: 20,
        opacity: 1,
        rotation: 0.1,
        url: 'http://example.com/1.png',
        zIndex: 20
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentHeight)).to.be(false);
      expect(literal.equals(differentWidth)).to.be(false);
      expect(literal.equals(differentOpacity)).to.be(false);
      expect(literal.equals(differentRotation)).to.be(false);
      expect(literal.equals(differentUrl)).to.be(false);
      expect(literal.equals(differentZIndex)).to.be(false);
    });

  });

});



goog.require('ol.style.IconLiteral');
