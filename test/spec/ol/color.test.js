goog.provide('ol.test.Color');

describe('ol.Color', function() {

  describe('constructor', function() {

    it('limits r to 0-255', function() {
      var c;

      // legit r
      c = new ol.Color(10.5, 11, 12, 0.5);
      expect(c.r).to.be(10.5);

      // under r
      c = new ol.Color(-10, 11, 12, 0.5);
      expect(c.r).to.be(0);

      // over r
      c = new ol.Color(300, 11, 12, 0.5);
      expect(c.r).to.be(255);
    });

    it('limits g to 0-255', function() {
      var c;

      // legit g
      c = new ol.Color(10, 11.5, 12, 0.5);
      expect(c.g).to.be(11.5);

      // under g
      c = new ol.Color(10, -11, 12, 0.5);
      expect(c.g).to.be(0);

      // over g
      c = new ol.Color(10, 275, 12, 0.5);
      expect(c.g).to.be(255);
    });

    it('limits b to 0-255', function() {
      var c;

      // legit b
      c = new ol.Color(10, 11, 12.5, 0.5);
      expect(c.b).to.be(12.5);

      // under b
      c = new ol.Color(10, 11, -12, 0.5);
      expect(c.b).to.be(0);

      // over b
      c = new ol.Color(10, 11, 500, 0.5);
      expect(c.b).to.be(255);
    });

    it('limits a to 0-1', function() {
      var c;

      // legit a
      c = new ol.Color(10, 11, 12, 0.5);
      expect(c.a).to.be(0.5);

      // under a
      c = new ol.Color(10, 11, 12, -0.5);
      expect(c.a).to.be(0);

      // over a
      c = new ol.Color(10, 11, 12, 2.5);
      expect(c.a).to.be(1);
    });

  });

});

goog.require('ol.Color');
