goog.provide('ol.test.style.LineLiteral');

describe('ol.style.LineLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.LineLiteral({
        strokeWidth: 3,
        strokeColor: '#BADA55',
        strokeOpacity: 1
      });
      var equalLiteral = new ol.style.LineLiteral({
        strokeColor: '#BADA55',
        strokeWidth: 3,
        strokeOpacity: 1
      });
      var differentLiteral = new ol.style.LineLiteral({
        strokeColor: '#013',
        strokeWidth: 3,
        strokeOpacity: 1
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentLiteral)).to.be(false);
    });

  });

});

goog.require('ol.style.LineLiteral');
