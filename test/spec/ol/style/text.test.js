goog.provide('ol.test.style.Text');


describe('ol.style.Text', function() {

  describe('#constructor', function() {

    it('uses a default fill style if none passed', function() {
      var style = new ol.style.Text();
      expect(style.getFill().getColor()).to.be('#333');
    });

    it('uses a provided fill style if one passed', function() {
      var style = new ol.style.Text({
        fill: new ol.style.Fill({color: '#123456'})
      });
      expect(style.getFill().getColor()).to.be('#123456');
    });

    it('can always be resetted to no color', function() {
      var style = new ol.style.Text();
      style.getFill().setColor();
      expect(style.getFill().getColor()).to.be(undefined);
    });

  });

});

goog.require('ol.style.Fill');
goog.require('ol.style.Text');
